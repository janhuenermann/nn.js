(function (lib) { "use strict";

    /**
     * Helper function, that converts a description into an actual layer object
     * @param {object} description
     */
    function Layer(opt) {
        switch (opt.type) {
            case 'input': return new lib.InputLayer(opt);
            case 'dot': return new lib.DotLayer(opt);
            case 'conv': return new lib.ConvolutionalLayer(opt);
            case 'lstm': return new lib.LongShortTermMemoryLayer(opt);
            case 'pool': return new lib.PoolingLayer(opt);
            case 'sigmoid': return new lib.SigmoidLayer(opt);
            case 'relu': return new lib.ReluLayer(opt);
            case 'tanh': return new lib.TanhLayer(opt);
            case 'dropout': return new lib.DropOutLayer(opt);
            case 'softmax': return new lib.SoftmaxLayer(opt);
            case 'hsm': return new lib.HierarchicalSoftmax(opt);
            case 'regression': return new lib.RegressionLayer(opt);
        }
    }

    /**
     * The network model, describing how data flows through the network, from input to output
     * @param {array} desc      An array with layer descriptions, see examples and documentation for more
     * @param {nn.Network} net  The network that links to the model
     */
    function NetworkModel(desc) {
        this.description = this.ExpandDescription(desc);
        this.recurrent = false;
        this.Build();
    };

    NetworkModel.prototype.ExpandDescription = function (description) {
        var L = [];
        for (var i = 0; i < description.length; i++) {
            var descriptor = description[i];
            if (descriptor.type === 'softmax' && descriptor.classes !== undefined) {
                L.push({ type: 'dot', size: descriptor.classes });
            }

            else if (descriptor.type === 'regression' && descriptor.size !== undefined) {
                L.push({ type: 'dot', size: descriptor.size });
            }

            L.push(descriptor);

            switch (descriptor.activation) {
                case 'tanh':
                case 'sigmoid':
                case 'relu':
                    L.push({ type: descriptor.activation }); 
                    break;

                case undefined:
                default: 
                    break;
            }

            if (descriptor.dropout) {
                L.push({ type: 'dropout', probability: descriptor.dropout });
            }

            descriptor.activation = undefined;
            descriptor.dropout = undefined;
        }

        return L;
    };

    NetworkModel.prototype.Build = function () {
        this.list = []; var l = null;

        for (var i = 0; i < this.description.length; i++) {
            var descriptor = this.description[i];

            if (l != null) 
                descriptor.input = l.out;
            
            this.list.push(l = Layer(descriptor));
            this.recurrent = this.recurrent || l.recurrent;
        }

        this.length = this.list.length;
    };

    NetworkModel.prototype.link = function (net) {
        for (var i = 0; i < this.length; i++) {
            this.list[i].net = net;
        }

        this.linked = net;
    }

    NetworkModel.prototype.export = function () {
        var arr = [ ];
        for (var i = 0; i < this.description.length; i++) {
            var descriptor = Object.extend({}, this.description[i]);
            var layer = this.list[i];

            var parameters = {};
            for (var key in layer.parameters) {
                var param = layer.parameters[key];
                if (param instanceof Array) {
                    parameters[key] = [];
                    for (var j = 0; j < param.length; j++) { parameters[key][j] = param[j].w.d; }
                }

                else if (param instanceof lib.Blob) {
                    parameters[key] = param.w.d;
                }

                else if (param instanceof lib.Mat) {
                    parameters[key] = param.d;
                }
            }

            descriptor.parameters = parameters;

            arr.push(descriptor);
        }

        return arr;
    };

    NetworkModel.prototype.at = function (i) {
        i = i >= 0 ? i : this.length + i;
        return this.list[i];
    };

    /**
     * The network state, which represents the current data in the network
     * @param {nn.NetworkModel} model
     * @param {int} T
     */
    function NetworkState(model, T) {
        this.model = model;
        this.width = this.model.length; // how many layers?
        this.height = this.model.recurrent ? T : 1; // through how many time-steps unfold network? / time steps
        
        if (this.model.recurrent) {
            this.blobs = this.Build(T + 1); // last one needs reference to previous
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

        for (var i = 0; i < this.model.length; i++) {
            // create or recycle layer item
            if (typeof this.model.list[i].out !== 'undefined' && S[i] === undefined) {
                S[i] = new lib.Blob(this.model.list[i].out.x, this.model.list[i].out.y, this.model.list[i].out.depth, 0.0);
            } else if (S[i] === undefined) {
                S[i] = {};
            } else {
                S[i].w.all(0), S[i].dw.all(0);
            }

            // if recurrent, add link to previous time-step
            if (typeof this.model.list[i].recurrent !== 'undefined' && this.model.list[i].recurrent
                    && T !== undefined && T.length > 0) {
                S[i].prev = T[0][i];
            }

            // add layer specific variables
            if (typeof this.model.list[i].PrepareStateBlob !== 'undefined') {
                this.model.list[i].PrepareStateBlob(S[i]);
            }
        }

        return S;
    };

    NetworkState.prototype.reset = function () {
        this.blobs = this.Build(this.blobs.length, this.blobs);
    };

    NetworkState.prototype.next = function () {
        if (this.model.recurrent) {
            // get last item
            var S = this.blobs.pop();

            // recycle it
            this.blobs.unshift(this.BuildState(this.blobs, S)); // reusability

            // and remove all connections to any older items
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

    NetworkState.prototype.export = function () {
    };

    NetworkState.prototype.at = function (i, t) {
        return this.blobs[(t || 0) >= 0 ? (t || 0) : this.height + t][(i || 0) >= 0 ? (i || 0) : this.width + i];
    };

    /**
     * A neural network, consisting of a state and a model
     * @param {object} opt
     */
    function Network(opt) {
        this.learner = opt.learner;
        this.learner = Object.extend(true, {
            method: 'sgd',
            batch: 1,
            decay: { l1: 0, l2: 0 },
            clip: Infinity,
            timespan: 10 // only for rnn
        }, this.learner);

        this.learner = Object.extend(true, this.gd[this.learner.method].defaults, this.learner);
        this.weak = true; // dropout enabled? in production versions of a net, this should be turned off
        this.pass = 0; // for batch

        this.model = new NetworkModel(opt.layers);
        this.model.link(this);

        this.state = new NetworkState(this.model, this.learner.timespan);
    };

    Network.prototype.forward = function(inp) {
        // go forwards through network
        // first add time step to current network state
        this.state.next();

        // project every matrix from A to B (V to A) then B to C, C to D... where the first matrix is 'inp'
        var y = this.model.list[0].forward( inp, this.state.blobs[0][0] );
        for (var i = 1; i < this.model.length; ++i) {
            y = this.model.list[i].forward( this.state.blobs[0][i - 1], this.state.blobs[0][i] );
        }

        // return either a value (like softmax index) or the last matrix values
        return y !== undefined ? y : this.state.at(-1).w.d;
    };

    Network.prototype.backward = function(outp) {
        // go backwards through time (note: only when network is recurrent, otherwise only t = 0)
        var E = false, I = this.model.length - 1;

        // calculate loss
        var loss = this.model.list[I--].backward(this.state.at(-1), this.state.at(-2), outp);

        // run through every timestep
        // BUT only when network is expanded through time OR it's the first time step (feed-forward and recurrence-check)
        for (var t = 0; t < this.state.height && (E || t === 0); t++) {
            for (var i = I; i >= 0; i--) { // always start backward pass at last recurrent layer, or at second-last layer if t=0
                // expand network and save location of first recurrent occurence
                // to start at next (last) time step
                if(!E && this.model.list[i].recurrent) { 
                    E = true, I = i;
                }

                // project gradients backwards
                this.model.list[i].backward( this.state.blobs[t][i], this.state.blobs[t][i - 1] );
            }  
        }

        // now that we got the gradients
        // we can change the weights
        this.adjust();
        
        return loss;
    };

    Network.prototype.adjust = function() {
        if (++this.pass % this.learner.batch !== 0) {
            return;
        }

        // how to change gradients; select algorithm
        var method = this.gd[this.learner.method];

        // go through every layer
        for (var i = 0; i < this.model.length; ++i) {
            // check if it has parameters
            if (typeof this.model.list[i].parameters === 'undefined')
                continue;

            // iterate through different parameter types
            var P = this.model.list[i].parameters;
            for(var key in P) {
                // different parameter types, have different l1-l2-decays
                // f.E. bias has no such decay
                var decay = Network.prototype.adjust.decay[key];
                    decay = decay === undefined ? 1.0 : decay;

                // put through learner methods
                var param = P[key];
                if (param instanceof Array) {
                    for (var j = 0; j < param.length; j++) { method(this.learner, param[j], decay); }
                } 

                else if (param instanceof lib.Blob) {
                    method(this.learner, param, decay);
                }
            }
        }
    };

    Network.prototype.adjust.decay = { 'biases': 0.0 };

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

    // to make things fast as well as extendable
    // this compiler makes real weight update functions from
    // algorithms; these only need to include, what they need/what they need to save for next time step, 
    // the default options, and the per gradient algorithm to change weights
    // the algorithm should be a function, which changes the already in-scope variable 'dx', which is the change
    // of the weight; it can use the variable gij, representing the gradient
    (function() {
        var gd_prototype = function(opt, O, decay) {
            if (O.omit) return;
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

            var func = gd_prototype_
                .replace('"UU1";', checks.join(""))
                .replace('"UU2";', extractions.join(""))
                .replace('"UU3";', alg)
                .replace('"UU4";', storings.join(""));

            eval('Network.prototype.gd.' + name + ' = ' + func);
            Network.prototype.gd[name].defaults = description.defaults;
        }
    })();

    lib.Network = Network;
})(nnjs);
