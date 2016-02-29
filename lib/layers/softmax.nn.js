(function (lib) { "use strict";

    function SoftmaxLayer(opt) {
        this.in = opt.input;
        this.out = lib.Size3(1, 1, this.in.x * this.in.y * this.in.depth);
        this.classes = this.out.depth;
    };

    SoftmaxLayer.prototype.forward = function (V, A) {
        // compute max activation
        var amax = V.w.d[0];
        for (var i = 1; i < this.classes; i++) {
            if(V.w.d[i] > amax) amax = V.w.d[i];
        }

        // compute exponentials (carefully to not blow up)
        var es = lib.Mat.CreateArray(this.out.depth, 0.0), esum = 0.0;
        for (var i = 0; i < this.classes; i++) {
            var e = Math.exp(V.w.d[i] - amax);
            esum += e;
            es[i] = e;
        }

        // normalize and output to sum to one
        for (var i = 0; i < this.classes; i++) {
            es[i] /= esum;
            A.w.d[i] = es[i];
        }

        return A.w.maxi();
    };

    SoftmaxLayer.prototype.backward = function (A, V, desired) {
        for (var i = 0; i < this.classes; i++) {
            var indicator = i === desired ? 1.0 : 0.0;
            V.dw.d[i] = A.w.d[i] - indicator;
        }

        // loss is the class negative log likelihood
        return -Math.log(A.w.d[desired]);
    };

    /* approx. 300x faster than softmax, decrease in accuracy and performance */
    /**
     * @param {object} tree [object] or classes [int]
     */
    function HierarchicalSoftmax(opt) {
        this.in = opt.input;

        if (opt.tree) {
            this.tree = opt.tree;
        } else {
            this.tree = this.BuildTree(opt.classes);
        }

        this.PrepareTree();

        assert(opt.classes === undefined || (opt.classes === this.classes), 'HierarchicalSoftmax: tree not supported');

        this.nodes = this.classes - 1;
        this.parameters = {
            filters: [],
            biases: new lib.Blob(1, 1, this.nodes, 0.0)
        };

        for (var i = 0; i < this.nodes; i++) {
            this.parameters.filters[i] = new lib.Blob(1, 1, this.in.length);
        }
    };

    HierarchicalSoftmax.POINTER = 0;
    HierarchicalSoftmax.SELECTOR = 1;

    HierarchicalSoftmax.prototype.BuildTree = function (classes) {
        // create tree of size log(classes)
        var depth = Math.floor(Math.log2(classes));
        var tree = this.CreateNode(depth, null);

        // add remaining nodes to tree
        var remainder = classes - Math.pow(2, depth);
        this.traverse(tree, function (node) {
            if (node.type === HierarchicalSoftmax.SELECTOR && remainder > 0) {
                node.type = HierarchicalSoftmax.POINTER;
                node.a = this.CreateNode(0, node);
                node.b = this.CreateNode(0, node);

                remainder--;

                return false;
            }

            return true;
        });

        return tree;
    }; 

    HierarchicalSoftmax.prototype.PrepareTree = function () {
        var sel = 0, ptr = 0, table = {};
        this.traverse(this.tree, function (node) {
            if (node.type === HierarchicalSoftmax.SELECTOR) {
                table[sel] = node;
                node.index = sel;
            ++sel;}

            else if (node.type === HierarchicalSoftmax.POINTER) {
                node.index = ptr;
            ptr++;}

            return true;
        });

        this.classes = sel;
        this.nodes = ptr;
        this.table = table;
    };

    HierarchicalSoftmax.prototype.CreateNode = function (depth, parent) {
        var node = { parent: parent };

        if (depth <= 0) {
            node.type = HierarchicalSoftmax.SELECTOR;
        } else {
            node.type = HierarchicalSoftmax.POINTER;
            node.a = this.CreateNode(depth-1, node);
            node.b = this.CreateNode(depth-1, node);
        }

        return node;
    };

    HierarchicalSoftmax.prototype.traverse = function (node, cb) {
        if (cb.call(this, node) && node.type === HierarchicalSoftmax.POINTER) {
            this.traverse(node.a, cb);
            this.traverse(node.b, cb);
        }
    };

    HierarchicalSoftmax.prototype.ascend = function (node, cb) {
        if (node.parent === null) return ;
        cb.call(this, node.parent, node === node.parent.a ? -1.0 : 1.0);
        this.ascend(node.parent, cb);
    };

    HierarchicalSoftmax.prototype.descend = function (node, cb) {
        var d = cb.call(this, node);

        if (node.type === HierarchicalSoftmax.SELECTOR || d instanceof Object || d === null) {
            return d;
        }

        if (d > 0.0) { // negative means left, positive means right
            return this.descend(node.b, cb);
        } else {
            return this.descend(node.a, cb);
        }
    };

    HierarchicalSoftmax.prototype.activate = function (V, i) {
        var sum = 0.0;
        for (var j = 0; j < this.in.length; j++) {
            sum += V.w.d[j] * this.parameters.filters[i].w.d[j];
        }

        return lib.MathU.tanh(this.parameters.biases.w.d[i] + sum);
    };

    HierarchicalSoftmax.prototype.gradient = function (V, i, direction) {
        var act = this.activate(V, i),
                err = act - direction;

        var dw = (1.0 - act * act) * err;
        this.parameters.filters[i].omit = false;

        for (var j = 0; j < this.in.length; j++) {
            this.parameters.filters[i].dw.d[j] += V.w.d[j] * dw;
            V.dw.d[j] += this.parameters.filters[i].w.d[j] * dw;
        }

        this.parameters.biases.dw.d[i] += dw;

        return (direction < 0 ? 1 - (act * 0.5 + 0.5) : (act * 0.5 + 0.5)); // probability to go the right way
    };

    HierarchicalSoftmax.prototype.forward = function (V, A) {
        var selected = this.descend(this.tree, function (node) {
            if (node.type === HierarchicalSoftmax.POINTER) {
                return this.activate(V, node.index);
            }

            else if (node.type === HierarchicalSoftmax.SELECTOR) {
                return node;
            }

            return null;
        });

        return (A.index = selected.index);
    };

    HierarchicalSoftmax.prototype.backward = function (A, V, desired) {
        for (var i = 0; i < this.parameters.filters.length; i++) {
            this.parameters.filters[i].omit = true;
        }

        var prob = 1.0;
        this.ascend(this.table[desired], function (node, direction) {
            prob = prob * this.gradient(V, node.index, direction);
        });

        return 1.0 - prob; // probability to NOT go the right way
    };

    lib.SoftmaxLayer = SoftmaxLayer;
    lib.HierarchicalSoftmax = HierarchicalSoftmax;
})(nnjs);