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


    //
    //
    //
    function Mat(x, y, z, v) {
        this.size = lib.Size3(x, y, z);
        this.d = Mat.CreateArray(x * y * z, v === undefined ? 0.0 : v, 'Float64Array');
    };

    Mat.CreateArray = function(length, v, t) {
        var arr = null;

        v = v || 0;
        t = t || 'Float64Array';

        if (typeof ArrayBuffer === 'undefined') {
            arr = new Array(length);
        } else {
            arr = eval('new ' + t + '(length)');
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
        for (var i = 0; i < this.d.length; i++) { this.d[i] = v; }
    };

    Mat.prototype.copy = function(a, s, b) {
        if (s === undefined) s = 1;
        for (var i = 0; i < this.d.length; i++) { this.d[i] = a[i] / s + b; }
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


    function Blob(x, y, z, a, b) {
        this.size = lib.Size3(x, y, z);
        this.w = new Mat(x, y, z);
        this.dw = new Mat(x, y, z);

        if (a !== undefined && b !== undefined) {
            this.w.randf(a, b);
        } else {
            this.w.randn();
        }

    };

    lib.MathU = math;
    lib.Size2 = Size2;
    lib.Size3 = Size3;
    lib.Mat = Mat;
    lib.Blob = Blob;

})(nnjs);

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
        this.stride = opt.stride;
        this.pad = opt.pad;

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
        var A_x = A.size.x | 0, A_y = A.size.y | 0, A_d = A.size.depth | 0;
        var V_x = V.size.x | 0, V_y = V.size.y | 0, V_d = V.size.depth | 0;
        var F_x = this.filter.x | 0, F_y = this.filter.y | 0, F_d = this.filter.depth | 0;

        var stride = this.stride | 0;
        var biases = this.parameters.biases.w.d;

        for (var d = 0; d < A_d; d++) {
            var f = this.parameters.filters[d];
            var x = -this.pad | 0;
            var y = -this.pad | 0;
            for (var ay = 0; ay < A_y; y += stride, ay++) { // xy_stride
                x = -this.pad | 0;
                for (var ax = 0; ax < A_x; x += stride, ax++) { // xy_stride

                    // convolve centered at this particular location [ax, ay]
                    var a = 0.0;
                    var ox = 0, oy = 0;
                    for (var fy = 0; fy < F_y; fy++) {
                        oy = y + fy; // coordinates in the original input array coordinates
                        for (var fx = 0; fx < F_x; fx++) {
                            ox = x + fx;
                            if (oy >= 0 && oy < V_y && ox >= 0 && ox < V_x) {
                                for (var fd = 0; fd < F_d; fd++) {
                                    // A.w[ax, ay, d] += f.w[ fx, fy, fd ] * V.w[ ox, oy, fd ]
                                    a += f.w.d[(fy * F_x + fx) * F_d + fd] * V.w.d[(oy * V_x + ox) * V_d + fd];
                                }
                            }
                        }
                    }

                    A.w.d[(ay * A_x + ax) * A_d + d] = a + biases[d];
                }
            }
        }
    };

    ConvolutionalLayer.prototype.backward = function (A, V) {
        var A_x = A.size.x | 0, A_y = A.size.y | 0, A_d = A.size.depth | 0;
        var V_x = V.size.x | 0, V_y = V.size.y | 0, V_d = V.size.depth | 0;
        var F_x = this.filter.x | 0, F_y = this.filter.y | 0, F_d = this.filter.depth | 0;

        var stride = this.stride | 0;
        var biases = this.parameters.biases.dw.d;

        var v1 = 0, v2 = 0;

        for (var d = 0; d < A_d; d++) {
            var f = this.parameters.filters[d];
            var x = -this.pad | 0;
            var y = -this.pad | 0;
            for (var ay = 0; ay < A_y; y += stride, ay++) {
                x = -this.pad | 0;
                for (var ax = 0; ax < A_x; x += stride, ax++) {

                    // convolve centered at this location [ax, ay]
                    var dA = A.dw.d[(ay * A_x + ax) * A_d + d];
                    var ox = 0, oy = 0;
                    for (var fy = 0; fy < F_y; fy++) {
                        oy = y + fy; // coordinates in the original input array coordinates
                        for (var fx = 0; fx < F_x; fx++) {
                            ox = x + fx;
                            if (oy >= 0 && oy < V_y && ox >= 0 && ox < V_x) {
                                for (var fd = 0; fd < F_d; fd++) {
                                    // f.dw[fx, fy, fd] += V.w[ox, oy, fd] * A.dw[ax, ay, d]
                                    // V.dw[ox, oy, fd] += f.w[fx, fy, fd] * A.dw[ax, ay, d]
                                    v1 = (fy * F_x + fx) * F_d + fd;
                                    v2 = (oy * V_x + ox) * V_d + fd;
                                    f.dw.d[v1] += V.w.d[v2]*dA;
                                    V.dw.d[v2] += f.w.d[v1]*dA;
                                }
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
        this.stride = opt.stride;
        this.pad = opt.pad;

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
                    var selv = -Math.Infinity, selx = 0, sely;
                    var ox = 0, oy = 0, q = 0;
                    for (var fy = 0; fy < F_y; fy++) {
                        oy = y + fy; // coordinates in the original input array coordinates
                        for (var fx = 0; fx < F_x; fx++) {
                            ox = x + fx;
                            if (oy >= 0 && oy < V_y && ox >= 0 && ox < V_x) {
                                q = V.w.d[(oy * V_x + ox) * V_d + d];
                                if (q > selv) { selv = q; selx = ox; sely = oy; }
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
                    var dA = A.dw.d[ix];

                    var selx = A.px[ix]; 
                    var sely = A.py[ix];

                    V.dw.d[(sely * V_x + selx) * V_d + d] = dA; // only transfer weights from selected locations
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

    function DropOutLayer(opt, net) {
        this.in = opt.input;
        this.out = opt.input;
        this.net = net;
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
        this.scale = opt.scale || 1.0;
        this.bias = opt.bias || 0.0;
    };

    InputLayer.prototype.forward = function(V, A) {
        A.w.copy(V, this.scale, this.bias);
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
            this.parameters.filters[i] = new lib.Blob(1, 1, 9, 0, 0.08);
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
        this.parameters.filters[i].nochange = false;

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
            this.parameters.filters[i].nochange = true;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5uLmluaXQuanMiLCJubi5tYXRoLmpzIiwiYXBpL25ldHdvcmsubm4uanMiLCJhcGkvd2Vid29ya2VyLm5uLmpzIiwibGF5ZXJzL2NvbnZvbHV0aW9uYWwubm4uanMiLCJsYXllcnMvZG90Lm5uLmpzIiwibGF5ZXJzL2Ryb3BvdXQubm4uanMiLCJsYXllcnMvaW5wdXQubm4uanMiLCJsYXllcnMvbHN0bS5ubi5qcyIsImxheWVycy9ub24tbGluZWFyLm5uLmpzIiwibGF5ZXJzL3JlZ3Jlc3Npb24ubm4uanMiLCJsYXllcnMvc29mdG1heC5ubi5qcyIsIm5uLmV4cG9ydC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDalVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNoQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdk5BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJubi5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBubmpzID0ge307XG5cbi8vIFV0aWxpdHkgZnVuXG5mdW5jdGlvbiBhc3NlcnQoY29uZGl0aW9uLCBtZXNzYWdlKSB7XG4gICAgLy8gZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE1MzEzNDE4L2phdmFzY3JpcHQtYXNzZXJ0XG4gICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgXCJBc3NlcnRpb24gZmFpbGVkXCI7XG4gICAgICAgIGlmICh0eXBlb2YgRXJyb3IgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBtZXNzYWdlOyAvLyBGYWxsYmFja1xuICAgIH1cbn1cblxuKGZ1bmN0aW9uKCkge1widXNlIHN0cmljdFwiO1xuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICAgIHZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICB2YXIgaXNBcnJheSA9IGZ1bmN0aW9uIGlzQXJyYXkoYXJyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0b1N0ci5jYWxsKGFycikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcblxuICAgIHZhciBpc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcbiAgICAgICAgaWYgKCFvYmogfHwgdG9TdHIuY2FsbChvYmopICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhc093bkNvbnN0cnVjdG9yID0gaGFzT3duLmNhbGwob2JqLCAnY29uc3RydWN0b3InKTtcbiAgICAgICAgdmFyIGhhc0lzUHJvdG90eXBlT2YgPSBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSAmJiBoYXNPd24uY2FsbChvYmouY29uc3RydWN0b3IucHJvdG90eXBlLCAnaXNQcm90b3R5cGVPZicpO1xuICAgICAgICAvLyBOb3Qgb3duIGNvbnN0cnVjdG9yIHByb3BlcnR5IG11c3QgYmUgT2JqZWN0XG4gICAgICAgIGlmIChvYmouY29uc3RydWN0b3IgJiYgIWhhc093bkNvbnN0cnVjdG9yICYmICFoYXNJc1Byb3RvdHlwZU9mKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPd24gcHJvcGVydGllcyBhcmUgZW51bWVyYXRlZCBmaXJzdGx5LCBzbyB0byBzcGVlZCB1cCxcbiAgICAgICAgLy8gaWYgbGFzdCBvbmUgaXMgb3duLCB0aGVuIGFsbCBwcm9wZXJ0aWVzIGFyZSBvd24uXG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIGZvciAoa2V5IGluIG9iaikgeyAvKiovIH1cblxuICAgICAgICByZXR1cm4gdHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcgfHwgaGFzT3duLmNhbGwob2JqLCBrZXkpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBleHRlbmQoKSB7XG4gICAgICAgIHZhciBvcHRpb25zLCBuYW1lLCBzcmMsIGNvcHksIGNvcHlJc0FycmF5LCBjbG9uZTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgdmFyIGkgPSAxO1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgdmFyIGRlZXAgPSBmYWxzZTtcblxuICAgICAgICAvLyBIYW5kbGUgYSBkZWVwIGNvcHkgc2l0dWF0aW9uXG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIGRlZXAgPSB0YXJnZXQ7XG4gICAgICAgICAgICB0YXJnZXQgPSBhcmd1bWVudHNbMV0gfHwge307XG4gICAgICAgICAgICAvLyBza2lwIHRoZSBib29sZWFuIGFuZCB0aGUgdGFyZ2V0XG4gICAgICAgICAgICBpID0gMjtcbiAgICAgICAgfSBlbHNlIGlmICgodHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJykgfHwgdGFyZ2V0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcbiAgICAgICAgICAgIGlmIChvcHRpb25zICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBFeHRlbmQgdGhlIGJhc2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3JjID0gdGFyZ2V0W25hbWVdO1xuICAgICAgICAgICAgICAgICAgICBjb3B5ID0gb3B0aW9uc1tuYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IG5ldmVyLWVuZGluZyBsb29wXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgIT09IGNvcHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlY3Vyc2UgaWYgd2UncmUgbWVyZ2luZyBwbGFpbiBvYmplY3RzIG9yIGFycmF5c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZXAgJiYgY29weSAmJiAoaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSBpc0FycmF5KGNvcHkpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29weUlzQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29weUlzQXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgaXNBcnJheShzcmMpID8gc3JjIDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmV2ZXIgbW92ZSBvcmlnaW5hbCBvYmplY3RzLCBjbG9uZSB0aGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gZXh0ZW5kKGRlZXAsIGNsb25lLCBjb3B5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IGJyaW5nIGluIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvcHkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gY29weTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfTtcblxuICAgIE9iamVjdC5leHRlbmQgPSBleHRlbmQ7XG59KSgpO1xuIiwiKGZ1bmN0aW9uKGxpYikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBtYXRoID0ge1xuICAgICAgICBnYXVzc186IHsgYTogZmFsc2UsIGI6IDAuMCB9LFxuICAgICAgICBnYXVzczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAobWF0aC5nYXVzc18uYSkgeyBtYXRoLmdhdXNzXy5hID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGguZ2F1c3NfLmI7IH1cbiAgICAgICAgICAgIHZhciB1ID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuICAgICAgICAgICAgdmFyIHYgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG4gICAgICAgICAgICB2YXIgciA9IHUgKiB1ICsgdiAqIHY7XG4gICAgICAgICAgICBpZiAociA9PSAwIHx8IHIgPiAxKSByZXR1cm4gbWF0aC5nYXVzcygpO1xuICAgICAgICAgICAgdmFyIGMgPSBNYXRoLnNxcnQoLTIgKiBNYXRoLmxvZyhyKSAvIHIpO1xuICAgICAgICAgICAgbWF0aC5nYXVzc18uYiA9IHYgKiBjOyAvLyBjYWNoZSB0aGlzXG4gICAgICAgICAgICBtYXRoLmdhdXNzXy5hID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB1ICogYztcbiAgICAgICAgfSxcblxuICAgICAgICByYW5kZjogZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAoYiAtIGEpICsgYTtcbiAgICAgICAgfSxcblxuICAgICAgICByYW5kaTogZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChiIC0gYSkgKyBhKTtcbiAgICAgICAgfSxcblxuICAgICAgICByYW5kbjogZnVuY3Rpb24obXUsIHN0ZCkge1xuICAgICAgICAgICAgcmV0dXJuIG11ICsgbWF0aC5nYXVzcygpICogc3RkO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRhbmg6IHR5cGVvZiBNYXRoLnRhbmggPT09IFwidW5kZWZpbmVkXCIgPyBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICB2YXIgeSA9IE1hdGguZXhwKDIgKiB4KTtcbiAgICAgICAgICAgIHJldHVybiAoeSAtIDEpIC8gKHkgKyAxKTsgfSA6IE1hdGgudGFuaFxuICAgIH07XG5cbiAgICAvL1xuICAgIC8vXG4gICAgLy9cbiAgICBmdW5jdGlvbiBTaXplMih4LCB5KSB7XG4gICAgICAgIHJldHVybiB7IHg6IHgsIHk6IHksIGxlbmd0aDogeCAqIHkgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gU2l6ZTMoeCwgeSwgeikge1xuICAgICAgICByZXR1cm4geyB4OiB4LCB5OiB5LCBkZXB0aDogeiwgbGVuZ3RoOiB4ICogeSAqIHogfTtcbiAgICB9O1xuXG5cbiAgICAvL1xuICAgIC8vXG4gICAgLy9cbiAgICBmdW5jdGlvbiBNYXQoeCwgeSwgeiwgdikge1xuICAgICAgICB0aGlzLnNpemUgPSBsaWIuU2l6ZTMoeCwgeSwgeik7XG4gICAgICAgIHRoaXMuZCA9IE1hdC5DcmVhdGVBcnJheSh4ICogeSAqIHosIHYgPT09IHVuZGVmaW5lZCA/IDAuMCA6IHYsICdGbG9hdDY0QXJyYXknKTtcbiAgICB9O1xuXG4gICAgTWF0LkNyZWF0ZUFycmF5ID0gZnVuY3Rpb24obGVuZ3RoLCB2LCB0KSB7XG4gICAgICAgIHZhciBhcnIgPSBudWxsO1xuXG4gICAgICAgIHYgPSB2IHx8IDA7XG4gICAgICAgIHQgPSB0IHx8ICdGbG9hdDY0QXJyYXknO1xuXG4gICAgICAgIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFyciA9IGV2YWwoJ25ldyAnICsgdCArICcobGVuZ3RoKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkgeyBhcnJbaV0gPSB2OyB9XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfTtcblxuICAgIE1hdC5jb3B5ID0gZnVuY3Rpb24obWF0KSB7XG4gICAgICAgIHZhciBtYXRfID0gbmV3IG1hdChtYXQuc2l6ZS54LCBtYXQuc2l6ZS55LCBtYXQuc2l6ZS5kZXB0aCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF0LmQubGVuZ3RoOyBpKyspIHsgbWF0Xy5kW2ldID0gbWF0LmRbaV07IH1cbiAgICAgICAgcmV0dXJuIG1hdF87XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUubWF4aSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IDAsIG0gPSAtSW5maW5pdHk7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRbaV0gPiBtKSB7XG4gICAgICAgICAgICAgICAgaiA9IGksIG0gPSB0aGlzLmRbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gajtcbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgel07XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oeCwgeSwgeiwgdikge1xuICAgICAgICB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgel0gPSB2O1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHgsIHksIHosIHYpIHtcbiAgICAgICAgdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHpdICs9IHY7XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24odikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSB2OyB9XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKGEsIHMsIGIpIHtcbiAgICAgICAgaWYgKHMgPT09IHVuZGVmaW5lZCkgcyA9IDE7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IGFbaV0gLyBzICsgYjsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24oYSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBhLmRbaV07IH1cbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5yYW5kZiA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gbWF0aC5yYW5kZihhLCBiKTsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLnJhbmRuID0gZnVuY3Rpb24oc2NhbGUpIHtcbiAgICAgICAgc2NhbGUgPSBzY2FsZSB8fCBNYXRoLnNxcnQoMS4wIC8gKHRoaXMuc2l6ZS54ICogdGhpcy5zaXplLnkgKiB0aGlzLnNpemUuZGVwdGgpKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gbWF0aC5yYW5kbigwLjAsIHNjYWxlKTsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBtYXQuY29weSh0aGlzKTtcbiAgICB9O1xuXG5cblxuICAgIE1hdC5wcm90b3R5cGUuVG9JbWFnZURhdGFCdWZmZXIgPSBmdW5jdGlvbiAoZGltLCBhbHBoYSkge1xuICAgICAgICBpZiAoIWlzTmFOKGQpKVxuICAgICAgICAgICAgZGltID0gWyBkaW0sIGRpbSwgZGltIF07XG5cbiAgICAgICAgaWYgKGRpbS5sZW5ndGggPT0gNCkgXG4gICAgICAgICAgICBhbHBoYSA9IC0xO1xuXG4gICAgICAgIGFscGhhID0gYWxwaGEgfHwgMjU1O1xuXG4gICAgICAgIHZhciBsZW4gPSB0aGlzLnNpemUueCAqIHRoaXMuc2l6ZS55O1xuICAgICAgICB2YXIgYnVmZmVyID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGxlbiAqIDQpO1xuICAgICAgICBmb3IgKHZhciB5ID0gMDsgeSA8IHRoaXMuc2l6ZS55OyB5KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIHggPSAwOyB4IDwgdGhpcy5zaXplLng7IHgrKykge1xuICAgICAgICAgICAgICAgIGJ1ZmZlclsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiA0ICsgMF0gPSB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgZGltWzBdXTtcbiAgICAgICAgICAgICAgICBidWZmZXJbKHkgKiB0aGlzLnNpemUueCArIHgpICogNCArIDFdID0gdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIGRpbVsxXV07XG4gICAgICAgICAgICAgICAgYnVmZmVyWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIDQgKyAyXSA9IHRoaXMuZFsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyBkaW1bMl1dO1xuICAgICAgICAgICAgICAgIGJ1ZmZlclsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiA0ICsgM10gPSBhbHBoYSA8IDAgPyB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgZGltWzNdXSA6IGFscGhhO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJ1ZmZlcjtcbiAgICB9O1xuXG4gICAgLy8gYWNjZXNzb3JcbiAgICAvLyBbICh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHogXVxuXG5cbiAgICBmdW5jdGlvbiBCbG9iKHgsIHksIHosIGEsIGIpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbGliLlNpemUzKHgsIHksIHopO1xuICAgICAgICB0aGlzLncgPSBuZXcgTWF0KHgsIHksIHopO1xuICAgICAgICB0aGlzLmR3ID0gbmV3IE1hdCh4LCB5LCB6KTtcblxuICAgICAgICBpZiAoYSAhPT0gdW5kZWZpbmVkICYmIGIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy53LnJhbmRmKGEsIGIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy53LnJhbmRuKCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBsaWIuTWF0aFUgPSBtYXRoO1xuICAgIGxpYi5TaXplMiA9IFNpemUyO1xuICAgIGxpYi5TaXplMyA9IFNpemUzO1xuICAgIGxpYi5NYXQgPSBNYXQ7XG4gICAgbGliLkJsb2IgPSBCbG9iO1xuXG59KShubmpzKTtcbiIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgLyoqXG4gICAgICogSGVscGVyIGZ1bmN0aW9uLCB0aGF0IGNvbnZlcnRzIGEgZGVzY3JpcHRpb24gaW50byBhbiBhY3R1YWwgbGF5ZXIgb2JqZWN0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRlc2NyaXB0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gTGF5ZXIob3B0LCBuZXQpIHtcbiAgICAgICAgc3dpdGNoIChvcHQudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnaW5wdXQnOiByZXR1cm4gbmV3IGxpYi5JbnB1dExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2RvdCc6IHJldHVybiBuZXcgbGliLkRvdExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2NvbnYnOiByZXR1cm4gbmV3IGxpYi5Db252b2x1dGlvbmFsTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnbHN0bSc6IHJldHVybiBuZXcgbGliLkxvbmdTaG9ydFRlcm1NZW1vcnlMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdwb29sJzogcmV0dXJuIG5ldyBsaWIuUG9vbGluZ0xheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3NpZ21vaWQnOiByZXR1cm4gbmV3IGxpYi5TaWdtb2lkTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAncmVsdSc6IHJldHVybiBuZXcgbGliLlJlbHVMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICd0YW5oJzogcmV0dXJuIG5ldyBsaWIuVGFuaExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2Ryb3BvdXQnOiByZXR1cm4gbmV3IGxpYi5Ecm9wT3V0TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnc29mdG1heCc6IHJldHVybiBuZXcgbGliLlNvZnRtYXhMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdoc20nOiByZXR1cm4gbmV3IGxpYi5IaWVyYXJjaGljYWxTb2Z0bWF4KG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3JlZ3Jlc3Npb24nOiByZXR1cm4gbmV3IGxpYi5SZWdyZXNzaW9uTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gTmV0d29ya1N0cnVjdHVyZShkZXNjLCBuZXQpIHtcbiAgICAgICAgdGhpcy5uZXQgPSBuZXQ7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjO1xuICAgICAgICB0aGlzLmxlbmd0aCA9IGRlc2MubGVuZ3RoOyAvLyBjb252aWVuaWVuY2VcbiAgICAgICAgdGhpcy5yZWN1cnJlbnQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLkJ1aWxkKCk7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdHJ1Y3R1cmUucHJvdG90eXBlLkJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmxpc3QgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRlc2NyaXB0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc2NyaXB0aW9uW2ldLmlucHV0ID0gdGhpcy5saXN0W2kgLSAxXS5vdXQ7IC8vIHNldCBpbnB1dCB0byB0aGlzIGxheWVyIHRvIHRoZSBvdXRwdXQgb2YgbGFzdCBsYXllclxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmxpc3RbaV0gPSBMYXllcih0aGlzLmRlc2NyaXB0aW9uW2ldLCB0aGlzLm5ldCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RbaV0ucmVjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTsgIFxuXG4gICAgTmV0d29ya1N0cnVjdHVyZS5wcm90b3R5cGUuc3RhdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdGF0cyA9IHsgcGFyYW1ldGVyczogMCB9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBzdGF0cy5wYXJhbWV0ZXJzICs9IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnNbal0uc2l6ZS5sZW5ndGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXRzLnBhcmFtZXRlcnMgKz0gdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuYmlhc2VzLnNpemUubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRzO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RydWN0dXJlLnByb3RvdHlwZS5wYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGFyYW1ldGVycyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgb2JqZWN0ID0geyBmaWx0ZXJzOiBbXSwgYmlhc2VzOiB0aGlzLmxpc3RbaV0ucGFyYW1ldGVycy5iaWFzZXMudy5kIH07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBvYmplY3QuZmlsdGVyc1tqXSA9IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnNbal0udy5kO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJhbWV0ZXJzW2ldID0gb2JqZWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtZXRlcnM7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdHJ1Y3R1cmUucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgaSA9IGkgPj0gMCA/IGkgOiB0aGlzLmxlbmd0aCArIGk7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RbaV07XG4gICAgfTtcblxuICAgIC8vIGN1cnJlbnQgc3RhdGVcbiAgICBmdW5jdGlvbiBOZXR3b3JrU3RhdGUobmV0KSB7XG4gICAgICAgIHRoaXMubmV0ID0gbmV0O1xuICAgICAgICB0aGlzLmxheWVycyA9IG5ldC5sYXllcnM7XG4gICAgICAgIHRoaXMud2lkdGggPSBuZXQubGF5ZXJzLmxlbmd0aDsgLy8gaG93IG1hbnkgbGF5ZXJzP1xuICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMubGF5ZXJzLnJlY3VycmVudCA/IHRoaXMubmV0LmxlYXJuZXIudGltZXNwYW4gOiAxOyAvLyBob3cgbG9uZyBicHR0PyAvIHRpbWUgc3RlcHNcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmxheWVycy5yZWN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuYmxvYnMgPSB0aGlzLkJ1aWxkKHRoaXMubmV0LmxlYXJuZXIudGltZXNwYW4gKyAxKTsgLy8gbGFzdCBvbmUgbmVlZHMgcmVmZXJlbmNlIHRvIHByZXZpb3VzXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJsb2JzID0gdGhpcy5CdWlsZCgxKTsgLy8gb25seSBvbmUgdGltZSBuZWVkZWRcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBbIFsgc3RhdGUgZm9yIFQ9MCBdLCBbIHN0YXRlIGZvciBUPTEgXSwgLi4uIF1cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLkJ1aWxkID0gZnVuY3Rpb24gKGgsIFMpIHtcbiAgICAgICAgdmFyIFQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgdCA9IDA7IHQgPCBoOyB0KyspIHtcbiAgICAgICAgICAgIFQudW5zaGlmdCh0aGlzLkJ1aWxkU3RhdGUoVCwgUyAhPT0gdW5kZWZpbmVkID8gU1t0XSA6IHVuZGVmaW5lZCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFQ7XG4gICAgfTtcblxuICAgIC8vIFsgWyBCbG9iIGZvciBsYXllciAxIF0sIFsgQmxvYiBmb3IgbGF5ZXIgMiBdLCAuLi4gXVxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUuQnVpbGRTdGF0ZSA9IGZ1bmN0aW9uIChULCBTKSB7XG4gICAgICAgIFMgPSBTIHx8IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5sYXllcnMubGlzdFtpXS5vdXQgIT09ICd1bmRlZmluZWQnICYmIFNbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFNbaV0gPSBuZXcgbGliLkJsb2IodGhpcy5sYXllcnMubGlzdFtpXS5vdXQueCwgdGhpcy5sYXllcnMubGlzdFtpXS5vdXQueSwgdGhpcy5sYXllcnMubGlzdFtpXS5vdXQuZGVwdGgsIDAuMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFNbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFNbaV0gPSB7fTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgU1tpXS53LmFsbCgwKSwgU1tpXS5kdy5hbGwoMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5sYXllcnMubGlzdFtpXS5yZWN1cnJlbnQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMubGF5ZXJzLmxpc3RbaV0ucmVjdXJyZW50XG4gICAgICAgICAgICAgICAgICAgICYmIFQgIT09IHVuZGVmaW5lZCAmJiBULmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBTW2ldLnByZXYgPSBUWzBdW2ldO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMubGF5ZXJzLmxpc3RbaV0uUHJlcGFyZVN0YXRlQmxvYiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheWVycy5saXN0W2ldLlByZXBhcmVTdGF0ZUJsb2IoU1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUztcbiAgICB9O1xuXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5ibG9icyA9IHRoaXMuQnVpbGQodGhpcy5ibG9icy5sZW5ndGgsIHRoaXMuYmxvYnMpO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmxheWVycy5yZWN1cnJlbnQpIHsgLy8gb25seSBpZiByZWN1cnJlbnRcbiAgICAgICAgICAgIHZhciBTID0gdGhpcy5ibG9icy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuYmxvYnMudW5zaGlmdCh0aGlzLkJ1aWxkU3RhdGUodGhpcy5ibG9icywgUykpOyAvLyByZXVzYWJpbGl0eVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLndpZHRoLmxlbmd0aDsgaSsrKSB7IFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLmJsb2JzW3RoaXMuaGVpZ2h0XVtpXS5wcmV2KVxuICAgICAgICAgICAgICAgICAgICB0aGlzLmJsb2JzW3RoaXMuaGVpZ2h0XVtpXS5wcmV2ID0gbnVsbDsgXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjbGVhbiBncmFkaWVudHNcbiAgICAgICAgZm9yICh2YXIgdCA9IDA7IHQgPCB0aGlzLmJsb2JzLmxlbmd0aDsgdCsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMud2lkdGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuYmxvYnNbdF1baV0uZHcuYWxsKDAuMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpLCB0KSB7XG4gICAgICAgIHQgPSB0IHx8IDA7XG4gICAgICAgIHQgPSB0ID49IDAgPyB0IDogdGhpcy5oZWlnaHQgKyB0O1xuXG4gICAgICAgIGkgPSBpIHx8IDA7XG4gICAgICAgIGkgPSBpID49IDAgPyBpIDogdGhpcy53aWR0aCArIGk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvYnNbdF1baV07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIE5ldHdvcmsob3B0KSB7XG4gICAgICAgIHRoaXMubGVhcm5lciA9IG9wdC5sZWFybmVyO1xuICAgICAgICB0aGlzLmxlYXJuZXIgPSBPYmplY3QuZXh0ZW5kKHRydWUsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ3NnZCcsXG4gICAgICAgICAgICBiYXRjaDogMSxcbiAgICAgICAgICAgIGRlY2F5OiB7IGwxOiAwLCBsMjogMCB9LFxuICAgICAgICAgICAgY2xpcDogSW5maW5pdHksXG4gICAgICAgICAgICB0aW1lc3BhbjogMSAvLyBvbmx5IGZvciBybm5cbiAgICAgICAgfSwgdGhpcy5sZWFybmVyKTtcblxuICAgICAgICB0aGlzLmxlYXJuZXIgPSBPYmplY3QuZXh0ZW5kKHRydWUsIHRoaXMuZ2RbdGhpcy5sZWFybmVyLm1ldGhvZF0uZGVmYXVsdHMsIHRoaXMubGVhcm5lcik7XG4gICAgICAgIHRoaXMud2VhayA9IHRydWU7IC8vIGRyb3BvdXQgZW5hYmxlZD9cbiAgICAgICAgdGhpcy5wYXNzID0gMDtcblxuICAgICAgICB0aGlzLmxheWVycyA9IG5ldyBOZXR3b3JrU3RydWN0dXJlKG9wdC5sYXllcnMsIHRoaXMpO1xuICAgICAgICB0aGlzLnN0YXRlID0gbmV3IE5ldHdvcmtTdGF0ZSh0aGlzKTsgLy8gZXhjaGFuZ2FibGVcbiAgICB9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uKGlucCkge1xuICAgICAgICAvLyBnbyBmb3J3YXJkcyB0aHJvdWdoIG5ldHdvcmtcbiAgICAgICAgdGhpcy5zdGF0ZS5uZXh0KCk7XG4gICAgICAgIHZhciB5ID0gdGhpcy5sYXllcnMubGlzdFswXS5mb3J3YXJkKGlucCwgdGhpcy5zdGF0ZS5hdCgwKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHkgPSB0aGlzLmxheWVycy5saXN0W2ldLmZvcndhcmQodGhpcy5zdGF0ZS5hdChpIC0gMSksIHRoaXMuc3RhdGUuYXQoaSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHkgIT09IHVuZGVmaW5lZCA/IHkgOiB0aGlzLnN0YXRlLmF0KC0xKS53LmQ7XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24ob3V0cCkge1xuICAgICAgICB2YXIgRSA9IGZhbHNlLCBJID0gdGhpcy5sYXllcnMubGVuZ3RoIC0gMjtcblxuICAgICAgICB2YXIgbG9zcyA9IHRoaXMubGF5ZXJzLmF0KC0xKS5iYWNrd2FyZCh0aGlzLnN0YXRlLmF0KC0xKSwgdGhpcy5zdGF0ZS5hdCgtMiksIG91dHApO1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IHRoaXMuc3RhdGUuaGVpZ2h0ICYmIChFIHx8IHQgPT09IDApOyB0KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBJOyBpID49IDA7IGktLSkgeyAvLyBhbHdheXMgc3RhcnQgYmFja3dhcmQgcGFzcyBhdCBsYXN0IHJlY3VycmVudCBsYXllciwgb3IgYXQgc2Vjb25kLWxhc3QgbGF5ZXIgaWYgdD0wXG5cbiAgICAgICAgICAgICAgICBpZighRSAmJiB0aGlzLmxheWVycy5saXN0W2ldLnJlY3VycmVudCkgeyAvLyBleHBhbmQgbmV0d29ya1xuICAgICAgICAgICAgICAgICAgICBFID0gdHJ1ZSwgSSA9IGk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnMubGlzdFtpXS5iYWNrd2FyZCh0aGlzLnN0YXRlLmF0KGksIHQpLCB0aGlzLnN0YXRlLmF0KGkgLSAxLCB0KSk7XG5cbiAgICAgICAgICAgIH0gIFxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hZGp1c3QoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBsb3NzO1xuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5hZGp1c3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCsrdGhpcy5wYXNzICUgdGhpcy5sZWFybmVyLmJhdGNoICE9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbWV0aG9kID0gdGhpcy5nZFt0aGlzLmxlYXJuZXIubWV0aG9kXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVycy5saXN0W2ldLnBhcmFtZXRlcnMgPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW0gPSB0aGlzLmxheWVycy5saXN0W2ldLnBhcmFtZXRlcnM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtLmZpbHRlcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwYXJhbS5maWx0ZXJzLmxlbmd0aDsgaisrKSB7IG1ldGhvZC5jYWxsKHRoaXMsIHRoaXMubGVhcm5lciwgcGFyYW0uZmlsdGVyc1tqXSwgMS4wKTsgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtLmJpYXNlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBtZXRob2QuY2FsbCh0aGlzLCB0aGlzLmxlYXJuZXIsIHBhcmFtLmJpYXNlcywgMC4wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKiBncmFkaWVudCBkZXNjZW50IGFsZ29yaXRobXMgKi9cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5nZCA9IHt9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuZ2Quc2dkID0ge1xuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgcmF0ZTogMC4wMSxcbiAgICAgICAgICAgIG1vbWVudHVtOiAwLjlcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcmFnZTogWydnc3VtJ10sXG4gICAgICAgIGFsZ29yaXRobTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkeCA9IG9wdC5tb21lbnR1bSAqIGdzdW0gLSBvcHQucmF0ZSAqIGdpajtcbiAgICAgICAgICAgIGdzdW0gPSBkeDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5nZC5hZGFkZWx0YSA9IHtcbiAgICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgICAgIHJvOiAwLjk1LFxuICAgICAgICAgICAgZXBzOiAxZS04XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3JhZ2U6IFsnZ3N1bScsICd4c3VtJ10sXG4gICAgICAgIGFsZ29yaXRobTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBnc3VtID0gb3B0LnJvICogZ3N1bSArICgxIC0gb3B0LnJvKSAqIGdpaiAqIGdpajtcbiAgICAgICAgICAgIGR4ID0gLU1hdGguc3FydCgoeHN1bSArIG9wdC5lcHMpIC8gKGdzdW0gKyBvcHQuZXBzKSkgKiBnaWo7XG4gICAgICAgICAgICB4c3VtID0gb3B0LnJvICogeHN1bSArICgxIC0gb3B0LnJvKSAqIGR4ICogZHg7IC8vIHllcywgeHN1bSBsYWdzIGJlaGluZCBnc3VtIGJ5IDEuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyogYWxnb3JpdGhtcyBjb21waWxlciwgc3BlZWRzIHRoaW5ncyB1cCwgYW5kIG1ha2VzIHRoaW5ncyBlYXNpZXIgKi9cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBnZF9wcm90b3R5cGUgPSBmdW5jdGlvbihvcHQsIE8sIGRlY2F5KSB7XG4gICAgICAgICAgICBpZiAoTy5ub2NoYW5nZSkgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIGR4ID0gMCwgX19ncmFkID0gMCwgZ2lqID0gMCwgbDFncmFkID0gMCwgbDJncmFkID0gMDtcbiAgICAgICAgICAgIFwiVVUxXCI7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE8uc2l6ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIF9fZ3JhZCA9IE8uZHcuZFtpXTtcbiAgICAgICAgICAgICAgICBfX2dyYWQgPSBfX2dyYWQgPiBvcHQuY2xpcCA/IG9wdC5jbGlwIDogKF9fZ3JhZCA8IC1vcHQuY2xpcCA/IC1vcHQuY2xpcCA6IF9fZ3JhZCk7XG4gICAgICAgICAgICAgICAgbDFncmFkID0gZGVjYXkgKiBvcHQuZGVjYXkubDEgKiAoTy53LmRbaV0gPiAwID8gMSA6IC0xKTtcbiAgICAgICAgICAgICAgICBsMmdyYWQgPSBkZWNheSAqIG9wdC5kZWNheS5sMiAqIChPLncuZFtpXSk7XG4gICAgICAgICAgICAgICAgZ2lqID0gKF9fZ3JhZCArIGwxZ3JhZCArIGwyZ3JhZCkgLyBvcHQuYmF0Y2g7XG4gICAgICAgICAgICAgICAgXCJVVTJcIjtcbiAgICAgICAgICAgICAgICBcIlVVM1wiO1xuICAgICAgICAgICAgICAgIFwiVVU0XCI7XG4gICAgICAgICAgICAgICAgTy53LmRbaV0gKz0gZHg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIE8uZHcuYWxsKDAuMCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdkX3Byb3RvdHlwZV8gPSBnZF9wcm90b3R5cGUudG9TdHJpbmcoKTtcblxuICAgICAgICBmb3IgKHZhciBuYW1lIGluIE5ldHdvcmsucHJvdG90eXBlLmdkKSB7XG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRpb24gPSBOZXR3b3JrLnByb3RvdHlwZS5nZFtuYW1lXTtcbiAgICAgICAgICAgIHZhciBjaGVja3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzY3JpcHRpb24uc3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNoZWNrc1tpXSA9ICdpZiAodHlwZW9mIE8uJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnID09PSBcInVuZGVmaW5lZFwiKSB7IE8uJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnID0gbmV3IGxpYi5NYXQoTy5zaXplLngsIE8uc2l6ZS55LCBPLnNpemUuZGVwdGgsIDAuMCk7IH0nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZXh0cmFjdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzY3JpcHRpb24uc3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGV4dHJhY3Rpb25zW2ldID0gJ3ZhciAnICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcgPSBPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJy5kW2ldOyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhbGcgPSBkZXNjcmlwdGlvbi5hbGdvcml0aG0udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGFsZyA9IGFsZy5zdWJzdHJpbmcoYWxnLmluZGV4T2YoJ3snKSArIDEsIGFsZy5sZW5ndGggLSAxKTtcblxuICAgICAgICAgICAgdmFyIHN0b3JpbmdzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLnN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzdG9yaW5nc1tpXSA9ICdPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJy5kW2ldID0gJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnOyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBmdW5jID0gZ2RfcHJvdG90eXBlXy5yZXBsYWNlKCdcIlVVMVwiOycsIGNoZWNrcy5qb2luKFwiXCIpKS5yZXBsYWNlKCdcIlVVMlwiOycsIGV4dHJhY3Rpb25zLmpvaW4oXCJcIikpLnJlcGxhY2UoJ1wiVVUzXCI7JywgYWxnKS5yZXBsYWNlKCdcIlVVNFwiOycsIHN0b3JpbmdzLmpvaW4oXCJcIikpO1xuICAgICAgICAgICAgdmFyIGNtZCA9ICdOZXR3b3JrLnByb3RvdHlwZS5nZC4nICsgbmFtZSArICcgPSAnICsgZnVuYztcbiAgICAgICAgICAgIGV2YWwoY21kKTtcbiAgICAgICAgICAgIE5ldHdvcmsucHJvdG90eXBlLmdkW25hbWVdLmRlZmF1bHRzID0gZGVzY3JpcHRpb24uZGVmYXVsdHM7XG4gICAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgbGliLk5ldHdvcmsgPSBOZXR3b3JrO1xufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24obGliKSB7XG5cbiAgICBmdW5jdGlvbiBXZWJXb3JrZXIobWFpbiwgbm5qcykge1xuICAgICAgICB0aGlzLmV2ZW50cyA9IHt9O1xuICAgICAgICB0aGlzLkNyZWF0ZVdvcmtlcihtYWluLCBubmpzLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBXZWJXb3JrZXIuQVBJLmxpc3Rlbih0aGlzLmV2ZW50cywgdGhpcy53b3JrZXIpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5DcmVhdGVXb3JrZXIgPSBmdW5jdGlvbihtYWluLCBubmpzLCBjb21wbGV0aW9uKSB7XG4gICAgICAgIHZhciBjb21waWxlID0gKGZ1bmN0aW9uIChjb2RlKSB7XG4gICAgICAgICAgICB0aGlzLndvcmtlciA9IG5ldyBXb3JrZXIodGhpcy5DcmVhdGVVUkwoY29kZSwgbm5qcykpO1xuICAgICAgICAgICAgY29tcGxldGlvbi5jYWxsKHRoaXMpO1xuICAgICAgICB9KS5iaW5kKHRoaXMpO1xuXG4gICAgICAgIGlmIChtYWluIGluc3RhbmNlb2YgRnVuY3Rpb24pIHtcbiAgICAgICAgICAgIGNvbXBpbGUodGhpcy5GdW5jdGlvblRvU3RyaW5nKG1haW4pKTtcbiAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbWFpbiA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgIHZhciByZXF1ZXN0ID0gbmV3IFhNTEh0dHBSZXF1ZXN0KCk7XG5cbiAgICAgICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImxvYWRcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbXBpbGUodGhpcy5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJlcXVlc3QuYWRkRXZlbnRMaXN0ZW5lcihcImVycm9yXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3IgbG9hZGluZyB3b3JrZXIgXCInICsgbWFpbiArICdcIicpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXF1ZXN0Lm9wZW4oXCJHRVRcIiwgdGhpcy5Db252ZXJ0UmVsYXRpdmVVUkkobWFpbikpO1xuICAgICAgICAgICAgcmVxdWVzdC5zZW5kKCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5DcmVhdGVVUkwgPSBmdW5jdGlvbihjb2RlLCBubmpzKSB7XG4gICAgICAgIHZhciB3b3JrZXJTdHJpbmcgPSB0aGlzLkFkZFJlcXVpcmVkU3R1ZmYobm5qcykgKyAnXFxuJyArIGNvZGU7XG4gICAgICAgIHZhciBkYXRhID0gdGhpcy5DcmVhdGVCbG9iKHdvcmtlclN0cmluZyk7XG4gICAgICAgIHJldHVybiB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChkYXRhKTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5DcmVhdGVCbG9iID0gZnVuY3Rpb24oc3RyaW5nKSB7XG4gICAgICAgIHZhciBibG9iO1xuICAgICAgICB0cnkge1xuICAgICAgICAgICAgYmxvYiA9IG5ldyBCbG9iKFtzdHJpbmddLCB7IHR5cGU6ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyB9KTtcbiAgICAgICAgfSBjYXRjaCAoZSkgeyAvLyBCYWNrd2FyZHMtY29tcGF0aWJpbGl0eVxuICAgICAgICAgICAgd2luZG93LkJsb2JCdWlsZGVyID0gd2luZG93LkJsb2JCdWlsZGVyIHx8IHdpbmRvdy5XZWJLaXRCbG9iQnVpbGRlciB8fCB3aW5kb3cuTW96QmxvYkJ1aWxkZXI7XG4gICAgICAgICAgICBibG9iID0gbmV3IEJsb2JCdWlsZGVyKCk7XG4gICAgICAgICAgICBibG9iLmFwcGVuZChzdHJpbmcpO1xuICAgICAgICAgICAgYmxvYiA9IGJsb2IuZ2V0QmxvYigpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGJsb2I7XG4gICAgfTtcblxuICAgIFdlYldvcmtlci5wcm90b3R5cGUuRnVuY3Rpb25Ub1N0cmluZyA9IGZ1bmN0aW9uKGZ1bmMpIHtcbiAgICAgICAgdmFyIHN0cmluZyA9IHdvcmtlci50b1N0cmluZygpO1xuICAgICAgICB2YXIgYmVnID0gc3RyaW5nLmluZGV4T2YoJ3snKSArIDE7XG4gICAgICAgIHZhciBlbmQgPSBzdHJpbmcubGFzdEluZGV4T2YoJ30nKTtcbiAgICAgICAgcmV0dXJuIHN0cmluZy5zdWJzdHJpbmcoYmVnLCBlbmQpLnRyaW0oKTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5BZGRSZXF1aXJlZFN0dWZmID0gZnVuY3Rpb24obm5qcykge1xuICAgICAgICB2YXIgc3RyID0gJ2ltcG9ydFNjcmlwdHMoXCInICsgdGhpcy5Db252ZXJ0UmVsYXRpdmVVUkkobm5qcykgKyAnXCIpOyB2YXIgbm4gPSBubmpzOyAnO1xuICAgICAgICBzdHIgKz0gXCJ2YXIgV2ViV29ya2VyID0ge307IFdlYldvcmtlci5BUEkgPSB7XCI7XG5cbiAgICAgICAgdmFyIGFwaSA9IFtdO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gV2ViV29ya2VyLkFQSSkge1xuICAgICAgICAgICAgYXBpLnB1c2goa2V5ICsgJzogJyArIFdlYldvcmtlci5BUElba2V5XS50b1N0cmluZygpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN0ciArPSBhcGkuam9pbignLCcpICsgJ307IHd3ID0gV2ViV29ya2VyLkFQSTsnO1xuICAgICAgICBzdHIgKz0gJ3d3LmV2ZW50cyA9IHt9OyB3dy5saXN0ZW4oKTsnO1xuXG4gICAgICAgIHJldHVybiBzdHI7XG4gICAgfTtcblxuICAgIFdlYldvcmtlci5wcm90b3R5cGUuQ29udmVydFJlbGF0aXZlVVJJID0gZnVuY3Rpb24ocmVsYXRpdmUpIHtcbiAgICAgICAgdmFyIGFic29sdXRlID0gbnVsbDtcbiAgICAgICAgKGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICBlLmhyZWYgPSByZWxhdGl2ZTsgYWJzb2x1dGUgPSBlLmhyZWY7XG4gICAgICAgIH0pKGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2EnKSk7XG4gICAgICAgIHJldHVybiBhYnNvbHV0ZTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5vbiA9IGZ1bmN0aW9uKGV2ZW50LCBmdW5jKSB7XG4gICAgICAgIFdlYldvcmtlci5BUEkub24oZXZlbnQsIGZ1bmMsIHRoaXMuZXZlbnRzKTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS50cmlnZ2VyID0gZnVuY3Rpb24oZXZlbnQsIGRhdGEsIHRyYW5zZmVyKSB7XG4gICAgICAgIFdlYldvcmtlci5BUEkudHJpZ2dlcihldmVudCwgZGF0YSwgdHJhbnNmZXIsIHRoaXMud29ya2VyKTtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLkFQSSA9IHtcbiAgICAgICAgbGlzdGVuOiBmdW5jdGlvbihzdG9yZSwgdykge1xuICAgICAgICAgICAgc3RvcmUgPSBzdG9yZSB8fCAod3cgPyB3dy5ldmVudHMgOiBudWxsKTtcbiAgICAgICAgICAgIHcgPSB3IHx8IHNlbGY7XG4gICAgICAgICAgICB3Lm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcmVjZWl2ZWQgPSBlLmRhdGE7XG4gICAgICAgICAgICAgICAgdmFyIHN0b3JlZCA9IHN0b3JlW3JlY2VpdmVkLm5hbWVdO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBzdG9yZWQgIT09IHVuZGVmaW5lZCAmJiBzdG9yZWQgaW5zdGFuY2VvZiBBcnJheSAmJiBpIDwgc3RvcmVkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0b3JlZFtpXS5hcHBseSh1bmRlZmluZWQsIFtdLmNvbmNhdChyZWNlaXZlZC5wYXJhbWV0ZXIsIHJlY2VpdmVkLnRyYW5zZmVyKSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSxcbiAgICAgICAgb246IGZ1bmN0aW9uKG5hbWUsIGZ1bmMsIHN0b3JlKSB7XG4gICAgICAgICAgICBzdG9yZSA9IHN0b3JlIHx8ICh3dyA/IHd3LmV2ZW50cyA6IG51bGwpO1xuICAgICAgICAgICAgaWYgKHN0b3JlW25hbWVdID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgICAgICBzdG9yZVtuYW1lXSA9IFtdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzdG9yZVtuYW1lXS5wdXNoKGZ1bmMpO1xuICAgICAgICB9LFxuICAgICAgICB0cmlnZ2VyOiBmdW5jdGlvbihldmVudCwgZGF0YSwgdHJhbnNmZXIsIHcpIHtcbiAgICAgICAgICAgIHcgPSB3IHx8IHNlbGY7XG4gICAgICAgICAgICB3LnBvc3RNZXNzYWdlKHtcbiAgICAgICAgICAgICAgICBuYW1lOiBldmVudCxcbiAgICAgICAgICAgICAgICBwYXJhbWV0ZXI6IGRhdGEsXG4gICAgICAgICAgICAgICAgdHJhbnNmZXI6IHRyYW5zZmVyXG4gICAgICAgICAgICB9LCB0cmFuc2Zlcik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliLldlYldvcmtlciA9IFdlYldvcmtlcjtcblxufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8qIHNwYXRpYWwgd2VpZ2h0cyAqL1xuICAgIGZ1bmN0aW9uIENvbnZvbHV0aW9uYWxMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBvcHQuZmlsdGVyO1xuICAgICAgICB0aGlzLnN0cmlkZSA9IG9wdC5zdHJpZGU7XG4gICAgICAgIHRoaXMucGFkID0gb3B0LnBhZDtcblxuICAgICAgICB2YXIgb3ggPSBNYXRoLmZsb29yKCh0aGlzLmluLnggKyB0aGlzLnBhZCAqIDIgLSB0aGlzLmZpbHRlci54KSAvIHRoaXMuc3RyaWRlICsgMSk7XG4gICAgICAgIHZhciBveSA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueSArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLnkpIC8gdGhpcy5zdHJpZGUgKyAxKTtcbiAgICAgICAgdGhpcy5vdXQgPSBsaWIuU2l6ZTMob3gsIG95LCB0aGlzLmZpbHRlci5kZXB0aCk7XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgICAgICAgZmlsdGVyczogW10sXG4gICAgICAgICAgICBiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLmZpbHRlci5kZXB0aCwgMC4wKVxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQuZGVwdGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IodGhpcy5maWx0ZXIueCwgdGhpcy5maWx0ZXIueSwgdGhpcy5pbi5kZXB0aCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQ29udm9sdXRpb25hbExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgdmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuICAgICAgICB2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDAsIEZfZCA9IHRoaXMuZmlsdGVyLmRlcHRoIHwgMDtcblxuICAgICAgICB2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGUgfCAwO1xuICAgICAgICB2YXIgYmlhc2VzID0gdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmQ7XG5cbiAgICAgICAgZm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuICAgICAgICAgICAgdmFyIGYgPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tkXTtcbiAgICAgICAgICAgIHZhciB4ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgIGZvciAodmFyIGF5ID0gMDsgYXkgPCBBX3k7IHkgKz0gc3RyaWRlLCBheSsrKSB7IC8vIHh5X3N0cmlkZVxuICAgICAgICAgICAgICAgIHggPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGF4ID0gMDsgYXggPCBBX3g7IHggKz0gc3RyaWRlLCBheCsrKSB7IC8vIHh5X3N0cmlkZVxuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgcGFydGljdWxhciBsb2NhdGlvbiBbYXgsIGF5XVxuICAgICAgICAgICAgICAgICAgICB2YXIgYSA9IDAuMDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmeSA9IDA7IGZ5IDwgRl95OyBmeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBveSA9IHkgKyBmeTsgLy8gY29vcmRpbmF0ZXMgaW4gdGhlIG9yaWdpbmFsIGlucHV0IGFycmF5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ggPSB4ICsgZng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG95ID49IDAgJiYgb3kgPCBWX3kgJiYgb3ggPj0gMCAmJiBveCA8IFZfeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmZCA9IDA7IGZkIDwgRl9kOyBmZCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBBLndbYXgsIGF5LCBkXSArPSBmLndbIGZ4LCBmeSwgZmQgXSAqIFYud1sgb3gsIG95LCBmZCBdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBhICs9IGYudy5kWyhmeSAqIEZfeCArIGZ4KSAqIEZfZCArIGZkXSAqIFYudy5kWyhveSAqIFZfeCArIG94KSAqIFZfZCArIGZkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIEEudy5kWyhheSAqIEFfeCArIGF4KSAqIEFfZCArIGRdID0gYSArIGJpYXNlc1tkXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgQ29udm9sdXRpb25hbExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG4gICAgICAgIHZhciBBX3ggPSBBLnNpemUueCB8IDAsIEFfeSA9IEEuc2l6ZS55IHwgMCwgQV9kID0gQS5zaXplLmRlcHRoIHwgMDtcbiAgICAgICAgdmFyIFZfeCA9IFYuc2l6ZS54IHwgMCwgVl95ID0gVi5zaXplLnkgfCAwLCBWX2QgPSBWLnNpemUuZGVwdGggfCAwO1xuICAgICAgICB2YXIgRl94ID0gdGhpcy5maWx0ZXIueCB8IDAsIEZfeSA9IHRoaXMuZmlsdGVyLnkgfCAwLCBGX2QgPSB0aGlzLmZpbHRlci5kZXB0aCB8IDA7XG5cbiAgICAgICAgdmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcbiAgICAgICAgdmFyIGJpYXNlcyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuZDtcblxuICAgICAgICB2YXIgdjEgPSAwLCB2MiA9IDA7XG5cbiAgICAgICAgZm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuICAgICAgICAgICAgdmFyIGYgPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tkXTtcbiAgICAgICAgICAgIHZhciB4ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgIGZvciAodmFyIGF5ID0gMDsgYXkgPCBBX3k7IHkgKz0gc3RyaWRlLCBheSsrKSB7XG4gICAgICAgICAgICAgICAgeCA9IC10aGlzLnBhZCB8IDA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgeCArPSBzdHJpZGUsIGF4KyspIHtcblxuICAgICAgICAgICAgICAgICAgICAvLyBjb252b2x2ZSBjZW50ZXJlZCBhdCB0aGlzIGxvY2F0aW9uIFtheCwgYXldXG4gICAgICAgICAgICAgICAgICAgIHZhciBkQSA9IEEuZHcuZFsoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwO1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmeSA9IDA7IGZ5IDwgRl95OyBmeSsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBveSA9IHkgKyBmeTsgLy8gY29vcmRpbmF0ZXMgaW4gdGhlIG9yaWdpbmFsIGlucHV0IGFycmF5IGNvb3JkaW5hdGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3ggPSB4ICsgZng7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG95ID49IDAgJiYgb3kgPCBWX3kgJiYgb3ggPj0gMCAmJiBveCA8IFZfeCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmZCA9IDA7IGZkIDwgRl9kOyBmZCsrKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBmLmR3W2Z4LCBmeSwgZmRdICs9IFYud1tveCwgb3ksIGZkXSAqIEEuZHdbYXgsIGF5LCBkXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gVi5kd1tveCwgb3ksIGZkXSArPSBmLndbZngsIGZ5LCBmZF0gKiBBLmR3W2F4LCBheSwgZF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYxID0gKGZ5ICogRl94ICsgZngpICogRl9kICsgZmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB2MiA9IChveSAqIFZfeCArIG94KSAqIFZfZCArIGZkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZi5kdy5kW3YxXSArPSBWLncuZFt2Ml0qZEE7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWLmR3LmRbdjJdICs9IGYudy5kW3YxXSpkQTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGJpYXNlc1tkXSArPSBkQTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyogUG9vbGluZyBsYXllciwgc2VsZWN0IGJpZ2dlc3QgdmFsdWUgZnJvbSBjb252b2x1dGlvbiAqL1xuICAgIGZ1bmN0aW9uIFBvb2xpbmdMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5maWx0ZXIgPSBvcHQuZmlsdGVyO1xuICAgICAgICB0aGlzLnN0cmlkZSA9IG9wdC5zdHJpZGU7XG4gICAgICAgIHRoaXMucGFkID0gb3B0LnBhZDtcblxuICAgICAgICB2YXIgb3ggPSBNYXRoLmZsb29yKCh0aGlzLmluLnggKyB0aGlzLnBhZCAqIDIgLSB0aGlzLmZpbHRlci54KSAvIHRoaXMuc3RyaWRlICsgMSk7XG4gICAgICAgIHZhciBveSA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueSArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLnkpIC8gdGhpcy5zdHJpZGUgKyAxKTtcbiAgICAgICAgdGhpcy5vdXQgPSBsaWIuU2l6ZTMob3gsIG95LCB0aGlzLmluLmRlcHRoKTtcbiAgICB9O1xuXG4gICAgUG9vbGluZ0xheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgdmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuICAgICAgICB2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDA7IFxuXG4gICAgICAgIHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cbiAgICAgICAgZm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuICAgICAgICAgICAgdmFyIHggPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHtcbiAgICAgICAgICAgICAgICB4ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgbG9jYXRpb24gW2F4LCBheV1cbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbHYgPSAtTWF0aC5JbmZpbml0eSwgc2VseCA9IDAsIHNlbHk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBveCA9IDAsIG95ID0gMCwgcSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG95ID0geSArIGZ5OyAvLyBjb29yZGluYXRlcyBpbiB0aGUgb3JpZ2luYWwgaW5wdXQgYXJyYXkgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZ4ID0gMDsgZnggPCBGX3g7IGZ4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3kgPj0gMCAmJiBveSA8IFZfeSAmJiBveCA+PSAwICYmIG94IDwgVl94KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHEgPSBWLncuZFsob3kgKiBWX3ggKyBveCkgKiBWX2QgKyBkXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHEgPiBzZWx2KSB7IHNlbHYgPSBxOyBzZWx4ID0gb3g7IHNlbHkgPSBveTsgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBpeCA9IChheSAqIEFfeCArIGF4KSAqIEFfZCArIGQ7XG4gICAgICAgICAgICAgICAgICAgIEEucHhbaXhdID0gc2VseDtcbiAgICAgICAgICAgICAgICAgICAgQS5weVtpeF0gPSBzZWx5O1xuICAgICAgICAgICAgICAgICAgICBBLncuZFtpeF0gPSBzZWx2O1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBQb29saW5nTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcbiAgICAgICAgdmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuICAgICAgICB2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDA7IFxuXG4gICAgICAgIHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cbiAgICAgICAgZm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgYXkrKykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGF4ID0gMDsgYXggPCBBX3g7IGF4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGl4ID0gKGF5ICogQV94ICsgYXgpICogQV9kICsgZDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRBID0gQS5kdy5kW2l4XTtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VseCA9IEEucHhbaXhdOyBcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNlbHkgPSBBLnB5W2l4XTtcblxuICAgICAgICAgICAgICAgICAgICBWLmR3LmRbKHNlbHkgKiBWX3ggKyBzZWx4KSAqIFZfZCArIGRdID0gZEE7IC8vIG9ubHkgdHJhbnNmZXIgd2VpZ2h0cyBmcm9tIHNlbGVjdGVkIGxvY2F0aW9uc1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBQb29saW5nTGF5ZXIucHJvdG90eXBlLlByZXBhcmVTdGF0ZUJsb2IgPSBmdW5jdGlvbiAoQSkge1xuICAgICAgICBpZiAoQS5weCA9PT0gdW5kZWZpbmVkIHx8IEEucHkgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgQS5weCA9IGxpYi5NYXQuQ3JlYXRlQXJyYXkodGhpcy5vdXQuZGVwdGggKiB0aGlzLm91dC55ICogdGhpcy5vdXQueCwgMCwgJ1VpbnQxNkFycmF5Jyk7XG4gICAgICAgICAgICBBLnB5ID0gbGliLk1hdC5DcmVhdGVBcnJheSh0aGlzLm91dC5kZXB0aCAqIHRoaXMub3V0LnkgKiB0aGlzLm91dC54LCAwLCAnVWludDE2QXJyYXknKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIuQ29udm9sdXRpb25hbExheWVyID0gQ29udm9sdXRpb25hbExheWVyO1xuICAgIGxpYi5Qb29saW5nTGF5ZXIgPSBQb29saW5nTGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gaW5wdXQsIHNpemVcbiAgICAgKi9cbiAgICBmdW5jdGlvbiBEb3RMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5vdXQgPSBsaWIuU2l6ZTMoMSwgMSwgb3B0LnNpemUpO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgICBmaWx0ZXJzOiBbXSxcbiAgICAgICAgICAgIGJpYXNlczogbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMub3V0LmRlcHRoLCAwLjApXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5pbi5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIERvdExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHN1bSA9IDAuMDtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHN1bSArPSBWLncuZFtqXSAqIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgQS53LmRbaV0gPSBzdW0gKyB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncuZFtpXTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBEb3RMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZEEgPSBBLmR3LmRbaV07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5kdy5kW2pdICs9IFYudy5kW2pdICogZEE7XG4gICAgICAgICAgICAgICAgVi5kdy5kW2pdICs9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXSAqIGRBO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLmR3LmRbaV0gKz0gZEE7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliLkRvdExheWVyID0gRG90TGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIGZ1bmN0aW9uIERyb3BPdXRMYXllcihvcHQsIG5ldCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5uZXQgPSBuZXQ7XG4gICAgICAgIHRoaXMucHJvYmFiaWxpdHkgPSBvcHQucHJvYmFiaWxpdHkgfHwgMC4yNTtcbiAgICB9XG5cbiAgICBEcm9wT3V0TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICBpZiAoIXRoaXMubmV0LndlYWspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykgeyBBLncuZFtpXSA9IFYudy5kW2ldICogdGhpcy5wcm9iYWJpbGl0eTsgfSByZXR1cm4gO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoTWF0aC5yYW5kb20oKSA8IHRoaXMucHJvYmFiaWxpdHkpIHtcbiAgICAgICAgICAgICAgICBBLncuZFtpXSA9IDAuMDtcbiAgICAgICAgICAgICAgICBBLmRyb3BwZWRPdXRbaV0gPSB0cnVlO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBBLncuZFtpXSA9IFYudy5kW2ldO1xuICAgICAgICAgICAgICAgIEEuZHJvcHBlZE91dFtpXSA9IGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIERyb3BPdXRMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuICAgICAgICBpZiAoIXRoaXMubmV0LndlYWsgfHwgQS5kcm9wcGVkT3V0Lmxlbmd0aCAhPT0gdGhpcy5pbi5sZW5ndGgpIHJldHVybiA7XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZighQS5kcm9wcGVkT3V0W2ldKSB7XG4gICAgICAgICAgICAgICAgVi5kdy5kW2ldID0gQS5kdy5kW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIERyb3BPdXRMYXllci5wcm90b3R5cGUuUHJlcGFyZVN0YXRlQmxvYiA9IGZ1bmN0aW9uIChBKSB7XG4gICAgICAgIEEuZHJvcHBlZE91dCA9IFtdO1xuICAgIH07XG5cbiAgICBsaWIuRHJvcE91dExheWVyID0gRHJvcE91dExheWVyO1xuICAgIFxufSkobm5qcyk7IiwiKGZ1bmN0aW9uKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIGZ1bmN0aW9uIElucHV0TGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LnNpemU7XG4gICAgICAgIHRoaXMuc2NhbGUgPSBvcHQuc2NhbGUgfHwgMS4wO1xuICAgICAgICB0aGlzLmJpYXMgPSBvcHQuYmlhcyB8fCAwLjA7XG4gICAgfTtcblxuICAgIElucHV0TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbihWLCBBKSB7XG4gICAgICAgIEEudy5jb3B5KFYsIHRoaXMuc2NhbGUsIHRoaXMuYmlhcyk7XG4gICAgfTtcblxuICAgIElucHV0TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24oQSwgVikge307XG5cbiAgICBsaWIuSW5wdXRMYXllciA9IElucHV0TGF5ZXI7XG59KShubmpzKTtcbiIsIihmdW5jdGlvbihsaWIpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIGZ1bmN0aW9uIHNpZ20oeCkge1xuICAgICAgICByZXR1cm4gMS4wIC8gKDEuMCArIE1hdGguZXhwKC14KSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHNpZ20oeSkge1xuICAgICAgICByZXR1cm4geSAqICgxIC0geSk7XG4gICAgfVxuXG4gICAgLy8gc2VlIGh0dHA6Ly9wZW9wbGUuaWRzaWEuY2gvfmp1ZXJnZW4vbHN0bS9zbGQwMTkuaHRtXG4gICAgZnVuY3Rpb24gTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5pbnB1dDsgLy8gMSB0byAxIG1hcHBpbmdcblxuICAgICAgICB0aGlzLnJlY3VycmVudCA9IHRydWU7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIGZpbHRlcnM6IFtdLFxuICAgICAgICAgICAgYmlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5vdXQuZGVwdGgsIDAuMClcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldID0gbmV3IGxpYi5CbG9iKDEsIDEsIDksIDAsIDAuMDgpO1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kWzJdID0gLTE7IC8vIGF0IGJlZ2lubmluZyBuZWdhdGl2ZSBwZWVwaG9sZSBjb25uZWN0aW9uc1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kWzVdID0gLTE7IC8vIHRvIG1pbmltaXplIGV4cGxvZGluZ1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kWzhdID0gLTE7IC8vIGNlbGwgc3RhdGVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5iaWFzZXMgPSBuZXcgbGliLkJsb2IoMSwgdGhpcy5pbi5sZW5ndGgsIDMsIDAuMCk7XG4gICAgfTtcblxuICAgIExvbmdTaG9ydFRlcm1NZW1vcnlMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uKFYsIEEpIHtcbiAgICAgICAgdmFyIGJpYXMgPSB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncuZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBhcmFtID0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kO1xuXG4gICAgICAgICAgICB2YXIgeCA9IFYudy5kW2ldO1xuICAgICAgICAgICAgdmFyIGhfID0gQS5wcmV2LncuZFtpXTtcbiAgICAgICAgICAgIHZhciBjXyA9IEEucHJldi5sc3RtLmNlbGxzLncuZFtpXTtcblxuICAgICAgICAgICAgdmFyIGlnID0gc2lnbSh4ICogcGFyYW1bMF0gKyBoXyAqIHBhcmFtWzFdICsgY18gKiBwYXJhbVsyXSArIGJpYXNbaSAqIDMgKyAwXSk7XG4gICAgICAgICAgICB2YXIgZmcgPSBzaWdtKHggKiBwYXJhbVszXSArIGhfICogcGFyYW1bNF0gKyBjXyAqIHBhcmFtWzVdICsgYmlhc1tpICogMyArIDFdKTtcbiAgICAgICAgICAgIHZhciBjID0gaWcgKiB4ICsgZmcgKiBjXztcbiAgICAgICAgICAgIHZhciBvZyA9IHNpZ20oeCAqIHBhcmFtWzZdICsgaF8gKiBwYXJhbVs3XSArIGMgICogcGFyYW1bOF0gKyBiaWFzW2kgKiAzICsgMl0pO1xuICAgICAgICAgICAgdmFyIGggPSBvZyAqIGM7XG5cbiAgICAgICAgICAgIEEubHN0bS5nYXRlcy5pbi5kW2ldID0gaWc7XG4gICAgICAgICAgICBBLmxzdG0uZ2F0ZXMuZm9yZ2V0LmRbaV0gPSBmZztcbiAgICAgICAgICAgIEEubHN0bS5nYXRlcy5vdXQuZFtpXSA9IG9nO1xuXG4gICAgICAgICAgICBBLmxzdG0uY2VsbHMudy5kW2ldID0gYztcbiAgICAgICAgICAgIEEudy5kW2ldID0gaDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24oQSwgVikge1xuICAgICAgICB2YXIgQklBUyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXM7XG4gICAgICAgIHZhciBiaWFzID0gQklBUy53LmQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBQQVJBTSA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldO1xuICAgICAgICAgICAgdmFyIHBhcmFtID0gUEFSQU0udy5kO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgaWcgPSBBLmxzdG0uZ2F0ZXMuaW4uZFtpXTtcbiAgICAgICAgICAgIHZhciBmZyA9IEEubHN0bS5nYXRlcy5mb3JnZXQuZFtpXTtcbiAgICAgICAgICAgIHZhciBvZyA9IEEubHN0bS5nYXRlcy5vdXQuZFtpXTtcbiAgICAgICAgICAgIHZhciBjID0gQS5sc3RtLmNlbGxzLncuZFtpXTtcblxuICAgICAgICAgICAgdmFyIHggPSBWLncuZFtpXTtcbiAgICAgICAgICAgIHZhciBoXyA9IEEucHJldi53LmRbaV07XG4gICAgICAgICAgICB2YXIgY18gPSBBLnByZXYubHN0bS5jZWxscy53LmRbaV07XG5cbiAgICAgICAgICAgIHZhciBkaCA9IEEuZHcuZFtpXTtcbiAgICAgICAgICAgIHZhciBkYyA9IEEubHN0bS5jZWxscy5kdy5kW2ldO1xuXG4gICAgICAgICAgICB2YXIgZG9nID0gZHNpZ20ob2cpICogYyAqIGRoO1xuICAgICAgICAgICAgICAgIGRjID0gZGMgKyBwYXJhbVs4XSAqIGRvZyArIG9nICogZGg7XG4gICAgICAgICAgICB2YXIgZGZnID0gZHNpZ20oZmcpICogY18gKiBkYztcbiAgICAgICAgICAgIHZhciBkaWcgPSBkc2lnbShpZykgKiB4ICogZGM7XG4gICAgICAgICAgICB2YXIgZHggPSBpZyAqIGRjICsgcGFyYW1bNl0gKiBkb2cgKyBwYXJhbVszXSAqIGRmZyArIHBhcmFtWzBdICogZGlnO1xuXG4gICAgICAgICAgICB2YXIgZGNfID0gZmcgKiBkYyArIHBhcmFtWzVdICogZGZnICsgcGFyYW1bMl0gKiBkaWc7XG4gICAgICAgICAgICB2YXIgZGhfID0gcGFyYW1bN10gKiBkb2cgKyBwYXJhbVs0XSAqIGRmZyArIHBhcmFtWzFdICogZGlnO1xuXG4gICAgICAgICAgICBBLnByZXYubHN0bS5jZWxscy5kdy5kW2ldID0gZGNfO1xuICAgICAgICAgICAgQS5wcmV2LmR3LmRbaV0gKz0gZGhfOyAvLyBhZGQgdG8gYWxyZWFkeSBiYWNrcHJvcHBlZCB2YWx1ZVxuICAgICAgICAgICAgVi5kdy5kW2ldID0gZHg7XG5cbiAgICAgICAgICAgIFBBUkFNLmR3LmRbMF0gKz0geCAqIGRpZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbMV0gKz0gaF8gKiBkaWc7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzJdICs9IGNfICogZGlnO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFszXSArPSB4ICogZGZnO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFs0XSArPSBoXyAqIGRmZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbNV0gKz0gY18gKiBkZmc7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzZdICs9IHggKiBkb2c7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzddICs9IGhfICogZG9nO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFs4XSArPSBjICogZG9nO1xuXG4gICAgICAgICAgICBCSUFTLmR3LmRbaSAqIDMgKyAwXSArPSAxLjAgKiBkaWc7XG4gICAgICAgICAgICBCSUFTLmR3LmRbaSAqIDMgKyAxXSArPSAxLjAgKiBkZmc7XG4gICAgICAgICAgICBCSUFTLmR3LmRbaSAqIDMgKyAyXSArPSAxLjAgKiBkb2c7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyLnByb3RvdHlwZS5QcmVwYXJlU3RhdGVCbG9iID0gZnVuY3Rpb24oQSkge1xuICAgICAgICBpZiAodHlwZW9mIEEuc3RhdGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBBLmxzdG0gPSB7XG4gICAgICAgICAgICAgICAgY2VsbHM6IG5ldyBsaWIuQmxvYih0aGlzLm91dC54LCB0aGlzLm91dC55LCB0aGlzLm91dC5kZXB0aCwgMC4wKSxcbiAgICAgICAgICAgICAgICBnYXRlczogeyBpbiA6IG5ldyBsaWIuTWF0KHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApLFxuICAgICAgICAgICAgICAgICAgICBvdXQ6IG5ldyBsaWIuTWF0KHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApLFxuICAgICAgICAgICAgICAgICAgICBmb3JnZXQ6IG5ldyBsaWIuTWF0KHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEEubHN0bS5jZWxscy53LmFsbCgwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIuTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyID0gTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyO1xufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcbiAgICBmdW5jdGlvbiBTaWdtb2lkTGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LmlucHV0O1xuICAgIH07XG5cbiAgICBTaWdtb2lkTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIEEudy5kW2ldID0gMS4wLygxLjArTWF0aC5leHAoLVYudy5kW2ldKSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBTaWdtb2lkTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBWLmR3LmRbaV0gPSBBLncuZFtpXSAqICgtQS53LmRbaV0gKyAxLjApICogQS5kdy5kW2ldO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIFJlbHVMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG4gICAgfTtcblxuICAgIFJlbHVMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgQS53LmRbaV0gPSBWLncuZFtpXSA8IDAgPyAwIDogVi53LmRbaV07XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBSZWx1TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZihBLncuZFtpXSA8PSAwKSBWLmR3LmRbaV0gPSAwOyAvLyB0aHJlc2hvbGRcbiAgICAgICAgICAgIGVsc2UgVi5kdy5kW2ldID0gQS5kdy5kW2ldO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIFRhbmhMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG4gICAgfTtcblxuICAgIFRhbmhMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgQS53LmRbaV0gPSBsaWIuTWF0aFUudGFuaChWLncuZFtpXSk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBUYW5oTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBWLmR3LmRbaV0gPSAoMS4wIC0gQS53LmRbaV0gKiBBLncuZFtpXSkgKiBBLmR3LmRbaV07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbGliLlNpZ21vaWRMYXllciA9IFNpZ21vaWRMYXllcjtcbiAgICBsaWIuUmVsdUxheWVyID0gUmVsdUxheWVyO1xuICAgIGxpYi5UYW5oTGF5ZXIgPSBUYW5oTGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIGZ1bmN0aW9uIFJlZ3Jlc3Npb25MYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG4gICAgfTtcblxuICAgIFJlZ3Jlc3Npb25MYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG4gICAgICAgIEEudy53cml0ZShWLncpO1xuICAgIH07XG5cbiAgICBSZWdyZXNzaW9uTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYsIGRlc2lyZWQpIHtcbiAgICAgICAgdmFyIGxvc3MgPSAwLjA7XG4gICAgICAgIGlmKGRlc2lyZWQgaW5zdGFuY2VvZiBBcnJheSB8fCBkZXNpcmVkIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB7XG4gICAgICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgICAgICBWLmR3LmRbaV0gPSBBLncuZFtpXSAtIGRlc2lyZWRbaV07XG4gICAgICAgICAgICAgICAgbG9zcyArPSAwLjUqVi5kdy5kW2ldKlYuZHcuZFtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsb3NzO1xuICAgIH07XG5cbiAgICBsaWIuUmVncmVzc2lvbkxheWVyID0gUmVncmVzc2lvbkxheWVyO1xuXG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIGZ1bmN0aW9uIFNvZnRtYXhMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5vdXQgPSBsaWIuU2l6ZTMoMSwgMSwgdGhpcy5pbi54ICogdGhpcy5pbi55ICogdGhpcy5pbi5kZXB0aCk7XG4gICAgICAgIHRoaXMuY2xhc3NlcyA9IHRoaXMub3V0LmRlcHRoO1xuICAgIH07XG5cbiAgICBTb2Z0bWF4TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICAvLyBjb21wdXRlIG1heCBhY3RpdmF0aW9uXG4gICAgICAgIHZhciBhbWF4ID0gVi53LmRbMF07XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcbiAgICAgICAgICAgIGlmKFYudy5kW2ldID4gYW1heCkgYW1heCA9IFYudy5kW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gY29tcHV0ZSBleHBvbmVudGlhbHMgKGNhcmVmdWxseSB0byBub3QgYmxvdyB1cClcbiAgICAgICAgdmFyIGVzID0gbGliLk1hdC5DcmVhdGVBcnJheSh0aGlzLm91dC5kZXB0aCwgMC4wKSwgZXN1bSA9IDAuMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuICAgICAgICAgICAgdmFyIGUgPSBNYXRoLmV4cChWLncuZFtpXSAtIGFtYXgpO1xuICAgICAgICAgICAgZXN1bSArPSBlO1xuICAgICAgICAgICAgZXNbaV0gPSBlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbm9ybWFsaXplIGFuZCBvdXRwdXQgdG8gc3VtIHRvIG9uZVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2xhc3NlczsgaSsrKSB7XG4gICAgICAgICAgICBlc1tpXSAvPSBlc3VtO1xuICAgICAgICAgICAgQS53LmRbaV0gPSBlc1tpXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBBLncubWF4aSgpO1xuICAgIH07XG5cbiAgICBTb2Z0bWF4TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYsIGRlc2lyZWQpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuICAgICAgICAgICAgdmFyIGluZGljYXRvciA9IGkgPT09IGRlc2lyZWQgPyAxLjAgOiAwLjA7XG4gICAgICAgICAgICBWLmR3LmRbaV0gPSBBLncuZFtpXSAtIGluZGljYXRvcjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGxvc3MgaXMgdGhlIGNsYXNzIG5lZ2F0aXZlIGxvZyBsaWtlbGlob29kXG4gICAgICAgIHJldHVybiAtTWF0aC5sb2coQS53LmRbZGVzaXJlZF0pO1xuICAgIH07XG5cbiAgICAvKiBhcHByb3guIDMwMHggZmFzdGVyIHRoYW4gc29mdG1heCwgZGVjcmVhc2UgaW4gYWNjdXJhY3kgYW5kIHBlcmZvcm1hbmNlICovXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9IHRyZWUgW29iamVjdF0gb3IgY2xhc3NlcyBbaW50XVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIEhpZXJhcmNoaWNhbFNvZnRtYXgob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cbiAgICAgICAgaWYgKG9wdC50cmVlKSB7XG4gICAgICAgICAgICB0aGlzLnRyZWUgPSBvcHQudHJlZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudHJlZSA9IHRoaXMuQnVpbGRUcmVlKG9wdC5jbGFzc2VzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuUHJlcGFyZVRyZWUoKTtcblxuICAgICAgICBhc3NlcnQob3B0LmNsYXNzZXMgPT09IHVuZGVmaW5lZCB8fCAob3B0LmNsYXNzZXMgPT09IHRoaXMuY2xhc3NlcyksICdIaWVyYXJjaGljYWxTb2Z0bWF4OiB0cmVlIG5vdCBzdXBwb3J0ZWQnKTtcblxuICAgICAgICB0aGlzLm5vZGVzID0gdGhpcy5jbGFzc2VzIC0gMTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgICAgICAgZmlsdGVyczogW10sXG4gICAgICAgICAgICBiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLm5vZGVzLCAwLjApXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5vZGVzOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldID0gbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMuaW4ubGVuZ3RoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVIgPSAwO1xuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IgPSAxO1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuQnVpbGRUcmVlID0gZnVuY3Rpb24gKGNsYXNzZXMpIHtcbiAgICAgICAgLy8gY3JlYXRlIHRyZWUgb2Ygc2l6ZSBsb2coY2xhc3NlcylcbiAgICAgICAgdmFyIGRlcHRoID0gTWF0aC5mbG9vcihNYXRoLmxvZzIoY2xhc3NlcykpO1xuICAgICAgICB2YXIgdHJlZSA9IHRoaXMuQ3JlYXRlTm9kZShkZXB0aCwgbnVsbCk7XG5cbiAgICAgICAgLy8gYWRkIHJlbWFpbmluZyBub2RlcyB0byB0cmVlXG4gICAgICAgIHZhciByZW1haW5kZXIgPSBjbGFzc2VzIC0gTWF0aC5wb3coMiwgZGVwdGgpO1xuICAgICAgICB0aGlzLnRyYXZlcnNlKHRyZWUsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SICYmIHJlbWFpbmRlciA+IDApIHtcbiAgICAgICAgICAgICAgICBub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVI7XG4gICAgICAgICAgICAgICAgbm9kZS5hID0gdGhpcy5DcmVhdGVOb2RlKDAsIG5vZGUpO1xuICAgICAgICAgICAgICAgIG5vZGUuYiA9IHRoaXMuQ3JlYXRlTm9kZSgwLCBub2RlKTtcblxuICAgICAgICAgICAgICAgIHJlbWFpbmRlci0tO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIHRyZWU7XG4gICAgfTsgXG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5QcmVwYXJlVHJlZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHNlbCA9IDAsIHB0ciA9IDAsIHRhYmxlID0ge307XG4gICAgICAgIHRoaXMudHJhdmVyc2UodGhpcy50cmVlLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUikge1xuICAgICAgICAgICAgICAgIHRhYmxlW3NlbF0gPSBub2RlO1xuICAgICAgICAgICAgICAgIG5vZGUuaW5kZXggPSBzZWw7XG4gICAgICAgICAgICArK3NlbDt9XG5cbiAgICAgICAgICAgIGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5pbmRleCA9IHB0cjtcbiAgICAgICAgICAgIHB0cisrO31cblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHRoaXMuY2xhc3NlcyA9IHNlbDtcbiAgICAgICAgdGhpcy5ub2RlcyA9IHB0cjtcbiAgICAgICAgdGhpcy50YWJsZSA9IHRhYmxlO1xuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5DcmVhdGVOb2RlID0gZnVuY3Rpb24gKGRlcHRoLCBwYXJlbnQpIHtcbiAgICAgICAgdmFyIG5vZGUgPSB7IHBhcmVudDogcGFyZW50IH07XG5cbiAgICAgICAgaWYgKGRlcHRoIDw9IDApIHtcbiAgICAgICAgICAgIG5vZGUudHlwZSA9IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1I7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVI7XG4gICAgICAgICAgICBub2RlLmEgPSB0aGlzLkNyZWF0ZU5vZGUoZGVwdGgtMSwgbm9kZSk7XG4gICAgICAgICAgICBub2RlLmIgPSB0aGlzLkNyZWF0ZU5vZGUoZGVwdGgtMSwgbm9kZSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZTtcbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUudHJhdmVyc2UgPSBmdW5jdGlvbiAobm9kZSwgY2IpIHtcbiAgICAgICAgaWYgKGNiLmNhbGwodGhpcywgbm9kZSkgJiYgbm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVIpIHtcbiAgICAgICAgICAgIHRoaXMudHJhdmVyc2Uobm9kZS5hLCBjYik7XG4gICAgICAgICAgICB0aGlzLnRyYXZlcnNlKG5vZGUuYiwgY2IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmFzY2VuZCA9IGZ1bmN0aW9uIChub2RlLCBjYikge1xuICAgICAgICBpZiAobm9kZS5wYXJlbnQgPT09IG51bGwpIHJldHVybiA7XG4gICAgICAgIGNiLmNhbGwodGhpcywgbm9kZS5wYXJlbnQsIG5vZGUgPT09IG5vZGUucGFyZW50LmEgPyAtMS4wIDogMS4wKTtcbiAgICAgICAgdGhpcy5hc2NlbmQobm9kZS5wYXJlbnQsIGNiKTtcbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuZGVzY2VuZCA9IGZ1bmN0aW9uIChub2RlLCBjYikge1xuICAgICAgICB2YXIgZCA9IGNiLmNhbGwodGhpcywgbm9kZSk7XG5cbiAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUiB8fCBkIGluc3RhbmNlb2YgT2JqZWN0IHx8IGQgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiBkO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGQgPiAwLjApIHsgLy8gbmVnYXRpdmUgbWVhbnMgbGVmdCwgcG9zaXRpdmUgbWVhbnMgcmlnaHRcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlc2NlbmQobm9kZS5iLCBjYik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5kZXNjZW5kKG5vZGUuYSwgY2IpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gKFYsIGkpIHtcbiAgICAgICAgdmFyIHN1bSA9IDAuMDtcbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICBzdW0gKz0gVi53LmRbal0gKiB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbal07XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbGliLk1hdGhVLnRhbmgodGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmRbaV0gKyBzdW0pO1xuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5ncmFkaWVudCA9IGZ1bmN0aW9uIChWLCBpLCBkaXJlY3Rpb24pIHtcbiAgICAgICAgdmFyIGFjdCA9IHRoaXMuYWN0aXZhdGUoViwgaSksXG4gICAgICAgICAgICAgICAgZXJyID0gYWN0IC0gZGlyZWN0aW9uO1xuXG4gICAgICAgIHZhciBkdyA9ICgxLjAgLSBhY3QgKiBhY3QpICogZXJyO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5ub2NoYW5nZSA9IGZhbHNlO1xuXG4gICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFtqXSArPSBWLncuZFtqXSAqIGR3O1xuICAgICAgICAgICAgVi5kdy5kW2pdICs9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXSAqIGR3O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kW2ldICs9IGR3O1xuXG4gICAgICAgIHJldHVybiAoZGlyZWN0aW9uIDwgMCA/IDEgLSAoYWN0ICogMC41ICsgMC41KSA6IChhY3QgKiAwLjUgKyAwLjUpKTsgLy8gcHJvYmFiaWxpdHkgdG8gZ28gdGhlIHJpZ2h0IHdheVxuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgdmFyIHNlbGVjdGVkID0gdGhpcy5kZXNjZW5kKHRoaXMudHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuICAgICAgICAgICAgICAgIHJldHVybiB0aGlzLmFjdGl2YXRlKFYsIG5vZGUuaW5kZXgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBlbHNlIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gbm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAoQS5pbmRleCA9IHNlbGVjdGVkLmluZGV4KTtcbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgViwgZGVzaXJlZCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5ub2NoYW5nZSA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgcHJvYiA9IDEuMDtcbiAgICAgICAgdGhpcy5hc2NlbmQodGhpcy50YWJsZVtkZXNpcmVkXSwgZnVuY3Rpb24gKG5vZGUsIGRpcmVjdGlvbikge1xuICAgICAgICAgICAgcHJvYiA9IHByb2IgKiB0aGlzLmdyYWRpZW50KFYsIG5vZGUuaW5kZXgsIGRpcmVjdGlvbik7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiAxLjAgLSBwcm9iOyAvLyBwcm9iYWJpbGl0eSB0byBOT1QgZ28gdGhlIHJpZ2h0IHdheVxuICAgIH07XG5cbiAgICBsaWIuU29mdG1heExheWVyID0gU29mdG1heExheWVyO1xuICAgIGxpYi5IaWVyYXJjaGljYWxTb2Z0bWF4ID0gSGllcmFyY2hpY2FsU29mdG1heDtcbn0pKG5uanMpOyIsIihmdW5jdGlvbihsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiB3aW5kb3cgIT09ICd1bmRlZmluZWQnKSB7IC8vIHdlYiB3b3JrZXIgc3VwcG9ydDsganVzdCB1c2Ugbm5qcyBpbiB3ZWIgd29ya2VyXG4gICAgICAgICAgICB3aW5kb3cubm4gPSBsaWI7XG4gICAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGxpYjtcbiAgICB9XG4gICAgXG59KShubmpzKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
