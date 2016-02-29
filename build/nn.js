var nnjs = {};

// Utility fun
function assert(condition, message) {
    // from http://stackoverflow.com/questions/15313418/javascript-assert
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}

(function() {"use strict";
    var hasOwn = Object.prototype.hasOwnProperty;
    var toStr = Object.prototype.toString;

    var isArray = function isArray(arr) {
        if (typeof Array.isArray === 'function') {
            return Array.isArray(arr);
        }

        return toStr.call(arr) === '[object Array]';
    };

    var isPlainObject = function isPlainObject(obj) {
        if (!obj || toStr.call(obj) !== '[object Object]') {
            return false;
        }

        var hasOwnConstructor = hasOwn.call(obj, 'constructor');
        var hasIsPrototypeOf = obj.constructor && obj.constructor.prototype && hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
        // Not own constructor property must be Object
        if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
            return false;
        }

        // Own properties are enumerated firstly, so to speed up,
        // if last one is own, then all properties are own.
        var key;
        for (key in obj) { /**/ }

        return typeof key === 'undefined' || hasOwn.call(obj, key);
    };

    function extend() {
        var options, name, src, copy, copyIsArray, clone;
        var target = arguments[0];
        var i = 1;
        var length = arguments.length;
        var deep = false;

        // Handle a deep copy situation
        if (typeof target === 'boolean') {
            deep = target;
            target = arguments[1] || {};
            // skip the boolean and the target
            i = 2;
        } else if ((typeof target !== 'object' && typeof target !== 'function') || target == null) {
            target = {};
        }

        for (; i < length; ++i) {
            options = arguments[i];
            // Only deal with non-null/undefined values
            if (options != null) {
                // Extend the base object
                for (name in options) {
                    src = target[name];
                    copy = options[name];

                    // Prevent never-ending loop
                    if (target !== copy) {
                        // Recurse if we're merging plain objects or arrays
                        if (deep && copy && (isPlainObject(copy) || (copyIsArray = isArray(copy)))) {
                            if (copyIsArray) {
                                copyIsArray = false;
                                clone = src && isArray(src) ? src : [];
                            } else {
                                clone = src && isPlainObject(src) ? src : {};
                            }

                            // Never move original objects, clone them
                            target[name] = extend(deep, clone, copy);

                            // Don't bring in undefined values
                        } else if (typeof copy !== 'undefined') {
                            target[name] = copy;
                        }
                    }
                }
            }
        }

        // Return the modified object
        return target;
    };

    Object.extend = extend;
})();

(function(lib) {
    "use strict";
    var math = {
        gauss_: { a: false, b: 0.0 },
        gauss: function() {
            if (math.gauss_.a) { math.gauss_.a = false;
                return math.gauss_.b; }
            var u = 2 * Math.random() - 1;
            var v = 2 * Math.random() - 1;
            var r = u * u + v * v;
            if (r == 0 || r > 1) return math.gauss();
            var c = Math.sqrt(-2 * Math.log(r) / r);
            math.gauss_.b = v * c; // cache this
            math.gauss_.a = true;
            return u * c;
        },

        randf: function(a, b) {
            return Math.random() * (b - a) + a;
        },

        randi: function(a, b) {
            return Math.floor(Math.random() * (b - a) + a);
        },

        randn: function(mu, std) {
            return mu + math.gauss() * std;
        },

        tanh: typeof Math.tanh === "undefined" ? function(x) {
            var y = Math.exp(2 * x);
            return (y - 1) / (y + 1); } : Math.tanh
    };

    //
    //
    //
    function Size2(x, y) {
        return { x: x, y: y, length: x * y };
    };

    function Size3(x, y, z) {
        return { x: x, y: y, depth: z, length: x * y * z };
    };

    var nativeMatSupport = typeof ArrayBuffer !== 'undefined';
    var extendedNativeMatSupport = nativeMatSupport && Float64Array.prototype.fill !== undefined && Float64Array.prototype.set !== undefined;

    function Mat(x, y, z, v) {
        this.size = lib.Size3(x, y, z);
        this.d = Mat.CreateArray(x * y * z, v === undefined ? 0.0 : v, 'Float64Array');
    };

    Mat.CreateArray = function(length, v, t) {
        var arr = null;

        v = v || 0;
        t = t || 'Float64Array';

        if (nativeMatSupport) {
            arr = eval('new ' + t + '(length)');
        } else {
            arr = new Array(length);
        }

        for (var i = 0; i < length; ++i) { arr[i] = v; }
        return arr;
    };

    Mat.copy = function(mat) {
        var mat_ = new mat(mat.size.x, mat.size.y, mat.size.depth);
        for (var i = 0; i < mat.d.length; i++) { mat_.d[i] = mat.d[i]; }
        return mat_;
    };

    Mat.prototype.maxi = function() {
        for (var i = 0, j = 0, m = -Infinity; i < this.d.length; i++) {
            if (this.d[i] > m) {
                j = i, m = this.d[i];
            }
        }

        return j;
    };

    Mat.prototype.get = function(x, y, z) {
        return this.d[(y * this.size.x + x) * this.size.depth + z];
    };

    Mat.prototype.set = function(x, y, z, v) {
        this.d[(y * this.size.x + x) * this.size.depth + z] = v;
    };

    Mat.prototype.add = function(x, y, z, v) {
        this.d[(y * this.size.x + x) * this.size.depth + z] += v;
    };

    Mat.prototype.all = function(v) {
        if (extendedNativeMatSupport) {
            return this.d.fill(v);
        }

        for (var i = 0; i < this.d.length; i++) { this.d[i] = v; }
    };

    Mat.prototype.copy = function(a) {
        if (extendedNativeMatSupport) {
            return this.d.set(a);
        }

        for (var i = 0; i < this.d.length; i++) { this.d[i] = a[i]; }
    };

    Mat.prototype.write = function(a) {
        for (var i = 0; i < this.d.length; i++) { this.d[i] = a.d[i]; }
    };

    Mat.prototype.randf = function(a, b) {
        for (var i = 0; i < this.d.length; i++) { this.d[i] = math.randf(a, b); }
    };

    Mat.prototype.randn = function(scale) {
        scale = scale || Math.sqrt(1.0 / (this.size.x * this.size.y * this.size.depth));
        for (var i = 0; i < this.d.length; i++) { this.d[i] = math.randn(0.0, scale); }
    };

    Mat.prototype.clone = function() {
        return mat.copy(this);
    };



    Mat.prototype.ToImageDataBuffer = function (dim, alpha) {
        if (!isNaN(d))
            dim = [ dim, dim, dim ];

        if (dim.length == 4) 
            alpha = -1;

        alpha = alpha || 255;

        var len = this.size.x * this.size.y;
        var buffer = new Uint8ClampedArray(len * 4);
        for (var y = 0; y < this.size.y; y++) {
            for (var x = 0; x < this.size.x; x++) {
                buffer[(y * this.size.x + x) * 4 + 0] = this.d[(y * this.size.x + x) * this.size.depth + dim[0]];
                buffer[(y * this.size.x + x) * 4 + 1] = this.d[(y * this.size.x + x) * this.size.depth + dim[1]];
                buffer[(y * this.size.x + x) * 4 + 2] = this.d[(y * this.size.x + x) * this.size.depth + dim[2]];
                buffer[(y * this.size.x + x) * 4 + 3] = alpha < 0 ? this.d[(y * this.size.x + x) * this.size.depth + dim[3]] : alpha;
            }
        }

        return buffer;
    };

    // accessor
    // [ (y * this.size.x + x) * this.size.depth + z ]


    function Blob(x, y, z, v) {
        this.size = lib.Size3(x, y, z);
        this.w = new Mat(x, y, z);
        this.dw = new Mat(x, y, z);

        if (v instanceof Array) {
            this.w.randf(v[0], v[1]);
        } else if (v !== undefined) {
            this.w.all(v);
        } else {
            this.w.randn();
        }

    };

    function MovingWindow(len) {
        this.values = [];
        this.length = len;
    };

    MovingWindow.prototype.add = function (value) {
        if (this.values.length >= this.length) {
            this.values.pop();
        }

        this.values.unshift(value);
    };

    MovingWindow.prototype.average = function () {
        var sum = 0.0;
        for (var i = 0; i < this.values.length; i++) {
            sum += this.values[i];
        }

        return sum / this.values.length;
    };

    lib.MathU = math;
    lib.Size2 = Size2;
    lib.Size3 = Size3;
    lib.Mat = Mat;
    lib.Blob = Blob;
    lib.MovingWindow = MovingWindow;

})(nnjs);

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

(function(lib) {

    function WebWorker(main, nnjs) {
        this.events = {};
        this.CreateWorker(main, nnjs, function () {
            WebWorker.API.listen(this.events, this.worker);
        });
    };

    WebWorker.prototype.CreateWorker = function(main, nnjs, completion) {
        var compile = (function (code) {
            this.worker = new Worker(this.CreateURL(code, nnjs));
            completion.call(this);
        }).bind(this);

        if (main instanceof Function) {
            compile(this.FunctionToString(main));
        } else if (typeof main === 'string') {
            var request = new XMLHttpRequest();

            request.addEventListener("load", function () {
                compile(this.responseText);
            });

            request.addEventListener("error", function () {
                console.log('Error loading worker "' + main + '"');
            });
            request.open("GET", this.ConvertRelativeURI(main));
            request.send();
        }
    };

    WebWorker.prototype.CreateURL = function(code, nnjs) {
        var workerString = this.AddRequiredStuff(nnjs) + '\n' + code;
        var data = this.CreateBlob(workerString);
        return window.URL.createObjectURL(data);
    };

    WebWorker.prototype.CreateBlob = function(string) {
        var blob;
        try {
            blob = new Blob([string], { type: 'application/javascript' });
        } catch (e) { // Backwards-compatibility
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
            blob = new BlobBuilder();
            blob.append(string);
            blob = blob.getBlob();
        }

        return blob;
    };

    WebWorker.prototype.FunctionToString = function(func) {
        var string = worker.toString();
        var beg = string.indexOf('{') + 1;
        var end = string.lastIndexOf('}');
        return string.substring(beg, end).trim();
    };

    WebWorker.prototype.AddRequiredStuff = function(nnjs) {
        var str = 'importScripts("' + this.ConvertRelativeURI(nnjs) + '"); var nn = nnjs; ';
        str += "var WebWorker = {}; WebWorker.API = {";

        var api = [];
        for (var key in WebWorker.API) {
            api.push(key + ': ' + WebWorker.API[key].toString());
        }

        str += api.join(',') + '}; ww = WebWorker.API;';
        str += 'ww.events = {}; ww.listen();';

        return str;
    };

    WebWorker.prototype.ConvertRelativeURI = function(relative) {
        var absolute = null;
        (function (e) {
            e.href = relative; absolute = e.href;
        })(document.createElement('a'));
        return absolute;
    };

    WebWorker.prototype.on = function(event, func) {
        WebWorker.API.on(event, func, this.events);
    };

    WebWorker.prototype.trigger = function(event, data, transfer) {
        WebWorker.API.trigger(event, data, transfer, this.worker);
    };

    WebWorker.API = {
        listen: function(store, w) {
            store = store || (ww ? ww.events : null);
            w = w || self;
            w.onmessage = function(e) {
                var received = e.data;
                var stored = store[received.name];
                for (var i = 0; stored !== undefined && stored instanceof Array && i < stored.length; i++) {
                    stored[i].apply(undefined, [].concat(received.parameter, received.transfer));
                }
            };
        },
        on: function(name, func, store) {
            store = store || (ww ? ww.events : null);
            if (store[name] === undefined) {
                store[name] = [];
            }

            store[name].push(func);
        },
        trigger: function(event, data, transfer, w) {
            w = w || self;
            w.postMessage({
                name: event,
                parameter: data,
                transfer: transfer
            }, transfer);
        }
    };

    lib.WebWorker = WebWorker;

})(nnjs);

