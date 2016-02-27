(function (lib) { "use strict";

    /**
     * Helper function, that converts a description into an actual layer object
     * @param {object} description
     */
    function Layer(opt, net) {
        switch (opt.type) {
            case 'input': return new lib.InputLayer(opt, net);
            case 'dot': return new lib.DotLayer(opt, net);
            case 'conv': return new lib.ConvolutionalLayer(opt, net);
            case 'pool': return new lib.PoolingLayer(opt, net);
            case 'sigmoid': return new lib.SigmoidLayer(opt, net);
            case 'relu': return new lib.ReluLayer(opt, net);
            case 'tanh': return new lib.TanhLayer(opt, net);
            case 'dropout': return new lib.DropOutLayer(opt, net);
            case 'softmax': return new lib.SoftmaxLayer(opt, net);
            case 'hsm': return new lib.HierarchicalSoftmax(opt, net);
            case 'regression': return new lib.RegressionLayer(opt, net);
        }
    }

    /**
     * @param {object}
     */
    var Network = function(opt) {
        this.learner = opt.learner;
        this.learner = Object.extend({
            method: 'sgd',
            batch: 1,
            decay: {
                l1: 0,
                l2: 0
            },
        }, this.learner);

        this.learner = Object.extend(this.gd[this.learner.method].defaults, this.learner);
        this.weak = true; // dropout enabled?

        this.structure = opt.layers;
        this.pass = 0;
        this.layers = [];

        for (var i = 0; i < this.structure.length; i++) {
            if (i > 0) this.structure[i].input = this.layers[i - 1].out; // set input to this layer to the output of last layer
            this.layers[i] = Layer(this.structure[i], this);
        }

        this.state = this.CreateState();
    };

    Network.prototype.CreateState = function () {
        var s = [];
        for (var i = 0; i < this.layers.length; i++) {
            if (typeof this.layers[i].out !== 'undefined') {
                s[i] = new lib.Blob(this.layers[i].out.x, this.layers[i].out.y, this.layers[i].out.depth, 0.0);
            } else {
                s[i] = {};
            }

            if (typeof this.layers[i].PrepareStateBlob !== 'undefined') {
                this.layers[i].PrepareStateBlob(s[i]);
            }
        }

        return s;
    };

    Network.prototype.forward = function(inp) {
        // go forwards through network
        var y = undefined; // f.e. for softmax to return an index
        this.layers[0].forward(inp, this.state[0]);
        for (var i = 1; i < this.layers.length; i++) {
            y = this.layers[i].forward(this.state[i - 1], this.state[i]);
        }

        return y === undefined ? this.state[this.layers.length - 1].w.d : y;
    };

    Network.prototype.backward = function(outp) {
        // go backwards through network
        var loss = this.layers.slice(-1)[0].backward(this.state[this.layers.length - 1], this.state[this.layers.length - 2], outp);
        for (var i = this.layers.length - 2; i >= 0; i--) {
            this.layers[i].backward(this.state[i], this.state[i - 1]);
        }

        this.adjust();

        return loss;
    };

    Network.prototype.adjust = function() {
        if (++this.pass % this.learner.batch !== 0) {
            return;
        }

        var method = this.gd[this.learner.method];
        for (var i = 0; i < this.layers.length; i++) {
            if (typeof this.layers[i].parameters === 'undefined')
                continue;

            var param = this.layers[i].parameters;
            if (typeof param.filters !== 'undefined') {
                for (var j = 0; j < param.filters.length; j++) { method.call(this, this.learner, param.filters[j], 1.0); }
            }

            if (typeof param.biases !== 'undefined') {
                method.call(this, this.learner, param.biases, 0.0);
            }
        }
    };

    /* gradient descent algorithms */
    Network.prototype.gd = {};

    Network.prototype.gd.sgd = {
        defaults: {
            rate: 0.01,
            momentum: 0.9
        },
        storage: ['gsum'],
        algorithm: function() {
            dx = opt.momentum * gsum - opt.rate * gij;
            gsum = dx;
        }
    };

    Network.prototype.gd.adadelta = {
        defaults: {
            ro: 0.95,
            eps: 1e-8
        },
        storage: ['gsum', 'xsum'],
        algorithm: function() {
            gsum = opt.ro * gsum + (1 - opt.ro) * gij * gij;
            dx = -Math.sqrt((xsum + opt.eps) / (gsum + opt.eps)) * gij;
            xsum = opt.ro * xsum + (1 - opt.ro) * dx * dx; // yes, xsum lags behind gsum by 1.
        }
    };

    /* algorithms compiler, speeds things up, and makes things easier */
    (function() {
        var gd_prototype = function(opt, O, decay) {
            if (O.nochange) return;
            var dx = 0, __grad = 0, gij = 0, l1grad = 0, l2grad = 0;
            "UU1";
            for (var i = 0; i < O.size.length; i++) {
                __grad = O.dw.d[i];
                l1grad = decay * opt.decay.l1 * (O.w.d[i] > 0 ? 1 : -1);
                l2grad = decay * opt.decay.l2 * (O.w.d[i]);
                gij = (__grad + l1grad + l2grad) / opt.batch;
                "UU2";
                "UU3";
                "UU4";
                O.w.d[i] += dx;
            }

            O.dw.all(0.0);
        };

        var gd_prototype_ = gd_prototype.toString();

        for (var name in Network.prototype.gd) {
            var description = Network.prototype.gd[name];
            var checks = [];
            for (var i = 0; i < description.storage.length; i++) {
                checks[i] = 'if (typeof O.' + description.storage[i] + ' === "undefined") { O.' + description.storage[i] + ' = new lib.Mat(O.size.x, O.size.y, O.size.depth, 0.0); }';
            }

            var extractions = [];
            for (var i = 0; i < description.storage.length; i++) {
                extractions[i] = 'var ' + description.storage[i] + ' = O.' + description.storage[i] + '.d[i];';
            }

            var alg = description.algorithm.toString();
            alg = alg.substring(alg.indexOf('{') + 1, alg.length - 1);

            var storings = [];
            for (var i = 0; i < description.storage.length; i++) {
                storings[i] = 'O.' + description.storage[i] + '.d[i] = ' + description.storage[i] + ';';
            }

            var func = gd_prototype_.replace('"UU1";', checks.join("")).replace('"UU2";', extractions.join("")).replace('"UU3";', alg).replace('"UU4";', storings.join(""));
            var cmd = 'Network.prototype.gd.' + name + ' = ' + func;
            eval(cmd);
            Network.prototype.gd[name].defaults = description.defaults;
        }
    })();

    lib.Network = Network;
})(nnjs);
