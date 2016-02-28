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

    Layer.activation = [ 'tanh', 'sigmoid', 'relu' ];

    function NetworkStructure(desc, net) {
        this.net = net;
        this.description = desc;
        this.recurrent = false;

        this.Build();
    };

    NetworkStructure.prototype.Build = function () {
        var L = null;
        this.list = [];

        for (var i = 0; i < this.description.length; i++) {
            var descriptor = this.description[i];

            if (L != null) {
                descriptor.input = L.out; // set input to this layer to the output of last layer
            }
            
            this.list.push(L = Layer(descriptor, this.net));
            this.recurrent = this.recurrent || L.recurrent;

            if (descriptor.activation !== undefined && Layer.activation.indexOf(descriptor.activation) != -1) {
                this.list.push(L = Layer({ type: descriptor.activation, input: L.out }, this.net));
            }
        }

        this.length = this.list.length;
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5uLmluaXQuanMiLCJubi5tYXRoLmpzIiwiYXBpL25ldHdvcmsubm4uanMiLCJhcGkvd2Vid29ya2VyLm5uLmpzIiwibGF5ZXJzL2NvbnZvbHV0aW9uYWwubm4uanMiLCJsYXllcnMvZG90Lm5uLmpzIiwibGF5ZXJzL2Ryb3BvdXQubm4uanMiLCJsYXllcnMvaW5wdXQubm4uanMiLCJsYXllcnMvbHN0bS5ubi5qcyIsImxheWVycy9ub24tbGluZWFyLm5uLmpzIiwibGF5ZXJzL3JlZ3Jlc3Npb24ubm4uanMiLCJsYXllcnMvc29mdG1heC5ubi5qcyIsIm5uLmV4cG9ydC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDN0tBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibm4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgbm5qcyA9IHt9O1xuXG4vLyBVdGlsaXR5IGZ1blxuZnVuY3Rpb24gYXNzZXJ0KGNvbmRpdGlvbiwgbWVzc2FnZSkge1xuICAgIC8vIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNTMxMzQxOC9qYXZhc2NyaXB0LWFzc2VydFxuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiQXNzZXJ0aW9uIGZhaWxlZFwiO1xuICAgICAgICBpZiAodHlwZW9mIEVycm9yICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbWVzc2FnZTsgLy8gRmFsbGJhY2tcbiAgICB9XG59XG5cbihmdW5jdGlvbigpIHtcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICB2YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gICAgdmFyIGlzQXJyYXkgPSBmdW5jdGlvbiBpc0FycmF5KGFycikge1xuICAgICAgICBpZiAodHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGFycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9TdHIuY2FsbChhcnIpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG5cbiAgICB2YXIgaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqKSB7XG4gICAgICAgIGlmICghb2JqIHx8IHRvU3RyLmNhbGwob2JqKSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBoYXNPd25Db25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG4gICAgICAgIHZhciBoYXNJc1Byb3RvdHlwZU9mID0gb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgJiYgaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcbiAgICAgICAgLy8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuICAgICAgICBpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNPd25Db25zdHJ1Y3RvciAmJiAhaGFzSXNQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3duIHByb3BlcnRpZXMgYXJlIGVudW1lcmF0ZWQgZmlyc3RseSwgc28gdG8gc3BlZWQgdXAsXG4gICAgICAgIC8vIGlmIGxhc3Qgb25lIGlzIG93biwgdGhlbiBhbGwgcHJvcGVydGllcyBhcmUgb3duLlxuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHsgLyoqLyB9XG5cbiAgICAgICAgcmV0dXJuIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgICAgICB2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmU7XG4gICAgICAgIHZhciB0YXJnZXQgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIHZhciBpID0gMTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIHZhciBkZWVwID0gZmFsc2U7XG5cbiAgICAgICAgLy8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuICAgICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBkZWVwID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuICAgICAgICAgICAgLy8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuICAgICAgICAgICAgaSA9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB0YXJnZXQgIT09ICdvYmplY3QnICYmIHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicpIHx8IHRhcmdldCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuICAgICAgICAgICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYyA9IHRhcmdldFtuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgY29weSA9IG9wdGlvbnNbbmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBuZXZlci1lbmRpbmcgbG9vcFxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0ICE9PSBjb3B5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWVwICYmIGNvcHkgJiYgKGlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gaXNBcnJheShjb3B5KSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcHlJc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlJc0FycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5ldmVyIG1vdmUgb3JpZ2luYWwgb2JqZWN0cywgY2xvbmUgdGhlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb3B5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGNvcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICBPYmplY3QuZXh0ZW5kID0gZXh0ZW5kO1xufSkoKTtcbiIsIihmdW5jdGlvbihsaWIpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgbWF0aCA9IHtcbiAgICAgICAgZ2F1c3NfOiB7IGE6IGZhbHNlLCBiOiAwLjAgfSxcbiAgICAgICAgZ2F1c3M6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKG1hdGguZ2F1c3NfLmEpIHsgbWF0aC5nYXVzc18uYSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHJldHVybiBtYXRoLmdhdXNzXy5iOyB9XG4gICAgICAgICAgICB2YXIgdSA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcbiAgICAgICAgICAgIHZhciB2ID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuICAgICAgICAgICAgdmFyIHIgPSB1ICogdSArIHYgKiB2O1xuICAgICAgICAgICAgaWYgKHIgPT0gMCB8fCByID4gMSkgcmV0dXJuIG1hdGguZ2F1c3MoKTtcbiAgICAgICAgICAgIHZhciBjID0gTWF0aC5zcXJ0KC0yICogTWF0aC5sb2cocikgLyByKTtcbiAgICAgICAgICAgIG1hdGguZ2F1c3NfLmIgPSB2ICogYzsgLy8gY2FjaGUgdGhpc1xuICAgICAgICAgICAgbWF0aC5nYXVzc18uYSA9IHRydWU7XG4gICAgICAgICAgICByZXR1cm4gdSAqIGM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmFuZGY6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLnJhbmRvbSgpICogKGIgLSBhKSArIGE7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmFuZGk6IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICAgIHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiAoYiAtIGEpICsgYSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmFuZG46IGZ1bmN0aW9uKG11LCBzdGQpIHtcbiAgICAgICAgICAgIHJldHVybiBtdSArIG1hdGguZ2F1c3MoKSAqIHN0ZDtcbiAgICAgICAgfSxcblxuICAgICAgICB0YW5oOiB0eXBlb2YgTWF0aC50YW5oID09PSBcInVuZGVmaW5lZFwiID8gZnVuY3Rpb24oeCkge1xuICAgICAgICAgICAgdmFyIHkgPSBNYXRoLmV4cCgyICogeCk7XG4gICAgICAgICAgICByZXR1cm4gKHkgLSAxKSAvICh5ICsgMSk7IH0gOiBNYXRoLnRhbmhcbiAgICB9O1xuXG4gICAgLy9cbiAgICAvL1xuICAgIC8vXG4gICAgZnVuY3Rpb24gU2l6ZTIoeCwgeSkge1xuICAgICAgICByZXR1cm4geyB4OiB4LCB5OiB5LCBsZW5ndGg6IHggKiB5IH07XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIFNpemUzKHgsIHksIHopIHtcbiAgICAgICAgcmV0dXJuIHsgeDogeCwgeTogeSwgZGVwdGg6IHosIGxlbmd0aDogeCAqIHkgKiB6IH07XG4gICAgfTtcblxuXG4gICAgLy9cbiAgICAvL1xuICAgIC8vXG4gICAgZnVuY3Rpb24gTWF0KHgsIHksIHosIHYpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbGliLlNpemUzKHgsIHksIHopO1xuICAgICAgICB0aGlzLmQgPSBNYXQuQ3JlYXRlQXJyYXkoeCAqIHkgKiB6LCB2ID09PSB1bmRlZmluZWQgPyAwLjAgOiB2LCAnRmxvYXQ2NEFycmF5Jyk7XG4gICAgfTtcblxuICAgIE1hdC5DcmVhdGVBcnJheSA9IGZ1bmN0aW9uKGxlbmd0aCwgdiwgdCkge1xuICAgICAgICB2YXIgYXJyID0gbnVsbDtcblxuICAgICAgICB2ID0gdiB8fCAwO1xuICAgICAgICB0ID0gdCB8fCAnRmxvYXQ2NEFycmF5JztcblxuICAgICAgICBpZiAodHlwZW9mIEFycmF5QnVmZmVyID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgYXJyID0gbmV3IEFycmF5KGxlbmd0aCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBhcnIgPSBldmFsKCduZXcgJyArIHQgKyAnKGxlbmd0aCknKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHsgYXJyW2ldID0gdjsgfVxuICAgICAgICByZXR1cm4gYXJyO1xuICAgIH07XG5cbiAgICBNYXQuY29weSA9IGZ1bmN0aW9uKG1hdCkge1xuICAgICAgICB2YXIgbWF0XyA9IG5ldyBtYXQobWF0LnNpemUueCwgbWF0LnNpemUueSwgbWF0LnNpemUuZGVwdGgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IG1hdC5kLmxlbmd0aDsgaSsrKSB7IG1hdF8uZFtpXSA9IG1hdC5kW2ldOyB9XG4gICAgICAgIHJldHVybiBtYXRfO1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLm1heGkgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIGogPSAwLCBtID0gLUluZmluaXR5OyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5kW2ldID4gbSkge1xuICAgICAgICAgICAgICAgIGogPSBpLCBtID0gdGhpcy5kW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGo7XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24oeCwgeSwgeikge1xuICAgICAgICByZXR1cm4gdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHpdO1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLnNldCA9IGZ1bmN0aW9uKHgsIHksIHosIHYpIHtcbiAgICAgICAgdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHpdID0gdjtcbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbih4LCB5LCB6LCB2KSB7XG4gICAgICAgIHRoaXMuZFsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyB6XSArPSB2O1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uKHYpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gdjsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbihhLCBzLCBiKSB7XG4gICAgICAgIGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAxO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBhW2ldIC8gcyArIGI7IH1cbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS53cml0ZSA9IGZ1bmN0aW9uKGEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gYS5kW2ldOyB9XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUucmFuZGYgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IG1hdGgucmFuZGYoYSwgYik7IH1cbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5yYW5kbiA9IGZ1bmN0aW9uKHNjYWxlKSB7XG4gICAgICAgIHNjYWxlID0gc2NhbGUgfHwgTWF0aC5zcXJ0KDEuMCAvICh0aGlzLnNpemUueCAqIHRoaXMuc2l6ZS55ICogdGhpcy5zaXplLmRlcHRoKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IG1hdGgucmFuZG4oMC4wLCBzY2FsZSk7IH1cbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gbWF0LmNvcHkodGhpcyk7XG4gICAgfTtcblxuXG5cbiAgICBNYXQucHJvdG90eXBlLlRvSW1hZ2VEYXRhQnVmZmVyID0gZnVuY3Rpb24gKGRpbSwgYWxwaGEpIHtcbiAgICAgICAgaWYgKCFpc05hTihkKSlcbiAgICAgICAgICAgIGRpbSA9IFsgZGltLCBkaW0sIGRpbSBdO1xuXG4gICAgICAgIGlmIChkaW0ubGVuZ3RoID09IDQpIFxuICAgICAgICAgICAgYWxwaGEgPSAtMTtcblxuICAgICAgICBhbHBoYSA9IGFscGhhIHx8IDI1NTtcblxuICAgICAgICB2YXIgbGVuID0gdGhpcy5zaXplLnggKiB0aGlzLnNpemUueTtcbiAgICAgICAgdmFyIGJ1ZmZlciA9IG5ldyBVaW50OENsYW1wZWRBcnJheShsZW4gKiA0KTtcbiAgICAgICAgZm9yICh2YXIgeSA9IDA7IHkgPCB0aGlzLnNpemUueTsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciB4ID0gMDsgeCA8IHRoaXMuc2l6ZS54OyB4KyspIHtcbiAgICAgICAgICAgICAgICBidWZmZXJbKHkgKiB0aGlzLnNpemUueCArIHgpICogNCArIDBdID0gdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIGRpbVswXV07XG4gICAgICAgICAgICAgICAgYnVmZmVyWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIDQgKyAxXSA9IHRoaXMuZFsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyBkaW1bMV1dO1xuICAgICAgICAgICAgICAgIGJ1ZmZlclsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiA0ICsgMl0gPSB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgZGltWzJdXTtcbiAgICAgICAgICAgICAgICBidWZmZXJbKHkgKiB0aGlzLnNpemUueCArIHgpICogNCArIDNdID0gYWxwaGEgPCAwID8gdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIGRpbVszXV0gOiBhbHBoYTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBidWZmZXI7XG4gICAgfTtcblxuICAgIC8vIGFjY2Vzc29yXG4gICAgLy8gWyAoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyB6IF1cblxuXG4gICAgZnVuY3Rpb24gQmxvYih4LCB5LCB6LCBhLCBiKSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IGxpYi5TaXplMyh4LCB5LCB6KTtcbiAgICAgICAgdGhpcy53ID0gbmV3IE1hdCh4LCB5LCB6KTtcbiAgICAgICAgdGhpcy5kdyA9IG5ldyBNYXQoeCwgeSwgeik7XG5cbiAgICAgICAgaWYgKGEgIT09IHVuZGVmaW5lZCAmJiBiICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIHRoaXMudy5yYW5kZihhLCBiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMudy5yYW5kbigpO1xuICAgICAgICB9XG5cbiAgICB9O1xuXG4gICAgbGliLk1hdGhVID0gbWF0aDtcbiAgICBsaWIuU2l6ZTIgPSBTaXplMjtcbiAgICBsaWIuU2l6ZTMgPSBTaXplMztcbiAgICBsaWIuTWF0ID0gTWF0O1xuICAgIGxpYi5CbG9iID0gQmxvYjtcblxufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8qKlxuICAgICAqIEhlbHBlciBmdW5jdGlvbiwgdGhhdCBjb252ZXJ0cyBhIGRlc2NyaXB0aW9uIGludG8gYW4gYWN0dWFsIGxheWVyIG9iamVjdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkZXNjcmlwdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIExheWVyKG9wdCwgbmV0KSB7XG4gICAgICAgIHN3aXRjaCAob3B0LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2lucHV0JzogcmV0dXJuIG5ldyBsaWIuSW5wdXRMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdkb3QnOiByZXR1cm4gbmV3IGxpYi5Eb3RMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdjb252JzogcmV0dXJuIG5ldyBsaWIuQ29udm9sdXRpb25hbExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2xzdG0nOiByZXR1cm4gbmV3IGxpYi5Mb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAncG9vbCc6IHJldHVybiBuZXcgbGliLlBvb2xpbmdMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdzaWdtb2lkJzogcmV0dXJuIG5ldyBsaWIuU2lnbW9pZExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3JlbHUnOiByZXR1cm4gbmV3IGxpYi5SZWx1TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAndGFuaCc6IHJldHVybiBuZXcgbGliLlRhbmhMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdkcm9wb3V0JzogcmV0dXJuIG5ldyBsaWIuRHJvcE91dExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3NvZnRtYXgnOiByZXR1cm4gbmV3IGxpYi5Tb2Z0bWF4TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnaHNtJzogcmV0dXJuIG5ldyBsaWIuSGllcmFyY2hpY2FsU29mdG1heChvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdyZWdyZXNzaW9uJzogcmV0dXJuIG5ldyBsaWIuUmVncmVzc2lvbkxheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIExheWVyLmFjdGl2YXRpb24gPSBbICd0YW5oJywgJ3NpZ21vaWQnLCAncmVsdScgXTtcblxuICAgIGZ1bmN0aW9uIE5ldHdvcmtTdHJ1Y3R1cmUoZGVzYywgbmV0KSB7XG4gICAgICAgIHRoaXMubmV0ID0gbmV0O1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzYztcbiAgICAgICAgdGhpcy5yZWN1cnJlbnQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLkJ1aWxkKCk7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdHJ1Y3R1cmUucHJvdG90eXBlLkJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgTCA9IG51bGw7XG4gICAgICAgIHRoaXMubGlzdCA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kZXNjcmlwdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGRlc2NyaXB0b3IgPSB0aGlzLmRlc2NyaXB0aW9uW2ldO1xuXG4gICAgICAgICAgICBpZiAoTCAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgZGVzY3JpcHRvci5pbnB1dCA9IEwub3V0OyAvLyBzZXQgaW5wdXQgdG8gdGhpcyBsYXllciB0byB0aGUgb3V0cHV0IG9mIGxhc3QgbGF5ZXJcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIFxuICAgICAgICAgICAgdGhpcy5saXN0LnB1c2goTCA9IExheWVyKGRlc2NyaXB0b3IsIHRoaXMubmV0KSk7XG4gICAgICAgICAgICB0aGlzLnJlY3VycmVudCA9IHRoaXMucmVjdXJyZW50IHx8IEwucmVjdXJyZW50O1xuXG4gICAgICAgICAgICBpZiAoZGVzY3JpcHRvci5hY3RpdmF0aW9uICE9PSB1bmRlZmluZWQgJiYgTGF5ZXIuYWN0aXZhdGlvbi5pbmRleE9mKGRlc2NyaXB0b3IuYWN0aXZhdGlvbikgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxpc3QucHVzaChMID0gTGF5ZXIoeyB0eXBlOiBkZXNjcmlwdG9yLmFjdGl2YXRpb24sIGlucHV0OiBMLm91dMKgfSwgdGhpcy5uZXQpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMubGVuZ3RoID0gdGhpcy5saXN0Lmxlbmd0aDtcbiAgICB9OyAgXG5cbiAgICBOZXR3b3JrU3RydWN0dXJlLnByb3RvdHlwZS5zdGF0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0YXRzID0geyBwYXJhbWV0ZXJzOiAwIH07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5saXN0W2ldLnBhcmFtZXRlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuZmlsdGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHN0YXRzLnBhcmFtZXRlcnMgKz0gdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuZmlsdGVyc1tqXS5zaXplLmxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhdHMucGFyYW1ldGVycyArPSB0aGlzLmxpc3RbaV0ucGFyYW1ldGVycy5iaWFzZXMuc2l6ZS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHM7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdHJ1Y3R1cmUucHJvdG90eXBlLnBhcmFtZXRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYXJhbWV0ZXJzID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5saXN0W2ldLnBhcmFtZXRlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICAgICAgICAgIHZhciBvYmplY3QgPSB7IGZpbHRlcnM6IFtdLCBiaWFzZXM6IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmJpYXNlcy53LmQgfTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuZmlsdGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIG9iamVjdC5maWx0ZXJzW2pdID0gdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuZmlsdGVyc1tqXS53LmQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhcmFtZXRlcnNbaV0gPSBvYmplY3Q7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFyYW1ldGVycztcbiAgICB9O1xuXG4gICAgTmV0d29ya1N0cnVjdHVyZS5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICBpID0gaSA+PSAwID8gaSA6IHRoaXMubGVuZ3RoICsgaTtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdFtpXTtcbiAgICB9O1xuXG4gICAgLy8gY3VycmVudCBzdGF0ZVxuICAgIGZ1bmN0aW9uIE5ldHdvcmtTdGF0ZShuZXQpIHtcbiAgICAgICAgdGhpcy5uZXQgPSBuZXQ7XG4gICAgICAgIHRoaXMubGF5ZXJzID0gbmV0LmxheWVycztcbiAgICAgICAgdGhpcy53aWR0aCA9IG5ldC5sYXllcnMubGVuZ3RoOyAvLyBob3cgbWFueSBsYXllcnM/XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5sYXllcnMucmVjdXJyZW50ID8gdGhpcy5uZXQubGVhcm5lci50aW1lc3BhbiA6IDE7IC8vIGhvdyBsb25nIGJwdHQ/IC8gdGltZSBzdGVwc1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzLnJlY3VycmVudCkge1xuICAgICAgICAgICAgdGhpcy5ibG9icyA9IHRoaXMuQnVpbGQodGhpcy5uZXQubGVhcm5lci50aW1lc3BhbiArIDEpOyAvLyBsYXN0IG9uZSBuZWVkcyByZWZlcmVuY2UgdG8gcHJldmlvdXNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYmxvYnMgPSB0aGlzLkJ1aWxkKDEpOyAvLyBvbmx5IG9uZSB0aW1lIG5lZWRlZFxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFsgWyBzdGF0ZSBmb3IgVD0wIF0sIFsgc3RhdGUgZm9yIFQ9MSBdLCAuLi4gXVxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUuQnVpbGQgPSBmdW5jdGlvbiAoaCwgUykge1xuICAgICAgICB2YXIgVCA9IFtdO1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IGg7IHQrKykge1xuICAgICAgICAgICAgVC51bnNoaWZ0KHRoaXMuQnVpbGRTdGF0ZShULCBTICE9PSB1bmRlZmluZWQgPyBTW3RdIDogdW5kZWZpbmVkKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVDtcbiAgICB9O1xuXG4gICAgLy8gWyBbIEJsb2IgZm9yIGxheWVyIDEgXSwgWyBCbG9iIGZvciBsYXllciAyIF0sIC4uLiBdXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5CdWlsZFN0YXRlID0gZnVuY3Rpb24gKFQsIFMpIHtcbiAgICAgICAgUyA9IFMgfHwgW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVycy5saXN0W2ldLm91dCAhPT0gJ3VuZGVmaW5lZCcgJiYgU1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgU1tpXSA9IG5ldyBsaWIuQmxvYih0aGlzLmxheWVycy5saXN0W2ldLm91dC54LCB0aGlzLmxheWVycy5saXN0W2ldLm91dC55LCB0aGlzLmxheWVycy5saXN0W2ldLm91dC5kZXB0aCwgMC4wKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoU1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgU1tpXSA9IHt9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBTW2ldLncuYWxsKDApLCBTW2ldLmR3LmFsbCgwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVycy5saXN0W2ldLnJlY3VycmVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5sYXllcnMubGlzdFtpXS5yZWN1cnJlbnRcbiAgICAgICAgICAgICAgICAgICAgJiYgVCAhPT0gdW5kZWZpbmVkICYmIFQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIFNbaV0ucHJldiA9IFRbMF1baV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5sYXllcnMubGlzdFtpXS5QcmVwYXJlU3RhdGVCbG9iICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzLmxpc3RbaV0uUHJlcGFyZVN0YXRlQmxvYihTW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBTO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJsb2JzID0gdGhpcy5CdWlsZCh0aGlzLmJsb2JzLmxlbmd0aCwgdGhpcy5ibG9icyk7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzLnJlY3VycmVudCkgeyAvLyBvbmx5IGlmIHJlY3VycmVudFxuICAgICAgICAgICAgdmFyIFMgPSB0aGlzLmJsb2JzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5ibG9icy51bnNoaWZ0KHRoaXMuQnVpbGRTdGF0ZSh0aGlzLmJsb2JzLCBTKSk7IC8vIHJldXNhYmlsaXR5XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMud2lkdGgubGVuZ3RoOyBpKyspIHsgXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYmxvYnNbdGhpcy5oZWlnaHRdW2ldLnByZXYpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmxvYnNbdGhpcy5oZWlnaHRdW2ldLnByZXYgPSBudWxsOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFuIGdyYWRpZW50c1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IHRoaXMuYmxvYnMubGVuZ3RoOyB0KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy53aWR0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5ibG9ic1t0XVtpXS5kdy5hbGwoMC4wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGksIHQpIHtcbiAgICAgICAgdCA9IHQgfHwgMDtcbiAgICAgICAgdCA9IHQgPj0gMCA/IHQgOiB0aGlzLmhlaWdodCArIHQ7XG5cbiAgICAgICAgaSA9IGkgfHwgMDtcbiAgICAgICAgaSA9IGkgPj0gMCA/IGkgOiB0aGlzLndpZHRoICsgaTtcblxuICAgICAgICByZXR1cm4gdGhpcy5ibG9ic1t0XVtpXTtcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9XG4gICAgICovXG4gICAgZnVuY3Rpb24gTmV0d29yayhvcHQpIHtcbiAgICAgICAgdGhpcy5sZWFybmVyID0gb3B0LmxlYXJuZXI7XG4gICAgICAgIHRoaXMubGVhcm5lciA9IE9iamVjdC5leHRlbmQodHJ1ZSwge1xuICAgICAgICAgICAgbWV0aG9kOiAnc2dkJyxcbiAgICAgICAgICAgIGJhdGNoOiAxLFxuICAgICAgICAgICAgZGVjYXk6IHsgbDE6IDAsIGwyOiAwIH0sXG4gICAgICAgICAgICBjbGlwOiBJbmZpbml0eSxcbiAgICAgICAgICAgIHRpbWVzcGFuOiAxIC8vIG9ubHkgZm9yIHJublxuICAgICAgICB9LCB0aGlzLmxlYXJuZXIpO1xuXG4gICAgICAgIHRoaXMubGVhcm5lciA9IE9iamVjdC5leHRlbmQodHJ1ZSwgdGhpcy5nZFt0aGlzLmxlYXJuZXIubWV0aG9kXS5kZWZhdWx0cywgdGhpcy5sZWFybmVyKTtcbiAgICAgICAgdGhpcy53ZWFrID0gdHJ1ZTsgLy8gZHJvcG91dCBlbmFibGVkP1xuICAgICAgICB0aGlzLnBhc3MgPSAwO1xuXG4gICAgICAgIHRoaXMubGF5ZXJzID0gbmV3IE5ldHdvcmtTdHJ1Y3R1cmUob3B0LmxheWVycywgdGhpcyk7XG4gICAgICAgIHRoaXMuc3RhdGUgPSBuZXcgTmV0d29ya1N0YXRlKHRoaXMpOyAvLyBleGNoYW5nYWJsZVxuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24oaW5wKSB7XG4gICAgICAgIC8vIGdvIGZvcndhcmRzIHRocm91Z2ggbmV0d29ya1xuICAgICAgICB0aGlzLnN0YXRlLm5leHQoKTtcbiAgICAgICAgdmFyIHkgPSB0aGlzLmxheWVycy5saXN0WzBdLmZvcndhcmQoaW5wLCB0aGlzLnN0YXRlLmF0KDApKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgeSA9IHRoaXMubGF5ZXJzLmxpc3RbaV0uZm9yd2FyZCh0aGlzLnN0YXRlLmF0KGkgLSAxKSwgdGhpcy5zdGF0ZS5hdChpKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geSAhPT0gdW5kZWZpbmVkID8geSA6IHRoaXMuc3RhdGUuYXQoLTEpLncuZDtcbiAgICB9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbihvdXRwKSB7XG4gICAgICAgIHZhciBFID0gZmFsc2UsIEkgPSB0aGlzLmxheWVycy5sZW5ndGggLSAyO1xuXG4gICAgICAgIHZhciBsb3NzID0gdGhpcy5sYXllcnMuYXQoLTEpLmJhY2t3YXJkKHRoaXMuc3RhdGUuYXQoLTEpLCB0aGlzLnN0YXRlLmF0KC0yKSwgb3V0cCk7XG4gICAgICAgIGZvciAodmFyIHQgPSAwOyB0IDwgdGhpcy5zdGF0ZS5oZWlnaHQgJiYgKEUgfHwgdCA9PT0gMCk7IHQrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IEk7IGkgPj0gMDsgaS0tKSB7IC8vIGFsd2F5cyBzdGFydCBiYWNrd2FyZCBwYXNzIGF0IGxhc3QgcmVjdXJyZW50IGxheWVyLCBvciBhdCBzZWNvbmQtbGFzdCBsYXllciBpZiB0PTBcblxuICAgICAgICAgICAgICAgIGlmKCFFICYmIHRoaXMubGF5ZXJzLmxpc3RbaV0ucmVjdXJyZW50KSB7IC8vIGV4cGFuZCBuZXR3b3JrXG4gICAgICAgICAgICAgICAgICAgIEUgPSB0cnVlLCBJID0gaTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB0aGlzLmxheWVycy5saXN0W2ldLmJhY2t3YXJkKHRoaXMuc3RhdGUuYXQoaSwgdCksIHRoaXMuc3RhdGUuYXQoaSAtIDEsIHQpKTtcblxuICAgICAgICAgICAgfSAgXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkanVzdCgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGxvc3M7XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmFkanVzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoKyt0aGlzLnBhc3MgJSB0aGlzLmxlYXJuZXIuYmF0Y2ggIT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtZXRob2QgPSB0aGlzLmdkW3RoaXMubGVhcm5lci5tZXRob2RdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMubGF5ZXJzLmxpc3RbaV0ucGFyYW1ldGVycyA9PT0gJ3VuZGVmaW5lZCcpXG4gICAgICAgICAgICAgICAgY29udGludWU7XG5cbiAgICAgICAgICAgIHZhciBwYXJhbSA9IHRoaXMubGF5ZXJzLmxpc3RbaV0ucGFyYW1ldGVycztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0uZmlsdGVycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhcmFtLmZpbHRlcnMubGVuZ3RoOyBqKyspIHsgbWV0aG9kLmNhbGwodGhpcywgdGhpcy5sZWFybmVyLCBwYXJhbS5maWx0ZXJzW2pdLCAxLjApOyB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0uYmlhc2VzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIG1ldGhvZC5jYWxsKHRoaXMsIHRoaXMubGVhcm5lciwgcGFyYW0uYmlhc2VzLCAwLjApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qIGdyYWRpZW50IGRlc2NlbnQgYWxnb3JpdGhtcyAqL1xuICAgIE5ldHdvcmsucHJvdG90eXBlLmdkID0ge307XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5nZC5zZ2QgPSB7XG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICByYXRlOiAwLjAxLFxuICAgICAgICAgICAgbW9tZW50dW06IDAuOVxuICAgICAgICB9LFxuICAgICAgICBzdG9yYWdlOiBbJ2dzdW0nXSxcbiAgICAgICAgYWxnb3JpdGhtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGR4ID0gb3B0Lm1vbWVudHVtICogZ3N1bSAtIG9wdC5yYXRlICogZ2lqO1xuICAgICAgICAgICAgZ3N1bSA9IGR4O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmdkLmFkYWRlbHRhID0ge1xuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgcm86IDAuOTUsXG4gICAgICAgICAgICBlcHM6IDFlLThcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcmFnZTogWydnc3VtJywgJ3hzdW0nXSxcbiAgICAgICAgYWxnb3JpdGhtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGdzdW0gPSBvcHQucm8gKiBnc3VtICsgKDEgLSBvcHQucm8pICogZ2lqICogZ2lqO1xuICAgICAgICAgICAgZHggPSAtTWF0aC5zcXJ0KCh4c3VtICsgb3B0LmVwcykgLyAoZ3N1bSArIG9wdC5lcHMpKSAqIGdpajtcbiAgICAgICAgICAgIHhzdW0gPSBvcHQucm8gKiB4c3VtICsgKDEgLSBvcHQucm8pICogZHggKiBkeDsgLy8geWVzLCB4c3VtIGxhZ3MgYmVoaW5kIGdzdW0gYnkgMS5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKiBhbGdvcml0aG1zIGNvbXBpbGVyLCBzcGVlZHMgdGhpbmdzIHVwLCBhbmQgbWFrZXMgdGhpbmdzIGVhc2llciAqL1xuICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGdkX3Byb3RvdHlwZSA9IGZ1bmN0aW9uKG9wdCwgTywgZGVjYXkpIHtcbiAgICAgICAgICAgIGlmIChPLm5vY2hhbmdlKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgZHggPSAwLCBfX2dyYWQgPSAwLCBnaWogPSAwLCBsMWdyYWQgPSAwLCBsMmdyYWQgPSAwO1xuICAgICAgICAgICAgXCJVVTFcIjtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTy5zaXplLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgX19ncmFkID0gTy5kdy5kW2ldO1xuICAgICAgICAgICAgICAgIF9fZ3JhZCA9IF9fZ3JhZCA+IG9wdC5jbGlwID8gb3B0LmNsaXAgOiAoX19ncmFkIDwgLW9wdC5jbGlwID8gLW9wdC5jbGlwIDogX19ncmFkKTtcbiAgICAgICAgICAgICAgICBsMWdyYWQgPSBkZWNheSAqIG9wdC5kZWNheS5sMSAqIChPLncuZFtpXSA+IDAgPyAxIDogLTEpO1xuICAgICAgICAgICAgICAgIGwyZ3JhZCA9IGRlY2F5ICogb3B0LmRlY2F5LmwyICogKE8udy5kW2ldKTtcbiAgICAgICAgICAgICAgICBnaWogPSAoX19ncmFkICsgbDFncmFkICsgbDJncmFkKSAvIG9wdC5iYXRjaDtcbiAgICAgICAgICAgICAgICBcIlVVMlwiO1xuICAgICAgICAgICAgICAgIFwiVVUzXCI7XG4gICAgICAgICAgICAgICAgXCJVVTRcIjtcbiAgICAgICAgICAgICAgICBPLncuZFtpXSArPSBkeDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgTy5kdy5hbGwoMC4wKTtcbiAgICAgICAgfTtcblxuICAgICAgICB2YXIgZ2RfcHJvdG90eXBlXyA9IGdkX3Byb3RvdHlwZS50b1N0cmluZygpO1xuXG4gICAgICAgIGZvciAodmFyIG5hbWUgaW4gTmV0d29yay5wcm90b3R5cGUuZ2QpIHtcbiAgICAgICAgICAgIHZhciBkZXNjcmlwdGlvbiA9IE5ldHdvcmsucHJvdG90eXBlLmdkW25hbWVdO1xuICAgICAgICAgICAgdmFyIGNoZWNrcyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5zdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgY2hlY2tzW2ldID0gJ2lmICh0eXBlb2YgTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcgPT09IFwidW5kZWZpbmVkXCIpIHsgTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcgPSBuZXcgbGliLk1hdChPLnNpemUueCwgTy5zaXplLnksIE8uc2l6ZS5kZXB0aCwgMC4wKTsgfSc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBleHRyYWN0aW9ucyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5zdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgZXh0cmFjdGlvbnNbaV0gPSAndmFyICcgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJyA9IE8uJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnLmRbaV07JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGFsZyA9IGRlc2NyaXB0aW9uLmFsZ29yaXRobS50b1N0cmluZygpO1xuICAgICAgICAgICAgYWxnID0gYWxnLnN1YnN0cmluZyhhbGcuaW5kZXhPZigneycpICsgMSwgYWxnLmxlbmd0aCAtIDEpO1xuXG4gICAgICAgICAgICB2YXIgc3RvcmluZ3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzY3JpcHRpb24uc3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHN0b3JpbmdzW2ldID0gJ08uJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnLmRbaV0gPSAnICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICc7JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGZ1bmMgPSBnZF9wcm90b3R5cGVfLnJlcGxhY2UoJ1wiVVUxXCI7JywgY2hlY2tzLmpvaW4oXCJcIikpLnJlcGxhY2UoJ1wiVVUyXCI7JywgZXh0cmFjdGlvbnMuam9pbihcIlwiKSkucmVwbGFjZSgnXCJVVTNcIjsnLCBhbGcpLnJlcGxhY2UoJ1wiVVU0XCI7Jywgc3RvcmluZ3Muam9pbihcIlwiKSk7XG4gICAgICAgICAgICB2YXIgY21kID0gJ05ldHdvcmsucHJvdG90eXBlLmdkLicgKyBuYW1lICsgJyA9ICcgKyBmdW5jO1xuICAgICAgICAgICAgZXZhbChjbWQpO1xuICAgICAgICAgICAgTmV0d29yay5wcm90b3R5cGUuZ2RbbmFtZV0uZGVmYXVsdHMgPSBkZXNjcmlwdGlvbi5kZWZhdWx0cztcbiAgICAgICAgfVxuICAgIH0pKCk7XG5cbiAgICBsaWIuTmV0d29yayA9IE5ldHdvcms7XG59KShubmpzKTtcbiIsIihmdW5jdGlvbihsaWIpIHtcblxuICAgIGZ1bmN0aW9uIFdlYldvcmtlcihtYWluLCBubmpzKSB7XG4gICAgICAgIHRoaXMuZXZlbnRzID0ge307XG4gICAgICAgIHRoaXMuQ3JlYXRlV29ya2VyKG1haW4sIG5uanMsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIFdlYldvcmtlci5BUEkubGlzdGVuKHRoaXMuZXZlbnRzLCB0aGlzLndvcmtlcik7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBXZWJXb3JrZXIucHJvdG90eXBlLkNyZWF0ZVdvcmtlciA9IGZ1bmN0aW9uKG1haW4sIG5uanMsIGNvbXBsZXRpb24pIHtcbiAgICAgICAgdmFyIGNvbXBpbGUgPSAoZnVuY3Rpb24gKGNvZGUpIHtcbiAgICAgICAgICAgIHRoaXMud29ya2VyID0gbmV3IFdvcmtlcih0aGlzLkNyZWF0ZVVSTChjb2RlLCBubmpzKSk7XG4gICAgICAgICAgICBjb21wbGV0aW9uLmNhbGwodGhpcyk7XG4gICAgICAgIH0pLmJpbmQodGhpcyk7XG5cbiAgICAgICAgaWYgKG1haW4gaW5zdGFuY2VvZiBGdW5jdGlvbikge1xuICAgICAgICAgICAgY29tcGlsZSh0aGlzLkZ1bmN0aW9uVG9TdHJpbmcobWFpbikpO1xuICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBtYWluID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgdmFyIHJlcXVlc3QgPSBuZXcgWE1MSHR0cFJlcXVlc3QoKTtcblxuICAgICAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKFwibG9hZFwiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29tcGlsZSh0aGlzLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmVxdWVzdC5hZGRFdmVudExpc3RlbmVyKFwiZXJyb3JcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvciBsb2FkaW5nIHdvcmtlciBcIicgKyBtYWluICsgJ1wiJyk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJlcXVlc3Qub3BlbihcIkdFVFwiLCB0aGlzLkNvbnZlcnRSZWxhdGl2ZVVSSShtYWluKSk7XG4gICAgICAgICAgICByZXF1ZXN0LnNlbmQoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBXZWJXb3JrZXIucHJvdG90eXBlLkNyZWF0ZVVSTCA9IGZ1bmN0aW9uKGNvZGUsIG5uanMpIHtcbiAgICAgICAgdmFyIHdvcmtlclN0cmluZyA9IHRoaXMuQWRkUmVxdWlyZWRTdHVmZihubmpzKSArICdcXG4nICsgY29kZTtcbiAgICAgICAgdmFyIGRhdGEgPSB0aGlzLkNyZWF0ZUJsb2Iod29ya2VyU3RyaW5nKTtcbiAgICAgICAgcmV0dXJuIHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGRhdGEpO1xuICAgIH07XG5cbiAgICBXZWJXb3JrZXIucHJvdG90eXBlLkNyZWF0ZUJsb2IgPSBmdW5jdGlvbihzdHJpbmcpIHtcbiAgICAgICAgdmFyIGJsb2I7XG4gICAgICAgIHRyeSB7XG4gICAgICAgICAgICBibG9iID0gbmV3IEJsb2IoW3N0cmluZ10sIHsgdHlwZTogJ2FwcGxpY2F0aW9uL2phdmFzY3JpcHQnIH0pO1xuICAgICAgICB9IGNhdGNoIChlKSB7IC8vIEJhY2t3YXJkcy1jb21wYXRpYmlsaXR5XG4gICAgICAgICAgICB3aW5kb3cuQmxvYkJ1aWxkZXIgPSB3aW5kb3cuQmxvYkJ1aWxkZXIgfHwgd2luZG93LldlYktpdEJsb2JCdWlsZGVyIHx8IHdpbmRvdy5Nb3pCbG9iQnVpbGRlcjtcbiAgICAgICAgICAgIGJsb2IgPSBuZXcgQmxvYkJ1aWxkZXIoKTtcbiAgICAgICAgICAgIGJsb2IuYXBwZW5kKHN0cmluZyk7XG4gICAgICAgICAgICBibG9iID0gYmxvYi5nZXRCbG9iKCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gYmxvYjtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5GdW5jdGlvblRvU3RyaW5nID0gZnVuY3Rpb24oZnVuYykge1xuICAgICAgICB2YXIgc3RyaW5nID0gd29ya2VyLnRvU3RyaW5nKCk7XG4gICAgICAgIHZhciBiZWcgPSBzdHJpbmcuaW5kZXhPZigneycpICsgMTtcbiAgICAgICAgdmFyIGVuZCA9IHN0cmluZy5sYXN0SW5kZXhPZignfScpO1xuICAgICAgICByZXR1cm4gc3RyaW5nLnN1YnN0cmluZyhiZWcsIGVuZCkudHJpbSgpO1xuICAgIH07XG5cbiAgICBXZWJXb3JrZXIucHJvdG90eXBlLkFkZFJlcXVpcmVkU3R1ZmYgPSBmdW5jdGlvbihubmpzKSB7XG4gICAgICAgIHZhciBzdHIgPSAnaW1wb3J0U2NyaXB0cyhcIicgKyB0aGlzLkNvbnZlcnRSZWxhdGl2ZVVSSShubmpzKSArICdcIik7IHZhciBubiA9IG5uanM7ICc7XG4gICAgICAgIHN0ciArPSBcInZhciBXZWJXb3JrZXIgPSB7fTsgV2ViV29ya2VyLkFQSSA9IHtcIjtcblxuICAgICAgICB2YXIgYXBpID0gW107XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBXZWJXb3JrZXIuQVBJKSB7XG4gICAgICAgICAgICBhcGkucHVzaChrZXkgKyAnOiAnICsgV2ViV29ya2VyLkFQSVtrZXldLnRvU3RyaW5nKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RyICs9IGFwaS5qb2luKCcsJykgKyAnfTsgd3cgPSBXZWJXb3JrZXIuQVBJOyc7XG4gICAgICAgIHN0ciArPSAnd3cuZXZlbnRzID0ge307IHd3Lmxpc3RlbigpOyc7XG5cbiAgICAgICAgcmV0dXJuIHN0cjtcbiAgICB9O1xuXG4gICAgV2ViV29ya2VyLnByb3RvdHlwZS5Db252ZXJ0UmVsYXRpdmVVUkkgPSBmdW5jdGlvbihyZWxhdGl2ZSkge1xuICAgICAgICB2YXIgYWJzb2x1dGUgPSBudWxsO1xuICAgICAgICAoZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIGUuaHJlZiA9IHJlbGF0aXZlOyBhYnNvbHV0ZSA9IGUuaHJlZjtcbiAgICAgICAgfSkoZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpKTtcbiAgICAgICAgcmV0dXJuIGFic29sdXRlO1xuICAgIH07XG5cbiAgICBXZWJXb3JrZXIucHJvdG90eXBlLm9uID0gZnVuY3Rpb24oZXZlbnQsIGZ1bmMpIHtcbiAgICAgICAgV2ViV29ya2VyLkFQSS5vbihldmVudCwgZnVuYywgdGhpcy5ldmVudHMpO1xuICAgIH07XG5cbiAgICBXZWJXb3JrZXIucHJvdG90eXBlLnRyaWdnZXIgPSBmdW5jdGlvbihldmVudCwgZGF0YSwgdHJhbnNmZXIpIHtcbiAgICAgICAgV2ViV29ya2VyLkFQSS50cmlnZ2VyKGV2ZW50LCBkYXRhLCB0cmFuc2ZlciwgdGhpcy53b3JrZXIpO1xuICAgIH07XG5cbiAgICBXZWJXb3JrZXIuQVBJID0ge1xuICAgICAgICBsaXN0ZW46IGZ1bmN0aW9uKHN0b3JlLCB3KSB7XG4gICAgICAgICAgICBzdG9yZSA9IHN0b3JlIHx8ICh3dyA/IHd3LmV2ZW50cyA6IG51bGwpO1xuICAgICAgICAgICAgdyA9IHcgfHwgc2VsZjtcbiAgICAgICAgICAgIHcub25tZXNzYWdlID0gZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgIHZhciByZWNlaXZlZCA9IGUuZGF0YTtcbiAgICAgICAgICAgICAgICB2YXIgc3RvcmVkID0gc3RvcmVbcmVjZWl2ZWQubmFtZV07XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IHN0b3JlZCAhPT0gdW5kZWZpbmVkICYmIHN0b3JlZCBpbnN0YW5jZW9mIEFycmF5ICYmIGkgPCBzdG9yZWQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3RvcmVkW2ldLmFwcGx5KHVuZGVmaW5lZCwgW10uY29uY2F0KHJlY2VpdmVkLnBhcmFtZXRlciwgcmVjZWl2ZWQudHJhbnNmZXIpKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9LFxuICAgICAgICBvbjogZnVuY3Rpb24obmFtZSwgZnVuYywgc3RvcmUpIHtcbiAgICAgICAgICAgIHN0b3JlID0gc3RvcmUgfHwgKHd3ID8gd3cuZXZlbnRzIDogbnVsbCk7XG4gICAgICAgICAgICBpZiAoc3RvcmVbbmFtZV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIHN0b3JlW25hbWVdID0gW107XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0b3JlW25hbWVdLnB1c2goZnVuYyk7XG4gICAgICAgIH0sXG4gICAgICAgIHRyaWdnZXI6IGZ1bmN0aW9uKGV2ZW50LCBkYXRhLCB0cmFuc2Zlciwgdykge1xuICAgICAgICAgICAgdyA9IHcgfHwgc2VsZjtcbiAgICAgICAgICAgIHcucG9zdE1lc3NhZ2Uoe1xuICAgICAgICAgICAgICAgIG5hbWU6IGV2ZW50LFxuICAgICAgICAgICAgICAgIHBhcmFtZXRlcjogZGF0YSxcbiAgICAgICAgICAgICAgICB0cmFuc2ZlcjogdHJhbnNmZXJcbiAgICAgICAgICAgIH0sIHRyYW5zZmVyKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIuV2ViV29ya2VyID0gV2ViV29ya2VyO1xuXG59KShubmpzKTtcbiIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgLyogc3BhdGlhbCB3ZWlnaHRzICovXG4gICAgZnVuY3Rpb24gQ29udm9sdXRpb25hbExheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLmZpbHRlciA9IG9wdC5maWx0ZXI7XG4gICAgICAgIHRoaXMuc3RyaWRlID0gb3B0LnN0cmlkZTtcbiAgICAgICAgdGhpcy5wYWQgPSBvcHQucGFkO1xuXG4gICAgICAgIHZhciBveCA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueCArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLngpIC8gdGhpcy5zdHJpZGUgKyAxKTtcbiAgICAgICAgdmFyIG95ID0gTWF0aC5mbG9vcigodGhpcy5pbi55ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueSkgLyB0aGlzLnN0cmlkZSArIDEpO1xuICAgICAgICB0aGlzLm91dCA9IGxpYi5TaXplMyhveCwgb3ksIHRoaXMuZmlsdGVyLmRlcHRoKTtcblxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgICBmaWx0ZXJzOiBbXSxcbiAgICAgICAgICAgIGJpYXNlczogbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMuZmlsdGVyLmRlcHRoLCAwLjApXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5kZXB0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXSA9IG5ldyBsaWIuQmxvYih0aGlzLmZpbHRlci54LCB0aGlzLmZpbHRlci55LCB0aGlzLmluLmRlcHRoKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDb252b2x1dGlvbmFsTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICB2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcbiAgICAgICAgdmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMCwgRl9kID0gdGhpcy5maWx0ZXIuZGVwdGggfCAwO1xuXG4gICAgICAgIHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG4gICAgICAgIHZhciBiaWFzZXMgPSB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncuZDtcblxuICAgICAgICBmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG4gICAgICAgICAgICB2YXIgZiA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2RdO1xuICAgICAgICAgICAgdmFyIHggPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHsgLy8geHlfc3RyaWRlXG4gICAgICAgICAgICAgICAgeCA9IC10aGlzLnBhZCB8IDA7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgeCArPSBzdHJpZGUsIGF4KyspIHsgLy8geHlfc3RyaWRlXG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBwYXJ0aWN1bGFyIGxvY2F0aW9uIFtheCwgYXldXG4gICAgICAgICAgICAgICAgICAgIHZhciBhID0gMC4wO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3ggPSAwLCBveSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG95ID0geSArIGZ5OyAvLyBjb29yZGluYXRlcyBpbiB0aGUgb3JpZ2luYWwgaW5wdXQgYXJyYXkgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZ4ID0gMDsgZnggPCBGX3g7IGZ4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3kgPj0gMCAmJiBveSA8IFZfeSAmJiBveCA+PSAwICYmIG94IDwgVl94KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZkID0gMDsgZmQgPCBGX2Q7IGZkKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEud1theCwgYXksIGRdICs9IGYud1sgZngsIGZ5LCBmZCBdICogVi53WyBveCwgb3ksIGZkIF1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGEgKz0gZi53LmRbKGZ5ICogRl94ICsgZngpICogRl9kICsgZmRdICogVi53LmRbKG95ICogVl94ICsgb3gpICogVl9kICsgZmRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgQS53LmRbKGF5ICogQV94ICsgYXgpICogQV9kICsgZF0gPSBhICsgYmlhc2VzW2RdO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBDb252b2x1dGlvbmFsTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcbiAgICAgICAgdmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuICAgICAgICB2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDAsIEZfZCA9IHRoaXMuZmlsdGVyLmRlcHRoIHwgMDtcblxuICAgICAgICB2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGUgfCAwO1xuICAgICAgICB2YXIgYmlhc2VzID0gdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kO1xuXG4gICAgICAgIHZhciB2MSA9IDAsIHYyID0gMDtcblxuICAgICAgICBmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG4gICAgICAgICAgICB2YXIgZiA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2RdO1xuICAgICAgICAgICAgdmFyIHggPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHtcbiAgICAgICAgICAgICAgICB4ID0gLXRoaXMucGFkIHwgMDtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykge1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgbG9jYXRpb24gW2F4LCBheV1cbiAgICAgICAgICAgICAgICAgICAgdmFyIGRBID0gQS5kdy5kWyhheSAqIEFfeCArIGF4KSAqIEFfZCArIGRdO1xuICAgICAgICAgICAgICAgICAgICB2YXIgb3ggPSAwLCBveSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG95ID0geSArIGZ5OyAvLyBjb29yZGluYXRlcyBpbiB0aGUgb3JpZ2luYWwgaW5wdXQgYXJyYXkgY29vcmRpbmF0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZ4ID0gMDsgZnggPCBGX3g7IGZ4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAob3kgPj0gMCAmJiBveSA8IFZfeSAmJiBveCA+PSAwICYmIG94IDwgVl94KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZkID0gMDsgZmQgPCBGX2Q7IGZkKyspIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGYuZHdbZngsIGZ5LCBmZF0gKz0gVi53W294LCBveSwgZmRdICogQS5kd1theCwgYXksIGRdXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBWLmR3W294LCBveSwgZmRdICs9IGYud1tmeCwgZnksIGZkXSAqIEEuZHdbYXgsIGF5LCBkXVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgdjEgPSAoZnkgKiBGX3ggKyBmeCkgKiBGX2QgKyBmZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYyID0gKG95ICogVl94ICsgb3gpICogVl9kICsgZmQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBmLmR3LmRbdjFdICs9IFYudy5kW3YyXSpkQTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIFYuZHcuZFt2Ml0gKz0gZi53LmRbdjFdKmRBO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgYmlhc2VzW2RdICs9IGRBO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKiBQb29saW5nIGxheWVyLCBzZWxlY3QgYmlnZ2VzdCB2YWx1ZSBmcm9tIGNvbnZvbHV0aW9uICovXG4gICAgZnVuY3Rpb24gUG9vbGluZ0xheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLmZpbHRlciA9IG9wdC5maWx0ZXI7XG4gICAgICAgIHRoaXMuc3RyaWRlID0gb3B0LnN0cmlkZTtcbiAgICAgICAgdGhpcy5wYWQgPSBvcHQucGFkO1xuXG4gICAgICAgIHZhciBveCA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueCArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLngpIC8gdGhpcy5zdHJpZGUgKyAxKTtcbiAgICAgICAgdmFyIG95ID0gTWF0aC5mbG9vcigodGhpcy5pbi55ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueSkgLyB0aGlzLnN0cmlkZSArIDEpO1xuICAgICAgICB0aGlzLm91dCA9IGxpYi5TaXplMyhveCwgb3ksIHRoaXMuaW4uZGVwdGgpO1xuICAgIH07XG5cbiAgICBQb29saW5nTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICB2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcbiAgICAgICAgdmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMDsgXG5cbiAgICAgICAgdmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcblxuICAgICAgICBmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG4gICAgICAgICAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG4gICAgICAgICAgICB2YXIgeSA9IC10aGlzLnBhZCB8IDA7XG4gICAgICAgICAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyB5ICs9IHN0cmlkZSwgYXkrKykge1xuICAgICAgICAgICAgICAgIHggPSAtdGhpcy5wYWQgfCAwO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGF4ID0gMDsgYXggPCBBX3g7IHggKz0gc3RyaWRlLCBheCsrKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBsb2NhdGlvbiBbYXgsIGF5XVxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VsdiA9IC1NYXRoLkluZmluaXR5LCBzZWx4ID0gMCwgc2VseTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwLCBxID0gMDtcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZnkgPSAwOyBmeSA8IEZfeTsgZnkrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgZnggPSAwOyBmeCA8IEZfeDsgZngrKykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG94ID0geCArIGZ4O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcSA9IFYudy5kWyhveSAqIFZfeCArIG94KSAqIFZfZCArIGRdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAocSA+IHNlbHYpIHsgc2VsdiA9IHE7IHNlbHggPSBveDsgc2VseSA9IG95OyB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGl4ID0gKGF5ICogQV94ICsgYXgpICogQV9kICsgZDtcbiAgICAgICAgICAgICAgICAgICAgQS5weFtpeF0gPSBzZWx4O1xuICAgICAgICAgICAgICAgICAgICBBLnB5W2l4XSA9IHNlbHk7XG4gICAgICAgICAgICAgICAgICAgIEEudy5kW2l4XSA9IHNlbHY7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIFBvb2xpbmdMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuICAgICAgICB2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG4gICAgICAgIHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcbiAgICAgICAgdmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMDsgXG5cbiAgICAgICAgdmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcblxuICAgICAgICBmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyBheSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgYXgrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgaXggPSAoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZEEgPSBBLmR3LmRbaXhdO1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBzZWx4ID0gQS5weFtpeF07IFxuICAgICAgICAgICAgICAgICAgICB2YXIgc2VseSA9IEEucHlbaXhdO1xuXG4gICAgICAgICAgICAgICAgICAgIFYuZHcuZFsoc2VseSAqIFZfeCArIHNlbHgpICogVl9kICsgZF0gPSBkQTsgLy8gb25seSB0cmFuc2ZlciB3ZWlnaHRzIGZyb20gc2VsZWN0ZWQgbG9jYXRpb25zXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIFBvb2xpbmdMYXllci5wcm90b3R5cGUuUHJlcGFyZVN0YXRlQmxvYiA9IGZ1bmN0aW9uIChBKSB7XG4gICAgICAgIGlmIChBLnB4ID09PSB1bmRlZmluZWQgfHwgQS5weSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBBLnB4ID0gbGliLk1hdC5DcmVhdGVBcnJheSh0aGlzLm91dC5kZXB0aCAqIHRoaXMub3V0LnkgKiB0aGlzLm91dC54LCAwLCAnVWludDE2QXJyYXknKTtcbiAgICAgICAgICAgIEEucHkgPSBsaWIuTWF0LkNyZWF0ZUFycmF5KHRoaXMub3V0LmRlcHRoICogdGhpcy5vdXQueSAqIHRoaXMub3V0LngsIDAsICdVaW50MTZBcnJheScpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxpYi5Db252b2x1dGlvbmFsTGF5ZXIgPSBDb252b2x1dGlvbmFsTGF5ZXI7XG4gICAgbGliLlBvb2xpbmdMYXllciA9IFBvb2xpbmdMYXllcjtcbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBpbnB1dCwgc2l6ZVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIERvdExheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IGxpYi5TaXplMygxLCAxLCBvcHQuc2l6ZSk7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIGZpbHRlcnM6IFtdLFxuICAgICAgICAgICAgYmlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5vdXQuZGVwdGgsIDAuMClcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXSA9IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLmluLmxlbmd0aCk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgRG90TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgc3VtID0gMC4wO1xuICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICAgICAgc3VtICs9IFYudy5kW2pdICogdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBBLncuZFtpXSA9IHN1bSArIHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kW2ldO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIERvdExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBkQSA9IEEuZHcuZFtpXTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLmR3LmRbal0gKz0gVi53LmRbal0gKiBkQTtcbiAgICAgICAgICAgICAgICBWLmR3LmRbal0gKz0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdICogZEE7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuZFtpXSArPSBkQTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIuRG90TGF5ZXIgPSBEb3RMYXllcjtcbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgZnVuY3Rpb24gRHJvcE91dExheWVyKG9wdCwgbmV0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm5ldCA9IG5ldDtcbiAgICAgICAgdGhpcy5wcm9iYWJpbGl0eSA9IG9wdC5wcm9iYWJpbGl0eSB8fCAwLjI1O1xuICAgIH1cblxuICAgIERyb3BPdXRMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG4gICAgICAgIGlmICghdGhpcy5uZXQud2Vhaykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7IEEudy5kW2ldID0gVi53LmRbaV0gKiB0aGlzLnByb2JhYmlsaXR5OyB9IHJldHVybiA7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChNYXRoLnJhbmRvbSgpIDwgdGhpcy5wcm9iYWJpbGl0eSkge1xuICAgICAgICAgICAgICAgIEEudy5kW2ldID0gMC4wO1xuICAgICAgICAgICAgICAgIEEuZHJvcHBlZE91dFtpXSA9IHRydWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIEEudy5kW2ldID0gVi53LmRbaV07XG4gICAgICAgICAgICAgICAgQS5kcm9wcGVkT3V0W2ldID0gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgRHJvcE91dExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG4gICAgICAgIGlmICghdGhpcy5uZXQud2VhayB8fCBBLmRyb3BwZWRPdXQubGVuZ3RoICE9PSB0aGlzLmluLmxlbmd0aCkgcmV0dXJuIDtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKCFBLmRyb3BwZWRPdXRbaV0pIHtcbiAgICAgICAgICAgICAgICBWLmR3LmRbaV0gPSBBLmR3LmRbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgRHJvcE91dExheWVyLnByb3RvdHlwZS5QcmVwYXJlU3RhdGVCbG9iID0gZnVuY3Rpb24gKEEpIHtcbiAgICAgICAgQS5kcm9wcGVkT3V0ID0gW107XG4gICAgfTtcblxuICAgIGxpYi5Ecm9wT3V0TGF5ZXIgPSBEcm9wT3V0TGF5ZXI7XG4gICAgXG59KShubmpzKTsiLCIoZnVuY3Rpb24obGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgZnVuY3Rpb24gSW5wdXRMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5vdXQgPSBvcHQuc2l6ZTtcbiAgICAgICAgdGhpcy5zY2FsZSA9IG9wdC5zY2FsZSB8fCAxLjA7XG4gICAgICAgIHRoaXMuYmlhcyA9IG9wdC5iaWFzIHx8IDAuMDtcbiAgICB9O1xuXG4gICAgSW5wdXRMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uKFYsIEEpIHtcbiAgICAgICAgQS53LmNvcHkoViwgdGhpcy5zY2FsZSwgdGhpcy5iaWFzKTtcbiAgICB9O1xuXG4gICAgSW5wdXRMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbihBLCBWKSB7fTtcblxuICAgIGxpYi5JbnB1dExheWVyID0gSW5wdXRMYXllcjtcbn0pKG5uanMpO1xuIiwiKGZ1bmN0aW9uKGxpYikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgZnVuY3Rpb24gc2lnbSh4KSB7XG4gICAgICAgIHJldHVybiAxLjAgLyAoMS4wICsgTWF0aC5leHAoLXgpKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkc2lnbSh5KSB7XG4gICAgICAgIHJldHVybiB5ICogKDEgLSB5KTtcbiAgICB9XG5cbiAgICAvLyBzZWUgaHR0cDovL3Blb3BsZS5pZHNpYS5jaC9+anVlcmdlbi9sc3RtL3NsZDAxOS5odG1cbiAgICBmdW5jdGlvbiBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LmlucHV0OyAvLyAxIHRvIDEgbWFwcGluZ1xuXG4gICAgICAgIHRoaXMucmVjdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzID0ge1xuICAgICAgICAgICAgZmlsdGVyczogW10sXG4gICAgICAgICAgICBiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLm91dC5kZXB0aCwgMC4wKVxuICAgICAgICB9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgOSwgMCwgMC4wOCk7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbMl0gPSAtMTsgLy8gYXQgYmVnaW5uaW5nIG5lZ2F0aXZlIHBlZXBob2xlIGNvbm5lY3Rpb25zXG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbNV0gPSAtMTsgLy8gdG8gbWluaW1pemUgZXhwbG9kaW5nXG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbOF0gPSAtMTsgLy8gY2VsbCBzdGF0ZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcyA9IG5ldyBsaWIuQmxvYigxLCB0aGlzLmluLmxlbmd0aCwgMywgMC4wKTtcbiAgICB9O1xuXG4gICAgTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24oViwgQSkge1xuICAgICAgICB2YXIgYmlhcyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW0gPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmQ7XG5cbiAgICAgICAgICAgIHZhciB4ID0gVi53LmRbaV07XG4gICAgICAgICAgICB2YXIgaF8gPSBBLnByZXYudy5kW2ldO1xuICAgICAgICAgICAgdmFyIGNfID0gQS5wcmV2LmxzdG0uY2VsbHMudy5kW2ldO1xuXG4gICAgICAgICAgICB2YXIgaWcgPSBzaWdtKHggKiBwYXJhbVswXSArIGhfICogcGFyYW1bMV0gKyBjXyAqIHBhcmFtWzJdICsgYmlhc1tpICogMyArIDBdKTtcbiAgICAgICAgICAgIHZhciBmZyA9IHNpZ20oeCAqIHBhcmFtWzNdICsgaF8gKiBwYXJhbVs0XSArIGNfICogcGFyYW1bNV0gKyBiaWFzW2kgKiAzICsgMV0pO1xuICAgICAgICAgICAgdmFyIGMgPSBpZyAqIHggKyBmZyAqIGNfO1xuICAgICAgICAgICAgdmFyIG9nID0gc2lnbSh4ICogcGFyYW1bNl0gKyBoXyAqIHBhcmFtWzddICsgYyAgKiBwYXJhbVs4XSArIGJpYXNbaSAqIDMgKyAyXSk7XG4gICAgICAgICAgICB2YXIgaCA9IG9nICogYztcblxuICAgICAgICAgICAgQS5sc3RtLmdhdGVzLmluLmRbaV0gPSBpZztcbiAgICAgICAgICAgIEEubHN0bS5nYXRlcy5mb3JnZXQuZFtpXSA9IGZnO1xuICAgICAgICAgICAgQS5sc3RtLmdhdGVzLm91dC5kW2ldID0gb2c7XG5cbiAgICAgICAgICAgIEEubHN0bS5jZWxscy53LmRbaV0gPSBjO1xuICAgICAgICAgICAgQS53LmRbaV0gPSBoO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIExvbmdTaG9ydFRlcm1NZW1vcnlMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbihBLCBWKSB7XG4gICAgICAgIHZhciBCSUFTID0gdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcztcbiAgICAgICAgdmFyIGJpYXMgPSBCSUFTLncuZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIFBBUkFNID0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV07XG4gICAgICAgICAgICB2YXIgcGFyYW0gPSBQQVJBTS53LmQ7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgIHZhciBpZyA9IEEubHN0bS5nYXRlcy5pbi5kW2ldO1xuICAgICAgICAgICAgdmFyIGZnID0gQS5sc3RtLmdhdGVzLmZvcmdldC5kW2ldO1xuICAgICAgICAgICAgdmFyIG9nID0gQS5sc3RtLmdhdGVzLm91dC5kW2ldO1xuICAgICAgICAgICAgdmFyIGMgPSBBLmxzdG0uY2VsbHMudy5kW2ldO1xuXG4gICAgICAgICAgICB2YXIgeCA9IFYudy5kW2ldO1xuICAgICAgICAgICAgdmFyIGhfID0gQS5wcmV2LncuZFtpXTtcbiAgICAgICAgICAgIHZhciBjXyA9IEEucHJldi5sc3RtLmNlbGxzLncuZFtpXTtcblxuICAgICAgICAgICAgdmFyIGRoID0gQS5kdy5kW2ldO1xuICAgICAgICAgICAgdmFyIGRjID0gQS5sc3RtLmNlbGxzLmR3LmRbaV07XG5cbiAgICAgICAgICAgIHZhciBkb2cgPSBkc2lnbShvZykgKiBjICogZGg7XG4gICAgICAgICAgICAgICAgZGMgPSBkYyArIHBhcmFtWzhdICogZG9nICsgb2cgKiBkaDtcbiAgICAgICAgICAgIHZhciBkZmcgPSBkc2lnbShmZykgKiBjXyAqIGRjO1xuICAgICAgICAgICAgdmFyIGRpZyA9IGRzaWdtKGlnKSAqIHggKiBkYztcbiAgICAgICAgICAgIHZhciBkeCA9IGlnICogZGMgKyBwYXJhbVs2XSAqIGRvZyArIHBhcmFtWzNdICogZGZnICsgcGFyYW1bMF0gKiBkaWc7XG5cbiAgICAgICAgICAgIHZhciBkY18gPSBmZyAqIGRjICsgcGFyYW1bNV0gKiBkZmcgKyBwYXJhbVsyXSAqIGRpZztcbiAgICAgICAgICAgIHZhciBkaF8gPSBwYXJhbVs3XSAqIGRvZyArIHBhcmFtWzRdICogZGZnICsgcGFyYW1bMV0gKiBkaWc7XG5cbiAgICAgICAgICAgIEEucHJldi5sc3RtLmNlbGxzLmR3LmRbaV0gPSBkY187XG4gICAgICAgICAgICBBLnByZXYuZHcuZFtpXSArPSBkaF87IC8vIGFkZCB0byBhbHJlYWR5IGJhY2twcm9wcGVkIHZhbHVlXG4gICAgICAgICAgICBWLmR3LmRbaV0gPSBkeDtcblxuICAgICAgICAgICAgUEFSQU0uZHcuZFswXSArPSB4ICogZGlnO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFsxXSArPSBoXyAqIGRpZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbMl0gKz0gY18gKiBkaWc7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzNdICs9IHggKiBkZmc7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzRdICs9IGhfICogZGZnO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFs1XSArPSBjXyAqIGRmZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbNl0gKz0geCAqIGRvZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbN10gKz0gaF8gKiBkb2c7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzhdICs9IGMgKiBkb2c7XG5cbiAgICAgICAgICAgIEJJQVMuZHcuZFtpICogMyArIDBdICs9IDEuMCAqIGRpZztcbiAgICAgICAgICAgIEJJQVMuZHcuZFtpICogMyArIDFdICs9IDEuMCAqIGRmZztcbiAgICAgICAgICAgIEJJQVMuZHcuZFtpICogMyArIDJdICs9IDEuMCAqIGRvZztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIucHJvdG90eXBlLlByZXBhcmVTdGF0ZUJsb2IgPSBmdW5jdGlvbihBKSB7XG4gICAgICAgIGlmICh0eXBlb2YgQS5zdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIEEubHN0bSA9IHtcbiAgICAgICAgICAgICAgICBjZWxsczogbmV3IGxpYi5CbG9iKHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApLFxuICAgICAgICAgICAgICAgIGdhdGVzOiB7IGluIDogbmV3IGxpYi5NYXQodGhpcy5vdXQueCwgdGhpcy5vdXQueSwgdGhpcy5vdXQuZGVwdGgsIDAuMCksXG4gICAgICAgICAgICAgICAgICAgIG91dDogbmV3IGxpYi5NYXQodGhpcy5vdXQueCwgdGhpcy5vdXQueSwgdGhpcy5vdXQuZGVwdGgsIDAuMCksXG4gICAgICAgICAgICAgICAgICAgIGZvcmdldDogbmV3IGxpYi5NYXQodGhpcy5vdXQueCwgdGhpcy5vdXQueSwgdGhpcy5vdXQuZGVwdGgsIDAuMClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQS5sc3RtLmNlbGxzLncuYWxsKDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxpYi5Mb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIgPSBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXI7XG59KShubmpzKTtcbiIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuICAgIGZ1bmN0aW9uIFNpZ21vaWRMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG4gICAgfTtcblxuICAgIFNpZ21vaWRMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgQS53LmRbaV0gPSAxLjAvKDEuMCtNYXRoLmV4cCgtVi53LmRbaV0pKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFNpZ21vaWRMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIFYuZHcuZFtpXSA9IEEudy5kW2ldICogKC1BLncuZFtpXSArIDEuMCkgKiBBLmR3LmRbaV07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gUmVsdUxheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5pbnB1dDtcbiAgICB9O1xuXG4gICAgUmVsdUxheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBBLncuZFtpXSA9IFYudy5kW2ldIDwgMCA/IDAgOiBWLncuZFtpXTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFJlbHVMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmKEEudy5kW2ldIDw9IDApIFYuZHcuZFtpXSA9IDA7IC8vIHRocmVzaG9sZFxuICAgICAgICAgICAgZWxzZSBWLmR3LmRbaV0gPSBBLmR3LmRbaV07XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gVGFuaExheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5pbnB1dDtcbiAgICB9O1xuXG4gICAgVGFuaExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBBLncuZFtpXSA9IGxpYi5NYXRoVS50YW5oKFYudy5kW2ldKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIFRhbmhMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIFYuZHcuZFtpXSA9ICgxLjAgLSBBLncuZFtpXSAqIEEudy5kW2ldKSAqIEEuZHcuZFtpXTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIuU2lnbW9pZExheWVyID0gU2lnbW9pZExheWVyO1xuICAgIGxpYi5SZWx1TGF5ZXIgPSBSZWx1TGF5ZXI7XG4gICAgbGliLlRhbmhMYXllciA9IFRhbmhMYXllcjtcbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgZnVuY3Rpb24gUmVncmVzc2lvbkxheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5pbnB1dDtcbiAgICB9O1xuXG4gICAgUmVncmVzc2lvbkxheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcbiAgICAgICAgQS53LndyaXRlKFYudyk7XG4gICAgfTtcblxuICAgIFJlZ3Jlc3Npb25MYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgViwgZGVzaXJlZCkge1xuICAgICAgICB2YXIgbG9zcyA9IDAuMDtcbiAgICAgICAgaWYoZGVzaXJlZCBpbnN0YW5jZW9mIEFycmF5IHx8IGRlc2lyZWQgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpIHtcbiAgICAgICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgICAgIFYuZHcuZFtpXSA9IEEudy5kW2ldIC0gZGVzaXJlZFtpXTtcbiAgICAgICAgICAgICAgICBsb3NzICs9IDAuNSpWLmR3LmRbaV0qVi5kdy5kW2ldO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIGxvc3M7XG4gICAgfTtcblxuICAgIGxpYi5SZWdyZXNzaW9uTGF5ZXIgPSBSZWdyZXNzaW9uTGF5ZXI7XG5cbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgZnVuY3Rpb24gU29mdG1heExheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IGxpYi5TaXplMygxLCAxLCB0aGlzLmluLnggKiB0aGlzLmluLnkgKiB0aGlzLmluLmRlcHRoKTtcbiAgICAgICAgdGhpcy5jbGFzc2VzID0gdGhpcy5vdXQuZGVwdGg7XG4gICAgfTtcblxuICAgIFNvZnRtYXhMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG4gICAgICAgIC8vIGNvbXB1dGUgbWF4IGFjdGl2YXRpb25cbiAgICAgICAgdmFyIGFtYXggPSBWLncuZFswXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuICAgICAgICAgICAgaWYoVi53LmRbaV0gPiBhbWF4KSBhbWF4ID0gVi53LmRbaV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjb21wdXRlIGV4cG9uZW50aWFscyAoY2FyZWZ1bGx5IHRvIG5vdCBibG93IHVwKVxuICAgICAgICB2YXIgZXMgPSBsaWIuTWF0LkNyZWF0ZUFycmF5KHRoaXMub3V0LmRlcHRoLCAwLjApLCBlc3VtID0gMC4wO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2xhc3NlczsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgZSA9IE1hdGguZXhwKFYudy5kW2ldIC0gYW1heCk7XG4gICAgICAgICAgICBlc3VtICs9IGU7XG4gICAgICAgICAgICBlc1tpXSA9IGU7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBub3JtYWxpemUgYW5kIG91dHB1dCB0byBzdW0gdG8gb25lXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcbiAgICAgICAgICAgIGVzW2ldIC89IGVzdW07XG4gICAgICAgICAgICBBLncuZFtpXSA9IGVzW2ldO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEEudy5tYXhpKCk7XG4gICAgfTtcblxuICAgIFNvZnRtYXhMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgViwgZGVzaXJlZCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2xhc3NlczsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgaW5kaWNhdG9yID0gaSA9PT0gZGVzaXJlZCA/IDEuMCA6IDAuMDtcbiAgICAgICAgICAgIFYuZHcuZFtpXSA9IEEudy5kW2ldIC0gaW5kaWNhdG9yO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gbG9zcyBpcyB0aGUgY2xhc3MgbmVnYXRpdmUgbG9nIGxpa2VsaWhvb2RcbiAgICAgICAgcmV0dXJuIC1NYXRoLmxvZyhBLncuZFtkZXNpcmVkXSk7XG4gICAgfTtcblxuICAgIC8qIGFwcHJveC4gMzAweCBmYXN0ZXIgdGhhbiBzb2Z0bWF4LCBkZWNyZWFzZSBpbiBhY2N1cmFjeSBhbmQgcGVyZm9ybWFuY2UgKi9cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gdHJlZSBbb2JqZWN0XSBvciBjbGFzc2VzIFtpbnRdXG4gICAgICovXG4gICAgZnVuY3Rpb24gSGllcmFyY2hpY2FsU29mdG1heChvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcblxuICAgICAgICBpZiAob3B0LnRyZWUpIHtcbiAgICAgICAgICAgIHRoaXMudHJlZSA9IG9wdC50cmVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy50cmVlID0gdGhpcy5CdWlsZFRyZWUob3B0LmNsYXNzZXMpO1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5QcmVwYXJlVHJlZSgpO1xuXG4gICAgICAgIGFzc2VydChvcHQuY2xhc3NlcyA9PT0gdW5kZWZpbmVkIHx8IChvcHQuY2xhc3NlcyA9PT0gdGhpcy5jbGFzc2VzKSwgJ0hpZXJhcmNoaWNhbFNvZnRtYXg6IHRyZWUgbm90IHN1cHBvcnRlZCcpO1xuXG4gICAgICAgIHRoaXMubm9kZXMgPSB0aGlzLmNsYXNzZXMgLSAxO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgICBmaWx0ZXJzOiBbXSxcbiAgICAgICAgICAgIGJpYXNlczogbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMubm9kZXMsIDAuMClcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubm9kZXM7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5pbi5sZW5ndGgpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUiA9IDA7XG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUiA9IDE7XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5CdWlsZFRyZWUgPSBmdW5jdGlvbiAoY2xhc3Nlcykge1xuICAgICAgICAvLyBjcmVhdGUgdHJlZSBvZiBzaXplIGxvZyhjbGFzc2VzKVxuICAgICAgICB2YXIgZGVwdGggPSBNYXRoLmZsb29yKE1hdGgubG9nMihjbGFzc2VzKSk7XG4gICAgICAgIHZhciB0cmVlID0gdGhpcy5DcmVhdGVOb2RlKGRlcHRoLCBudWxsKTtcblxuICAgICAgICAvLyBhZGQgcmVtYWluaW5nIG5vZGVzIHRvIHRyZWVcbiAgICAgICAgdmFyIHJlbWFpbmRlciA9IGNsYXNzZXMgLSBNYXRoLnBvdygyLCBkZXB0aCk7XG4gICAgICAgIHRoaXMudHJhdmVyc2UodHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcbiAgICAgICAgICAgIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IgJiYgcmVtYWluZGVyID4gMCkge1xuICAgICAgICAgICAgICAgIG5vZGUudHlwZSA9IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUjtcbiAgICAgICAgICAgICAgICBub2RlLmEgPSB0aGlzLkNyZWF0ZU5vZGUoMCwgbm9kZSk7XG4gICAgICAgICAgICAgICAgbm9kZS5iID0gdGhpcy5DcmVhdGVOb2RlKDAsIG5vZGUpO1xuXG4gICAgICAgICAgICAgICAgcmVtYWluZGVyLS07XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gdHJlZTtcbiAgICB9OyBcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLlByZXBhcmVUcmVlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc2VsID0gMCwgcHRyID0gMCwgdGFibGUgPSB7fTtcbiAgICAgICAgdGhpcy50cmF2ZXJzZSh0aGlzLnRyZWUsIGZ1bmN0aW9uIChub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SKSB7XG4gICAgICAgICAgICAgICAgdGFibGVbc2VsXSA9IG5vZGU7XG4gICAgICAgICAgICAgICAgbm9kZS5pbmRleCA9IHNlbDtcbiAgICAgICAgICAgICsrc2VsO31cblxuICAgICAgICAgICAgZWxzZSBpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVIpIHtcbiAgICAgICAgICAgICAgICBub2RlLmluZGV4ID0gcHRyO1xuICAgICAgICAgICAgcHRyKys7fVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgdGhpcy5jbGFzc2VzID0gc2VsO1xuICAgICAgICB0aGlzLm5vZGVzID0gcHRyO1xuICAgICAgICB0aGlzLnRhYmxlID0gdGFibGU7XG4gICAgfTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLkNyZWF0ZU5vZGUgPSBmdW5jdGlvbiAoZGVwdGgsIHBhcmVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IHsgcGFyZW50OiBwYXJlbnQgfTtcblxuICAgICAgICBpZiAoZGVwdGggPD0gMCkge1xuICAgICAgICAgICAgbm9kZS50eXBlID0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUjtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIG5vZGUudHlwZSA9IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUjtcbiAgICAgICAgICAgIG5vZGUuYSA9IHRoaXMuQ3JlYXRlTm9kZShkZXB0aC0xLCBub2RlKTtcbiAgICAgICAgICAgIG5vZGUuYiA9IHRoaXMuQ3JlYXRlTm9kZShkZXB0aC0xLCBub2RlKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBub2RlO1xuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS50cmF2ZXJzZSA9IGZ1bmN0aW9uIChub2RlLCBjYikge1xuICAgICAgICBpZiAoY2IuY2FsbCh0aGlzLCBub2RlKSAmJiBub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuICAgICAgICAgICAgdGhpcy50cmF2ZXJzZShub2RlLmEsIGNiKTtcbiAgICAgICAgICAgIHRoaXMudHJhdmVyc2Uobm9kZS5iLCBjYik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuYXNjZW5kID0gZnVuY3Rpb24gKG5vZGUsIGNiKSB7XG4gICAgICAgIGlmIChub2RlLnBhcmVudCA9PT0gbnVsbCkgcmV0dXJuIDtcbiAgICAgICAgY2IuY2FsbCh0aGlzLCBub2RlLnBhcmVudCwgbm9kZSA9PT0gbm9kZS5wYXJlbnQuYSA/IC0xLjAgOiAxLjApO1xuICAgICAgICB0aGlzLmFzY2VuZChub2RlLnBhcmVudCwgY2IpO1xuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5kZXNjZW5kID0gZnVuY3Rpb24gKG5vZGUsIGNiKSB7XG4gICAgICAgIHZhciBkID0gY2IuY2FsbCh0aGlzLCBub2RlKTtcblxuICAgICAgICBpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SIHx8IGQgaW5zdGFuY2VvZiBPYmplY3QgfHwgZCA9PT0gbnVsbCkge1xuICAgICAgICAgICAgcmV0dXJuIGQ7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoZCA+IDAuMCkgeyAvLyBuZWdhdGl2ZSBtZWFucyBsZWZ0LCBwb3NpdGl2ZSBtZWFucyByaWdodFxuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZGVzY2VuZChub2RlLmIsIGNiKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmRlc2NlbmQobm9kZS5hLCBjYik7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgSGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbiAoViwgaSkge1xuICAgICAgICB2YXIgc3VtID0gMC4wO1xuICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgIHN1bSArPSBWLncuZFtqXSAqIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBsaWIuTWF0aFUudGFuaCh0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncuZFtpXSArIHN1bSk7XG4gICAgfTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmdyYWRpZW50ID0gZnVuY3Rpb24gKFYsIGksIGRpcmVjdGlvbikge1xuICAgICAgICB2YXIgYWN0ID0gdGhpcy5hY3RpdmF0ZShWLCBpKSxcbiAgICAgICAgICAgICAgICBlcnIgPSBhY3QgLSBkaXJlY3Rpb247XG5cbiAgICAgICAgdmFyIGR3ID0gKDEuMCAtIGFjdCAqIGFjdCkgKiBlcnI7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLm5vY2hhbmdlID0gZmFsc2U7XG5cbiAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5kdy5kW2pdICs9IFYudy5kW2pdICogZHc7XG4gICAgICAgICAgICBWLmR3LmRbal0gKz0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdICogZHc7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLmR3LmRbaV0gKz0gZHc7XG5cbiAgICAgICAgcmV0dXJuIChkaXJlY3Rpb24gPCAwID8gMSAtIChhY3QgKiAwLjUgKyAwLjUpIDogKGFjdCAqIDAuNSArIDAuNSkpOyAvLyBwcm9iYWJpbGl0eSB0byBnbyB0aGUgcmlnaHQgd2F5XG4gICAgfTtcblxuICAgIEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuICAgICAgICB2YXIgc2VsZWN0ZWQgPSB0aGlzLmRlc2NlbmQodGhpcy50cmVlLCBmdW5jdGlvbiAobm9kZSkge1xuICAgICAgICAgICAgaWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuYWN0aXZhdGUoViwgbm9kZS5pbmRleCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUikge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIChBLmluZGV4ID0gc2VsZWN0ZWQuaW5kZXgpO1xuICAgIH07XG5cbiAgICBIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWLCBkZXNpcmVkKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLm5vY2hhbmdlID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBwcm9iID0gMS4wO1xuICAgICAgICB0aGlzLmFzY2VuZCh0aGlzLnRhYmxlW2Rlc2lyZWRdLCBmdW5jdGlvbiAobm9kZSwgZGlyZWN0aW9uKSB7XG4gICAgICAgICAgICBwcm9iID0gcHJvYiAqIHRoaXMuZ3JhZGllbnQoViwgbm9kZS5pbmRleCwgZGlyZWN0aW9uKTtcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIDEuMCAtIHByb2I7IC8vIHByb2JhYmlsaXR5IHRvIE5PVCBnbyB0aGUgcmlnaHQgd2F5XG4gICAgfTtcblxuICAgIGxpYi5Tb2Z0bWF4TGF5ZXIgPSBTb2Z0bWF4TGF5ZXI7XG4gICAgbGliLkhpZXJhcmNoaWNhbFNvZnRtYXggPSBIaWVyYXJjaGljYWxTb2Z0bWF4O1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICBpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHsgLy8gd2ViIHdvcmtlciBzdXBwb3J0OyBqdXN0IHVzZSBubmpzIGluIHdlYiB3b3JrZXJcbiAgICAgICAgICAgIHdpbmRvdy5ubiA9IGxpYjtcbiAgICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbGliO1xuICAgIH1cbiAgICBcbn0pKG5uanMpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