(function (lib) { "use strict";

    /* spatial weights */
    function ConvolutionalLayer(opt) {
        this.in = opt.input;
        this.filter = opt.filter;
        this.stride = opt.stride || 1;
        this.pad = opt.pad || 0;

        var ox = Math.floor((this.in.x + this.pad * 2 - this.filter.x) / this.stride + 1);
        var oy = Math.floor((this.in.y + this.pad * 2 - this.filter.y) / this.stride + 1);
        this.out = lib.Size3(ox, oy, this.filter.depth);

        this.parameters = {
            filters: [],
            biases: new lib.Blob(1, 1, this.filter.depth, 0.0)
        };

        for (var i = 0; i < this.out.depth; i++) {
            this.parameters.filters[i] = new lib.Blob(this.filter.x, this.filter.y, this.in.depth);
        }
    };

    ConvolutionalLayer.prototype.forward = function (V, A) {
        var A_x = this.out.x | 0, A_y = this.out.y | 0, A_d = this.out.depth | 0;
        var V_x = this.in.x | 0, V_y = this.in.y | 0, V_d = this.in.depth | 0;
        var F_x = this.filter.x | 0, F_y = this.filter.y | 0;

        var stride = this.stride | 0;
        var biases = this.parameters.biases.w.d;

        var ox = 0, oy = 0, fy = 0, fx = 0, fd = 0, a = 0.0;
        for (var d = 0; d < A_d; d++) {
            var f = this.parameters.filters[d];
            var x = -this.pad | 0;
            var y = -this.pad | 0;
            for (var ay = 0; ay < A_y; y += stride, ay++) { // xy_stride
                x = -this.pad | 0;
                for (var ax = 0; ax < A_x; x += stride, ax++) { // xy_stride

                    // convolve centered at this particular location [ax, ay]
                    a = 0.0;
                    for (fy = y < 0 ? -y : 0; fy < F_y && (y+fy)<V_y; fy++) {
                        oy = y + fy; // coordinates in the original input array coordinates
                        for (fx = x < 0 ? -x : 0; fx < F_x && (x+fx)<V_x; fx++) {
                            ox = x + fx;
                            for (fd = 0; fd < V_d; fd++) {
                                // A.w[ax, ay, d] += f.w[ fx, fy, fd ] * V.w[ ox, oy, fd ]
                                a += f.w.d[(fy * F_x + fx) * V_d + fd] * V.w.d[(oy * V_x + ox) * V_d + fd];
                            }
                        }
                    }

                    A.w.d[(ay * A_x + ax) * A_d + d] = a + biases[d];
                }
            }
        }
    };

    ConvolutionalLayer.prototype.backward = function (A, V) {
        var A_x = this.out.x | 0, A_y = this.out.y | 0, A_d = this.out.depth | 0;
        var V_x = this.in.x | 0, V_y = this.in.y | 0, V_d = this.in.depth | 0;
        var F_x = this.filter.x | 0, F_y = this.filter.y | 0;

        var stride = this.stride | 0;
        var biases = this.parameters.biases.dw.d;

        var v1 = 0, v2 = 0, ox = 0, oy = 0, fy = 0, fx = 0, fd = 0, dA = 0;
        for (var d = 0; d < A_d; d++) {
            var f = this.parameters.filters[d];
            var x = -this.pad | 0;
            var y = -this.pad | 0;
            
            for (var ay = 0; ay < A_y; y += stride, ay++) {
                x = -this.pad | 0;
                for (var ax = 0; ax < A_x; x += stride, ax++) {

                    // convolve centered at this location [ax, ay]
                    dA = A.dw.d[(ay * A_x + ax) * A_d + d];
                    for (fy = y < 0 ? -y : 0; fy < F_y && (y+fy)<V_y; fy++) {
                        oy = y + fy; // coordinates in the original input array coordinates
                        for (fx = x < 0 ? -x : 0; fx < F_x && (x+fx)<V_x; fx++) {
                            ox = x + fx;
                            for (fd = 0; fd < V_d; fd++) {
                                // f.dw[fx, fy, fd] += V.w[ox, oy, fd] * A.dw[ax, ay, d]
                                // V.dw[ox, oy, fd] += f.w[fx, fy, fd] * A.dw[ax, ay, d]
                                v1 = (fy * F_x + fx) * V_d + fd;
                                v2 = (oy * V_x + ox) * V_d + fd;
                                f.dw.d[v1] += V.w.d[v2] * dA;
                                V.dw.d[v2] += f.w.d[v1] * dA;
                            }
                        }
                    }

                    biases[d] += dA;
                }
            }
        }
    };

    /* Pooling layer, select biggest value from convolution */
    function PoolingLayer(opt) {
        this.in = opt.input;
        this.filter = opt.filter;
        this.stride = opt.stride || 1;
        this.pad = opt.pad || 0;

        var ox = Math.floor((this.in.x + this.pad * 2 - this.filter.x) / this.stride + 1);
        var oy = Math.floor((this.in.y + this.pad * 2 - this.filter.y) / this.stride + 1);
        this.out = lib.Size3(ox, oy, this.in.depth);
    };

    PoolingLayer.prototype.forward = function (V, A) {
        var A_x = A.size.x | 0, A_y = A.size.y | 0, A_d = A.size.depth | 0;
        var V_x = V.size.x | 0, V_y = V.size.y | 0, V_d = V.size.depth | 0;
        var F_x = this.filter.x | 0, F_y = this.filter.y | 0; 

        var stride = this.stride | 0;

        for (var d = 0; d < A_d; d++) {
            var x = -this.pad | 0;
            var y = -this.pad | 0;
            for (var ay = 0; ay < A_y; y += stride, ay++) {
                x = -this.pad | 0;
                for (var ax = 0; ax < A_x; x += stride, ax++) {

                    // convolve centered at this location [ax, ay]
                    var selv = -Infinity, selx = 0, sely = 0;
                    var ox = 0, oy = 0, q = 0;
                    for (var fy = 0; fy < F_y; fy++) {
                        oy = y + fy; // coordinates in the original input array coordinates
                        for (var fx = 0; fx < F_x; fx++) {
                            ox = x + fx;
                            if (oy >= 0 && oy < V_y && ox >= 0 && ox < V_x) {
                                q = V.w.d[(oy * V_x + ox) * V_d + d];
                                if (q > selv) { 
                                    selv = q; selx = ox; sely = oy; 
                                }
                            }
                        }
                    }

                    var ix = (ay * A_x + ax) * A_d + d;
                    A.px[ix] = selx;
                    A.py[ix] = sely;
                    A.w.d[ix] = selv;
                }
            }
        }
    };

    PoolingLayer.prototype.backward = function (A, V) {
        var A_x = A.size.x | 0, A_y = A.size.y | 0, A_d = A.size.depth | 0;
        var V_x = V.size.x | 0, V_y = V.size.y | 0, V_d = V.size.depth | 0;
        var F_x = this.filter.x | 0, F_y = this.filter.y | 0; 

        var stride = this.stride | 0;

        for (var d = 0; d < A_d; d++) {
            for (var ay = 0; ay < A_y; ay++) {
                for (var ax = 0; ax < A_x; ax++) {
                    var ix = (ay * A_x + ax) * A_d + d;

                    var selx = A.px[ix]; 
                    var sely = A.py[ix];

                    V.dw.d[(sely * V_x + selx) * V_d + d] = A.dw.d[ix]; // only transfer weights from selected locations
                }
            }
        }
    };

    PoolingLayer.prototype.PrepareStateBlob = function (A) {
        if (A.px === undefined || A.py === undefined) {
            A.px = lib.Mat.CreateArray(this.out.depth * this.out.y * this.out.x, 0, 'Uint16Array');
            A.py = lib.Mat.CreateArray(this.out.depth * this.out.y * this.out.x, 0, 'Uint16Array');
        }
    };

    lib.ConvolutionalLayer = ConvolutionalLayer;
    lib.PoolingLayer = PoolingLayer;
})(nnjs);
(function (lib) { "use strict";
    /**
     * @param {object} input, size
     */
    function DotLayer(opt) {
        this.in = opt.input;
        this.out = lib.Size3(1, 1, opt.size);
        this.parameters = {
            filters: [],
            biases: new lib.Blob(1, 1, this.out.depth, 0.0)
        };

        for (var i = 0; i < this.out.length; i++) {
            this.parameters.filters[i] = new lib.Blob(1, 1, this.in.length);
        }
    };

    DotLayer.prototype.forward = function (V, A) {
        for (var i = 0; i < this.out.length; i++) {
            var sum = 0.0;
            for (var j = 0; j < this.in.length; j++) {
                sum += V.w.d[j] * this.parameters.filters[i].w.d[j];
            }

            A.w.d[i] = sum + this.parameters.biases.w.d[i];
        }
    };

    DotLayer.prototype.backward = function (A, V) {
        for (var i = 0; i < this.out.length; i++) {
            var dA = A.dw.d[i];
            for (var j = 0; j < this.in.length; j++) {
                this.parameters.filters[i].dw.d[j] += V.w.d[j] * dA;
                V.dw.d[j] += this.parameters.filters[i].w.d[j] * dA;
            }

            this.parameters.biases.dw.d[i] += dA;
        }
    };

    lib.DotLayer = DotLayer;
})(nnjs);
(function (lib) { "use strict";

    function DropOutLayer(opt) {
        this.in = opt.input;
        this.out = opt.input;
        this.probability = opt.probability || 0.25;
    }

    DropOutLayer.prototype.forward = function (V, A) {
        if (!this.net.weak) {
            for (var i = 0; i < this.in.length; i++) { A.w.d[i] = V.w.d[i] * this.probability; } return ;
        }

        for (var i = 0; i < this.in.length; i++) {
            if (Math.random() < this.probability) {
                A.w.d[i] = 0.0;
                A.droppedOut[i] = true;
            } else {
                A.w.d[i] = V.w.d[i];
                A.droppedOut[i] = false;
            }
        }
    };

    DropOutLayer.prototype.backward = function (A, V) {
        if (!this.net.weak || A.droppedOut.length !== this.in.length) return ;

        for (var i = 0; i < this.in.length; i++) {
            if(!A.droppedOut[i]) {
                V.dw.d[i] = A.dw.d[i];
            }
        }
    };

    DropOutLayer.prototype.PrepareStateBlob = function (A) {
        A.droppedOut = [];
    };

    lib.DropOutLayer = DropOutLayer;
    
})(nnjs);
(function(lib) { "use strict";

    function InputLayer(opt) {
        this.out = opt.size;
    };

    InputLayer.prototype.forward = function(V, A) {
        A.w.copy(V);
    };

    InputLayer.prototype.backward = function(A, V) {};

    lib.InputLayer = InputLayer;
})(nnjs);

(function(lib) {
    "use strict";

    function sigm(x) {
        return 1.0 / (1.0 + Math.exp(-x));
    }

    function dsigm(y) {
        return y * (1 - y);
    }

    // see http://people.idsia.ch/~juergen/lstm/sld019.htm
    function LongShortTermMemoryLayer(opt) {
        this.in = opt.input;
        this.out = opt.input; // 1 to 1 mapping

        this.recurrent = true;
        this.parameters = {
            filters: [],
            biases: new lib.Blob(1, 1, this.out.depth, 0.0)
        };

        for (var i = 0; i < this.in.length; i++) {
            this.parameters.filters[i] = new lib.Blob(1, 1, 9, [0, 0.08]);
            this.parameters.filters[i].w.d[2] = -1; // at beginning negative peephole connections
            this.parameters.filters[i].w.d[5] = -1; // to minimize exploding
            this.parameters.filters[i].w.d[8] = -1; // cell state
        }

        this.parameters.biases = new lib.Blob(1, this.in.length, 3, 0.0);
    };

    LongShortTermMemoryLayer.prototype.forward = function(V, A) {
        var bias = this.parameters.biases.w.d;
        for (var i = 0; i < this.out.length; i++) {
            var param = this.parameters.filters[i].w.d;

            var x = V.w.d[i];
            var h_ = A.prev.w.d[i];
            var c_ = A.prev.lstm.cells.w.d[i];

            var ig = sigm(x * param[0] + h_ * param[1] + c_ * param[2] + bias[i * 3 + 0]);
            var fg = sigm(x * param[3] + h_ * param[4] + c_ * param[5] + bias[i * 3 + 1]);
            var c = ig * x + fg * c_;
            var og = sigm(x * param[6] + h_ * param[7] + c  * param[8] + bias[i * 3 + 2]);
            var h = og * c;

            A.lstm.gates.in.d[i] = ig;
            A.lstm.gates.forget.d[i] = fg;
            A.lstm.gates.out.d[i] = og;

            A.lstm.cells.w.d[i] = c;
            A.w.d[i] = h;
        }
    };

    LongShortTermMemoryLayer.prototype.backward = function(A, V) {
        var BIAS = this.parameters.biases;
        var bias = BIAS.w.d;
        for (var i = 0; i < this.out.length; i++) {
            var PARAM = this.parameters.filters[i];
            var param = PARAM.w.d;
            
            var ig = A.lstm.gates.in.d[i];
            var fg = A.lstm.gates.forget.d[i];
            var og = A.lstm.gates.out.d[i];
            var c = A.lstm.cells.w.d[i];

            var x = V.w.d[i];
            var h_ = A.prev.w.d[i];
            var c_ = A.prev.lstm.cells.w.d[i];

            var dh = A.dw.d[i];
            var dc = A.lstm.cells.dw.d[i];

            var dog = dsigm(og) * c * dh;
                dc = dc + param[8] * dog + og * dh;
            var dfg = dsigm(fg) * c_ * dc;
            var dig = dsigm(ig) * x * dc;
            var dx = ig * dc + param[6] * dog + param[3] * dfg + param[0] * dig;

            var dc_ = fg * dc + param[5] * dfg + param[2] * dig;
            var dh_ = param[7] * dog + param[4] * dfg + param[1] * dig;

            A.prev.lstm.cells.dw.d[i] = dc_;
            A.prev.dw.d[i] += dh_; // add to already backpropped value
            V.dw.d[i] = dx;

            PARAM.dw.d[0] += x * dig;
            PARAM.dw.d[1] += h_ * dig;
            PARAM.dw.d[2] += c_ * dig;
            PARAM.dw.d[3] += x * dfg;
            PARAM.dw.d[4] += h_ * dfg;
            PARAM.dw.d[5] += c_ * dfg;
            PARAM.dw.d[6] += x * dog;
            PARAM.dw.d[7] += h_ * dog;
            PARAM.dw.d[8] += c * dog;

            BIAS.dw.d[i * 3 + 0] += 1.0 * dig;
            BIAS.dw.d[i * 3 + 1] += 1.0 * dfg;
            BIAS.dw.d[i * 3 + 2] += 1.0 * dog;
        }
    };

    LongShortTermMemoryLayer.prototype.PrepareStateBlob = function(A) {
        if (typeof A.state === 'undefined') {
            A.lstm = {
                cells: new lib.Blob(this.out.x, this.out.y, this.out.depth, 0.0),
                gates: { in : new lib.Mat(this.out.x, this.out.y, this.out.depth, 0.0),
                    out: new lib.Mat(this.out.x, this.out.y, this.out.depth, 0.0),
                    forget: new lib.Mat(this.out.x, this.out.y, this.out.depth, 0.0)
                }
            };
        } else {
            A.lstm.cells.w.all(0);
        }
    };

    lib.LongShortTermMemoryLayer = LongShortTermMemoryLayer;
})(nnjs);

