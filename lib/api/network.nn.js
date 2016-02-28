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
            case 'lstm': return new lib.LongShortTermMemoryLayer(opt, net);
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

    function NetworkStructure(desc, net) {
        this.net = net;
        this.description = desc;
        this.length = desc.length; // convienience
        this.recurrent = false;

        this.Build();
    };

    NetworkStructure.prototype.Build = function () {
        this.list = [];
        for (var i = 0; i < this.description.length; i++) {
            if (i > 0) {
                this.description[i].input = this.list[i - 1].out; // set input to this layer to the output of last layer
            }

            this.list[i] = Layer(this.description[i], this.net);

            if (this.list[i].recurrent) {
                this.recurrent = true;
            }
        }
    };  

    NetworkStructure.prototype.stats = function () {
        var stats = { parameters: 0 };

        for (var i = 0; i < this.length; i++) {
            if (this.list[i].parameters === undefined) continue;

            for (var j = 0; j < this.list[i].parameters.filters.length; j++) {
                stats.parameters += this.list[i].parameters.filters[j].size.length;
            }

            stats.parameters += this.list[i].parameters.biases.size.length;
        }

        return stats;
    };

    NetworkStructure.prototype.parameters = function () {
        var parameters = [];

        for (var i = 0; i < this.length; i++) {
            if (this.list[i].parameters === undefined) continue;

            var object = { filters: [], biases: this.list[i].parameters.biases.w.d };
            for (var j = 0; j < this.list[i].parameters.filters.length; j++) {
                object.filters[j] = this.list[i].parameters.filters[j].w.d;
            }

            parameters[i] = object;
        }

        return parameters;
    };

    NetworkStructure.prototype.at = function (i) {
        i = i >= 0 ? i : this.length + i;
        return this.list[i];
    };

    // current state
    function NetworkState(net) {
        this.net = net;
        this.layers = net.layers;
        this.width = net.layers.length; // how many layers?
        this.height = this.layers.recurrent ? this.net.learner.timespan : 1; // how long bptt? / time steps
        
        if (this.layers.recurrent) {
            this.blobs = this.Build(this.net.learner.timespan + 1); // last one needs reference to previous
        } else {
            this.blobs = this.Build(1); // only one time needed
        }
    };

    // [ [ state for T=0 ], [ state for T=1 ], ... ]
    NetworkState.prototype.Build = function (h, S) {
        var T = [];
        for (var t = 0; t < h; t++) {
            T.unshift(this.BuildState(T, S !== undefined ? S[t] : undefined));
        }

        return T;
    };

    // [ [ Blob for layer 1 ], [ Blob for layer 2 ], ... ]
    NetworkState.prototype.BuildState = function (T, S) {
        S = S || [];

        for (var i = 0; i < this.layers.length; i++) {
            if (typeof this.layers.list[i].out !== 'undefined' && S[i] === undefined) {
                S[i] = new lib.Blob(this.layers.list[i].out.x, this.layers.list[i].out.y, this.layers.list[i].out.depth, 0.0);
            } else if (S[i] === undefined) {
                S[i] = {};
            } else {
                S[i].w.all(0), S[i].dw.all(0);
            }

            if (typeof this.layers.list[i].recurrent !== 'undefined' && this.layers.list[i].recurrent
                    && T !== undefined && T.length > 0) {
                S[i].prev = T[0][i];
            }

            if (typeof this.layers.list[i].PrepareStateBlob !== 'undefined') {
                this.layers.list[i].PrepareStateBlob(S[i]);
            }
        }

        return S;
    };

    NetworkState.prototype.reset = function () {
        this.blobs = this.Build(this.blobs.length, this.blobs);
    };

    NetworkState.prototype.next = function () {
        if (this.layers.recurrent) { // only if recurrent
            var S = this.blobs.pop();
            this.blobs.unshift(this.BuildState(this.blobs, S)); // reusability
            for (var i = 0; i < this.width.length; i++) { 
                if (this.blobs[this.height][i].prev)
                    this.blobs[this.height][i].prev = null; 
            }
        }

        // clean gradients
        for (var t = 0; t < this.blobs.length; t++) {
            for (var i = 0; i < this.width; i++) {
                this.blobs[t][i].dw.all(0.0);
            }
        }
    };

    NetworkState.prototype.at = function (i, t) {
        t = t || 0;
        t = t >= 0 ? t : this.height + t;

        i = i || 0;
        i = i >= 0 ? i : this.width + i;

        return this.blobs[t][i];
    };

    /**
     * @param {object}
     */
    function Network(opt) {
        this.learner = opt.learner;
        this.learner = Object.extend(true, {
            method: 'sgd',
            batch: 1,
            decay: { l1: 0, l2: 0 },
            clip: Infinity,
            timespan: 1 // only for rnn
        }, this.learner);

        this.learner = Object.extend(true, this.gd[this.learner.method].defaults, this.learner);
        this.weak = true; // dropout enabled?
        this.pass = 0;

        this.layers = new NetworkStructure(opt.layers, this);
        this.state = new NetworkState(this); // exchangable
    };

    Network.prototype.forward = function(inp) {
        // go forwards through network
        this.state.next();
        var y = this.layers.list[0].forward(inp, this.state.at(0));
        for (var i = 1; i < this.layers.length; ++i) {
            y = this.layers.list[i].forward(this.state.at(i - 1), this.state.at(i));
        }

        return y !== undefined ? y : this.state.at(-1).w.d;
    };

    Network.prototype.backward = function(outp) {
        var E = false, I = this.layers.length - 2;

        var loss = this.layers.at(-1).backward(this.state.at(-1), this.state.at(-2), outp);
        for (var t = 0; t < this.state.height && (E || t === 0); t++) {
            for (var i = I; i >= 0; i--) { // always start backward pass at last recurrent layer, or at second-last layer if t=0

                if(!E && this.layers.list[i].recurrent) { // expand network
                    E = true, I = i;
                }

                this.layers.list[i].backward(this.state.at(i, t), this.state.at(i - 1, t));

            }  
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
            if (typeof this.layers.list[i].parameters === 'undefined')
                continue;

            var param = this.layers.list[i].parameters;
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
                __grad = __grad > opt.clip ? opt.clip : (__grad < -opt.clip ? -opt.clip : __grad);
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
