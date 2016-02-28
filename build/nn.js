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
        for (var t = 0; t < this.height + 1; t++) {
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
		A.px = lib.Mat.CreateArray(this.out.depth * this.out.y * this.out.x, 0, 'Uint16Array');
		A.py = lib.Mat.CreateArray(this.out.depth * this.out.y * this.out.x, 0, 'Uint16Array');
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5uLmluaXQuanMiLCJubi5tYXRoLmpzIiwiYXBpL25ldHdvcmsubm4uanMiLCJsYXllcnMvY29udm9sdXRpb25hbC5ubi5qcyIsImxheWVycy9kb3Qubm4uanMiLCJsYXllcnMvZHJvcG91dC5ubi5qcyIsImxheWVycy9pbnB1dC5ubi5qcyIsImxheWVycy9sc3RtLm5uLmpzIiwibGF5ZXJzL25vbi1saW5lYXIubm4uanMiLCJsYXllcnMvcmVncmVzc2lvbi5ubi5qcyIsImxheWVycy9zb2Z0bWF4Lm5uLmpzIiwibm4uZXhwb3J0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDalVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6Im5uLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIG5uanMgPSB7fTtcblxuLy8gVXRpbGl0eSBmdW5cbmZ1bmN0aW9uIGFzc2VydChjb25kaXRpb24sIG1lc3NhZ2UpIHtcbiAgICAvLyBmcm9tIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvMTUzMTM0MTgvamF2YXNjcmlwdC1hc3NlcnRcbiAgICBpZiAoIWNvbmRpdGlvbikge1xuICAgICAgICBtZXNzYWdlID0gbWVzc2FnZSB8fCBcIkFzc2VydGlvbiBmYWlsZWRcIjtcbiAgICAgICAgaWYgKHR5cGVvZiBFcnJvciAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKG1lc3NhZ2UpO1xuICAgICAgICB9XG4gICAgICAgIHRocm93IG1lc3NhZ2U7IC8vIEZhbGxiYWNrXG4gICAgfVxufVxuXG4oZnVuY3Rpb24oKSB7XCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIGhhc093biA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG4gICAgdmFyIHRvU3RyID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcblxuICAgIHZhciBpc0FycmF5ID0gZnVuY3Rpb24gaXNBcnJheShhcnIpIHtcbiAgICAgICAgaWYgKHR5cGVvZiBBcnJheS5pc0FycmF5ID09PSAnZnVuY3Rpb24nKSB7XG4gICAgICAgICAgICByZXR1cm4gQXJyYXkuaXNBcnJheShhcnIpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHRvU3RyLmNhbGwoYXJyKSA9PT0gJ1tvYmplY3QgQXJyYXldJztcbiAgICB9O1xuXG4gICAgdmFyIGlzUGxhaW5PYmplY3QgPSBmdW5jdGlvbiBpc1BsYWluT2JqZWN0KG9iaikge1xuICAgICAgICBpZiAoIW9iaiB8fCB0b1N0ci5jYWxsKG9iaikgIT09ICdbb2JqZWN0IE9iamVjdF0nKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaGFzT3duQ29uc3RydWN0b3IgPSBoYXNPd24uY2FsbChvYmosICdjb25zdHJ1Y3RvcicpO1xuICAgICAgICB2YXIgaGFzSXNQcm90b3R5cGVPZiA9IG9iai5jb25zdHJ1Y3RvciAmJiBvYmouY29uc3RydWN0b3IucHJvdG90eXBlICYmIGhhc093bi5jYWxsKG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUsICdpc1Byb3RvdHlwZU9mJyk7XG4gICAgICAgIC8vIE5vdCBvd24gY29uc3RydWN0b3IgcHJvcGVydHkgbXVzdCBiZSBPYmplY3RcbiAgICAgICAgaWYgKG9iai5jb25zdHJ1Y3RvciAmJiAhaGFzT3duQ29uc3RydWN0b3IgJiYgIWhhc0lzUHJvdG90eXBlT2YpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIE93biBwcm9wZXJ0aWVzIGFyZSBlbnVtZXJhdGVkIGZpcnN0bHksIHNvIHRvIHNwZWVkIHVwLFxuICAgICAgICAvLyBpZiBsYXN0IG9uZSBpcyBvd24sIHRoZW4gYWxsIHByb3BlcnRpZXMgYXJlIG93bi5cbiAgICAgICAgdmFyIGtleTtcbiAgICAgICAgZm9yIChrZXkgaW4gb2JqKSB7IC8qKi8gfVxuXG4gICAgICAgIHJldHVybiB0eXBlb2Yga2V5ID09PSAndW5kZWZpbmVkJyB8fCBoYXNPd24uY2FsbChvYmosIGtleSk7XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIGV4dGVuZCgpIHtcbiAgICAgICAgdmFyIG9wdGlvbnMsIG5hbWUsIHNyYywgY29weSwgY29weUlzQXJyYXksIGNsb25lO1xuICAgICAgICB2YXIgdGFyZ2V0ID0gYXJndW1lbnRzWzBdO1xuICAgICAgICB2YXIgaSA9IDE7XG4gICAgICAgIHZhciBsZW5ndGggPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgICAgICB2YXIgZGVlcCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIEhhbmRsZSBhIGRlZXAgY29weSBzaXR1YXRpb25cbiAgICAgICAgaWYgKHR5cGVvZiB0YXJnZXQgPT09ICdib29sZWFuJykge1xuICAgICAgICAgICAgZGVlcCA9IHRhcmdldDtcbiAgICAgICAgICAgIHRhcmdldCA9IGFyZ3VtZW50c1sxXSB8fCB7fTtcbiAgICAgICAgICAgIC8vIHNraXAgdGhlIGJvb2xlYW4gYW5kIHRoZSB0YXJnZXRcbiAgICAgICAgICAgIGkgPSAyO1xuICAgICAgICB9IGVsc2UgaWYgKCh0eXBlb2YgdGFyZ2V0ICE9PSAnb2JqZWN0JyAmJiB0eXBlb2YgdGFyZ2V0ICE9PSAnZnVuY3Rpb24nKSB8fCB0YXJnZXQgPT0gbnVsbCkge1xuICAgICAgICAgICAgdGFyZ2V0ID0ge307XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBvcHRpb25zID0gYXJndW1lbnRzW2ldO1xuICAgICAgICAgICAgLy8gT25seSBkZWFsIHdpdGggbm9uLW51bGwvdW5kZWZpbmVkIHZhbHVlc1xuICAgICAgICAgICAgaWYgKG9wdGlvbnMgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIEV4dGVuZCB0aGUgYmFzZSBvYmplY3RcbiAgICAgICAgICAgICAgICBmb3IgKG5hbWUgaW4gb3B0aW9ucykge1xuICAgICAgICAgICAgICAgICAgICBzcmMgPSB0YXJnZXRbbmFtZV07XG4gICAgICAgICAgICAgICAgICAgIGNvcHkgPSBvcHRpb25zW25hbWVdO1xuXG4gICAgICAgICAgICAgICAgICAgIC8vIFByZXZlbnQgbmV2ZXItZW5kaW5nIGxvb3BcbiAgICAgICAgICAgICAgICAgICAgaWYgKHRhcmdldCAhPT0gY29weSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gUmVjdXJzZSBpZiB3ZSdyZSBtZXJnaW5nIHBsYWluIG9iamVjdHMgb3IgYXJyYXlzXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoZGVlcCAmJiBjb3B5ICYmIChpc1BsYWluT2JqZWN0KGNvcHkpIHx8IChjb3B5SXNBcnJheSA9IGlzQXJyYXkoY29weSkpKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmIChjb3B5SXNBcnJheSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb3B5SXNBcnJheSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiBpc0FycmF5KHNyYykgPyBzcmMgOiBbXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjbG9uZSA9IHNyYyAmJiBpc1BsYWluT2JqZWN0KHNyYykgPyBzcmMgOiB7fTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBOZXZlciBtb3ZlIG9yaWdpbmFsIG9iamVjdHMsIGNsb25lIHRoZW1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0gPSBleHRlbmQoZGVlcCwgY2xvbmUsIGNvcHkpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gRG9uJ3QgYnJpbmcgaW4gdW5kZWZpbmVkIHZhbHVlc1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgY29weSAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0YXJnZXRbbmFtZV0gPSBjb3B5O1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gUmV0dXJuIHRoZSBtb2RpZmllZCBvYmplY3RcbiAgICAgICAgcmV0dXJuIHRhcmdldDtcbiAgICB9O1xuXG4gICAgT2JqZWN0LmV4dGVuZCA9IGV4dGVuZDtcbn0pKCk7XG4iLCIoZnVuY3Rpb24obGliKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG4gICAgdmFyIG1hdGggPSB7XG4gICAgICAgIGdhdXNzXzogeyBhOiBmYWxzZSwgYjogMC4wIH0sXG4gICAgICAgIGdhdXNzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmIChtYXRoLmdhdXNzXy5hKSB7IG1hdGguZ2F1c3NfLmEgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICByZXR1cm4gbWF0aC5nYXVzc18uYjsgfVxuICAgICAgICAgICAgdmFyIHUgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG4gICAgICAgICAgICB2YXIgdiA9IDIgKiBNYXRoLnJhbmRvbSgpIC0gMTtcbiAgICAgICAgICAgIHZhciByID0gdSAqIHUgKyB2ICogdjtcbiAgICAgICAgICAgIGlmIChyID09IDAgfHwgciA+IDEpIHJldHVybiBtYXRoLmdhdXNzKCk7XG4gICAgICAgICAgICB2YXIgYyA9IE1hdGguc3FydCgtMiAqIE1hdGgubG9nKHIpIC8gcik7XG4gICAgICAgICAgICBtYXRoLmdhdXNzXy5iID0gdiAqIGM7IC8vIGNhY2hlIHRoaXNcbiAgICAgICAgICAgIG1hdGguZ2F1c3NfLmEgPSB0cnVlO1xuICAgICAgICAgICAgcmV0dXJuIHUgKiBjO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJhbmRmOiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5yYW5kb20oKSAqIChiIC0gYSkgKyBhO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJhbmRpOiBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgICByZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogKGIgLSBhKSArIGEpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJhbmRuOiBmdW5jdGlvbihtdSwgc3RkKSB7XG4gICAgICAgICAgICByZXR1cm4gbXUgKyBtYXRoLmdhdXNzKCkgKiBzdGQ7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdGFuaDogdHlwZW9mIE1hdGgudGFuaCA9PT0gXCJ1bmRlZmluZWRcIiA/IGZ1bmN0aW9uKHgpIHtcbiAgICAgICAgICAgIHZhciB5ID0gTWF0aC5leHAoMiAqIHgpO1xuICAgICAgICAgICAgcmV0dXJuICh5IC0gMSkgLyAoeSArIDEpOyB9IDogTWF0aC50YW5oXG4gICAgfTtcblxuICAgIC8vXG4gICAgLy9cbiAgICAvL1xuICAgIGZ1bmN0aW9uIFNpemUyKHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHsgeDogeCwgeTogeSwgbGVuZ3RoOiB4ICogeSB9O1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBTaXplMyh4LCB5LCB6KSB7XG4gICAgICAgIHJldHVybiB7IHg6IHgsIHk6IHksIGRlcHRoOiB6LCBsZW5ndGg6IHggKiB5ICogeiB9O1xuICAgIH07XG5cblxuICAgIC8vXG4gICAgLy9cbiAgICAvL1xuICAgIGZ1bmN0aW9uIE1hdCh4LCB5LCB6LCB2KSB7XG4gICAgICAgIHRoaXMuc2l6ZSA9IGxpYi5TaXplMyh4LCB5LCB6KTtcbiAgICAgICAgdGhpcy5kID0gTWF0LkNyZWF0ZUFycmF5KHggKiB5ICogeiwgdiA9PT0gdW5kZWZpbmVkID8gMC4wIDogdiwgJ0Zsb2F0NjRBcnJheScpO1xuICAgIH07XG5cbiAgICBNYXQuQ3JlYXRlQXJyYXkgPSBmdW5jdGlvbihsZW5ndGgsIHYsIHQpIHtcbiAgICAgICAgdmFyIGFyciA9IG51bGw7XG5cbiAgICAgICAgdiA9IHYgfHwgMDtcbiAgICAgICAgdCA9IHQgfHwgJ0Zsb2F0NjRBcnJheSc7XG5cbiAgICAgICAgaWYgKHR5cGVvZiBBcnJheUJ1ZmZlciA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIGFyciA9IG5ldyBBcnJheShsZW5ndGgpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgYXJyID0gZXZhbCgnbmV3ICcgKyB0ICsgJyhsZW5ndGgpJyk7XG4gICAgICAgIH1cblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgKytpKSB7IGFycltpXSA9IHY7IH1cbiAgICAgICAgcmV0dXJuIGFycjtcbiAgICB9O1xuXG4gICAgTWF0LmNvcHkgPSBmdW5jdGlvbihtYXQpIHtcbiAgICAgICAgdmFyIG1hdF8gPSBuZXcgbWF0KG1hdC5zaXplLngsIG1hdC5zaXplLnksIG1hdC5zaXplLmRlcHRoKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBtYXQuZC5sZW5ndGg7IGkrKykgeyBtYXRfLmRbaV0gPSBtYXQuZFtpXTsgfVxuICAgICAgICByZXR1cm4gbWF0XztcbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5tYXhpID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBqID0gMCwgbSA9IC1JbmZpbml0eTsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMuZFtpXSA+IG0pIHtcbiAgICAgICAgICAgICAgICBqID0gaSwgbSA9IHRoaXMuZFtpXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBqO1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uKHgsIHksIHopIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZFsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyB6XTtcbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbih4LCB5LCB6LCB2KSB7XG4gICAgICAgIHRoaXMuZFsoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyB6XSA9IHY7XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuYWRkID0gZnVuY3Rpb24oeCwgeSwgeiwgdikge1xuICAgICAgICB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgel0gKz0gdjtcbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbih2KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IHY7IH1cbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5jb3B5ID0gZnVuY3Rpb24oYSwgcywgYikge1xuICAgICAgICBpZiAocyA9PT0gdW5kZWZpbmVkKSBzID0gMTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gYVtpXSAvIHMgKyBiOyB9XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbihhKSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IGEuZFtpXTsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLnJhbmRmID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBtYXRoLnJhbmRmKGEsIGIpOyB9XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUucmFuZG4gPSBmdW5jdGlvbihzY2FsZSkge1xuICAgICAgICBzY2FsZSA9IHNjYWxlIHx8IE1hdGguc3FydCgxLjAgLyAodGhpcy5zaXplLnggKiB0aGlzLnNpemUueSAqIHRoaXMuc2l6ZS5kZXB0aCkpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBtYXRoLnJhbmRuKDAuMCwgc2NhbGUpOyB9XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuY2xvbmUgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIG1hdC5jb3B5KHRoaXMpO1xuICAgIH07XG5cbiAgICAvLyBhY2Nlc3NvclxuICAgIC8vIFsgKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgeiBdXG5cblxuICAgIGZ1bmN0aW9uIEJsb2IoeCwgeSwgeiwgYSwgYikge1xuICAgICAgICB0aGlzLnNpemUgPSBsaWIuU2l6ZTMoeCwgeSwgeik7XG4gICAgICAgIHRoaXMudyA9IG5ldyBNYXQoeCwgeSwgeik7XG4gICAgICAgIHRoaXMuZHcgPSBuZXcgTWF0KHgsIHksIHopO1xuXG4gICAgICAgIGlmIChhICE9PSB1bmRlZmluZWQgJiYgYiAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICB0aGlzLncucmFuZGYoYSwgYik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLncucmFuZG4oKTtcbiAgICAgICAgfVxuXG4gICAgfTtcblxuICAgIGxpYi5NYXRoVSA9IG1hdGg7XG4gICAgbGliLlNpemUyID0gU2l6ZTI7XG4gICAgbGliLlNpemUzID0gU2l6ZTM7XG4gICAgbGliLk1hdCA9IE1hdDtcbiAgICBsaWIuQmxvYiA9IEJsb2I7XG5cbn0pKG5uanMpO1xuIiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgZnVuY3Rpb24sIHRoYXQgY29udmVydHMgYSBkZXNjcmlwdGlvbiBpbnRvIGFuIGFjdHVhbCBsYXllciBvYmplY3RcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGVzY3JpcHRpb25cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBMYXllcihvcHQsIG5ldCkge1xuICAgICAgICBzd2l0Y2ggKG9wdC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdpbnB1dCc6IHJldHVybiBuZXcgbGliLklucHV0TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnZG90JzogcmV0dXJuIG5ldyBsaWIuRG90TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnY29udic6IHJldHVybiBuZXcgbGliLkNvbnZvbHV0aW9uYWxMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdsc3RtJzogcmV0dXJuIG5ldyBsaWIuTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3Bvb2wnOiByZXR1cm4gbmV3IGxpYi5Qb29saW5nTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnc2lnbW9pZCc6IHJldHVybiBuZXcgbGliLlNpZ21vaWRMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdyZWx1JzogcmV0dXJuIG5ldyBsaWIuUmVsdUxheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3RhbmgnOiByZXR1cm4gbmV3IGxpYi5UYW5oTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnZHJvcG91dCc6IHJldHVybiBuZXcgbGliLkRyb3BPdXRMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdzb2Z0bWF4JzogcmV0dXJuIG5ldyBsaWIuU29mdG1heExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2hzbSc6IHJldHVybiBuZXcgbGliLkhpZXJhcmNoaWNhbFNvZnRtYXgob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAncmVncmVzc2lvbic6IHJldHVybiBuZXcgbGliLlJlZ3Jlc3Npb25MYXllcihvcHQsIG5ldCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBmdW5jdGlvbiBOZXR3b3JrU3RydWN0dXJlKGRlc2MsIG5ldCkge1xuICAgICAgICB0aGlzLm5ldCA9IG5ldDtcbiAgICAgICAgdGhpcy5kZXNjcmlwdGlvbiA9IGRlc2M7XG4gICAgICAgIHRoaXMubGVuZ3RoID0gZGVzYy5sZW5ndGg7IC8vIGNvbnZpZW5pZW5jZVxuICAgICAgICB0aGlzLnJlY3VycmVudCA9IGZhbHNlO1xuXG4gICAgICAgIHRoaXMuQnVpbGQoKTtcbiAgICB9O1xuXG4gICAgTmV0d29ya1N0cnVjdHVyZS5wcm90b3R5cGUuQnVpbGQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHRoaXMubGlzdCA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGVzY3JpcHRpb24ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmIChpID4gMCkge1xuICAgICAgICAgICAgICAgIHRoaXMuZGVzY3JpcHRpb25baV0uaW5wdXQgPSB0aGlzLmxpc3RbaSAtIDFdLm91dDsgLy8gc2V0IGlucHV0IHRvIHRoaXMgbGF5ZXIgdG8gdGhlIG91dHB1dCBvZiBsYXN0IGxheWVyXG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRoaXMubGlzdFtpXSA9IExheWVyKHRoaXMuZGVzY3JpcHRpb25baV0sIHRoaXMubmV0KTtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGlzdFtpXS5yZWN1cnJlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlY3VycmVudCA9IHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9OyAgXG5cbiAgICBOZXR3b3JrU3RydWN0dXJlLnByb3RvdHlwZS5zdGF0cyA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHN0YXRzID0geyBwYXJhbWV0ZXJzOiAwIH07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5saXN0W2ldLnBhcmFtZXRlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuZmlsdGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHN0YXRzLnBhcmFtZXRlcnMgKz0gdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuZmlsdGVyc1tqXS5zaXplLmxlbmd0aDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhdHMucGFyYW1ldGVycyArPSB0aGlzLmxpc3RbaV0ucGFyYW1ldGVycy5iaWFzZXMuc2l6ZS5sZW5ndGg7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHM7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdHJ1Y3R1cmUucHJvdG90eXBlLnBhcmFtZXRlcnMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBwYXJhbWV0ZXJzID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodGhpcy5saXN0W2ldLnBhcmFtZXRlcnMgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICAgICAgICAgIHZhciBvYmplY3QgPSB7IGZpbHRlcnM6IFtdLCBiaWFzZXM6IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmJpYXNlcy53LmQgfTtcbiAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuZmlsdGVycy5sZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIG9iamVjdC5maWx0ZXJzW2pdID0gdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuZmlsdGVyc1tqXS53LmQ7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHBhcmFtZXRlcnNbaV0gPSBvYmplY3Q7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gcGFyYW1ldGVycztcbiAgICB9O1xuXG4gICAgTmV0d29ya1N0cnVjdHVyZS5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaSkge1xuICAgICAgICBpID0gaSA+PSAwID8gaSA6IHRoaXMubGVuZ3RoICsgaTtcbiAgICAgICAgcmV0dXJuIHRoaXMubGlzdFtpXTtcbiAgICB9O1xuXG4gICAgLy8gY3VycmVudCBzdGF0ZVxuICAgIGZ1bmN0aW9uIE5ldHdvcmtTdGF0ZShuZXQpIHtcbiAgICAgICAgdGhpcy5uZXQgPSBuZXQ7XG4gICAgICAgIHRoaXMubGF5ZXJzID0gbmV0LmxheWVycztcbiAgICAgICAgdGhpcy53aWR0aCA9IG5ldC5sYXllcnMubGVuZ3RoOyAvLyBob3cgbWFueSBsYXllcnM/XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gdGhpcy5sYXllcnMucmVjdXJyZW50ID8gdGhpcy5uZXQubGVhcm5lci50aW1lc3BhbiA6IDE7IC8vIGhvdyBsb25nIGJwdHQ/IC8gdGltZSBzdGVwc1xuICAgICAgICBcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzLnJlY3VycmVudCkge1xuICAgICAgICAgICAgdGhpcy5ibG9icyA9IHRoaXMuQnVpbGQodGhpcy5uZXQubGVhcm5lci50aW1lc3BhbiArIDEpOyAvLyBsYXN0IG9uZSBuZWVkcyByZWZlcmVuY2UgdG8gcHJldmlvdXNcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuYmxvYnMgPSB0aGlzLkJ1aWxkKDEpOyAvLyBvbmx5IG9uZSB0aW1lIG5lZWRlZFxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIFsgWyBzdGF0ZSBmb3IgVD0wIF0sIFsgc3RhdGUgZm9yIFQ9MSBdLCAuLi4gXVxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUuQnVpbGQgPSBmdW5jdGlvbiAoaCwgUykge1xuICAgICAgICB2YXIgVCA9IFtdO1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IGg7IHQrKykge1xuICAgICAgICAgICAgVC51bnNoaWZ0KHRoaXMuQnVpbGRTdGF0ZShULCBTICE9PSB1bmRlZmluZWQgPyBTW3RdIDogdW5kZWZpbmVkKSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gVDtcbiAgICB9O1xuXG4gICAgLy8gWyBbIEJsb2IgZm9yIGxheWVyIDEgXSwgWyBCbG9iIGZvciBsYXllciAyIF0sIC4uLiBdXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5CdWlsZFN0YXRlID0gZnVuY3Rpb24gKFQsIFMpIHtcbiAgICAgICAgUyA9IFMgfHwgW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVycy5saXN0W2ldLm91dCAhPT0gJ3VuZGVmaW5lZCcgJiYgU1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgU1tpXSA9IG5ldyBsaWIuQmxvYih0aGlzLmxheWVycy5saXN0W2ldLm91dC54LCB0aGlzLmxheWVycy5saXN0W2ldLm91dC55LCB0aGlzLmxheWVycy5saXN0W2ldLm91dC5kZXB0aCwgMC4wKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoU1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgU1tpXSA9IHt9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBTW2ldLncuYWxsKDApLCBTW2ldLmR3LmFsbCgwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVycy5saXN0W2ldLnJlY3VycmVudCAhPT0gJ3VuZGVmaW5lZCcgJiYgdGhpcy5sYXllcnMubGlzdFtpXS5yZWN1cnJlbnRcbiAgICAgICAgICAgICAgICAgICAgJiYgVCAhPT0gdW5kZWZpbmVkICYmIFQubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgIFNbaV0ucHJldiA9IFRbMF1baV07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5sYXllcnMubGlzdFtpXS5QcmVwYXJlU3RhdGVCbG9iICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzLmxpc3RbaV0uUHJlcGFyZVN0YXRlQmxvYihTW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBTO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLnJlc2V0ID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmJsb2JzID0gdGhpcy5CdWlsZCh0aGlzLmJsb2JzLmxlbmd0aCwgdGhpcy5ibG9icyk7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUubmV4dCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYgKHRoaXMubGF5ZXJzLnJlY3VycmVudCkgeyAvLyBvbmx5IGlmIHJlY3VycmVudFxuICAgICAgICAgICAgdmFyIFMgPSB0aGlzLmJsb2JzLnBvcCgpO1xuICAgICAgICAgICAgdGhpcy5ibG9icy51bnNoaWZ0KHRoaXMuQnVpbGRTdGF0ZSh0aGlzLmJsb2JzLCBTKSk7IC8vIHJldXNhYmlsaXR5XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMud2lkdGgubGVuZ3RoOyBpKyspIHsgXG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuYmxvYnNbdGhpcy5oZWlnaHRdW2ldLnByZXYpXG4gICAgICAgICAgICAgICAgICAgIHRoaXMuYmxvYnNbdGhpcy5oZWlnaHRdW2ldLnByZXYgPSBudWxsOyBcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGNsZWFuIGdyYWRpZW50c1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IHRoaXMuaGVpZ2h0ICsgMTsgdCsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMud2lkdGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuYmxvYnNbdF1baV0uZHcuYWxsKDAuMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpLCB0KSB7XG4gICAgICAgIHQgPSB0IHx8IDA7XG4gICAgICAgIHQgPSB0ID49IDAgPyB0IDogdGhpcy5oZWlnaHQgKyB0O1xuXG4gICAgICAgIGkgPSBpIHx8IDA7XG4gICAgICAgIGkgPSBpID49IDAgPyBpIDogdGhpcy53aWR0aCArIGk7XG5cbiAgICAgICAgcmV0dXJuIHRoaXMuYmxvYnNbdF1baV07XG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIEBwYXJhbSB7b2JqZWN0fVxuICAgICAqL1xuICAgIGZ1bmN0aW9uIE5ldHdvcmsob3B0KSB7XG4gICAgICAgIHRoaXMubGVhcm5lciA9IG9wdC5sZWFybmVyO1xuICAgICAgICB0aGlzLmxlYXJuZXIgPSBPYmplY3QuZXh0ZW5kKHRydWUsIHtcbiAgICAgICAgICAgIG1ldGhvZDogJ3NnZCcsXG4gICAgICAgICAgICBiYXRjaDogMSxcbiAgICAgICAgICAgIGRlY2F5OiB7IGwxOiAwLCBsMjogMCB9LFxuICAgICAgICAgICAgY2xpcDogSW5maW5pdHksXG4gICAgICAgICAgICB0aW1lc3BhbjogMSAvLyBvbmx5IGZvciBybm5cbiAgICAgICAgfSwgdGhpcy5sZWFybmVyKTtcblxuICAgICAgICB0aGlzLmxlYXJuZXIgPSBPYmplY3QuZXh0ZW5kKHRydWUsIHRoaXMuZ2RbdGhpcy5sZWFybmVyLm1ldGhvZF0uZGVmYXVsdHMsIHRoaXMubGVhcm5lcik7XG4gICAgICAgIHRoaXMud2VhayA9IHRydWU7IC8vIGRyb3BvdXQgZW5hYmxlZD9cbiAgICAgICAgdGhpcy5wYXNzID0gMDtcblxuICAgICAgICB0aGlzLmxheWVycyA9IG5ldyBOZXR3b3JrU3RydWN0dXJlKG9wdC5sYXllcnMsIHRoaXMpO1xuICAgICAgICB0aGlzLnN0YXRlID0gbmV3IE5ldHdvcmtTdGF0ZSh0aGlzKTsgLy8gZXhjaGFuZ2FibGVcbiAgICB9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uKGlucCkge1xuICAgICAgICAvLyBnbyBmb3J3YXJkcyB0aHJvdWdoIG5ldHdvcmtcbiAgICAgICAgdGhpcy5zdGF0ZS5uZXh0KCk7XG4gICAgICAgIHZhciB5ID0gdGhpcy5sYXllcnMubGlzdFswXS5mb3J3YXJkKGlucCwgdGhpcy5zdGF0ZS5hdCgwKSk7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHkgPSB0aGlzLmxheWVycy5saXN0W2ldLmZvcndhcmQodGhpcy5zdGF0ZS5hdChpIC0gMSksIHRoaXMuc3RhdGUuYXQoaSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHkgIT09IHVuZGVmaW5lZCA/IHkgOiB0aGlzLnN0YXRlLmF0KC0xKS53LmQ7XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24ob3V0cCkge1xuICAgICAgICB2YXIgRSA9IGZhbHNlLCBJID0gdGhpcy5sYXllcnMubGVuZ3RoIC0gMjtcblxuICAgICAgICB2YXIgbG9zcyA9IHRoaXMubGF5ZXJzLmF0KC0xKS5iYWNrd2FyZCh0aGlzLnN0YXRlLmF0KC0xKSwgdGhpcy5zdGF0ZS5hdCgtMiksIG91dHApO1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IHRoaXMuc3RhdGUuaGVpZ2h0ICYmIChFIHx8IHQgPT09IDApOyB0KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBJOyBpID49IDA7IGktLSkgeyAvLyBhbHdheXMgc3RhcnQgYmFja3dhcmQgcGFzcyBhdCBsYXN0IHJlY3VycmVudCBsYXllciwgb3IgYXQgc2Vjb25kLWxhc3QgbGF5ZXIgaWYgdD0wXG5cbiAgICAgICAgICAgICAgICBpZighRSAmJiB0aGlzLmxheWVycy5saXN0W2ldLnJlY3VycmVudCkgeyAvLyBleHBhbmQgbmV0d29ya1xuICAgICAgICAgICAgICAgICAgICBFID0gdHJ1ZSwgSSA9IGk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnMubGlzdFtpXS5iYWNrd2FyZCh0aGlzLnN0YXRlLmF0KGksIHQpLCB0aGlzLnN0YXRlLmF0KGkgLSAxLCB0KSk7XG5cbiAgICAgICAgICAgIH0gIFxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hZGp1c3QoKTtcbiAgICAgICAgXG4gICAgICAgIHJldHVybiBsb3NzO1xuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5hZGp1c3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCsrdGhpcy5wYXNzICUgdGhpcy5sZWFybmVyLmJhdGNoICE9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbWV0aG9kID0gdGhpcy5nZFt0aGlzLmxlYXJuZXIubWV0aG9kXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVycy5saXN0W2ldLnBhcmFtZXRlcnMgPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW0gPSB0aGlzLmxheWVycy5saXN0W2ldLnBhcmFtZXRlcnM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtLmZpbHRlcnMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgaiA9IDA7IGogPCBwYXJhbS5maWx0ZXJzLmxlbmd0aDsgaisrKSB7IG1ldGhvZC5jYWxsKHRoaXMsIHRoaXMubGVhcm5lciwgcGFyYW0uZmlsdGVyc1tqXSwgMS4wKTsgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHBhcmFtLmJpYXNlcyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBtZXRob2QuY2FsbCh0aGlzLCB0aGlzLmxlYXJuZXIsIHBhcmFtLmJpYXNlcywgMC4wKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKiBncmFkaWVudCBkZXNjZW50IGFsZ29yaXRobXMgKi9cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5nZCA9IHt9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuZ2Quc2dkID0ge1xuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgcmF0ZTogMC4wMSxcbiAgICAgICAgICAgIG1vbWVudHVtOiAwLjlcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcmFnZTogWydnc3VtJ10sXG4gICAgICAgIGFsZ29yaXRobTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBkeCA9IG9wdC5tb21lbnR1bSAqIGdzdW0gLSBvcHQucmF0ZSAqIGdpajtcbiAgICAgICAgICAgIGdzdW0gPSBkeDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5nZC5hZGFkZWx0YSA9IHtcbiAgICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgICAgIHJvOiAwLjk1LFxuICAgICAgICAgICAgZXBzOiAxZS04XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3JhZ2U6IFsnZ3N1bScsICd4c3VtJ10sXG4gICAgICAgIGFsZ29yaXRobTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBnc3VtID0gb3B0LnJvICogZ3N1bSArICgxIC0gb3B0LnJvKSAqIGdpaiAqIGdpajtcbiAgICAgICAgICAgIGR4ID0gLU1hdGguc3FydCgoeHN1bSArIG9wdC5lcHMpIC8gKGdzdW0gKyBvcHQuZXBzKSkgKiBnaWo7XG4gICAgICAgICAgICB4c3VtID0gb3B0LnJvICogeHN1bSArICgxIC0gb3B0LnJvKSAqIGR4ICogZHg7IC8vIHllcywgeHN1bSBsYWdzIGJlaGluZCBnc3VtIGJ5IDEuXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyogYWxnb3JpdGhtcyBjb21waWxlciwgc3BlZWRzIHRoaW5ncyB1cCwgYW5kIG1ha2VzIHRoaW5ncyBlYXNpZXIgKi9cbiAgICAoZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBnZF9wcm90b3R5cGUgPSBmdW5jdGlvbihvcHQsIE8sIGRlY2F5KSB7XG4gICAgICAgICAgICBpZiAoTy5ub2NoYW5nZSkgcmV0dXJuO1xuICAgICAgICAgICAgdmFyIGR4ID0gMCwgX19ncmFkID0gMCwgZ2lqID0gMCwgbDFncmFkID0gMCwgbDJncmFkID0gMDtcbiAgICAgICAgICAgIFwiVVUxXCI7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IE8uc2l6ZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIF9fZ3JhZCA9IE8uZHcuZFtpXTtcbiAgICAgICAgICAgICAgICBfX2dyYWQgPSBfX2dyYWQgPiBvcHQuY2xpcCA/IG9wdC5jbGlwIDogKF9fZ3JhZCA8IC1vcHQuY2xpcCA/IC1vcHQuY2xpcCA6IF9fZ3JhZCk7XG4gICAgICAgICAgICAgICAgbDFncmFkID0gZGVjYXkgKiBvcHQuZGVjYXkubDEgKiAoTy53LmRbaV0gPiAwID8gMSA6IC0xKTtcbiAgICAgICAgICAgICAgICBsMmdyYWQgPSBkZWNheSAqIG9wdC5kZWNheS5sMiAqIChPLncuZFtpXSk7XG4gICAgICAgICAgICAgICAgZ2lqID0gKF9fZ3JhZCArIGwxZ3JhZCArIGwyZ3JhZCkgLyBvcHQuYmF0Y2g7XG4gICAgICAgICAgICAgICAgXCJVVTJcIjtcbiAgICAgICAgICAgICAgICBcIlVVM1wiO1xuICAgICAgICAgICAgICAgIFwiVVU0XCI7XG4gICAgICAgICAgICAgICAgTy53LmRbaV0gKz0gZHg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIE8uZHcuYWxsKDAuMCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgdmFyIGdkX3Byb3RvdHlwZV8gPSBnZF9wcm90b3R5cGUudG9TdHJpbmcoKTtcblxuICAgICAgICBmb3IgKHZhciBuYW1lIGluIE5ldHdvcmsucHJvdG90eXBlLmdkKSB7XG4gICAgICAgICAgICB2YXIgZGVzY3JpcHRpb24gPSBOZXR3b3JrLnByb3RvdHlwZS5nZFtuYW1lXTtcbiAgICAgICAgICAgIHZhciBjaGVja3MgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzY3JpcHRpb24uc3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGNoZWNrc1tpXSA9ICdpZiAodHlwZW9mIE8uJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnID09PSBcInVuZGVmaW5lZFwiKSB7IE8uJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnID0gbmV3IGxpYi5NYXQoTy5zaXplLngsIE8uc2l6ZS55LCBPLnNpemUuZGVwdGgsIDAuMCk7IH0nO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZXh0cmFjdGlvbnMgPSBbXTtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZGVzY3JpcHRpb24uc3RvcmFnZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIGV4dHJhY3Rpb25zW2ldID0gJ3ZhciAnICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcgPSBPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJy5kW2ldOyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBhbGcgPSBkZXNjcmlwdGlvbi5hbGdvcml0aG0udG9TdHJpbmcoKTtcbiAgICAgICAgICAgIGFsZyA9IGFsZy5zdWJzdHJpbmcoYWxnLmluZGV4T2YoJ3snKSArIDEsIGFsZy5sZW5ndGggLSAxKTtcblxuICAgICAgICAgICAgdmFyIHN0b3JpbmdzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLnN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBzdG9yaW5nc1tpXSA9ICdPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJy5kW2ldID0gJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnOyc7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBmdW5jID0gZ2RfcHJvdG90eXBlXy5yZXBsYWNlKCdcIlVVMVwiOycsIGNoZWNrcy5qb2luKFwiXCIpKS5yZXBsYWNlKCdcIlVVMlwiOycsIGV4dHJhY3Rpb25zLmpvaW4oXCJcIikpLnJlcGxhY2UoJ1wiVVUzXCI7JywgYWxnKS5yZXBsYWNlKCdcIlVVNFwiOycsIHN0b3JpbmdzLmpvaW4oXCJcIikpO1xuICAgICAgICAgICAgdmFyIGNtZCA9ICdOZXR3b3JrLnByb3RvdHlwZS5nZC4nICsgbmFtZSArICcgPSAnICsgZnVuYztcbiAgICAgICAgICAgIGV2YWwoY21kKTtcbiAgICAgICAgICAgIE5ldHdvcmsucHJvdG90eXBlLmdkW25hbWVdLmRlZmF1bHRzID0gZGVzY3JpcHRpb24uZGVmYXVsdHM7XG4gICAgICAgIH1cbiAgICB9KSgpO1xuXG4gICAgbGliLk5ldHdvcmsgPSBOZXR3b3JrO1xufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuXHQvKiBzcGF0aWFsIHdlaWdodHMgKi9cblx0ZnVuY3Rpb24gQ29udm9sdXRpb25hbExheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5maWx0ZXIgPSBvcHQuZmlsdGVyO1xuXHRcdHRoaXMuc3RyaWRlID0gb3B0LnN0cmlkZTtcblx0XHR0aGlzLnBhZCA9IG9wdC5wYWQ7XG5cblx0XHR2YXIgb3ggPSBNYXRoLmZsb29yKCh0aGlzLmluLnggKyB0aGlzLnBhZCAqIDIgLSB0aGlzLmZpbHRlci54KSAvIHRoaXMuc3RyaWRlICsgMSk7XG5cdFx0dmFyIG95ID0gTWF0aC5mbG9vcigodGhpcy5pbi55ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueSkgLyB0aGlzLnN0cmlkZSArIDEpO1xuXHRcdHRoaXMub3V0ID0gbGliLlNpemUzKG94LCBveSwgdGhpcy5maWx0ZXIuZGVwdGgpO1xuXG5cdFx0dGhpcy5wYXJhbWV0ZXJzID0ge1xuXHRcdFx0ZmlsdGVyczogW10sXG5cdFx0XHRiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLmZpbHRlci5kZXB0aCwgMC4wKVxuXHRcdH07XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0LmRlcHRoOyBpKyspIHtcblx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldID0gbmV3IGxpYi5CbG9iKHRoaXMuZmlsdGVyLngsIHRoaXMuZmlsdGVyLnksIHRoaXMuaW4uZGVwdGgpO1xuXHRcdH1cblx0fTtcblxuXHRDb252b2x1dGlvbmFsTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdHZhciBBX3ggPSBBLnNpemUueCB8IDAsIEFfeSA9IEEuc2l6ZS55IHwgMCwgQV9kID0gQS5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMCwgRl9kID0gdGhpcy5maWx0ZXIuZGVwdGggfCAwO1xuXG5cdFx0dmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcblx0XHR2YXIgYmlhc2VzID0gdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmQ7XG5cblx0XHRmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG5cdFx0ICAgIHZhciBmID0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbZF07XG5cdFx0ICAgIHZhciB4ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyB5ICs9IHN0cmlkZSwgYXkrKykgeyAvLyB4eV9zdHJpZGVcblx0XHQgICAgICAgIHggPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgeCArPSBzdHJpZGUsIGF4KyspIHsgLy8geHlfc3RyaWRlXG5cblx0XHQgICAgICAgICAgICAvLyBjb252b2x2ZSBjZW50ZXJlZCBhdCB0aGlzIHBhcnRpY3VsYXIgbG9jYXRpb24gW2F4LCBheV1cblx0XHQgICAgICAgICAgICB2YXIgYSA9IDAuMDtcblx0XHQgICAgICAgICAgICB2YXIgb3ggPSAwLCBveSA9IDA7XG5cdFx0ICAgICAgICAgICAgZm9yICh2YXIgZnkgPSAwOyBmeSA8IEZfeTsgZnkrKykge1xuXHRcdCAgICAgICAgICAgICAgICBveSA9IHkgKyBmeTsgLy8gY29vcmRpbmF0ZXMgaW4gdGhlIG9yaWdpbmFsIGlucHV0IGFycmF5IGNvb3JkaW5hdGVzXG5cdFx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGZ4ID0gMDsgZnggPCBGX3g7IGZ4KyspIHtcblx0XHQgICAgICAgICAgICAgICAgICAgIG94ID0geCArIGZ4O1xuXHRcdCAgICAgICAgICAgICAgICAgICAgaWYgKG95ID49IDAgJiYgb3kgPCBWX3kgJiYgb3ggPj0gMCAmJiBveCA8IFZfeCkge1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZkID0gMDsgZmQgPCBGX2Q7IGZkKyspIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gQS53W2F4LCBheSwgZF0gKz0gZi53WyBmeCwgZnksIGZkIF0gKiBWLndbIG94LCBveSwgZmQgXVxuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBhICs9IGYudy5kWyhmeSAqIEZfeCArIGZ4KSAqIEZfZCArIGZkXSAqIFYudy5kWyhveSAqIFZfeCArIG94KSAqIFZfZCArIGZkXTtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICB9XG5cblx0XHQgICAgICAgICAgICBBLncuZFsoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkXSA9IGEgKyBiaWFzZXNbZF07XG5cdFx0ICAgICAgICB9XG5cdFx0ICAgIH1cblx0XHR9XG5cdH07XG5cblx0Q29udm9sdXRpb25hbExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG5cdFx0dmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgRl94ID0gdGhpcy5maWx0ZXIueCB8IDAsIEZfeSA9IHRoaXMuZmlsdGVyLnkgfCAwLCBGX2QgPSB0aGlzLmZpbHRlci5kZXB0aCB8IDA7XG5cblx0XHR2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGUgfCAwO1xuXHRcdHZhciBiaWFzZXMgPSB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLmR3LmQ7XG5cblx0XHR2YXIgdjEgPSAwLCB2MiA9IDA7XG5cblx0XHRmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG5cdFx0ICAgIHZhciBmID0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbZF07XG5cdFx0ICAgIHZhciB4ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyB5ICs9IHN0cmlkZSwgYXkrKykge1xuXHRcdCAgICAgICAgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykge1xuXG5cdFx0ICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBsb2NhdGlvbiBbYXgsIGF5XVxuXHRcdCAgICAgICAgICAgIHZhciBkQSA9IEEuZHcuZFsoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkXTtcblx0XHQgICAgICAgICAgICB2YXIgb3ggPSAwLCBveSA9IDA7XG5cdFx0ICAgICAgICAgICAgZm9yICh2YXIgZnkgPSAwOyBmeSA8IEZfeTsgZnkrKykge1xuXHRcdCAgICAgICAgICAgICAgICBveSA9IHkgKyBmeTsgLy8gY29vcmRpbmF0ZXMgaW4gdGhlIG9yaWdpbmFsIGlucHV0IGFycmF5IGNvb3JkaW5hdGVzXG5cdFx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGZ4ID0gMDsgZnggPCBGX3g7IGZ4KyspIHtcblx0XHQgICAgICAgICAgICAgICAgICAgIG94ID0geCArIGZ4O1xuXHRcdCAgICAgICAgICAgICAgICAgICAgaWYgKG95ID49IDAgJiYgb3kgPCBWX3kgJiYgb3ggPj0gMCAmJiBveCA8IFZfeCkge1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZkID0gMDsgZmQgPCBGX2Q7IGZkKyspIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZi5kd1tmeCwgZnksIGZkXSArPSBWLndbb3gsIG95LCBmZF0gKiBBLmR3W2F4LCBheSwgZF1cblx0XHRcdFx0XHRcdFx0XHRcdC8vIFYuZHdbb3gsIG95LCBmZF0gKz0gZi53W2Z4LCBmeSwgZmRdICogQS5kd1theCwgYXksIGRdXG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYxID0gKGZ5ICogRl94ICsgZngpICogRl9kICsgZmQ7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYyID0gKG95ICogVl94ICsgb3gpICogVl9kICsgZmQ7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGYuZHcuZFt2MV0gKz0gVi53LmRbdjJdKmRBO1xuXHQgICAgICAgICAgICAgICAgICAgIFx0XHRcdFYuZHcuZFt2Ml0gKz0gZi53LmRbdjFdKmRBO1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgIH1cblxuXHRcdCAgICAgICAgICAgIGJpYXNlc1tkXSArPSBkQTtcblx0XHQgICAgICAgIH1cblx0XHQgICAgfVxuXHRcdH1cblx0fTtcblxuXHQvKiBQb29saW5nIGxheWVyLCBzZWxlY3QgYmlnZ2VzdCB2YWx1ZSBmcm9tIGNvbnZvbHV0aW9uICovXG5cdGZ1bmN0aW9uIFBvb2xpbmdMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMuZmlsdGVyID0gb3B0LmZpbHRlcjtcblx0XHR0aGlzLnN0cmlkZSA9IG9wdC5zdHJpZGU7XG5cdFx0dGhpcy5wYWQgPSBvcHQucGFkO1xuXG5cdFx0dmFyIG94ID0gTWF0aC5mbG9vcigodGhpcy5pbi54ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueCkgLyB0aGlzLnN0cmlkZSArIDEpO1xuXHRcdHZhciBveSA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueSArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLnkpIC8gdGhpcy5zdHJpZGUgKyAxKTtcblx0XHR0aGlzLm91dCA9IGxpYi5TaXplMyhveCwgb3ksIHRoaXMuaW4uZGVwdGgpO1xuXHR9O1xuXG5cdFBvb2xpbmdMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0dmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgRl94ID0gdGhpcy5maWx0ZXIueCB8IDAsIEZfeSA9IHRoaXMuZmlsdGVyLnkgfCAwOyBcblxuXHRcdHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cblx0XHRmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG5cdFx0ICAgIHZhciB4ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyB5ICs9IHN0cmlkZSwgYXkrKykge1xuXHRcdCAgICAgICAgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykge1xuXG5cdFx0ICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBsb2NhdGlvbiBbYXgsIGF5XVxuXHRcdCAgICAgICAgICAgIHZhciBzZWx2ID0gLU1hdGguSW5maW5pdHksIHNlbHggPSAwLCBzZWx5O1xuXHRcdCAgICAgICAgICAgIHZhciBveCA9IDAsIG95ID0gMCwgcSA9IDA7XG5cdFx0ICAgICAgICAgICAgZm9yICh2YXIgZnkgPSAwOyBmeSA8IEZfeTsgZnkrKykge1xuXHRcdCAgICAgICAgICAgICAgICBveSA9IHkgKyBmeTsgLy8gY29vcmRpbmF0ZXMgaW4gdGhlIG9yaWdpbmFsIGlucHV0IGFycmF5IGNvb3JkaW5hdGVzXG5cdFx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGZ4ID0gMDsgZnggPCBGX3g7IGZ4KyspIHtcblx0XHQgICAgICAgICAgICAgICAgICAgIG94ID0geCArIGZ4O1xuXHRcdCAgICAgICAgICAgICAgICAgICAgaWYgKG95ID49IDAgJiYgb3kgPCBWX3kgJiYgb3ggPj0gMCAmJiBveCA8IFZfeCkge1xuXHRcdCAgICAgICAgICAgICAgICAgICAgXHRxID0gVi53LmRbKG95ICogVl94ICsgb3gpICogVl9kICsgZF07XG5cdFx0ICAgICAgICAgICAgICAgICAgICBcdGlmIChxID4gc2VsdikgeyBzZWx2ID0gcTsgc2VseCA9IG94OyBzZWx5ID0gb3k7IH1cblx0XHQgICAgICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgIH1cblxuXHRcdCAgICAgICAgICAgIHZhciBpeCA9IChheSAqIEFfeCArIGF4KSAqIEFfZCArIGQ7XG5cdFx0ICAgICAgICAgICAgQS5weFtpeF0gPSBzZWx4O1xuXHRcdCAgICAgICAgICAgIEEucHlbaXhdID0gc2VseTtcblx0XHQgICAgICAgICAgICBBLncuZFtpeF0gPSBzZWx2O1xuXHRcdCAgICAgICAgfVxuXHRcdCAgICB9XG5cdFx0fVxuXHR9O1xuXG5cdFBvb2xpbmdMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdHZhciBBX3ggPSBBLnNpemUueCB8IDAsIEFfeSA9IEEuc2l6ZS55IHwgMCwgQV9kID0gQS5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMDsgXG5cblx0XHR2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGUgfCAwO1xuXG5cdFx0Zm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuXHRcdCAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyBheSsrKSB7XG5cdFx0ICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyBheCsrKSB7XG5cdFx0ICAgICAgICBcdHZhciBpeCA9IChheSAqIEFfeCArIGF4KSAqIEFfZCArIGQ7XG5cdFx0ICAgICAgICBcdHZhciBkQSA9IEEuZHcuZFtpeF07XG5cblx0XHQgICAgICAgIFx0dmFyIHNlbHggPSBBLnB4W2l4XTsgXG5cdFx0ICAgICAgICBcdHZhciBzZWx5ID0gQS5weVtpeF07XG5cblx0XHQgICAgICAgIFx0Vi5kdy5kWyhzZWx5ICogVl94ICsgc2VseCkgKiBWX2QgKyBkXSA9IGRBOyAvLyBvbmx5IHRyYW5zZmVyIHdlaWdodHMgZnJvbSBzZWxlY3RlZCBsb2NhdGlvbnNcblx0XHQgICAgICAgIH1cblx0XHQgICAgfVxuXHRcdH1cblx0fTtcblxuXHRQb29saW5nTGF5ZXIucHJvdG90eXBlLlByZXBhcmVTdGF0ZUJsb2IgPSBmdW5jdGlvbiAoQSkge1xuXHRcdEEucHggPSBsaWIuTWF0LkNyZWF0ZUFycmF5KHRoaXMub3V0LmRlcHRoICogdGhpcy5vdXQueSAqIHRoaXMub3V0LngsIDAsICdVaW50MTZBcnJheScpO1xuXHRcdEEucHkgPSBsaWIuTWF0LkNyZWF0ZUFycmF5KHRoaXMub3V0LmRlcHRoICogdGhpcy5vdXQueSAqIHRoaXMub3V0LngsIDAsICdVaW50MTZBcnJheScpO1xuXHR9O1xuXG5cdGxpYi5Db252b2x1dGlvbmFsTGF5ZXIgPSBDb252b2x1dGlvbmFsTGF5ZXI7XG5cdGxpYi5Qb29saW5nTGF5ZXIgPSBQb29saW5nTGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblx0LyoqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBpbnB1dCwgc2l6ZVxuXHQgKi9cblx0ZnVuY3Rpb24gRG90TGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IGxpYi5TaXplMygxLCAxLCBvcHQuc2l6ZSk7XG5cdFx0dGhpcy5wYXJhbWV0ZXJzID0ge1xuXHRcdFx0ZmlsdGVyczogW10sXG5cdFx0XHRiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLm91dC5kZXB0aCwgMC4wKVxuXHRcdH07XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXSA9IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLmluLmxlbmd0aCk7XG5cdFx0fVxuXHR9O1xuXG5cdERvdExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgc3VtID0gMC4wO1xuXHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHN1bSArPSBWLncuZFtqXSAqIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXTtcblx0XHRcdH1cblxuXHRcdFx0QS53LmRbaV0gPSBzdW0gKyB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncuZFtpXTtcblx0XHR9XG5cdH07XG5cblx0RG90TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgZEEgPSBBLmR3LmRbaV07XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFtqXSArPSBWLncuZFtqXSAqIGRBO1xuXHRcdFx0XHRWLmR3LmRbal0gKz0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdICogZEE7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuZFtpXSArPSBkQTtcblx0XHR9XG5cdH07XG5cblx0bGliLkRvdExheWVyID0gRG90TGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuXHRmdW5jdGlvbiBEcm9wT3V0TGF5ZXIob3B0LCBuZXQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gb3B0LmlucHV0O1xuXHRcdHRoaXMubmV0ID0gbmV0O1xuXHRcdHRoaXMucHJvYmFiaWxpdHkgPSBvcHQucHJvYmFiaWxpdHkgfHwgMC4yNTtcblx0fVxuXG5cdERyb3BPdXRMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0aWYgKCF0aGlzLm5ldC53ZWFrKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHsgQS53LmRbaV0gPSBWLncuZFtpXSAqIHRoaXMucHJvYmFiaWxpdHk7IH0gcmV0dXJuIDtcblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChNYXRoLnJhbmRvbSgpIDwgdGhpcy5wcm9iYWJpbGl0eSkge1xuXHRcdFx0XHRBLncuZFtpXSA9IDAuMDtcblx0XHRcdFx0QS5kcm9wcGVkT3V0W2ldID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdEEudy5kW2ldID0gVi53LmRbaV07XG5cdFx0XHRcdEEuZHJvcHBlZE91dFtpXSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHREcm9wT3V0TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHRpZiAoIXRoaXMubmV0LndlYWsgfHwgQS5kcm9wcGVkT3V0Lmxlbmd0aCAhPT0gdGhpcy5pbi5sZW5ndGgpIHJldHVybiA7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmKCFBLmRyb3BwZWRPdXRbaV0pIHtcblx0XHRcdFx0Vi5kdy5kW2ldID0gQS5kdy5kW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHREcm9wT3V0TGF5ZXIucHJvdG90eXBlLlByZXBhcmVTdGF0ZUJsb2IgPSBmdW5jdGlvbiAoQSkge1xuXHRcdEEuZHJvcHBlZE91dCA9IFtdO1xuXHR9O1xuXG5cdGxpYi5Ecm9wT3V0TGF5ZXIgPSBEcm9wT3V0TGF5ZXI7XG5cdFxufSkobm5qcyk7IiwiKGZ1bmN0aW9uKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIGZ1bmN0aW9uIElucHV0TGF5ZXIob3B0KSB7XG4gICAgICAgIHRoaXMub3V0ID0gb3B0LnNpemU7XG4gICAgICAgIHRoaXMuc2NhbGUgPSBvcHQuc2NhbGUgfHwgMS4wO1xuICAgICAgICB0aGlzLmJpYXMgPSBvcHQuYmlhcyB8fCAwLjA7XG4gICAgfTtcblxuICAgIElucHV0TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbihWLCBBKSB7XG4gICAgICAgIEEudy5jb3B5KFYsIHRoaXMuc2NhbGUsIHRoaXMuYmlhcyk7XG4gICAgfTtcblxuICAgIElucHV0TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24oQSwgVikge307XG5cbiAgICBsaWIuSW5wdXRMYXllciA9IElucHV0TGF5ZXI7XG59KShubmpzKTtcbiIsIihmdW5jdGlvbihsaWIpIHtcbiAgICBcInVzZSBzdHJpY3RcIjtcblxuICAgIGZ1bmN0aW9uIHNpZ20oeCkge1xuICAgICAgICByZXR1cm4gMS4wIC8gKDEuMCArIE1hdGguZXhwKC14KSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZHNpZ20oeSkge1xuICAgICAgICByZXR1cm4geSAqICgxIC0geSk7XG4gICAgfVxuXG4gICAgLy8gc2VlIGh0dHA6Ly9wZW9wbGUuaWRzaWEuY2gvfmp1ZXJnZW4vbHN0bS9zbGQwMTkuaHRtXG4gICAgZnVuY3Rpb24gTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyKG9wdCkge1xuICAgICAgICB0aGlzLmluID0gb3B0LmlucHV0O1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5pbnB1dDsgLy8gMSB0byAxIG1hcHBpbmdcblxuICAgICAgICB0aGlzLnJlY3VycmVudCA9IHRydWU7XG4gICAgICAgIHRoaXMucGFyYW1ldGVycyA9IHtcbiAgICAgICAgICAgIGZpbHRlcnM6IFtdLFxuICAgICAgICAgICAgYmlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5vdXQuZGVwdGgsIDAuMClcbiAgICAgICAgfTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldID0gbmV3IGxpYi5CbG9iKDEsIDEsIDksIDAsIDAuMDgpO1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kWzJdID0gLTE7IC8vIGF0IGJlZ2lubmluZyBuZWdhdGl2ZSBwZWVwaG9sZSBjb25uZWN0aW9uc1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kWzVdID0gLTE7IC8vIHRvIG1pbmltaXplIGV4cGxvZGluZ1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kWzhdID0gLTE7IC8vIGNlbGwgc3RhdGVcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMucGFyYW1ldGVycy5iaWFzZXMgPSBuZXcgbGliLkJsb2IoMSwgdGhpcy5pbi5sZW5ndGgsIDMsIDAuMCk7XG4gICAgfTtcblxuICAgIExvbmdTaG9ydFRlcm1NZW1vcnlMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uKFYsIEEpIHtcbiAgICAgICAgdmFyIGJpYXMgPSB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncuZDtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIHBhcmFtID0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kO1xuXG4gICAgICAgICAgICB2YXIgeCA9IFYudy5kW2ldO1xuICAgICAgICAgICAgdmFyIGhfID0gQS5wcmV2LncuZFtpXTtcbiAgICAgICAgICAgIHZhciBjXyA9IEEucHJldi5sc3RtLmNlbGxzLncuZFtpXTtcblxuICAgICAgICAgICAgdmFyIGlnID0gc2lnbSh4ICogcGFyYW1bMF0gKyBoXyAqIHBhcmFtWzFdICsgY18gKiBwYXJhbVsyXSArIGJpYXNbaSAqIDMgKyAwXSk7XG4gICAgICAgICAgICB2YXIgZmcgPSBzaWdtKHggKiBwYXJhbVszXSArIGhfICogcGFyYW1bNF0gKyBjXyAqIHBhcmFtWzVdICsgYmlhc1tpICogMyArIDFdKTtcbiAgICAgICAgICAgIHZhciBjID0gaWcgKiB4ICsgZmcgKiBjXztcbiAgICAgICAgICAgIHZhciBvZyA9IHNpZ20oeCAqIHBhcmFtWzZdICsgaF8gKiBwYXJhbVs3XSArIGMgICogcGFyYW1bOF0gKyBiaWFzW2kgKiAzICsgMl0pO1xuICAgICAgICAgICAgdmFyIGggPSBvZyAqIGM7XG5cbiAgICAgICAgICAgIEEubHN0bS5nYXRlcy5pbi5kW2ldID0gaWc7XG4gICAgICAgICAgICBBLmxzdG0uZ2F0ZXMuZm9yZ2V0LmRbaV0gPSBmZztcbiAgICAgICAgICAgIEEubHN0bS5nYXRlcy5vdXQuZFtpXSA9IG9nO1xuXG4gICAgICAgICAgICBBLmxzdG0uY2VsbHMudy5kW2ldID0gYztcbiAgICAgICAgICAgIEEudy5kW2ldID0gaDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24oQSwgVikge1xuICAgICAgICB2YXIgQklBUyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXM7XG4gICAgICAgIHZhciBiaWFzID0gQklBUy53LmQ7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBQQVJBTSA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldO1xuICAgICAgICAgICAgdmFyIHBhcmFtID0gUEFSQU0udy5kO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgaWcgPSBBLmxzdG0uZ2F0ZXMuaW4uZFtpXTtcbiAgICAgICAgICAgIHZhciBmZyA9IEEubHN0bS5nYXRlcy5mb3JnZXQuZFtpXTtcbiAgICAgICAgICAgIHZhciBvZyA9IEEubHN0bS5nYXRlcy5vdXQuZFtpXTtcbiAgICAgICAgICAgIHZhciBjID0gQS5sc3RtLmNlbGxzLncuZFtpXTtcblxuICAgICAgICAgICAgdmFyIHggPSBWLncuZFtpXTtcbiAgICAgICAgICAgIHZhciBoXyA9IEEucHJldi53LmRbaV07XG4gICAgICAgICAgICB2YXIgY18gPSBBLnByZXYubHN0bS5jZWxscy53LmRbaV07XG5cbiAgICAgICAgICAgIHZhciBkaCA9IEEuZHcuZFtpXTtcbiAgICAgICAgICAgIHZhciBkYyA9IEEubHN0bS5jZWxscy5kdy5kW2ldO1xuXG4gICAgICAgICAgICB2YXIgZG9nID0gZHNpZ20ob2cpICogYyAqIGRoO1xuICAgICAgICAgICAgICAgIGRjID0gZGMgKyBwYXJhbVs4XSAqIGRvZyArIG9nICogZGg7XG4gICAgICAgICAgICB2YXIgZGZnID0gZHNpZ20oZmcpICogY18gKiBkYztcbiAgICAgICAgICAgIHZhciBkaWcgPSBkc2lnbShpZykgKiB4ICogZGM7XG4gICAgICAgICAgICB2YXIgZHggPSBpZyAqIGRjICsgcGFyYW1bNl0gKiBkb2cgKyBwYXJhbVszXSAqIGRmZyArIHBhcmFtWzBdICogZGlnO1xuXG4gICAgICAgICAgICB2YXIgZGNfID0gZmcgKiBkYyArIHBhcmFtWzVdICogZGZnICsgcGFyYW1bMl0gKiBkaWc7XG4gICAgICAgICAgICB2YXIgZGhfID0gcGFyYW1bN10gKiBkb2cgKyBwYXJhbVs0XSAqIGRmZyArIHBhcmFtWzFdICogZGlnO1xuXG4gICAgICAgICAgICBBLnByZXYubHN0bS5jZWxscy5kdy5kW2ldID0gZGNfO1xuICAgICAgICAgICAgQS5wcmV2LmR3LmRbaV0gKz0gZGhfOyAvLyBhZGQgdG8gYWxyZWFkeSBiYWNrcHJvcHBlZCB2YWx1ZVxuICAgICAgICAgICAgVi5kdy5kW2ldID0gZHg7XG5cbiAgICAgICAgICAgIFBBUkFNLmR3LmRbMF0gKz0geCAqIGRpZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbMV0gKz0gaF8gKiBkaWc7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzJdICs9IGNfICogZGlnO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFszXSArPSB4ICogZGZnO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFs0XSArPSBoXyAqIGRmZztcbiAgICAgICAgICAgIFBBUkFNLmR3LmRbNV0gKz0gY18gKiBkZmc7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzZdICs9IHggKiBkb2c7XG4gICAgICAgICAgICBQQVJBTS5kdy5kWzddICs9IGhfICogZG9nO1xuICAgICAgICAgICAgUEFSQU0uZHcuZFs4XSArPSBjICogZG9nO1xuXG4gICAgICAgICAgICBCSUFTLmR3LmRbaSAqIDMgKyAwXSArPSAxLjAgKiBkaWc7XG4gICAgICAgICAgICBCSUFTLmR3LmRbaSAqIDMgKyAxXSArPSAxLjAgKiBkZmc7XG4gICAgICAgICAgICBCSUFTLmR3LmRbaSAqIDMgKyAyXSArPSAxLjAgKiBkb2c7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyLnByb3RvdHlwZS5QcmVwYXJlU3RhdGVCbG9iID0gZnVuY3Rpb24oQSkge1xuICAgICAgICBpZiAodHlwZW9mIEEuc3RhdGUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBBLmxzdG0gPSB7XG4gICAgICAgICAgICAgICAgY2VsbHM6IG5ldyBsaWIuQmxvYih0aGlzLm91dC54LCB0aGlzLm91dC55LCB0aGlzLm91dC5kZXB0aCwgMC4wKSxcbiAgICAgICAgICAgICAgICBnYXRlczogeyBpbiA6IG5ldyBsaWIuTWF0KHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApLFxuICAgICAgICAgICAgICAgICAgICBvdXQ6IG5ldyBsaWIuTWF0KHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApLFxuICAgICAgICAgICAgICAgICAgICBmb3JnZXQ6IG5ldyBsaWIuTWF0KHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIEEubHN0bS5jZWxscy53LmFsbCgwKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsaWIuTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyID0gTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyO1xufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblx0ZnVuY3Rpb24gU2lnbW9pZExheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG5cdH07XG5cblx0U2lnbW9pZExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdEEudy5kW2ldID0gMS4wLygxLjArTWF0aC5leHAoLVYudy5kW2ldKSk7XG5cdFx0fVxuXHR9XG5cblx0U2lnbW9pZExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRWLmR3LmRbaV0gPSBBLncuZFtpXSAqICgtQS53LmRbaV0gKyAxLjApICogQS5kdy5kW2ldO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiBSZWx1TGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IG9wdC5pbnB1dDtcblx0fTtcblxuXHRSZWx1TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0QS53LmRbaV0gPSBWLncuZFtpXSA8IDAgPyAwIDogVi53LmRbaV07XG5cdFx0fVxuXHR9XG5cblx0UmVsdUxheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZihBLncuZFtpXSA8PSAwKSBWLmR3LmRbaV0gPSAwOyAvLyB0aHJlc2hvbGRcblx0ICAgICAgICBlbHNlIFYuZHcuZFtpXSA9IEEuZHcuZFtpXTtcblx0XHR9XG5cdH07XG5cblx0ZnVuY3Rpb24gVGFuaExheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG5cdH07XG5cblx0VGFuaExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdEEudy5kW2ldID0gbGliLk1hdGhVLnRhbmgoVi53LmRbaV0pO1xuXHRcdH1cblx0fVxuXG5cdFRhbmhMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0Vi5kdy5kW2ldID0gKDEuMCAtIEEudy5kW2ldICogQS53LmRbaV0pICogQS5kdy5kW2ldO1xuXHQgXHR9XG5cdH07XG5cblx0bGliLlNpZ21vaWRMYXllciA9IFNpZ21vaWRMYXllcjtcblx0bGliLlJlbHVMYXllciA9IFJlbHVMYXllcjtcblx0bGliLlRhbmhMYXllciA9IFRhbmhMYXllcjtcbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG5cdGZ1bmN0aW9uIFJlZ3Jlc3Npb25MYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gb3B0LmlucHV0O1xuXHR9O1xuXG5cdFJlZ3Jlc3Npb25MYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0QS53LndyaXRlKFYudyk7XG5cdH07XG5cblx0UmVncmVzc2lvbkxheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWLCBkZXNpcmVkKSB7XG5cdFx0dmFyIGxvc3MgPSAwLjA7XG5cdFx0aWYoZGVzaXJlZCBpbnN0YW5jZW9mIEFycmF5IHx8IGRlc2lyZWQgaW5zdGFuY2VvZiBGbG9hdDY0QXJyYXkpIHtcblx0XHRcdGZvcih2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7ICsraSkge1xuXHRcdFx0XHRWLmR3LmRbaV0gPSBBLncuZFtpXSAtIGRlc2lyZWRbaV07XG5cdFx0XHRcdGxvc3MgKz0gMC41KlYuZHcuZFtpXSpWLmR3LmRbaV07XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxvc3M7XG5cdH07XG5cblx0bGliLlJlZ3Jlc3Npb25MYXllciA9IFJlZ3Jlc3Npb25MYXllcjtcblxufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cblx0ZnVuY3Rpb24gU29mdG1heExheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBsaWIuU2l6ZTMoMSwgMSwgdGhpcy5pbi54ICogdGhpcy5pbi55ICogdGhpcy5pbi5kZXB0aCk7XG5cdFx0dGhpcy5jbGFzc2VzID0gdGhpcy5vdXQuZGVwdGg7XG5cdH07XG5cblx0U29mdG1heExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHQvLyBjb21wdXRlIG1heCBhY3RpdmF0aW9uXG5cdFx0dmFyIGFtYXggPSBWLncuZFswXTtcblx0XHRmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMuY2xhc3NlczsgaSsrKSB7XG5cdFx0XHRpZihWLncuZFtpXSA+IGFtYXgpIGFtYXggPSBWLncuZFtpXTtcblx0XHR9XG5cblx0XHQvLyBjb21wdXRlIGV4cG9uZW50aWFscyAoY2FyZWZ1bGx5IHRvIG5vdCBibG93IHVwKVxuXHRcdHZhciBlcyA9IGxpYi5NYXQuQ3JlYXRlQXJyYXkodGhpcy5vdXQuZGVwdGgsIDAuMCksIGVzdW0gPSAwLjA7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuXHRcdFx0dmFyIGUgPSBNYXRoLmV4cChWLncuZFtpXSAtIGFtYXgpO1xuXHRcdFx0ZXN1bSArPSBlO1xuXHRcdFx0ZXNbaV0gPSBlO1xuXHRcdH1cblxuXHRcdC8vIG5vcm1hbGl6ZSBhbmQgb3V0cHV0IHRvIHN1bSB0byBvbmVcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2xhc3NlczsgaSsrKSB7XG5cdFx0XHRlc1tpXSAvPSBlc3VtO1xuXHRcdFx0QS53LmRbaV0gPSBlc1tpXTtcblx0XHR9XG5cblx0XHRyZXR1cm4gQS53Lm1heGkoKTtcblx0fTtcblxuXHRTb2Z0bWF4TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYsIGRlc2lyZWQpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2xhc3NlczsgaSsrKSB7XG5cdFx0XHR2YXIgaW5kaWNhdG9yID0gaSA9PT0gZGVzaXJlZCA/IDEuMCA6IDAuMDtcblx0XHRcdFYuZHcuZFtpXSA9IEEudy5kW2ldIC0gaW5kaWNhdG9yO1xuXHRcdH1cblxuXHRcdC8vIGxvc3MgaXMgdGhlIGNsYXNzIG5lZ2F0aXZlIGxvZyBsaWtlbGlob29kXG5cdFx0cmV0dXJuIC1NYXRoLmxvZyhBLncuZFtkZXNpcmVkXSk7XG5cdH07XG5cblx0LyogYXBwcm94LiAzMDB4IGZhc3RlciB0aGFuIHNvZnRtYXgsIGRlY3JlYXNlIGluIGFjY3VyYWN5IGFuZCBwZXJmb3JtYW5jZSAqL1xuXHQvKipcblx0ICogQHBhcmFtIHtvYmplY3R9IHRyZWUgW29iamVjdF0gb3IgY2xhc3NlcyBbaW50XVxuXHQgKi9cblx0ZnVuY3Rpb24gSGllcmFyY2hpY2FsU29mdG1heChvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXG5cdFx0aWYgKG9wdC50cmVlKSB7XG5cdFx0XHR0aGlzLnRyZWUgPSBvcHQudHJlZTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy50cmVlID0gdGhpcy5CdWlsZFRyZWUob3B0LmNsYXNzZXMpO1xuXHRcdH1cblxuXHRcdHRoaXMuUHJlcGFyZVRyZWUoKTtcblxuXHRcdGFzc2VydChvcHQuY2xhc3NlcyA9PT0gdW5kZWZpbmVkIHx8IChvcHQuY2xhc3NlcyA9PT0gdGhpcy5jbGFzc2VzKSwgJ0hpZXJhcmNoaWNhbFNvZnRtYXg6IHRyZWUgbm90IHN1cHBvcnRlZCcpO1xuXG5cdFx0dGhpcy5ub2RlcyA9IHRoaXMuY2xhc3NlcyAtIDE7XG5cdFx0dGhpcy5wYXJhbWV0ZXJzID0ge1xuXHRcdFx0ZmlsdGVyczogW10sXG5cdFx0XHRiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLm5vZGVzLCAwLjApXG5cdFx0fTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5ub2RlczsgaSsrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXSA9IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLmluLmxlbmd0aCk7XG5cdFx0fVxuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUiA9IDA7XG5cdEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IgPSAxO1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLkJ1aWxkVHJlZSA9IGZ1bmN0aW9uIChjbGFzc2VzKSB7XG5cdFx0Ly8gY3JlYXRlIHRyZWUgb2Ygc2l6ZSBsb2coY2xhc3Nlcylcblx0XHR2YXIgZGVwdGggPSBNYXRoLmZsb29yKE1hdGgubG9nMihjbGFzc2VzKSk7XG5cdFx0dmFyIHRyZWUgPSB0aGlzLkNyZWF0ZU5vZGUoZGVwdGgsIG51bGwpO1xuXG5cdFx0Ly8gYWRkIHJlbWFpbmluZyBub2RlcyB0byB0cmVlXG5cdFx0dmFyIHJlbWFpbmRlciA9IGNsYXNzZXMgLSBNYXRoLnBvdygyLCBkZXB0aCk7XG5cdFx0dGhpcy50cmF2ZXJzZSh0cmVlLCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdFx0aWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUiAmJiByZW1haW5kZXIgPiAwKSB7XG5cdFx0XHRcdG5vZGUudHlwZSA9IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUjtcblx0XHRcdFx0bm9kZS5hID0gdGhpcy5DcmVhdGVOb2RlKDAsIG5vZGUpO1xuXHRcdFx0XHRub2RlLmIgPSB0aGlzLkNyZWF0ZU5vZGUoMCwgbm9kZSk7XG5cblx0XHRcdFx0cmVtYWluZGVyLS07XG5cblx0XHRcdFx0cmV0dXJuIGZhbHNlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KTtcblxuXHRcdHJldHVybiB0cmVlO1xuXHR9OyBcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5QcmVwYXJlVHJlZSA9IGZ1bmN0aW9uICgpIHtcblx0XHR2YXIgc2VsID0gMCwgcHRyID0gMCwgdGFibGUgPSB7fTtcblx0XHR0aGlzLnRyYXZlcnNlKHRoaXMudHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRcdGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IpIHtcblx0XHRcdFx0dGFibGVbc2VsXSA9IG5vZGU7XG5cdFx0XHRcdG5vZGUuaW5kZXggPSBzZWw7XG5cdFx0XHQrK3NlbDt9XG5cblx0XHRcdGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSKSB7XG5cdFx0XHRcdG5vZGUuaW5kZXggPSBwdHI7XG5cdFx0XHRwdHIrKzt9XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0pO1xuXG5cdFx0dGhpcy5jbGFzc2VzID0gc2VsO1xuXHRcdHRoaXMubm9kZXMgPSBwdHI7XG5cdFx0dGhpcy50YWJsZSA9IHRhYmxlO1xuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLkNyZWF0ZU5vZGUgPSBmdW5jdGlvbiAoZGVwdGgsIHBhcmVudCkge1xuXHRcdHZhciBub2RlID0geyBwYXJlbnQ6IHBhcmVudCB9O1xuXG5cdFx0aWYgKGRlcHRoIDw9IDApIHtcblx0XHRcdG5vZGUudHlwZSA9IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1I7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG5vZGUudHlwZSA9IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUjtcblx0XHRcdG5vZGUuYSA9IHRoaXMuQ3JlYXRlTm9kZShkZXB0aC0xLCBub2RlKTtcblx0XHRcdG5vZGUuYiA9IHRoaXMuQ3JlYXRlTm9kZShkZXB0aC0xLCBub2RlKTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbm9kZTtcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS50cmF2ZXJzZSA9IGZ1bmN0aW9uIChub2RlLCBjYikge1xuXHRcdGlmIChjYi5jYWxsKHRoaXMsIG5vZGUpICYmIG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSKSB7XG5cdFx0XHR0aGlzLnRyYXZlcnNlKG5vZGUuYSwgY2IpO1xuXHRcdFx0dGhpcy50cmF2ZXJzZShub2RlLmIsIGNiKTtcblx0XHR9XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuYXNjZW5kID0gZnVuY3Rpb24gKG5vZGUsIGNiKSB7XG5cdFx0aWYgKG5vZGUucGFyZW50ID09PSBudWxsKSByZXR1cm4gO1xuXHRcdGNiLmNhbGwodGhpcywgbm9kZS5wYXJlbnQsIG5vZGUgPT09IG5vZGUucGFyZW50LmEgPyAtMS4wIDogMS4wKTtcblx0XHR0aGlzLmFzY2VuZChub2RlLnBhcmVudCwgY2IpO1xuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmRlc2NlbmQgPSBmdW5jdGlvbiAobm9kZSwgY2IpIHtcblx0XHR2YXIgZCA9IGNiLmNhbGwodGhpcywgbm9kZSk7XG5cblx0XHRpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SIHx8IGQgaW5zdGFuY2VvZiBPYmplY3QgfHwgZCA9PT0gbnVsbCkge1xuXHRcdFx0cmV0dXJuIGQ7XG5cdFx0fVxuXG5cdFx0aWYgKGQgPiAwLjApIHsgLy8gbmVnYXRpdmUgbWVhbnMgbGVmdCwgcG9zaXRpdmUgbWVhbnMgcmlnaHRcblx0XHRcdHJldHVybiB0aGlzLmRlc2NlbmQobm9kZS5iLCBjYik7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLmRlc2NlbmQobm9kZS5hLCBjYik7XG5cdFx0fVxuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmFjdGl2YXRlID0gZnVuY3Rpb24gKFYsIGkpIHtcblx0XHR2YXIgc3VtID0gMC4wO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuXHRcdFx0c3VtICs9IFYudy5kW2pdICogdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdO1xuXHRcdH1cblxuXHRcdHJldHVybiBsaWIuTWF0aFUudGFuaCh0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncuZFtpXSArIHN1bSk7XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuZ3JhZGllbnQgPSBmdW5jdGlvbiAoViwgaSwgZGlyZWN0aW9uKSB7XG5cdFx0dmFyIGFjdCA9IHRoaXMuYWN0aXZhdGUoViwgaSksXG5cdFx0XHRcdGVyciA9IGFjdCAtIGRpcmVjdGlvbjtcblxuXHRcdHZhciBkdyA9ICgxLjAgLSBhY3QgKiBhY3QpICogZXJyO1xuXHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLm5vY2hhbmdlID0gZmFsc2U7XG5cblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLmR3LmRbal0gKz0gVi53LmRbal0gKiBkdztcblx0XHRcdFYuZHcuZFtqXSArPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbal0gKiBkdztcblx0XHR9XG5cblx0XHR0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLmR3LmRbaV0gKz0gZHc7XG5cblx0XHRyZXR1cm4gKGRpcmVjdGlvbiA8IDAgPyAxIC0gKGFjdCAqIDAuNSArIDAuNSkgOiAoYWN0ICogMC41ICsgMC41KSk7IC8vIHByb2JhYmlsaXR5IHRvIGdvIHRoZSByaWdodCB3YXlcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHR2YXIgc2VsZWN0ZWQgPSB0aGlzLmRlc2NlbmQodGhpcy50cmVlLCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdFx0aWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSKSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLmFjdGl2YXRlKFYsIG5vZGUuaW5kZXgpO1xuXHRcdFx0fVxuXG5cdFx0XHRlbHNlIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IpIHtcblx0XHRcdFx0cmV0dXJuIG5vZGU7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIChBLmluZGV4ID0gc2VsZWN0ZWQuaW5kZXgpO1xuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYsIGRlc2lyZWQpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5ub2NoYW5nZSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0dmFyIHByb2IgPSAxLjA7XG5cdFx0dGhpcy5hc2NlbmQodGhpcy50YWJsZVtkZXNpcmVkXSwgZnVuY3Rpb24gKG5vZGUsIGRpcmVjdGlvbikge1xuXHRcdFx0cHJvYiA9IHByb2IgKiB0aGlzLmdyYWRpZW50KFYsIG5vZGUuaW5kZXgsIGRpcmVjdGlvbik7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gMS4wIC0gcHJvYjsgLy8gcHJvYmFiaWxpdHkgdG8gTk9UIGdvIHRoZSByaWdodCB3YXlcblx0fTtcblxuXHRsaWIuU29mdG1heExheWVyID0gU29mdG1heExheWVyO1xuXHRsaWIuSGllcmFyY2hpY2FsU29mdG1heCA9IEhpZXJhcmNoaWNhbFNvZnRtYXg7XG59KShubmpzKTsiLCIoZnVuY3Rpb24obGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgXHRpZiAodHlwZW9mIHdpbmRvdyAhPT0gJ3VuZGVmaW5lZCcpIHsgLy8gd2ViIHdvcmtlciBzdXBwb3J0OyBqdXN0IHVzZSBubmpzIGluIHdlYiB3b3JrZXJcbiAgICBcdFx0d2luZG93Lm5uID0gbGliO1xuICAgIFx0fVxuICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbGliO1xuICAgIH1cbiAgICBcbn0pKG5uanMpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