(function (lib) { "use strict";
    function SigmoidLayer(opt) {
        this.in = opt.input;
        this.out = opt.input;
    };

    SigmoidLayer.prototype.forward = function (V, A) {
        for (var i = 0; i < this.in.length; i++) {
            A.w.d[i] = 1.0/(1.0+Math.exp(-V.w.d[i]));
        }
    }

    SigmoidLayer.prototype.backward = function (A, V) {
        for (var i = 0; i < this.in.length; i++) {
            V.dw.d[i] = A.w.d[i] * (-A.w.d[i] + 1.0) * A.dw.d[i];
        }
    };

    function ReluLayer(opt) {
        this.in = opt.input;
        this.out = opt.input;
    };

    ReluLayer.prototype.forward = function (V, A) {
        for (var i = 0; i < this.in.length; i++) {
            A.w.d[i] = V.w.d[i] < 0 ? 0 : V.w.d[i];
        }
    }

    ReluLayer.prototype.backward = function (A, V) {
        for (var i = 0; i < this.in.length; i++) {
            if(A.w.d[i] <= 0) V.dw.d[i] = 0; // threshold
            else V.dw.d[i] = A.dw.d[i];
        }
    };

    function TanhLayer(opt) {
        this.in = opt.input;
        this.out = opt.input;
    };

    TanhLayer.prototype.forward = function (V, A) {
        for (var i = 0; i < this.in.length; i++) {
            A.w.d[i] = lib.MathU.tanh(V.w.d[i]);
        }
    }

    TanhLayer.prototype.backward = function (A, V) {
        for (var i = 0; i < this.in.length; i++) {
            V.dw.d[i] = (1.0 - A.w.d[i] * A.w.d[i]) * A.dw.d[i];
        }
    };

    lib.SigmoidLayer = SigmoidLayer;
    lib.ReluLayer = ReluLayer;
    lib.TanhLayer = TanhLayer;
})(nnjs);
(function (lib) { "use strict";

    function RegressionLayer(opt) {
        this.in = opt.input;
        this.out = opt.input;
    };

    RegressionLayer.prototype.forward = function (V, A) {
        A.w.write(V.w);
    };

    RegressionLayer.prototype.backward = function (A, V, desired) {
        var loss = 0.0;
        if(desired instanceof Array || desired instanceof Float64Array) {
            for(var i = 0; i < this.out.length; ++i) {
                V.dw.d[i] = A.w.d[i] - desired[i];
                loss += 0.5*V.dw.d[i]*V.dw.d[i];
            }
        }

        return loss;
    };

    lib.RegressionLayer = RegressionLayer;

})(nnjs);
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
(function(lib) { "use strict";

    if (typeof module === "undefined" || typeof module.exports === "undefined") {
        if (typeof window !== 'undefined') { // web worker support; just use nnjs in web worker
            window.nn = lib;
        }
    } else {
        module.exports = lib;
    }
    
})(nnjs);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5uLmluaXQuanMiLCJubi5tYXRoLmpzIiwiYXBpL25ldHdvcmsubm4uanMiLCJhcGkvd2Vid29ya2VyLm5uLmpzIiwibGF5ZXJzL2NvbnZvbHV0aW9uYWwubm4uanMiLCJsYXllcnMvZG90Lm5uLmpzIiwibGF5ZXJzL2Ryb3BvdXQubm4uanMiLCJsYXllcnMvaW5wdXQubm4uanMiLCJsYXllcnMvbHN0bS5ubi5qcyIsImxheWVycy9ub24tbGluZWFyLm5uLmpzIiwibGF5ZXJzL3JlZ3Jlc3Npb24ubm4uanMiLCJsYXllcnMvc29mdG1heC5ubi5qcyIsIm5uLmV4cG9ydC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9aQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDckxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibm4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgbm5qcyA9IHt9O1xuXG4vLyBVdGlsaXR5IGZ1blxuZnVuY3Rpb24gYXNzZXJ0KGNvbmRpdGlvbiwgbWVzc2FnZSkge1xuICAgIC8vIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNTMxMzQxOC9qYXZhc2NyaXB0LWFzc2VydFxuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiQXNzZXJ0aW9uIGZhaWxlZFwiO1xuICAgICAgICBpZiAodHlwZW9mIEVycm9yICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbWVzc2FnZTsgLy8gRmFsbGJhY2tcbiAgICB9XG59XG5cbihmdW5jdGlvbigpIHtcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICB2YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gICAgdmFyIGlzQXJyYXkgPSBmdW5jdGlvbiBpc0FycmF5KGFycikge1xuICAgICAgICBpZiAodHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGFycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9TdHIuY2FsbChhcnIpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG5cbiAgICB2YXIgaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqKSB7XG4gICAgICAgIGlmICghb2JqIHx8IHRvU3RyLmNhbGwob2JqKSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBoYXNPd25Db25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG4gICAgICAgIHZhciBoYXNJc1Byb3RvdHlwZU9mID0gb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgJiYgaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcbiAgICAgICAgLy8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuICAgICAgICBpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNPd25Db25zdHJ1Y3RvciAmJiAhaGFzSXNQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3duIHByb3BlcnRpZXMgYXJlIGVudW1lcmF0ZWQgZmlyc3RseSwgc28gdG8gc3BlZWQgdXAsXG4gICAgICAgIC8vIGlmIGxhc3Qgb25lIGlzIG93biwgdGhlbiBhbGwgcHJvcGVydGllcyBhcmUgb3duLlxuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHsgLyoqLyB9XG5cbiAgICAgICAgcmV0dXJuIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgICAgICB2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmU7XG4gICAgICAgIHZhciB0YXJnZXQgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIHZhciBpID0gMTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIHZhciBkZWVwID0gZmFsc2U7XG5cbiAgICAgICAgLy8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuICAgICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBkZWVwID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuICAgICAgICAgICAgLy8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuICAgICAgICAgICAgaSA9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB0YXJnZXQgIT09ICdvYmplY3QnICYmIHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicpIHx8IHRhcmdldCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuICAgICAgICAgICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYyA9IHRhcmdldFtuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgY29weSA9IG9wdGlvbnNbbmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBuZXZlci1lbmRpbmcgbG9vcFxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0ICE9PSBjb3B5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWVwICYmIGNvcHkgJiYgKGlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gaXNBcnJheShjb3B5KSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcHlJc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlJc0FycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5ldmVyIG1vdmUgb3JpZ2luYWwgb2JqZWN0cywgY2xvbmUgdGhlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb3B5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGNvcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICBPYmplY3QuZXh0ZW5kID0gZXh0ZW5kO1xufSkoKTtcbiIsIihmdW5jdGlvbihsaWIpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgbWF0aCA9IHtcbiAgICAgICAgZ2F1c3NfOiB7IGE6IGZhbHNlLCBiOiAwLjAgfSxcbiAgICAgICAgZ2F1c3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKG1hdGguZ2F1c3NfLmEpIHsgbWF0aC5nYXVzc18uYSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRoLmdhdXNzXy5iOyB9XG4gICAgICAgICAgICB2YXIgdSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcbiAgICAgICAgICAgIHZhciB2ID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuICAgICAgICAgICAgdmFyIHIgPSB1ICogdSArIHYgKiB2O1xuICAgICAgICAgICAgaWYgKHIgPT0gMCB8fCByID4gMSkgcmV0dXJuIG1hdGguZ2F1c3MoKTtcbiAgICAgICAgICAgIHZhciBjID0gTWF0aC5zcXJ0KC0yICogTWF0aC5sb2cocikgLyByKTtcbiAgICAgICAgICAgIG1hdGguZ2F1c3NfLmIgPSB2ICogYzsgLy8gY2FjaGUgdGhpc1xuICAgICAgICAgICAgbWF0aC5nYXVzc18uYSA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gdSAqIGM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmFuZGY6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogKGIgLSBhKSArIGE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmFuZGk6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoYiAtIGEpICsgYSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmFuZG46IGZ1bmN0aW9uKG11LCBzdGQpIHtcbiAgICAgICAgICAgIHJldHVybiBtdSArIG1hdGguZ2F1c3MoKSAqIHN0ZDtcbiAgICAgICAgfSxcblxuICAgICAgICB0YW5oOiB0eXBlb2YgTWF0aC50YW5oID09PSBcInVuZGVmaW5lZFwiID8gZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgdmFyIHkgPSBNYXRoLmV4cCgyICogeCk7XG4gICAgICAgICAgICByZXR1cm4gKHkgLSAxKSAvICh5ICsgMSk7IH0gOiBNYXRoLnRhbmhcbiAgICB9O1xuXG4gICAgLy9cbiAgICAvL1xuICAgIC8vXG4gICAgZnVuY3Rpb24gU2l6ZTIoeCwgeSkge1xuICAgICAgICByZXR1cm4geyB4OiB4LCB5OiB5LCBsZW5ndGg6IHggKiB5IH07XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIFNpemUzKHgsIHksIHopIHtcbiAgICAgICAgcmV0dXJuIHsgeDogeCwgeTogeSwgZGVwdGg6IHosIGxlbmd0aDogeCAqIHkgKiB6IH07XG4gICAgfTtcblxuICAgIHZhciBuYXRpdmVNYXRTdXBwb3J0ID0gdHlwZW9mIEFycmF5QnVmZmVyICE9PSAndW5kZWZpbmVkJztcbiAgICB2YXIgZXh0ZW5kZWROYXRpdmVNYXRTdXBwb3J0ID0gbmF0aXZlTWF0U3VwcG9ydCAmJiBGbG9hdDY0QXJyYXkucHJvdG90eXBlLmZpbGwgIT09IHVuZGVmaW5lZCAmJiBGbG9hdDY0QXJyYXkucHJvdG90eXBlLnNldCAhPT0gdW5kZWZpbmVkO1xuXG4gICAgZnVuY3Rpb24gTWF0KHgsIHksIHosIHYpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbGliLlNpemUzKHgsIHksIHopO1xuICAgICAgICB0aGlzLmQgPSBNYXQuQ3JlYXRlQXJyYXkoeCAqIHkgKiB6LCB2ID09PSB1bmRlZmluZWQgPyAwLjAgOiB2LCAnRmxvYXQ2NEFycmF5Jyk7XG4gICAgfTtcblxuICAgIE1hdC5DcmVhdGVBcnJheSA9IGZ1bmN0aW9uKGxlbmd0aCwgdiwgdCkge1xuICAgICAgICB2YXIgYXJyID0gbnVsbDtcblxuICAgICAgICB2ID0gdiB8fCAwO1xuICAgICAgICB0ID0gdCB8fCAnRmxvYXQ2NEFycmF5JztcblxuICAgICAgICBpZiAobmF0aXZlTWF0U3VwcG9ydCkge1xuICAgICAgICAgICAgYXJyID0gZXZhbCgnbmV3ICcgKyB0ICsgJyhsZW5ndGgpJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHsgYXJyW2ldID0gdjsgfVxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH07XG5cbiAgICBNYXQuY29weSA9IGZ1bmN0aW9uKG1hdCkge1xuICAgICAgICB2YXIgbWF0XyA9IG5ldyBtYXQobWF0LnNpemUueCwgbWF0LnNpemUueSwgbWF0LnNpemUuZGVwdGgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdC5kLmxlbmd0aDsgaSsrKSB7IG1hdF8uZFtpXSA9IG1hdC5kW2ldOyB9XG4gICAgICAgIHJldHVybiBtYXRfO1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLm1heGkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBtID0gLUluZmluaXR5OyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kW2ldID4gbSkge1xuICAgICAgICAgICAgICAgIGogPSBpLCBtID0gdGhpcy5kW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGo7XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICAgICAgICByZXR1cm4gdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHpdO1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHgsIHksIHosIHYpIHtcbiAgICAgICAgdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHpdID0gdjtcbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih4LCB5LCB6LCB2KSB7XG4gICAgICAgIHRoaXMuZFsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyB6XSArPSB2O1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgaWYgKGV4dGVuZGVkTmF0aXZlTWF0U3VwcG9ydCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZC5maWxsKHYpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gdjsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihhKSB7XG4gICAgICAgIGlmIChleHRlbmRlZE5hdGl2ZU1hdFN1cHBvcnQpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmQuc2V0KGEpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gYVtpXTsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24oYSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBhLmRbaV07IH1cbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5yYW5kZiA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gbWF0aC5yYW5kZihhLCBiKTsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLnJhbmRuID0gZnVuY3Rpb24oc2NhbGUpIHtcbiAgICAgICAgc2NhbGUgPSBzY2FsZSB8fCBNYXRoLnNxcnQoMS4wIC8gKHRoaXMuc2l6ZS54ICogdGhpcy5zaXplLnkgKiB0aGlzLnNpemUuZGVwdGgpKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gbWF0aC5yYW5kbigwLjAsIHNjYWxlKTsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBtYXQuY29weSh0aGlzKTtcbiAgICB9O1xuXG5cblxuICAgIE1hdC5wcm90b3R5cGUuVG9JbWFnZURhdGFCdWZmZXIgPSBmdW5jdGlvbiAoZGltLCBhbHBoYSkge1xuICAgICAgICBpZiAoIWlzTmFOKGQpKVxuICAgICAgICAgICAgZGltID0gWyBkaW0sIGRpbSwgZGltIF07XG5cbiAgICAgICAgaWYgKGRpbS5sZW5ndGggPT0gNCkgXG4gICAgICAgICAgICBhbHBoYSA9IC0xO1xuXG4gICAgICAgIGFscGhhID0gYWxwaGEgfHwgMjU1O1xuXG4gICAgICAgIHZhciBsZW4gPSB0aGlzLnNpemUueCAqIHRoaXMuc2l6ZS55O1xuICAgICAgICB2YXIgYnVmZmVyID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGxlbiAqIDQpO1xuICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHRoaXMuc2l6ZS55OyB5KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy5zaXplLng7IHgrKykge1xuICAgICAgICAgICAgICAgIGJ1ZmZlclsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiA0ICsgMF0gPSB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgZGltWzBdXTtcbiAgICAgICAgICAgICAgICBidWZmZXJbKHkgKiB0aGlzLnNpemUueCArIHgpICogNCArIDFdID0gdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIGRpbVsxXV07XG4gICAgICAgICAgICAgICAgYnVmZmVyWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIDQgKyAyXSA9IHRoaXMuZFsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyBkaW1bMl1dO1xuICAgICAgICAgICAgICAgIGJ1ZmZlclsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiA0ICsgM10gPSBhbHBoYSA8IDAgPyB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgZGltWzNdXSA6IGFscGhhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICB9O1xuXG4gICAgLy8gYWNjZXNzb3JcbiAgICAvLyBbICh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHogXVxuXG5cbiAgICBmdW5jdGlvbiBCbG9iKHgsIHksIHosIHYpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbGliLlNpemUzKHgsIHksIHopO1xuICAgICAgICB0aGlzLncgPSBuZXcgTWF0KHgsIHksIHopO1xuICAgICAgICB0aGlzLmR3ID0gbmV3IE1hdCh4LCB5LCB6KTtcblxuICAgICAgICBpZiAodiBpbnN0YW5jZW9mIEFycmF5KSB7XG4gICAgICAgICAgICB0aGlzLncucmFuZGYodlswXSwgdlsxXSk7XG4gICAgICAgIH0gZWxzZSBpZiAodiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLncuYWxsKHYpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy53LnJhbmRuKCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBNb3ZpbmdXaW5kb3cobGVuKSB7XG4gICAgICAgIHRoaXMudmFsdWVzID0gW107XG4gICAgICAgIHRoaXMubGVuZ3RoID0gbGVuO1xuICAgIH07XG5cbiAgICBNb3ZpbmdXaW5kb3cucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xuICAgICAgICBpZiAodGhpcy52YWx1ZXMubGVuZ3RoID49IHRoaXMubGVuZ3RoKSB7XG4gICAgICAgICAgICB0aGlzLnZhbHVlcy5wb3AoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMudmFsdWVzLnVuc2hpZnQodmFsdWUpO1xuICAgIH07XG5cbiAgICBNb3ZpbmdXaW5kb3cucHJvdG90eXBlLmF2ZXJhZ2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdW0gPSAwLjA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy52YWx1ZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHN1bSArPSB0aGlzLnZhbHVlc1tpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdW0gLyB0aGlzLnZhbHVlcy5sZW5ndGg7XG4gICAgfTtcblxuICAgIGxpYi5NYXRoVSA9IG1hdGg7XG4gICAgbGliLlNpemUyID0gU2l6ZTI7XG4gICAgbGliLlNpemUzID0gU2l6ZTM7XG4gICAgbGliLk1hdCA9IE1hdDtcbiAgICBsaWIuQmxvYiA9IEJsb2I7XG4gICAgbGliLk1vdmluZ1dpbmRvdyA9IE1vdmluZ1dpbmRvdztcblxufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8qKlxuICAgICAqIEhlbHBlciBmdW5jdGlvbiwgdGhhdCBjb252ZXJ0cyBhIGRlc2NyaXB0aW9uIGludG8gYW4gYWN0dWFsIGxheWVyIG9iamVjdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkZXNjcmlwdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIExheWVyKG9wdCkge1xuICAgICAgICBzd2l0Y2ggKG9wdC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdpbnB1dCc6IHJldHVybiBuZXcgbGliLklucHV0TGF5ZXIob3B0KTtcbiAgICAgICAgICAgIGNhc2UgJ2RvdCc6IHJldHVybiBuZXcgbGliLkRvdExheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICdjb252JzogcmV0dXJuIG5ldyBsaWIuQ29udm9sdXRpb25hbExheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICdsc3RtJzogcmV0dXJuIG5ldyBsaWIuTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICdwb29sJzogcmV0dXJuIG5ldyBsaWIuUG9vbGluZ0xheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICdzaWdtb2lkJzogcmV0dXJuIG5ldyBsaWIuU2lnbW9pZExheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICdyZWx1JzogcmV0dXJuIG5ldyBsaWIuUmVsdUxheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICd0YW5oJzogcmV0dXJuIG5ldyBsaWIuVGFuaExheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICdkcm9wb3V0JzogcmV0dXJuIG5ldyBsaWIuRHJvcE91dExheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICdzb2Z0bWF4JzogcmV0dXJuIG5ldyBsaWIuU29mdG1heExheWVyKG9wdCk7XG4gICAgICAgICAgICBjYXNlICdoc20nOiByZXR1cm4gbmV3IGxpYi5IaWVyYXJjaGljYWxTb2Z0bWF4KG9wdCk7XG4gICAgICAgICAgICBjYXNlICdyZWdyZXNzaW9uJzogcmV0dXJuIG5ldyBsaWIuUmVncmVzc2lvbkxheWVyKG9wdCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBUaGUgbmV0d29yayBtb2RlbCwgZGVzY3JpYmluZyBob3cgZGF0YSBmbG93cyB0aHJvdWdoIHRoZSBuZXR3b3JrLCBmcm9tIGlucHV0IHRvIG91dHB1dFxuICAgICAqIEBwYXJhbSB7YXJyYXl9IGRlc2MgICAgICBBbiBhcnJheSB3aXRoIGxheWVyIGRlc2NyaXB0aW9ucywgc2VlIGV4YW1wbGVzIGFuZCBkb2N1bWVudGF0aW9uIGZvciBtb3JlXG4gICAgICogQHBhcmFtIHtubi5OZXR3b3JrfSBuZXQgIFRoZSBuZXR3b3JrIHRoYXQgbGlua3MgdG8gdGhlIG1vZGVsXG4gICAgICovXG4gICAgZnVuY3Rpb24gTmV0d29ya01vZGVsKGRlc2MpIHtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IHRoaXMuRXhwYW5kRGVzY3JpcHRpb24oZGVzYyk7XG4gICAgICAgIHRoaXMucmVjdXJyZW50ID0gZmFsc2U7XG4gICAgICAgIHRoaXMuQnVpbGQoKTtcbiAgICB9O1xuXG4gICAgTmV0d29ya01vZGVsLnByb3RvdHlwZS5FeHBhbmREZXNjcmlwdGlvbiA9IGZ1bmN0aW9uIChkZXNjcmlwdGlvbikge1xuICAgICAgICB2YXIgTCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRvciA9IGRlc2NyaXB0aW9uW2ldO1xuICAgICAgICAgICAgaWYgKGRlc2NyaXB0b3IudHlwZSA9PT0gJ3NvZnRtYXgnICYmIGRlc2NyaXB0b3IuY2xhc3NlcyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgTC5wdXNoKHsgdHlwZTogJ2RvdCcsIHNpemU6IGRlc2NyaXB0b3IuY2xhc3NlcyB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZWxzZSBpZiAoZGVzY3JpcHRvci50eXBlID09PSAncmVncmVzc2lvbicgJiYgZGVzY3JpcHRvci5zaXplICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBMLnB1c2goeyB0eXBlOiAnZG90Jywgc2l6ZTogZGVzY3JpcHRvci5zaXplIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBMLnB1c2goZGVzY3JpcHRvcik7XG5cbiAgICAgICAgICAgIHN3aXRjaCAoZGVzY3JpcHRvci5hY3RpdmF0aW9uKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAndGFuaCc6XG4gICAgICAgICAgICAgICAgY2FzZSAnc2lnbW9pZCc6XG4gICAgICAgICAgICAgICAgY2FzZSAncmVsdSc6XG4gICAgICAgICAgICAgICAgICAgIEwucHVzaCh7IHR5cGU6IGRlc2NyaXB0b3IuYWN0aXZhdGlvbiB9KTsgXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgICAgICAgY2FzZSB1bmRlZmluZWQ6XG4gICAgICAgICAgICAgICAgZGVmYXVsdDogXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvci5kcm9wb3V0KSB7XG4gICAgICAgICAgICAgICAgTC5wdXNoKHsgdHlwZTogJ2Ryb3BvdXQnLCBwcm9iYWJpbGl0eTogZGVzY3JpcHRvci5kcm9wb3V0IH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZXNjcmlwdG9yLmFjdGl2YXRpb24gPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICBkZXNjcmlwdG9yLmRyb3BvdXQgPSB1bmRlZmluZWQ7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gTDtcbiAgICB9O1xuXG4gICAgTmV0d29ya01vZGVsLnByb3RvdHlwZS5CdWlsZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5saXN0ID0gW107IHZhciBsID0gbnVsbDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGVzY3JpcHRpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkZXNjcmlwdG9yID0gdGhpcy5kZXNjcmlwdGlvbltpXTtcblxuICAgICAgICAgICAgaWYgKGwgIT0gbnVsbCkgXG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvci5pbnB1dCA9IGwub3V0O1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0aGlzLmxpc3QucHVzaChsID0gTGF5ZXIoZGVzY3JpcHRvcikpO1xuICAgICAgICAgICAgdGhpcy5yZWN1cnJlbnQgPSB0aGlzLnJlY3VycmVudCB8fCBsLnJlY3VycmVudDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5saXN0Lmxlbmd0aDtcbiAgICB9O1xuXG4gICAgTmV0d29ya01vZGVsLnByb3RvdHlwZS5saW5rID0gZnVuY3Rpb24gKG5ldCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMubGlzdFtpXS5uZXQgPSBuZXQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmxpbmtlZCA9IG5ldDtcbiAgICB9XG5cbiAgICBOZXR3b3JrTW9kZWwucHJvdG90eXBlLmV4cG9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIGFyciA9IFsgXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRlc2NyaXB0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRvciA9IE9iamVjdC5leHRlbmQoe30sIHRoaXMuZGVzY3JpcHRpb25baV0pO1xuICAgICAgICAgICAgdmFyIGxheWVyID0gdGhpcy5saXN0W2ldO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW1ldGVycyA9IHt9O1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGxheWVyLnBhcmFtZXRlcnMpIHtcbiAgICAgICAgICAgICAgICB2YXIgcGFyYW0gPSBsYXllci5wYXJhbWV0ZXJzW2tleV07XG4gICAgICAgICAgICAgICAgaWYgKHBhcmFtIGluc3RhbmNlb2YgQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyYW1ldGVyc1trZXldID0gW107XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGFyYW0ubGVuZ3RoOyBqKyspIHsgcGFyYW1ldGVyc1trZXldW2pdID0gcGFyYW1bal0udy5kOyB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBsaWIuQmxvYikge1xuICAgICAgICAgICAgICAgICAgICBwYXJhbWV0ZXJzW2tleV0gPSBwYXJhbS53LmQ7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBsaWIuTWF0KSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmFtZXRlcnNba2V5XSA9IHBhcmFtLmQ7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBkZXNjcmlwdG9yLnBhcmFtZXRlcnMgPSBwYXJhbWV0ZXJzO1xuXG4gICAgICAgICAgICBhcnIucHVzaChkZXNjcmlwdG9yKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfTtcblxuICAgIE5ldHdvcmtNb2RlbC5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICBpID0gaSA+PSAwID8gaSA6IHRoaXMubGVuZ3RoICsgaTtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdFtpXTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogVGhlIG5ldHdvcmsgc3RhdGUsIHdoaWNoIHJlcHJlc2VudHMgdGhlIGN1cnJlbnQgZGF0YSBpbiB0aGUgbmV0d29ya1xuICAgICAqIEBwYXJhbSB7bm4uTmV0d29ya01vZGVsfSBtb2RlbFxuICAgICAqIEBwYXJhbSB7aW50fSBUXG4gICAgICovXG4gICAgZnVuY3Rpb24gTmV0d29ya1N0YXRlKG1vZGVsLCBUKSB7XG4gICAgICAgIHRoaXMubW9kZWwgPSBtb2RlbDtcbiAgICAgICAgdGhpcy53aWR0aCA9IHRoaXMubW9kZWwubGVuZ3RoOyAvLyBob3cgbWFueSBsYXllcnM/XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5tb2RlbC5yZWN1cnJlbnQgPyBUIDogMTsgLy8gdGhyb3VnaCBob3cgbWFueSB0aW1lLXN0ZXBzIHVuZm9sZCBuZXR3b3JrPyAvIHRpbWUgc3RlcHNcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLm1vZGVsLnJlY3VycmVudCkge1xuICAgICAgICAgICAgdGhpcy5ibG9icyA9IHRoaXMuQnVpbGQoVCArIDEpOyAvLyBsYXN0IG9uZSBuZWVkcyByZWZlcmVuY2UgdG8gcHJldmlvdXNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYmxvYnMgPSB0aGlzLkJ1aWxkKDEpOyAvLyBvbmx5IG9uZSB0aW1lIG5lZWRlZFxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFsgWyBzdGF0ZSBmb3IgVD0wIF0sIFsgc3RhdGUgZm9yIFQ9MSBdLCAuLi4gXVxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUuQnVpbGQgPSBmdW5jdGlvbiAoaCwgUykge1xuICAgICAgICB2YXIgVCA9IFtdO1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IGg7IHQrKykge1xuICAgICAgICAgICAgVC51bnNoaWZ0KHRoaXMuQnVpbGRTdGF0ZShULCBTICE9PSB1bmRlZmluZWQgPyBTW3RdIDogdW5kZWZpbmVkKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVDtcbiAgICB9O1xuXG4gICAgLy8gWyBbIEJsb2IgZm9yIGxheWVyIDEgXSwgWyBCbG9iIGZvciBsYXllciAyIF0sIC4uLiBdXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5CdWlsZFN0YXRlID0gZnVuY3Rpb24gKFQsIFMpIHtcbiAgICAgICAgUyA9IFMgfHwgW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1vZGVsLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAvLyBjcmVhdGUgb3IgcmVjeWNsZSBsYXllciBpdGVtXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMubW9kZWwubGlzdFtpXS5vdXQgIT09ICd1bmRlZmluZWQnICYmIFNbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFNbaV0gPSBuZXcgbGliLkJsb2IodGhpcy5tb2RlbC5saXN0W2ldLm91dC54LCB0aGlzLm1vZGVsLmxpc3RbaV0ub3V0LnksIHRoaXMubW9kZWwubGlzdFtpXS5vdXQuZGVwdGgsIDAuMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFNbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFNbaV0gPSB7fTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgU1tpXS53LmFsbCgwKSwgU1tpXS5kdy5hbGwoMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGlmIHJlY3VycmVudCwgYWRkIGxpbmsgdG8gcHJldmlvdXMgdGltZS1zdGVwXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMubW9kZWwubGlzdFtpXS5yZWN1cnJlbnQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMubW9kZWwubGlzdFtpXS5yZWN1cnJlbnRcbiAgICAgICAgICAgICAgICAgICAgJiYgVCAhPT0gdW5kZWZpbmVkICYmIFQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIFNbaV0ucHJldiA9IFRbMF1baV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIGFkZCBsYXllciBzcGVjaWZpYyB2YXJpYWJsZXNcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5tb2RlbC5saXN0W2ldLlByZXBhcmVTdGF0ZUJsb2IgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5tb2RlbC5saXN0W2ldLlByZXBhcmVTdGF0ZUJsb2IoU1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUztcbiAgICB9O1xuXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5ibG9icyA9IHRoaXMuQnVpbGQodGhpcy5ibG9icy5sZW5ndGgsIHRoaXMuYmxvYnMpO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLm1vZGVsLnJlY3VycmVudCkge1xuICAgICAgICAgICAgLy8gZ2V0IGxhc3QgaXRlbVxuICAgICAgICAgICAgdmFyIFMgPSB0aGlzLmJsb2JzLnBvcCgpO1xuXG4gICAgICAgICAgICAvLyByZWN5Y2xlIGl0XG4gICAgICAgICAgICB0aGlzLmJsb2JzLnVuc2hpZnQodGhpcy5CdWlsZFN0YXRlKHRoaXMuYmxvYnMsIFMpKTsgLy8gcmV1c2FiaWxpdHlcblxuICAgICAgICAgICAgLy8gYW5kIHJlbW92ZSBhbGwgY29ubmVjdGlvbnMgdG8gYW55IG9sZGVyIGl0ZW1zXG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMud2lkdGgubGVuZ3RoOyBpKyspIHsgXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYmxvYnNbdGhpcy5oZWlnaHRdW2ldLnByZXYpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmxvYnNbdGhpcy5oZWlnaHRdW2ldLnByZXYgPSBudWxsOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFuIGdyYWRpZW50c1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IHRoaXMuYmxvYnMubGVuZ3RoOyB0KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy53aWR0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ic1t0XVtpXS5kdy5hbGwoMC4wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLmV4cG9ydCA9IGZ1bmN0aW9uICgpIHtcbiAgICB9O1xuXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpLCB0KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmJsb2JzWyh0IHx8IDApID49IDAgPyAodCB8fCAwKSA6IHRoaXMuaGVpZ2h0ICsgdF1bKGkgfHwgMCkgPj0gMCA/IChpIHx8IDApIDogdGhpcy53aWR0aCArIGldO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBBIG5ldXJhbCBuZXR3b3JrLCBjb25zaXN0aW5nIG9mIGEgc3RhdGUgYW5kIGEgbW9kZWxcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gb3B0XG4gICAgICovXG4gICAgZnVuY3Rpb24gTmV0d29yayhvcHQpIHtcbiAgICAgICAgdGhpcy5sZWFybmVyID0gb3B0LmxlYXJuZXI7XG4gICAgICAgIHRoaXMubGVhcm5lciA9IE9iamVjdC5leHRlbmQodHJ1ZSwge1xuICAgICAgICAgICAgbWV0aG9kOiAnc2dkJyxcbiAgICAgICAgICAgIGJhdGNoOiAxLFxuICAgICAgICAgICAgZGVjYXk6IHsgbDE6IDAsIGwyOiAwIH0sXG4gICAgICAgICAgICBjbGlwOiBJbmZpbml0eSxcbiAgICAgICAgICAgIHRpbWVzcGFuOiAxMCAvLyBvbmx5IGZvciBybm5cbiAgICAgICAgfSwgdGhpcy5sZWFybmVyKTtcblxuICAgICAgICB0aGlzLmxlYXJuZXIgPSBPYmplY3QuZXh0ZW5kKHRydWUsIHRoaXMuZ2RbdGhpcy5sZWFybmVyLm1ldGhvZF0uZGVmYXVsdHMsIHRoaXMubGVhcm5lcik7XG4gICAgICAgIHRoaXMud2VhayA9IHRydWU7IC8vIGRyb3BvdXQgZW5hYmxlZD8gaW4gcHJvZHVjdGlvbiB2ZXJzaW9ucyBvZiBhIG5ldCwgdGhpcyBzaG91bGQgYmUgdHVybmVkIG9mZlxuICAgICAgICB0aGlzLnBhc3MgPSAwOyAvLyBmb3IgYmF0Y2hcblxuICAgICAgICB0aGlzLm1vZGVsID0gbmV3IE5ldHdvcmtNb2RlbChvcHQubGF5ZXJzKTtcbiAgICAgICAgdGhpcy5tb2RlbC5saW5rKHRoaXMpO1xuXG4gICAgICAgIHRoaXMuc3RhdGUgPSBuZXcgTmV0d29ya1N0YXRlKHRoaXMubW9kZWwsIHRoaXMubGVhcm5lci50aW1lc3Bhbik7XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbihpbnApIHtcbiAgICAgICAgLy8gZ28gZm9yd2FyZHMgdGhyb3VnaCBuZXR3b3JrXG4gICAgICAgIC8vIGZpcnN0IGFkZCB0aW1lIHN0ZXAgdG8gY3VycmVudCBuZXR3b3JrIHN0YXRlXG4gICAgICAgIHRoaXMuc3RhdGUubmV4dCgpO1xuXG4gICAgICAgIC8vIHByb2plY3QgZXZlcnkgbWF0cml4IGZyb20gQSB0byBCIChWIHRvIEEpIHRoZW4gQiB0byBDLCBDIHRvIEQuLi4gd2hlcmUgdGhlIGZpcnN0IG1hdHJpeCBpcyAnaW5wJ1xuICAgICAgICB2YXIgeSA9IHRoaXMubW9kZWwubGlzdFswXS5mb3J3YXJkKCBpbnAsIHRoaXMuc3RhdGUuYmxvYnNbMF1bMF0gKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLm1vZGVsLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB5ID0gdGhpcy5tb2RlbC5saXN0W2ldLmZvcndhcmQoIHRoaXMuc3RhdGUuYmxvYnNbMF1baSAtIDFdLCB0aGlzLnN0YXRlLmJsb2JzWzBdW2ldICk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyByZXR1cm4gZWl0aGVyIGEgdmFsdWUgKGxpa2Ugc29mdG1heCBpbmRleCkgb3IgdGhlIGxhc3QgbWF0cml4IHZhbHVlc1xuICAgICAgICByZXR1cm4geSAhPT0gdW5kZWZpbmVkID8geSA6IHRoaXMuc3RhdGUuYXQoLTEpLncuZDtcbiAgICB9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbihvdXRwKSB7XG4gICAgICAgIC8vIGdvIGJhY2t3YXJkcyB0aHJvdWdoIHRpbWUgKG5vdGU6IG9ubHkgd2hlbiBuZXR3b3JrIGlzIHJlY3VycmVudCwgb3RoZXJ3aXNlIG9ubHkgdCA9IDApXG4gICAgICAgIHZhciBFID0gZmFsc2UsIEkgPSB0aGlzLm1vZGVsLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgLy8gY2FsY3VsYXRlIGxvc3NcbiAgICAgICAgdmFyIGxvc3MgPSB0aGlzLm1vZGVsLmxpc3RbSS0tXS5iYWNrd2FyZCh0aGlzLnN0YXRlLmF0KC0xKSwgdGhpcy5zdGF0ZS5hdCgtMiksIG91dHApO1xuXG4gICAgICAgIC8vIHJ1biB0aHJvdWdoIGV2ZXJ5IHRpbWVzdGVwXG4gICAgICAgIC8vIEJVVCBvbmx5IHdoZW4gbmV0d29yayBpcyBleHBhbmRlZCB0aHJvdWdoIHRpbWUgT1IgaXQncyB0aGUgZmlyc3QgdGltZSBzdGVwIChmZWVkLWZvcndhcmQgYW5kIHJlY3VycmVuY2UtY2hlY2spXG4gICAgICAgIGZvciAodmFyIHQgPSAwOyB0IDwgdGhpcy5zdGF0ZS5oZWlnaHQgJiYgKEUgfHwgdCA9PT0gMCk7IHQrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IEk7IGkgPj0gMDsgaS0tKSB7IC8vIGFsd2F5cyBzdGFydCBiYWNrd2FyZCBwYXNzIGF0IGxhc3QgcmVjdXJyZW50IGxheWVyLCBvciBhdCBzZWNvbmQtbGFzdCBsYXllciBpZiB0PTBcbiAgICAgICAgICAgICAgICAvLyBleHBhbmQgbmV0d29yayBhbmQgc2F2ZSBsb2NhdGlvbiBvZiBmaXJzdCByZWN1cnJlbnQgb2NjdXJlbmNlXG4gICAgICAgICAgICAgICAgLy8gdG8gc3RhcnQgYXQgbmV4dCAobGFzdCkgdGltZSBzdGVwXG4gICAgICAgICAgICAgICAgaWYoIUUgJiYgdGhpcy5tb2RlbC5saXN0W2ldLnJlY3VycmVudCkgeyBcbiAgICAgICAgICAgICAgICAgICAgRSA9IHRydWUsIEkgPSBpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIC8vIHByb2plY3QgZ3JhZGllbnRzIGJhY2t3YXJkc1xuICAgICAgICAgICAgICAgIHRoaXMubW9kZWwubGlzdFtpXS5iYWNrd2FyZCggdGhpcy5zdGF0ZS5ibG9ic1t0XVtpXSwgdGhpcy5zdGF0ZS5ibG9ic1t0XVtpIC0gMV0gKTtcbiAgICAgICAgICAgIH0gIFxuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm93IHRoYXQgd2UgZ290IHRoZSBncmFkaWVudHNcbiAgICAgICAgLy8gd2UgY2FuIGNoYW5nZSB0aGUgd2VpZ2h0c1xuICAgICAgICB0aGlzLmFkanVzdCgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGxvc3M7XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmFkanVzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoKyt0aGlzLnBhc3MgJSB0aGlzLmxlYXJuZXIuYmF0Y2ggIT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGhvdyB0byBjaGFuZ2UgZ3JhZGllbnRzOyBzZWxlY3QgYWxnb3JpdGhtXG4gICAgICAgIHZhciBtZXRob2QgPSB0aGlzLmdkW3RoaXMubGVhcm5lci5tZXRob2RdO1xuXG4gICAgICAgIC8vIGdvIHRocm91Z2ggZXZlcnkgbGF5ZXJcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm1vZGVsLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAvLyBjaGVjayBpZiBpdCBoYXMgcGFyYW1ldGVyc1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLm1vZGVsLmxpc3RbaV0ucGFyYW1ldGVycyA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgIC8vIGl0ZXJhdGUgdGhyb3VnaCBkaWZmZXJlbnQgcGFyYW1ldGVyIHR5cGVzXG4gICAgICAgICAgICB2YXIgUCA9IHRoaXMubW9kZWwubGlzdFtpXS5wYXJhbWV0ZXJzO1xuICAgICAgICAgICAgZm9yKHZhciBrZXkgaW4gUCkge1xuICAgICAgICAgICAgICAgIC8vIGRpZmZlcmVudCBwYXJhbWV0ZXIgdHlwZXMsIGhhdmUgZGlmZmVyZW50IGwxLWwyLWRlY2F5c1xuICAgICAgICAgICAgICAgIC8vIGYuRS4gYmlhcyBoYXMgbm8gc3VjaCBkZWNheVxuICAgICAgICAgICAgICAgIHZhciBkZWNheSA9IE5ldHdvcmsucHJvdG90eXBlLmFkanVzdC5kZWNheVtrZXldO1xuICAgICAgICAgICAgICAgICAgICBkZWNheSA9IGRlY2F5ID09PSB1bmRlZmluZWQgPyAxLjAgOiBkZWNheTtcblxuICAgICAgICAgICAgICAgIC8vIHB1dCB0aHJvdWdoIGxlYXJuZXIgbWV0aG9kc1xuICAgICAgICAgICAgICAgIHZhciBwYXJhbSA9IFBba2V5XTtcbiAgICAgICAgICAgICAgICBpZiAocGFyYW0gaW5zdGFuY2VvZiBBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhcmFtLmxlbmd0aDsgaisrKSB7IG1ldGhvZCh0aGlzLmxlYXJuZXIsIHBhcmFtW2pdLCBkZWNheSk7IH1cbiAgICAgICAgICAgICAgICB9IFxuXG4gICAgICAgICAgICAgICAgZWxzZSBpZiAocGFyYW0gaW5zdGFuY2VvZiBsaWIuQmxvYikge1xuICAgICAgICAgICAgICAgICAgICBtZXRob2QodGhpcy5sZWFybmVyLCBwYXJhbSwgZGVjYXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5hZGp1c3QuZGVjYXkgPSB7ICdiaWFzZXMnOiAwLjAgfTtcblxuICAgIC8qIGdyYWRpZW50IGRlc2NlbnQgYWxnb3JpdGhtcyAqL1xuICAgIE5ldHdvcmsucHJvdG90eXBlLmdkID0ge307XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5nZC5zZ2QgPSB7XG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICByYXRlOiAwLjAxLFxuICAgICAgICAgICAgbW9tZW50dW06IDAuOVxuICAgICAgICB9LFxuICAgICAgICBzdG9yYWdlOiBbJ2dzdW0nXSxcbiAgICAgICAgYWxnb3JpdGhtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGR4ID0gb3B0Lm1vbWVudHVtICogZ3N1bSAtIG9wdC5yYXRlICogZ2lqO1xuICAgICAgICAgICAgZ3N1bSA9IGR4O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmdkLmFkYWRlbHRhID0ge1xuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgcm86IDAuOTUsXG4gICAgICAgICAgICBlcHM6IDFlLThcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcmFnZTogWydnc3VtJywgJ3hzdW0nXSxcbiAgICAgICAgYWxnb3JpdGhtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGdzdW0gPSBvcHQucm8gKiBnc3VtICsgKDEgLSBvcHQucm8pICogZ2lqICogZ2lqO1xuICAgICAgICAgICAgZHggPSAtTWF0aC5zcXJ0KCh4c3VtICsgb3B0LmVwcykgLyAoZ3N1bSArIG9wdC5lcHMpKSAqIGdpajtcbiAgICAgICAgICAgIHhzdW0gPSBvcHQucm8gKiB4c3VtICsgKDEgLSBvcHQucm8pICogZHggKiBkeDsgLy8geWVzLCB4c3VtIGxhZ3MgYmVoaW5kIGdzdW0gYnkgMS5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyB0byBtYWtlIHRoaW5ncyBmYXN0IGFzIHdlbGwgYXMgZXh0ZW5kYWJsZVxuICAgIC8vIHRoaXMgY29tcGlsZXIgbWFrZXMgcmVhbCB3ZWlnaHQgdXBkYXRlIGZ1bmN0aW9ucyBmcm9tXG4gICAgLy8gYWxnb3JpdGhtczsgdGhlc2Ugb25seSBuZWVkIHRvIGluY2x1ZGUsIHdoYXQgdGhleSBuZWVkL3doYXQgdGhleSBuZWVkIHRvIHNhdmUgZm9yIG5leHQgdGltZSBzdGVwLCBcbiAgICAvLyB0aGUgZGVmYXVsdCBvcHRpb25zLCBhbmQgdGhlIHBlciBncmFkaWVudCBhbGdvcml0aG0gdG8gY2hhbmdlIHdlaWdodHNcbiAgICAvLyB0aGUgYWxnb3JpdGhtIHNob3VsZCBiZSBhIGZ1bmN0aW9uLCB3aGljaCBjaGFuZ2VzIHRoZSBhbHJlYWR5IGluLXNjb3BlIHZhcmlhYmxlICdkeCcsIHdoaWNoIGlzIHRoZSBjaGFuZ2VcbiAgICAvLyBvZiB0aGUgd2VpZ2h0OyBpdCBjYW4gdXNlIHRoZSB2YXJpYWJsZSBnaWosIHJlcHJlc2VudGluZyB0aGUgZ3JhZGllbnRcbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBnZF9wcm90b3R5cGUgPSBmdW5jdGlvbihvcHQsIE8sIGRlY2F5KSB7XG4gICAgICAgICAgICBpZiAoTy5vbWl0KSByZXR1cm47XG4gICAgICAgICAgICB2YXIgZHggPSAwLCBfX2dyYWQgPSAwLCBnaWogPSAwLCBsMWdyYWQgPSAwLCBsMmdyYWQgPSAwO1xuICAgICAgICAgICAgXCJVVTFcIjtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTy5zaXplLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgX19ncmFkID0gTy5kdy5kW2ldO1xuICAgICAgICAgICAgICAgIF9fZ3JhZCA9IF9fZ3JhZCA+IG9wdC5jbGlwID8gb3B0LmNsaXAgOiAoX19ncmFkIDwgLW9wdC5jbGlwID8gLW9wdC5jbGlwIDogX19ncmFkKTtcbiAgICAgICAgICAgICAgICBsMWdyYWQgPSBkZWNheSAqIG9wdC5kZWNheS5sMSAqIChPLncuZFtpXSA+IDAgPyAxIDogLTEpO1xuICAgICAgICAgICAgICAgIGwyZ3JhZCA9IGRlY2F5ICogb3B0LmRlY2F5LmwyICogKE8udy5kW2ldKTtcbiAgICAgICAgICAgICAgICBnaWogPSAoX19ncmFkICsgbDFncmFkICsgbDJncmFkKSAvIG9wdC5iYXRjaDtcbiAgICAgICAgICAgICAgICBcIlVVMlwiO1xuICAgICAgICAgICAgICAgIFwiVVUzXCI7XG4gICAgICAgICAgICAgICAgXCJVVTRcIjtcbiAgICAgICAgICAgICAgICBPLncuZFtpXSArPSBkeDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgTy5kdy5hbGwoMC4wKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ2RfcHJvdG90eXBlXyA9IGdkX3Byb3RvdHlwZS50b1N0cmluZygpO1xuXG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gTmV0d29yay5wcm90b3R5cGUuZ2QpIHtcbiAgICAgICAgICAgIHZhciBkZXNjcmlwdGlvbiA9IE5ldHdvcmsucHJvdG90eXBlLmdkW25hbWVdO1xuICAgICAgICAgICAgdmFyIGNoZWNrcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5zdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2hlY2tzW2ldID0gJ2lmICh0eXBlb2YgTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcgPT09IFwidW5kZWZpbmVkXCIpIHsgTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcgPSBuZXcgbGliLk1hdChPLnNpemUueCwgTy5zaXplLnksIE8uc2l6ZS5kZXB0aCwgMC4wKTsgfSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBleHRyYWN0aW9ucyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5zdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZXh0cmFjdGlvbnNbaV0gPSAndmFyICcgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJyA9IE8uJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnLmRbaV07JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGFsZyA9IGRlc2NyaXB0aW9uLmFsZ29yaXRobS50b1N0cmluZygpO1xuICAgICAgICAgICAgYWxnID0gYWxnLnN1YnN0cmluZyhhbGcuaW5kZXhPZigneycpICsgMSwgYWxnLmxlbmd0aCAtIDEpO1xuXG4gICAgICAgICAgICB2YXIgc3RvcmluZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzY3JpcHRpb24uc3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHN0b3JpbmdzW2ldID0gJ08uJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnLmRbaV0gPSAnICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICc7JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZ1bmMgPSBnZF9wcm90b3R5cGVfXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoJ1wiVVUxXCI7JywgY2hlY2tzLmpvaW4oXCJcIikpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoJ1wiVVUyXCI7JywgZXh0cmFjdGlvbnMuam9pbihcIlwiKSlcbiAgICAgICAgICAgICAgICAucmVwbGFjZSgnXCJVVTNcIjsnLCBhbGcpXG4gICAgICAgICAgICAgICAgLnJlcGxhY2UoJ1wiVVU0XCI7Jywgc3RvcmluZ3Muam9pbihcIlwiKSk7XG5cbiAgICAgICAgICAgIGV2YWwoJ05ldHdvcmsucHJvdG90eXBlLmdkLicgKyBuYW1lICsgJyA9ICcgKyBmdW5jKTtcbiAgICAgICAgICAgIE5ldHdvcmsucHJvdG90eXBlLmdkW25hbWVdLmRlZmF1bHRzID0gZGVzY3JpcHRpb24uZGVmYXVsdHM7XG4gICAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgbGliLk5ldHdvcmsgPSBOZXR3b3JrO1xufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24obGliKSB7XG5cbiAgICBmdW5jdGlvbiBXZWJXb3JrZXIobWFpbiwgbm5qcykge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xuICAgICAgICB0aGlzLkNyZWF0ZVdvcmtlcihtYWluLCBubmpzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBXZWJXb3JrZXIuQVBJLmxpc3Rlbih0aGlzLmV2ZW50cywgdGhpcy53b3JrZXIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5DcmVhdGVXb3JrZXIgPSBmdW5jdGlvbihtYWluLCBubmpzLCBjb21wbGV0aW9uKSB7XG4gICAgICAgIHZhciBjb21waWxlID0gKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgICAgICB0aGlzLndvcmtlciA9IG5ldyBXb3JrZXIodGhpcy5DcmVhdGVVUkwoY29kZSwgbm5qcykpO1xuICAgICAgICAgICAgY29tcGxldGlvbi5jYWxsKHRoaXMpO1xuICAgICAgICB9KS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGlmIChtYWluIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbXBpbGUodGhpcy5GdW5jdGlvblRvU3RyaW5nKG1haW4pKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbWFpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbXBpbGUodGhpcy5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3IgbG9hZGluZyB3b3JrZXIgXCInICsgbWFpbiArICdcIicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdGhpcy5Db252ZXJ0UmVsYXRpdmVVUkkobWFpbikpO1xuICAgICAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5DcmVhdGVVUkwgPSBmdW5jdGlvbihjb2RlLCBubmpzKSB7XG4gICAgICAgIHZhciB3b3JrZXJTdHJpbmcgPSB0aGlzLkFkZFJlcXVpcmVkU3R1ZmYobm5qcykgKyAnXFxuJyArIGNvZGU7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5DcmVhdGVCbG9iKHdvcmtlclN0cmluZyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChkYXRhKTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5DcmVhdGVCbG9iID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICAgIHZhciBibG9iO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYmxvYiA9IG5ldyBCbG9iKFtzdHJpbmddLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyAvLyBCYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgICAgICAgd2luZG93LkJsb2JCdWlsZGVyID0gd2luZG93LkJsb2JCdWlsZGVyIHx8IHdpbmRvdy5XZWJLaXRCbG9iQnVpbGRlciB8fCB3aW5kb3cuTW96QmxvYkJ1aWxkZXI7XG4gICAgICAgICAgICBibG9iID0gbmV3IEJsb2JCdWlsZGVyKCk7XG4gICAgICAgICAgICBibG9iLmFwcGVuZChzdHJpbmcpO1xuICAgICAgICAgICAgYmxvYiA9IGJsb2IuZ2V0QmxvYigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJsb2I7XG4gICAgfTtcblxuICAgIFdlYldvcmtlci5wcm90b3R5cGUuRnVuY3Rpb25Ub1N0cmluZyA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgdmFyIHN0cmluZyA9IHdvcmtlci50b1N0cmluZygpO1xuICAgICAgICB2YXIgYmVnID0gc3RyaW5nLmluZGV4T2YoJ3snKSArIDE7XG4gICAgICAgIHZhciBlbmQgPSBzdHJpbmcubGFzdEluZGV4T2YoJ30nKTtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5zdWJzdHJpbmcoYmVnLCBlbmQpLnRyaW0oKTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5BZGRSZXF1aXJlZFN0dWZmID0gZnVuY3Rpb24obm5qcykge1xuICAgICAgICB2YXIgc3RyID0gJ2ltcG9ydFNjcmlwdHMoXCInICsgdGhpcy5Db252ZXJ0UmVsYXRpdmVVUkkobm5qcykgKyAnXCIpOyB2YXIgbm4gPSBubmpzOyAnO1xuICAgICAgICBzdHIgKz0gXCJ2YXIgV2ViV29ya2VyID0ge307IFdlYldvcmtlci5BUEkgPSB7XCI7XG5cbiAgICAgICAgdmFyIGFwaSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gV2ViV29ya2VyLkFQSSkge1xuICAgICAgICAgICAgYXBpLnB1c2goa2V5ICsgJzogJyArIFdlYldvcmtlci5BUElba2V5XS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0ciArPSBhcGkuam9pbignLCcpICsgJ307IHd3ID0gV2ViV29ya2VyLkFQSTsnO1xuICAgICAgICBzdHIgKz0gJ3d3LmV2ZW50cyA9IHt9OyB3dy5saXN0ZW4oKTsnO1xuXG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfTtcblxuICAgIFdlYldvcmtlci5wcm90b3R5cGUuQ29udmVydFJlbGF0aXZlVVJJID0gZnVuY3Rpb24ocmVsYXRpdmUpIHtcbiAgICAgICAgdmFyIGFic29sdXRlID0gbnVsbDtcbiAgICAgICAgKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLmhyZWYgPSByZWxhdGl2ZTsgYWJzb2x1dGUgPSBlLmhyZWY7XG4gICAgICAgIH0pKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKSk7XG4gICAgICAgIHJldHVybiBhYnNvbHV0ZTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgIFdlYldvcmtlci5BUEkub24oZXZlbnQsIGZ1bmMsIHRoaXMuZXZlbnRzKTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24oZXZlbnQsIGRhdGEsIHRyYW5zZmVyKSB7XG4gICAgICAgIFdlYldvcmtlci5BUEkudHJpZ2dlcihldmVudCwgZGF0YSwgdHJhbnNmZXIsIHRoaXMud29ya2VyKTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLkFQSSA9IHtcbiAgICAgICAgbGlzdGVuOiBmdW5jdGlvbihzdG9yZSwgdykge1xuICAgICAgICAgICAgc3RvcmUgPSBzdG9yZSB8fCAod3cgPyB3dy5ldmVudHMgOiBudWxsKTtcbiAgICAgICAgICAgIHcgPSB3IHx8IHNlbGY7XG4gICAgICAgICAgICB3Lm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVjZWl2ZWQgPSBlLmRhdGE7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlZCA9IHN0b3JlW3JlY2VpdmVkLm5hbWVdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBzdG9yZWQgIT09IHVuZGVmaW5lZCAmJiBzdG9yZWQgaW5zdGFuY2VvZiBBcnJheSAmJiBpIDwgc3RvcmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFtpXS5hcHBseSh1bmRlZmluZWQsIFtdLmNvbmNhdChyZWNlaXZlZC5wYXJhbWV0ZXIsIHJlY2VpdmVkLnRyYW5zZmVyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgb246IGZ1bmN0aW9uKG5hbWUsIGZ1bmMsIHN0b3JlKSB7XG4gICAgICAgICAgICBzdG9yZSA9IHN0b3JlIHx8ICh3dyA/IHd3LmV2ZW50cyA6IG51bGwpO1xuICAgICAgICAgICAgaWYgKHN0b3JlW25hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdG9yZVtuYW1lXSA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdG9yZVtuYW1lXS5wdXNoKGZ1bmMpO1xuICAgICAgICB9LFxuICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbihldmVudCwgZGF0YSwgdHJhbnNmZXIsIHcpIHtcbiAgICAgICAgICAgIHcgPSB3IHx8IHNlbGY7XG4gICAgICAgICAgICB3LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBldmVudCxcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXI6IGRhdGEsXG4gICAgICAgICAgICAgICAgdHJhbnNmZXI6IHRyYW5zZmVyXG4gICAgICAgICAgICB9LCB0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliLldlYldvcmtlciA9IFdlYldvcmtlcjtcblxufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8qIHNwYXRpYWwgd2VpZ2h0cyAqL1xuICAgIGZ1bmN0aW9uIENvbnZvbHV0aW9uYWxMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBvcHQuZmlsdGVyO1xuICAgICAgICB0aGlzLnN0cmlkZSA9IG9wdC5zdHJpZGUgfHwgMTtcbiAgICAgICAgdGhpcy5wYWQgPSBvcHQucGFkIHx8IDA7XG5cbiAgICAgICAgdmFyIG94ID0gTWF0aC5mbG9vcigodGhpcy5pbi54ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueCkgLyB0aGlzLnN0cmlkZSArIDEpO1xuICAgICAgICB2YXIgb3kgPSBNYXRoLmZsb29yKCh0aGlzLmluLnkgKyB0aGlzLnBhZCAqIDIgLSB0aGlzLmZpbHRlci55KSAvIHRoaXMuc3RyaWRlICsgMSk7XG4gICAgICAgIHRoaXMub3V0ID0gbGliLlNpemUzKG94LCBveSwgdGhpcy5maWx0ZXIuZGVwdGgpO1xuXG4gICAgICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIGZpbHRlcnM6IFtdLFxuICAgICAgICAgICAgYmlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5maWx0ZXIuZGVwdGgsIDAuMClcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0LmRlcHRoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldID0gbmV3IGxpYi5CbG9iKHRoaXMuZmlsdGVyLngsIHRoaXMuZmlsdGVyLnksIHRoaXMuaW4uZGVwdGgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIENvbnZvbHV0aW9uYWxMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG4gICAgICAgIHZhciBBX3ggPSB0aGlzLm91dC54IHwgMCwgQV95ID0gdGhpcy5vdXQueSB8IDAsIEFfZCA9IHRoaXMub3V0LmRlcHRoIHwgMDtcbiAgICAgICAgdmFyIFZfeCA9IHRoaXMuaW4ueCB8IDAsIFZfeSA9IHRoaXMuaW4ueSB8IDAsIFZfZCA9IHRoaXMuaW4uZGVwdGggfCAwO1xuICAgICAgICB2YXIgRl94ID0gdGhpcy5maWx0ZXIueCB8IDAsIEZfeSA9IHRoaXMuZmlsdGVyLnkgfCAwO1xuXG4gICAgICAgIHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG4gICAgICAgIHZhciBiaWFzZXMgPSB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncuZDtcblxuICAgICAgICB2YXIgb3ggPSAwLCBveSA9IDAsIGZ5ID0gMCwgZnggPSAwLCBmZCA9IDAsIGEgPSAwLjA7XG4gICAgICAgIGZvciAodmFyIGQgPSAwOyBkIDwgQV9kOyBkKyspIHtcbiAgICAgICAgICAgIHZhciBmID0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbZF07XG4gICAgICAgICAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG4gICAgICAgICAgICB2YXIgeSA9IC10aGlzLnBhZCB8IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyB5ICs9IHN0cmlkZSwgYXkrKykgeyAvLyB4eV9zdHJpZGVcbiAgICAgICAgICAgICAgICB4ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykgeyAvLyB4eV9zdHJpZGVcblxuICAgICAgICAgICAgICAgICAgICAvLyBjb252b2x2ZSBjZW50ZXJlZCBhdCB0aGlzIHBhcnRpY3VsYXIgbG9jYXRpb24gW2F4LCBheV1cbiAgICAgICAgICAgICAgICAgICAgYSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yIChmeSA9IHkgPCAwID8gLXkgOiAwOyBmeSA8IEZfeSAmJiAoeStmeSk8Vl95OyBmeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBveSA9IHkgKyBmeTsgLy8gY29vcmRpbmF0ZXMgaW4gdGhlIG9yaWdpbmFsIGlucHV0IGFycmF5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGZ4ID0geCA8IDAgPyAteCA6IDA7IGZ4IDwgRl94ICYmICh4K2Z4KTxWX3g7IGZ4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKGZkID0gMDsgZmQgPCBWX2Q7IGZkKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQS53W2F4LCBheSwgZF0gKz0gZi53WyBmeCwgZnksIGZkIF0gKiBWLndbIG94LCBveSwgZmQgXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhICs9IGYudy5kWyhmeSAqIEZfeCArIGZ4KSAqIFZfZCArIGZkXSAqIFYudy5kWyhveSAqIFZfeCArIG94KSAqIFZfZCArIGZkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBBLncuZFsoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkXSA9IGEgKyBiaWFzZXNbZF07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIENvbnZvbHV0aW9uYWxMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuICAgICAgICB2YXIgQV94ID0gdGhpcy5vdXQueCB8IDAsIEFfeSA9IHRoaXMub3V0LnkgfCAwLCBBX2QgPSB0aGlzLm91dC5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBWX3ggPSB0aGlzLmluLnggfCAwLCBWX3kgPSB0aGlzLmluLnkgfCAwLCBWX2QgPSB0aGlzLmluLmRlcHRoIHwgMDtcbiAgICAgICAgdmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMDtcblxuICAgICAgICB2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGUgfCAwO1xuICAgICAgICB2YXIgYmlhc2VzID0gdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kO1xuXG4gICAgICAgIHZhciB2MSA9IDAsIHYyID0gMCwgb3ggPSAwLCBveSA9IDAsIGZ5ID0gMCwgZnggPSAwLCBmZCA9IDAsIGRBID0gMDtcbiAgICAgICAgZm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuICAgICAgICAgICAgdmFyIGYgPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tkXTtcbiAgICAgICAgICAgIHZhciB4ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHtcbiAgICAgICAgICAgICAgICB4ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgbG9jYXRpb24gW2F4LCBheV1cbiAgICAgICAgICAgICAgICAgICAgZEEgPSBBLmR3LmRbKGF5ICogQV94ICsgYXgpICogQV9kICsgZF07XG4gICAgICAgICAgICAgICAgICAgIGZvciAoZnkgPSB5IDwgMCA/IC15IDogMDsgZnkgPCBGX3kgJiYgKHkrZnkpPFZfeTsgZnkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChmeCA9IHggPCAwID8gLXggOiAwOyBmeCA8IEZfeCAmJiAoeCtmeCk8Vl94OyBmeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ggPSB4ICsgZng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChmZCA9IDA7IGZkIDwgVl9kOyBmZCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGYuZHdbZngsIGZ5LCBmZF0gKz0gVi53W294LCBveSwgZmRdICogQS5kd1theCwgYXksIGRdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIFYuZHdbb3gsIG95LCBmZF0gKz0gZi53W2Z4LCBmeSwgZmRdICogQS5kd1theCwgYXksIGRdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYxID0gKGZ5ICogRl94ICsgZngpICogVl9kICsgZmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYyID0gKG95ICogVl94ICsgb3gpICogVl9kICsgZmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGYuZHcuZFt2MV0gKz0gVi53LmRbdjJdICogZEE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFYuZHcuZFt2Ml0gKz0gZi53LmRbdjFdICogZEE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYmlhc2VzW2RdICs9IGRBO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKiBQb29saW5nIGxheWVyLCBzZWxlY3QgYmlnZ2VzdCB2YWx1ZSBmcm9tIGNvbnZvbHV0aW9uICovXG4gICAgZnVuY3Rpb24gUG9vbGluZ0xheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLmZpbHRlciA9IG9wdC5maWx0ZXI7XG4gICAgICAgIHRoaXMuc3RyaWRlID0gb3B0LnN0cmlkZSB8fCAxO1xuICAgICAgICB0aGlzLnBhZCA9IG9wdC5wYWQgfHwgMDtcblxuICAgICAgICB2YXIgb3ggPSBNYXRoLmZsb29yKCh0aGlzLmluLnggKyB0aGlzLnBhZCAqIDIgLSB0aGlzLmZpbHRlci54KSAvIHRoaXMuc3RyaWRlICsgMSk7XG4gICAgICAgIHZhciBveSA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueSArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLnkpIC8gdGhpcy5zdHJpZGUgKyAxKTtcbiAgICAgICAgdGhpcy5vdXQgPSBsaWIuU2l6ZTMob3gsIG95LCB0aGlzLmluLmRlcHRoKTtcbiAgICB9O1xuXG4gICAgUG9vbGluZ0xheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgdmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuICAgICAgICB2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDA7IFxuXG4gICAgICAgIHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cbiAgICAgICAgZm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuICAgICAgICAgICAgdmFyIHggPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHtcbiAgICAgICAgICAgICAgICB4ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgbG9jYXRpb24gW2F4LCBheV1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbHYgPSAtSW5maW5pdHksIHNlbHggPSAwLCBzZWx5ID0gMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwLCBxID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZnkgPSAwOyBmeSA8IEZfeTsgZnkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZnggPSAwOyBmeCA8IEZfeDsgZngrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG94ID0geCArIGZ4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcSA9IFYudy5kWyhveSAqIFZfeCArIG94KSAqIFZfZCArIGRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocSA+IHNlbHYpIHsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWx2ID0gcTsgc2VseCA9IG94OyBzZWx5ID0gb3k7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGl4ID0gKGF5ICogQV94ICsgYXgpICogQV9kICsgZDtcbiAgICAgICAgICAgICAgICAgICAgQS5weFtpeF0gPSBzZWx4O1xuICAgICAgICAgICAgICAgICAgICBBLnB5W2l4XSA9IHNlbHk7XG4gICAgICAgICAgICAgICAgICAgIEEudy5kW2l4XSA9IHNlbHY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIFBvb2xpbmdMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuICAgICAgICB2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcbiAgICAgICAgdmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMDsgXG5cbiAgICAgICAgdmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcblxuICAgICAgICBmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyBheSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgYXgrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXggPSAoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWx4ID0gQS5weFtpeF07IFxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VseSA9IEEucHlbaXhdO1xuXG4gICAgICAgICAgICAgICAgICAgIFYuZHcuZFsoc2VseSAqIFZfeCArIHNlbHgpICogVl9kICsgZF0gPSBBLmR3LmRbaXhdOyAvLyBvbmx5IHRyYW5zZmVyIHdlaWdodHMgZnJvbSBzZWxlY3RlZCBsb2NhdGlvbnNcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgUG9vbGluZ0xheWVyLnByb3RvdHlwZS5QcmVwYXJlU3RhdGVCbG9iID0gZnVuY3Rpb24gKEEpIHtcbiAgICAgICAgaWYgKEEucHggPT09IHVuZGVmaW5lZCB8fCBBLnB5ID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIEEucHggPSBsaWIuTWF0LkNyZWF0ZUFycmF5KHRoaXMub3V0LmRlcHRoICogdGhpcy5vdXQueSAqIHRoaXMub3V0LngsIDAsICdVaW50MTZBcnJheScpO1xuICAgICAgICAgICAgQS5weSA9IGxpYi5NYXQuQ3JlYXRlQXJyYXkodGhpcy5vdXQuZGVwdGggKiB0aGlzLm91dC55ICogdGhpcy5vdXQueCwgMCwgJ1VpbnQxNkFycmF5Jyk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliLkNvbnZvbHV0aW9uYWxMYXllciA9IENvbnZvbHV0aW9uYWxMYXllcjtcbiAgICBsaWIuUG9vbGluZ0xheWVyID0gUG9vbGluZ0xheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IGlucHV0LCBzaXplXG4gICAgICovXG4gICAgZnVuY3Rpb24gRG90TGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gbGliLlNpemUzKDEsIDEsIG9wdC5zaXplKTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgICAgICAgZmlsdGVyczogW10sXG4gICAgICAgICAgICBiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLm91dC5kZXB0aCwgMC4wKVxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldID0gbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMuaW4ubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBEb3RMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBzdW0gPSAwLjA7XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBzdW0gKz0gVi53LmRbal0gKiB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbal07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEEudy5kW2ldID0gc3VtICsgdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmRbaV07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgRG90TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGRBID0gQS5kdy5kW2ldO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFtqXSArPSBWLncuZFtqXSAqIGRBO1xuICAgICAgICAgICAgICAgIFYuZHcuZFtqXSArPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbal0gKiBkQTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kW2ldICs9IGRBO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxpYi5Eb3RMYXllciA9IERvdExheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBmdW5jdGlvbiBEcm9wT3V0TGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLnByb2JhYmlsaXR5ID0gb3B0LnByb2JhYmlsaXR5IHx8IDAuMjU7XG4gICAgfVxuXG4gICAgRHJvcE91dExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgaWYgKCF0aGlzLm5ldC53ZWFrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHsgQS53LmRbaV0gPSBWLncuZFtpXSAqIHRoaXMucHJvYmFiaWxpdHk7IH0gcmV0dXJuIDtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKE1hdGgucmFuZG9tKCkgPCB0aGlzLnByb2JhYmlsaXR5KSB7XG4gICAgICAgICAgICAgICAgQS53LmRbaV0gPSAwLjA7XG4gICAgICAgICAgICAgICAgQS5kcm9wcGVkT3V0W2ldID0gdHJ1ZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgQS53LmRbaV0gPSBWLncuZFtpXTtcbiAgICAgICAgICAgICAgICBBLmRyb3BwZWRPdXRbaV0gPSBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBEcm9wT3V0TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcbiAgICAgICAgaWYgKCF0aGlzLm5ldC53ZWFrIHx8IEEuZHJvcHBlZE91dC5sZW5ndGggIT09IHRoaXMuaW4ubGVuZ3RoKSByZXR1cm4gO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoIUEuZHJvcHBlZE91dFtpXSkge1xuICAgICAgICAgICAgICAgIFYuZHcuZFtpXSA9IEEuZHcuZFtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBEcm9wT3V0TGF5ZXIucHJvdG90eXBlLlByZXBhcmVTdGF0ZUJsb2IgPSBmdW5jdGlvbiAoQSkge1xuICAgICAgICBBLmRyb3BwZWRPdXQgPSBbXTtcbiAgICB9O1xuXG4gICAgbGliLkRyb3BPdXRMYXllciA9IERyb3BPdXRMYXllcjtcbiAgICBcbn0pKG5uanMpOyIsIihmdW5jdGlvbihsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBmdW5jdGlvbiBJbnB1dExheWVyKG9wdCkge1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5zaXplO1xuICAgIH07XG5cbiAgICBJbnB1dExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24oViwgQSkge1xuICAgICAgICBBLncuY29weShWKTtcbiAgICB9O1xuXG4gICAgSW5wdXRMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbihBLCBWKSB7fTtcblxuICAgIGxpYi5JbnB1dExheWVyID0gSW5wdXRMYXllcjtcbn0pKG5uanMpO1xuIiwiKGZ1bmN0aW9uKGxpYikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgZnVuY3Rpb24gc2lnbSh4KSB7XG4gICAgICAgIHJldHVybiAxLjAgLyAoMS4wICsgTWF0aC5leHAoLXgpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkc2lnbSh5KSB7XG4gICAgICAgIHJldHVybiB5ICogKDEgLSB5KTtcbiAgICB9XG5cbiAgICAvLyBzZWUgaHR0cDovL3Blb3BsZS5pZHNpYS5jaC9+anVlcmdlbi9sc3RtL3NsZDAxOS5odG1cbiAgICBmdW5jdGlvbiBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LmlucHV0OyAvLyAxIHRvIDEgbWFwcGluZ1xuXG4gICAgICAgIHRoaXMucmVjdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgICAgICAgZmlsdGVyczogW10sXG4gICAgICAgICAgICBiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLm91dC5kZXB0aCwgMC4wKVxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgOSwgWzAsIDAuMDhdKTtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFsyXSA9IC0xOyAvLyBhdCBiZWdpbm5pbmcgbmVnYXRpdmUgcGVlcGhvbGUgY29ubmVjdGlvbnNcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFs1XSA9IC0xOyAvLyB0byBtaW5pbWl6ZSBleHBsb2RpbmdcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFs4XSA9IC0xOyAvLyBjZWxsIHN0YXRlXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzID0gbmV3IGxpYi5CbG9iKDEsIHRoaXMuaW4ubGVuZ3RoLCAzLCAwLjApO1xuICAgIH07XG5cbiAgICBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbihWLCBBKSB7XG4gICAgICAgIHZhciBiaWFzID0gdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBwYXJhbSA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZDtcblxuICAgICAgICAgICAgdmFyIHggPSBWLncuZFtpXTtcbiAgICAgICAgICAgIHZhciBoXyA9IEEucHJldi53LmRbaV07XG4gICAgICAgICAgICB2YXIgY18gPSBBLnByZXYubHN0bS5jZWxscy53LmRbaV07XG5cbiAgICAgICAgICAgIHZhciBpZyA9IHNpZ20oeCAqIHBhcmFtWzBdICsgaF8gKiBwYXJhbVsxXSArIGNfICogcGFyYW1bMl0gKyBiaWFzW2kgKiAzICsgMF0pO1xuICAgICAgICAgICAgdmFyIGZnID0gc2lnbSh4ICogcGFyYW1bM10gKyBoXyAqIHBhcmFtWzRdICsgY18gKiBwYXJhbVs1XSArIGJpYXNbaSAqIDMgKyAxXSk7XG4gICAgICAgICAgICB2YXIgYyA9IGlnICogeCArIGZnICogY187XG4gICAgICAgICAgICB2YXIgb2cgPSBzaWdtKHggKiBwYXJhbVs2XSArIGhfICogcGFyYW1bN10gKyBjICAqIHBhcmFtWzhdICsgYmlhc1tpICogMyArIDJdKTtcbiAgICAgICAgICAgIHZhciBoID0gb2cgKiBjO1xuXG4gICAgICAgICAgICBBLmxzdG0uZ2F0ZXMuaW4uZFtpXSA9IGlnO1xuICAgICAgICAgICAgQS5sc3RtLmdhdGVzLmZvcmdldC5kW2ldID0gZmc7XG4gICAgICAgICAgICBBLmxzdG0uZ2F0ZXMub3V0LmRbaV0gPSBvZztcblxuICAgICAgICAgICAgQS5sc3RtLmNlbGxzLncuZFtpXSA9IGM7XG4gICAgICAgICAgICBBLncuZFtpXSA9IGg7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uKEEsIFYpIHtcbiAgICAgICAgdmFyIEJJQVMgPSB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzO1xuICAgICAgICB2YXIgYmlhcyA9IEJJQVMudy5kO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgUEFSQU0gPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXTtcbiAgICAgICAgICAgIHZhciBwYXJhbSA9IFBBUkFNLncuZDtcbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdmFyIGlnID0gQS5sc3RtLmdhdGVzLmluLmRbaV07XG4gICAgICAgICAgICB2YXIgZmcgPSBBLmxzdG0uZ2F0ZXMuZm9yZ2V0LmRbaV07XG4gICAgICAgICAgICB2YXIgb2cgPSBBLmxzdG0uZ2F0ZXMub3V0LmRbaV07XG4gICAgICAgICAgICB2YXIgYyA9IEEubHN0bS5jZWxscy53LmRbaV07XG5cbiAgICAgICAgICAgIHZhciB4ID0gVi53LmRbaV07XG4gICAgICAgICAgICB2YXIgaF8gPSBBLnByZXYudy5kW2ldO1xuICAgICAgICAgICAgdmFyIGNfID0gQS5wcmV2LmxzdG0uY2VsbHMudy5kW2ldO1xuXG4gICAgICAgICAgICB2YXIgZGggPSBBLmR3LmRbaV07XG4gICAgICAgICAgICB2YXIgZGMgPSBBLmxzdG0uY2VsbHMuZHcuZFtpXTtcblxuICAgICAgICAgICAgdmFyIGRvZyA9IGRzaWdtKG9nKSAqIGMgKiBkaDtcbiAgICAgICAgICAgICAgICBkYyA9IGRjICsgcGFyYW1bOF0gKiBkb2cgKyBvZyAqIGRoO1xuICAgICAgICAgICAgdmFyIGRmZyA9IGRzaWdtKGZnKSAqIGNfICogZGM7XG4gICAgICAgICAgICB2YXIgZGlnID0gZHNpZ20oaWcpICogeCAqIGRjO1xuICAgICAgICAgICAgdmFyIGR4ID0gaWcgKiBkYyArIHBhcmFtWzZdICogZG9nICsgcGFyYW1bM10gKiBkZmcgKyBwYXJhbVswXSAqIGRpZztcblxuICAgICAgICAgICAgdmFyIGRjXyA9IGZnICogZGMgKyBwYXJhbVs1XSAqIGRmZyArIHBhcmFtWzJdICogZGlnO1xuICAgICAgICAgICAgdmFyIGRoXyA9IHBhcmFtWzddICogZG9nICsgcGFyYW1bNF0gKiBkZmcgKyBwYXJhbVsxXSAqIGRpZztcblxuICAgICAgICAgICAgQS5wcmV2LmxzdG0uY2VsbHMuZHcuZFtpXSA9IGRjXztcbiAgICAgICAgICAgIEEucHJldi5kdy5kW2ldICs9IGRoXzsgLy8gYWRkIHRvIGFscmVhZHkgYmFja3Byb3BwZWQgdmFsdWVcbiAgICAgICAgICAgIFYuZHcuZFtpXSA9IGR4O1xuXG4gICAgICAgICAgICBQQVJBTS5kdy5kWzBdICs9IHggKiBkaWc7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzFdICs9IGhfICogZGlnO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFsyXSArPSBjXyAqIGRpZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbM10gKz0geCAqIGRmZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbNF0gKz0gaF8gKiBkZmc7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzVdICs9IGNfICogZGZnO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFs2XSArPSB4ICogZG9nO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFs3XSArPSBoXyAqIGRvZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbOF0gKz0gYyAqIGRvZztcblxuICAgICAgICAgICAgQklBUy5kdy5kW2kgKiAzICsgMF0gKz0gMS4wICogZGlnO1xuICAgICAgICAgICAgQklBUy5kdy5kW2kgKiAzICsgMV0gKz0gMS4wICogZGZnO1xuICAgICAgICAgICAgQklBUy5kdy5kW2kgKiAzICsgMl0gKz0gMS4wICogZG9nO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIExvbmdTaG9ydFRlcm1NZW1vcnlMYXllci5wcm90b3R5cGUuUHJlcGFyZVN0YXRlQmxvYiA9IGZ1bmN0aW9uKEEpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBBLnN0YXRlID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgQS5sc3RtID0ge1xuICAgICAgICAgICAgICAgIGNlbGxzOiBuZXcgbGliLkJsb2IodGhpcy5vdXQueCwgdGhpcy5vdXQueSwgdGhpcy5vdXQuZGVwdGgsIDAuMCksXG4gICAgICAgICAgICAgICAgZ2F0ZXM6IHsgaW4gOiBuZXcgbGliLk1hdCh0aGlzLm91dC54LCB0aGlzLm91dC55LCB0aGlzLm91dC5kZXB0aCwgMC4wKSxcbiAgICAgICAgICAgICAgICAgICAgb3V0OiBuZXcgbGliLk1hdCh0aGlzLm91dC54LCB0aGlzLm91dC55LCB0aGlzLm91dC5kZXB0aCwgMC4wKSxcbiAgICAgICAgICAgICAgICAgICAgZm9yZ2V0OiBuZXcgbGliLk1hdCh0aGlzLm91dC54LCB0aGlzLm91dC55LCB0aGlzLm91dC5kZXB0aCwgMC4wKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH07XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBBLmxzdG0uY2VsbHMudy5hbGwoMCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliLkxvbmdTaG9ydFRlcm1NZW1vcnlMYXllciA9IExvbmdTaG9ydFRlcm1NZW1vcnlMYXllcjtcbn0pKG5uanMpO1xuIiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgZnVuY3Rpb24gU2lnbW9pZExheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5pbnB1dDtcbiAgICB9O1xuXG4gICAgU2lnbW9pZExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBBLncuZFtpXSA9IDEuMC8oMS4wK01hdGguZXhwKC1WLncuZFtpXSkpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgU2lnbW9pZExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgVi5kdy5kW2ldID0gQS53LmRbaV0gKiAoLUEudy5kW2ldICsgMS4wKSAqIEEuZHcuZFtpXTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBSZWx1TGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LmlucHV0O1xuICAgIH07XG5cbiAgICBSZWx1TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIEEudy5kW2ldID0gVi53LmRbaV0gPCAwID8gMCA6IFYudy5kW2ldO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgUmVsdUxheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYoQS53LmRbaV0gPD0gMCkgVi5kdy5kW2ldID0gMDsgLy8gdGhyZXNob2xkXG4gICAgICAgICAgICBlbHNlIFYuZHcuZFtpXSA9IEEuZHcuZFtpXTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBUYW5oTGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LmlucHV0O1xuICAgIH07XG5cbiAgICBUYW5oTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIEEudy5kW2ldID0gbGliLk1hdGhVLnRhbmgoVi53LmRbaV0pO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgVGFuaExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgVi5kdy5kW2ldID0gKDEuMCAtIEEudy5kW2ldICogQS53LmRbaV0pICogQS5kdy5kW2ldO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxpYi5TaWdtb2lkTGF5ZXIgPSBTaWdtb2lkTGF5ZXI7XG4gICAgbGliLlJlbHVMYXllciA9IFJlbHVMYXllcjtcbiAgICBsaWIuVGFuaExheWVyID0gVGFuaExheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBmdW5jdGlvbiBSZWdyZXNzaW9uTGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LmlucHV0O1xuICAgIH07XG5cbiAgICBSZWdyZXNzaW9uTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICBBLncud3JpdGUoVi53KTtcbiAgICB9O1xuXG4gICAgUmVncmVzc2lvbkxheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWLCBkZXNpcmVkKSB7XG4gICAgICAgIHZhciBsb3NzID0gMC4wO1xuICAgICAgICBpZihkZXNpcmVkIGluc3RhbmNlb2YgQXJyYXkgfHwgZGVzaXJlZCBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkge1xuICAgICAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgVi5kdy5kW2ldID0gQS53LmRbaV0gLSBkZXNpcmVkW2ldO1xuICAgICAgICAgICAgICAgIGxvc3MgKz0gMC41KlYuZHcuZFtpXSpWLmR3LmRbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbG9zcztcbiAgICB9O1xuXG4gICAgbGliLlJlZ3Jlc3Npb25MYXllciA9IFJlZ3Jlc3Npb25MYXllcjtcblxufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBmdW5jdGlvbiBTb2Z0bWF4TGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gbGliLlNpemUzKDEsIDEsIHRoaXMuaW4ueCAqIHRoaXMuaW4ueSAqIHRoaXMuaW4uZGVwdGgpO1xuICAgICAgICB0aGlzLmNsYXNzZXMgPSB0aGlzLm91dC5kZXB0aDtcbiAgICB9O1xuXG4gICAgU29mdG1heExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgLy8gY29tcHV0ZSBtYXggYWN0aXZhdGlvblxuICAgICAgICB2YXIgYW1heCA9IFYudy5kWzBdO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuY2xhc3NlczsgaSsrKSB7XG4gICAgICAgICAgICBpZihWLncuZFtpXSA+IGFtYXgpIGFtYXggPSBWLncuZFtpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNvbXB1dGUgZXhwb25lbnRpYWxzIChjYXJlZnVsbHkgdG8gbm90IGJsb3cgdXApXG4gICAgICAgIHZhciBlcyA9IGxpYi5NYXQuQ3JlYXRlQXJyYXkodGhpcy5vdXQuZGVwdGgsIDAuMCksIGVzdW0gPSAwLjA7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBlID0gTWF0aC5leHAoVi53LmRbaV0gLSBhbWF4KTtcbiAgICAgICAgICAgIGVzdW0gKz0gZTtcbiAgICAgICAgICAgIGVzW2ldID0gZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG5vcm1hbGl6ZSBhbmQgb3V0cHV0IHRvIHN1bSB0byBvbmVcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuICAgICAgICAgICAgZXNbaV0gLz0gZXN1bTtcbiAgICAgICAgICAgIEEudy5kW2ldID0gZXNbaV07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQS53Lm1heGkoKTtcbiAgICB9O1xuXG4gICAgU29mdG1heExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWLCBkZXNpcmVkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBpbmRpY2F0b3IgPSBpID09PSBkZXNpcmVkID8gMS4wIDogMC4wO1xuICAgICAgICAgICAgVi5kdy5kW2ldID0gQS53LmRbaV0gLSBpbmRpY2F0b3I7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBsb3NzIGlzIHRoZSBjbGFzcyBuZWdhdGl2ZSBsb2cgbGlrZWxpaG9vZFxuICAgICAgICByZXR1cm4gLU1hdGgubG9nKEEudy5kW2Rlc2lyZWRdKTtcbiAgICB9O1xuXG4gICAgLyogYXBwcm94LiAzMDB4IGZhc3RlciB0aGFuIHNvZnRtYXgsIGRlY3JlYXNlIGluIGFjY3VyYWN5IGFuZCBwZXJmb3JtYW5jZSAqL1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSB0cmVlIFtvYmplY3RdIG9yIGNsYXNzZXMgW2ludF1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBIaWVyYXJjaGljYWxTb2Z0bWF4KG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuXG4gICAgICAgIGlmIChvcHQudHJlZSkge1xuICAgICAgICAgICAgdGhpcy50cmVlID0gb3B0LnRyZWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUgPSB0aGlzLkJ1aWxkVHJlZShvcHQuY2xhc3Nlcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLlByZXBhcmVUcmVlKCk7XG5cbiAgICAgICAgYXNzZXJ0KG9wdC5jbGFzc2VzID09PSB1bmRlZmluZWQgfHwgKG9wdC5jbGFzc2VzID09PSB0aGlzLmNsYXNzZXMpLCAnSGllcmFyY2hpY2FsU29mdG1heDogdHJlZSBub3Qgc3VwcG9ydGVkJyk7XG5cbiAgICAgICAgdGhpcy5ub2RlcyA9IHRoaXMuY2xhc3NlcyAtIDE7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIGZpbHRlcnM6IFtdLFxuICAgICAgICAgICAgYmlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5ub2RlcywgMC4wKVxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ub2RlczsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXSA9IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLmluLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSID0gMDtcbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SID0gMTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLkJ1aWxkVHJlZSA9IGZ1bmN0aW9uIChjbGFzc2VzKSB7XG4gICAgICAgIC8vIGNyZWF0ZSB0cmVlIG9mIHNpemUgbG9nKGNsYXNzZXMpXG4gICAgICAgIHZhciBkZXB0aCA9IE1hdGguZmxvb3IoTWF0aC5sb2cyKGNsYXNzZXMpKTtcbiAgICAgICAgdmFyIHRyZWUgPSB0aGlzLkNyZWF0ZU5vZGUoZGVwdGgsIG51bGwpO1xuXG4gICAgICAgIC8vIGFkZCByZW1haW5pbmcgbm9kZXMgdG8gdHJlZVxuICAgICAgICB2YXIgcmVtYWluZGVyID0gY2xhc3NlcyAtIE1hdGgucG93KDIsIGRlcHRoKTtcbiAgICAgICAgdGhpcy50cmF2ZXJzZSh0cmVlLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUiAmJiByZW1haW5kZXIgPiAwKSB7XG4gICAgICAgICAgICAgICAgbm9kZS50eXBlID0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSO1xuICAgICAgICAgICAgICAgIG5vZGUuYSA9IHRoaXMuQ3JlYXRlTm9kZSgwLCBub2RlKTtcbiAgICAgICAgICAgICAgICBub2RlLmIgPSB0aGlzLkNyZWF0ZU5vZGUoMCwgbm9kZSk7XG5cbiAgICAgICAgICAgICAgICByZW1haW5kZXItLTtcblxuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiB0cmVlO1xuICAgIH07IFxuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuUHJlcGFyZVRyZWUgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzZWwgPSAwLCBwdHIgPSAwLCB0YWJsZSA9IHt9O1xuICAgICAgICB0aGlzLnRyYXZlcnNlKHRoaXMudHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IpIHtcbiAgICAgICAgICAgICAgICB0YWJsZVtzZWxdID0gbm9kZTtcbiAgICAgICAgICAgICAgICBub2RlLmluZGV4ID0gc2VsO1xuICAgICAgICAgICAgKytzZWw7fVxuXG4gICAgICAgICAgICBlbHNlIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBwdHI7XG4gICAgICAgICAgICBwdHIrKzt9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcblxuICAgICAgICB0aGlzLmNsYXNzZXMgPSBzZWw7XG4gICAgICAgIHRoaXMubm9kZXMgPSBwdHI7XG4gICAgICAgIHRoaXMudGFibGUgPSB0YWJsZTtcbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuQ3JlYXRlTm9kZSA9IGZ1bmN0aW9uIChkZXB0aCwgcGFyZW50KSB7XG4gICAgICAgIHZhciBub2RlID0geyBwYXJlbnQ6IHBhcmVudCB9O1xuXG4gICAgICAgIGlmIChkZXB0aCA8PSAwKSB7XG4gICAgICAgICAgICBub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgbm9kZS50eXBlID0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSO1xuICAgICAgICAgICAgbm9kZS5hID0gdGhpcy5DcmVhdGVOb2RlKGRlcHRoLTEsIG5vZGUpO1xuICAgICAgICAgICAgbm9kZS5iID0gdGhpcy5DcmVhdGVOb2RlKGRlcHRoLTEsIG5vZGUpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIG5vZGU7XG4gICAgfTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLnRyYXZlcnNlID0gZnVuY3Rpb24gKG5vZGUsIGNiKSB7XG4gICAgICAgIGlmIChjYi5jYWxsKHRoaXMsIG5vZGUpICYmIG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSKSB7XG4gICAgICAgICAgICB0aGlzLnRyYXZlcnNlKG5vZGUuYSwgY2IpO1xuICAgICAgICAgICAgdGhpcy50cmF2ZXJzZShub2RlLmIsIGNiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5hc2NlbmQgPSBmdW5jdGlvbiAobm9kZSwgY2IpIHtcbiAgICAgICAgaWYgKG5vZGUucGFyZW50ID09PSBudWxsKSByZXR1cm4gO1xuICAgICAgICBjYi5jYWxsKHRoaXMsIG5vZGUucGFyZW50LCBub2RlID09PSBub2RlLnBhcmVudC5hID8gLTEuMCA6IDEuMCk7XG4gICAgICAgIHRoaXMuYXNjZW5kKG5vZGUucGFyZW50LCBjYik7XG4gICAgfTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmRlc2NlbmQgPSBmdW5jdGlvbiAobm9kZSwgY2IpIHtcbiAgICAgICAgdmFyIGQgPSBjYi5jYWxsKHRoaXMsIG5vZGUpO1xuXG4gICAgICAgIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IgfHwgZCBpbnN0YW5jZW9mIE9iamVjdCB8fCBkID09PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZDtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChkID4gMC4wKSB7IC8vIG5lZ2F0aXZlIG1lYW5zIGxlZnQsIHBvc2l0aXZlIG1lYW5zIHJpZ2h0XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXNjZW5kKG5vZGUuYiwgY2IpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVzY2VuZChub2RlLmEsIGNiKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uIChWLCBpKSB7XG4gICAgICAgIHZhciBzdW0gPSAwLjA7XG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgc3VtICs9IFYudy5kW2pdICogdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxpYi5NYXRoVS50YW5oKHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kW2ldICsgc3VtKTtcbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuZ3JhZGllbnQgPSBmdW5jdGlvbiAoViwgaSwgZGlyZWN0aW9uKSB7XG4gICAgICAgIHZhciBhY3QgPSB0aGlzLmFjdGl2YXRlKFYsIGkpLFxuICAgICAgICAgICAgICAgIGVyciA9IGFjdCAtIGRpcmVjdGlvbjtcblxuICAgICAgICB2YXIgZHcgPSAoMS4wIC0gYWN0ICogYWN0KSAqIGVycjtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0ub21pdCA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFtqXSArPSBWLncuZFtqXSAqIGR3O1xuICAgICAgICAgICAgVi5kdy5kW2pdICs9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXSAqIGR3O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kW2ldICs9IGR3O1xuXG4gICAgICAgIHJldHVybiAoZGlyZWN0aW9uIDwgMCA/IDEgLSAoYWN0ICogMC41ICsgMC41KSA6IChhY3QgKiAwLjUgKyAwLjUpKTsgLy8gcHJvYmFiaWxpdHkgdG8gZ28gdGhlIHJpZ2h0IHdheVxuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gdGhpcy5kZXNjZW5kKHRoaXMudHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlKFYsIG5vZGUuaW5kZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbHNlIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAoQS5pbmRleCA9IHNlbGVjdGVkLmluZGV4KTtcbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgViwgZGVzaXJlZCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5vbWl0ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm9iID0gMS4wO1xuICAgICAgICB0aGlzLmFzY2VuZCh0aGlzLnRhYmxlW2Rlc2lyZWRdLCBmdW5jdGlvbiAobm9kZSwgZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBwcm9iID0gcHJvYiAqIHRoaXMuZ3JhZGllbnQoViwgbm9kZS5pbmRleCwgZGlyZWN0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIDEuMCAtIHByb2I7IC8vIHByb2JhYmlsaXR5IHRvIE5PVCBnbyB0aGUgcmlnaHQgd2F5XG4gICAgfTtcblxuICAgIGxpYi5Tb2Z0bWF4TGF5ZXIgPSBTb2Z0bWF4TGF5ZXI7XG4gICAgbGliLkhpZXJhcmNoaWNhbFNvZnRtYXggPSBIaWVyYXJjaGljYWxTb2Z0bWF4O1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHsgLy8gd2ViIHdvcmtlciBzdXBwb3J0OyBqdXN0IHVzZSBubmpzIGluIHdlYiB3b3JrZXJcbiAgICAgICAgICAgIHdpbmRvdy5ubiA9IGxpYjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbGliO1xuICAgIH1cbiAgICBcbn0pKG5uanMpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
