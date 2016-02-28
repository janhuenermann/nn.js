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
            for (var i = 0; i < this.width.length; i++) { this.blobs[this.height][i].prev = null; }
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
        this.learner = Object.extend({
            method: 'sgd',
            batch: 1,
            decay: { l1: 0, l2: 0 },
            clip: Infinity,
            timespan: 1 // only for rnn
        }, this.learner);

        this.learner = Object.extend(this.gd[this.learner.method].defaults, this.learner);
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
        for (var i = 0; i < this.out.length; i++) {
            var param = this.parameters.filters[i].w.d;
            var bias = this.parameters.biases.w.d;

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
        for (var i = 0; i < this.out.length; i++) {
            var param = this.parameters.filters[i].w.d;
            var bias = this.parameters.biases.w.d;

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

            this.parameters.filters[i].dw.d[0] += x * dig;
            this.parameters.filters[i].dw.d[1] += h_ * dig;
            this.parameters.filters[i].dw.d[2] += c_ * dig;
            this.parameters.filters[i].dw.d[3] += x * dfg;
            this.parameters.filters[i].dw.d[4] += h_ * dfg;
            this.parameters.filters[i].dw.d[5] += c_ * dfg;
            this.parameters.filters[i].dw.d[6] += x * dog;
            this.parameters.filters[i].dw.d[7] += h_ * dog;
            this.parameters.filters[i].dw.d[8] += c * dog;

            this.parameters.biases.dw.d[i * 3 + 0] += 1.0 * dig;
            this.parameters.biases.dw.d[i * 3 + 1] += 1.0 * dfg;
            this.parameters.biases.dw.d[i * 3 + 2] += 1.0 * dog;
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
        window.nn = lib;
    } else {
        module.exports = lib;
    }
    
})(nnjs);

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5uLmluaXQuanMiLCJubi5tYXRoLmpzIiwiYXBpL25ldHdvcmsubm4uanMiLCJsYXllcnMvY29udm9sdXRpb25hbC5ubi5qcyIsImxheWVycy9kb3Qubm4uanMiLCJsYXllcnMvZHJvcG91dC5ubi5qcyIsImxheWVycy9pbnB1dC5ubi5qcyIsImxheWVycy9sc3RtLm5uLmpzIiwibGF5ZXJzL25vbi1saW5lYXIubm4uanMiLCJsYXllcnMvcmVncmVzc2lvbi5ubi5qcyIsImxheWVycy9zb2Z0bWF4Lm5uLmpzIiwibm4uZXhwb3J0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDcEpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDOVRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdkxBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3ZOQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJubi5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBubmpzID0ge307XG5cbi8vIFV0aWxpdHkgZnVuXG5mdW5jdGlvbiBhc3NlcnQoY29uZGl0aW9uLCBtZXNzYWdlKSB7XG4gICAgLy8gZnJvbSBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE1MzEzNDE4L2phdmFzY3JpcHQtYXNzZXJ0XG4gICAgaWYgKCFjb25kaXRpb24pIHtcbiAgICAgICAgbWVzc2FnZSA9IG1lc3NhZ2UgfHwgXCJBc3NlcnRpb24gZmFpbGVkXCI7XG4gICAgICAgIGlmICh0eXBlb2YgRXJyb3IgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihtZXNzYWdlKTtcbiAgICAgICAgfVxuICAgICAgICB0aHJvdyBtZXNzYWdlOyAvLyBGYWxsYmFja1xuICAgIH1cbn1cblxuKGZ1bmN0aW9uKCkge1widXNlIHN0cmljdFwiO1xuICAgIHZhciBoYXNPd24gPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuICAgIHZhciB0b1N0ciA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbiAgICB2YXIgaXNBcnJheSA9IGZ1bmN0aW9uIGlzQXJyYXkoYXJyKSB7XG4gICAgICAgIGlmICh0eXBlb2YgQXJyYXkuaXNBcnJheSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAgICAgcmV0dXJuIEFycmF5LmlzQXJyYXkoYXJyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB0b1N0ci5jYWxsKGFycikgPT09ICdbb2JqZWN0IEFycmF5XSc7XG4gICAgfTtcblxuICAgIHZhciBpc1BsYWluT2JqZWN0ID0gZnVuY3Rpb24gaXNQbGFpbk9iamVjdChvYmopIHtcbiAgICAgICAgaWYgKCFvYmogfHwgdG9TdHIuY2FsbChvYmopICE9PSAnW29iamVjdCBPYmplY3RdJykge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGhhc093bkNvbnN0cnVjdG9yID0gaGFzT3duLmNhbGwob2JqLCAnY29uc3RydWN0b3InKTtcbiAgICAgICAgdmFyIGhhc0lzUHJvdG90eXBlT2YgPSBvYmouY29uc3RydWN0b3IgJiYgb2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSAmJiBoYXNPd24uY2FsbChvYmouY29uc3RydWN0b3IucHJvdG90eXBlLCAnaXNQcm90b3R5cGVPZicpO1xuICAgICAgICAvLyBOb3Qgb3duIGNvbnN0cnVjdG9yIHByb3BlcnR5IG11c3QgYmUgT2JqZWN0XG4gICAgICAgIGlmIChvYmouY29uc3RydWN0b3IgJiYgIWhhc093bkNvbnN0cnVjdG9yICYmICFoYXNJc1Byb3RvdHlwZU9mKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBPd24gcHJvcGVydGllcyBhcmUgZW51bWVyYXRlZCBmaXJzdGx5LCBzbyB0byBzcGVlZCB1cCxcbiAgICAgICAgLy8gaWYgbGFzdCBvbmUgaXMgb3duLCB0aGVuIGFsbCBwcm9wZXJ0aWVzIGFyZSBvd24uXG4gICAgICAgIHZhciBrZXk7XG4gICAgICAgIGZvciAoa2V5IGluIG9iaikgeyAvKiovIH1cblxuICAgICAgICByZXR1cm4gdHlwZW9mIGtleSA9PT0gJ3VuZGVmaW5lZCcgfHwgaGFzT3duLmNhbGwob2JqLCBrZXkpO1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBleHRlbmQoKSB7XG4gICAgICAgIHZhciBvcHRpb25zLCBuYW1lLCBzcmMsIGNvcHksIGNvcHlJc0FycmF5LCBjbG9uZTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGFyZ3VtZW50c1swXTtcbiAgICAgICAgdmFyIGkgPSAxO1xuICAgICAgICB2YXIgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDtcbiAgICAgICAgdmFyIGRlZXAgPSBmYWxzZTtcblxuICAgICAgICAvLyBIYW5kbGUgYSBkZWVwIGNvcHkgc2l0dWF0aW9uXG4gICAgICAgIGlmICh0eXBlb2YgdGFyZ2V0ID09PSAnYm9vbGVhbicpIHtcbiAgICAgICAgICAgIGRlZXAgPSB0YXJnZXQ7XG4gICAgICAgICAgICB0YXJnZXQgPSBhcmd1bWVudHNbMV0gfHwge307XG4gICAgICAgICAgICAvLyBza2lwIHRoZSBib29sZWFuIGFuZCB0aGUgdGFyZ2V0XG4gICAgICAgICAgICBpID0gMjtcbiAgICAgICAgfSBlbHNlIGlmICgodHlwZW9mIHRhcmdldCAhPT0gJ29iamVjdCcgJiYgdHlwZW9mIHRhcmdldCAhPT0gJ2Z1bmN0aW9uJykgfHwgdGFyZ2V0ID09IG51bGwpIHtcbiAgICAgICAgICAgIHRhcmdldCA9IHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICg7IGkgPCBsZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgb3B0aW9ucyA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgICAgIC8vIE9ubHkgZGVhbCB3aXRoIG5vbi1udWxsL3VuZGVmaW5lZCB2YWx1ZXNcbiAgICAgICAgICAgIGlmIChvcHRpb25zICE9IG51bGwpIHtcbiAgICAgICAgICAgICAgICAvLyBFeHRlbmQgdGhlIGJhc2Ugb2JqZWN0XG4gICAgICAgICAgICAgICAgZm9yIChuYW1lIGluIG9wdGlvbnMpIHtcbiAgICAgICAgICAgICAgICAgICAgc3JjID0gdGFyZ2V0W25hbWVdO1xuICAgICAgICAgICAgICAgICAgICBjb3B5ID0gb3B0aW9uc1tuYW1lXTtcblxuICAgICAgICAgICAgICAgICAgICAvLyBQcmV2ZW50IG5ldmVyLWVuZGluZyBsb29wXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YXJnZXQgIT09IGNvcHkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFJlY3Vyc2UgaWYgd2UncmUgbWVyZ2luZyBwbGFpbiBvYmplY3RzIG9yIGFycmF5c1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGRlZXAgJiYgY29weSAmJiAoaXNQbGFpbk9iamVjdChjb3B5KSB8fCAoY29weUlzQXJyYXkgPSBpc0FycmF5KGNvcHkpKSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoY29weUlzQXJyYXkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29weUlzQXJyYXkgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgaXNBcnJheShzcmMpID8gc3JjIDogW107XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY2xvbmUgPSBzcmMgJiYgaXNQbGFpbk9iamVjdChzcmMpID8gc3JjIDoge307XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gTmV2ZXIgbW92ZSBvcmlnaW5hbCBvYmplY3RzLCBjbG9uZSB0aGVtXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gZXh0ZW5kKGRlZXAsIGNsb25lLCBjb3B5KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIERvbid0IGJyaW5nIGluIHVuZGVmaW5lZCB2YWx1ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIGNvcHkgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdGFyZ2V0W25hbWVdID0gY29weTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIFJldHVybiB0aGUgbW9kaWZpZWQgb2JqZWN0XG4gICAgICAgIHJldHVybiB0YXJnZXQ7XG4gICAgfTtcblxuICAgIE9iamVjdC5leHRlbmQgPSBleHRlbmQ7XG59KSgpO1xuIiwiKGZ1bmN0aW9uKGxpYikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuICAgIHZhciBtYXRoID0ge1xuICAgICAgICBnYXVzc186IHsgYTogZmFsc2UsIGI6IDAuMCB9LFxuICAgICAgICBnYXVzczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAobWF0aC5nYXVzc18uYSkgeyBtYXRoLmdhdXNzXy5hID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG1hdGguZ2F1c3NfLmI7IH1cbiAgICAgICAgICAgIHZhciB1ID0gMiAqIE1hdGgucmFuZG9tKCkgLSAxO1xuICAgICAgICAgICAgdmFyIHYgPSAyICogTWF0aC5yYW5kb20oKSAtIDE7XG4gICAgICAgICAgICB2YXIgciA9IHUgKiB1ICsgdiAqIHY7XG4gICAgICAgICAgICBpZiAociA9PSAwIHx8IHIgPiAxKSByZXR1cm4gbWF0aC5nYXVzcygpO1xuICAgICAgICAgICAgdmFyIGMgPSBNYXRoLnNxcnQoLTIgKiBNYXRoLmxvZyhyKSAvIHIpO1xuICAgICAgICAgICAgbWF0aC5nYXVzc18uYiA9IHYgKiBjOyAvLyBjYWNoZSB0aGlzXG4gICAgICAgICAgICBtYXRoLmdhdXNzXy5hID0gdHJ1ZTtcbiAgICAgICAgICAgIHJldHVybiB1ICogYztcbiAgICAgICAgfSxcblxuICAgICAgICByYW5kZjogZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGgucmFuZG9tKCkgKiAoYiAtIGEpICsgYTtcbiAgICAgICAgfSxcblxuICAgICAgICByYW5kaTogZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgICAgcmV0dXJuIE1hdGguZmxvb3IoTWF0aC5yYW5kb20oKSAqIChiIC0gYSkgKyBhKTtcbiAgICAgICAgfSxcblxuICAgICAgICByYW5kbjogZnVuY3Rpb24obXUsIHN0ZCkge1xuICAgICAgICAgICAgcmV0dXJuIG11ICsgbWF0aC5nYXVzcygpICogc3RkO1xuICAgICAgICB9LFxuXG4gICAgICAgIHRhbmg6IHR5cGVvZiBNYXRoLnRhbmggPT09IFwidW5kZWZpbmVkXCIgPyBmdW5jdGlvbih4KSB7XG4gICAgICAgICAgICB2YXIgeSA9IE1hdGguZXhwKDIgKiB4KTtcbiAgICAgICAgICAgIHJldHVybiAoeSAtIDEpIC8gKHkgKyAxKTsgfSA6IE1hdGgudGFuaFxuICAgIH07XG5cbiAgICAvL1xuICAgIC8vXG4gICAgLy9cbiAgICBmdW5jdGlvbiBTaXplMih4LCB5KSB7XG4gICAgICAgIHJldHVybiB7IHg6IHgsIHk6IHksIGxlbmd0aDogeCAqIHkgfTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gU2l6ZTMoeCwgeSwgeikge1xuICAgICAgICByZXR1cm4geyB4OiB4LCB5OiB5LCBkZXB0aDogeiwgbGVuZ3RoOiB4ICogeSAqIHogfTtcbiAgICB9O1xuXG5cbiAgICAvL1xuICAgIC8vXG4gICAgLy9cbiAgICBmdW5jdGlvbiBNYXQoeCwgeSwgeiwgdikge1xuICAgICAgICB0aGlzLnNpemUgPSBsaWIuU2l6ZTMoeCwgeSwgeik7XG4gICAgICAgIHRoaXMuZCA9IE1hdC5DcmVhdGVBcnJheSh4ICogeSAqIHosIHYgPT09IHVuZGVmaW5lZCA/IDAuMCA6IHYsICdGbG9hdDY0QXJyYXknKTtcbiAgICB9O1xuXG4gICAgTWF0LkNyZWF0ZUFycmF5ID0gZnVuY3Rpb24obGVuZ3RoLCB2LCB0KSB7XG4gICAgICAgIHZhciBhcnIgPSBudWxsO1xuXG4gICAgICAgIHYgPSB2IHx8IDA7XG4gICAgICAgIHQgPSB0IHx8ICdGbG9hdDY0QXJyYXknO1xuXG4gICAgICAgIGlmICh0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICBhcnIgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGFyciA9IGV2YWwoJ25ldyAnICsgdCArICcobGVuZ3RoKScpO1xuICAgICAgICB9XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkgeyBhcnJbaV0gPSB2OyB9XG4gICAgICAgIHJldHVybiBhcnI7XG4gICAgfTtcblxuICAgIE1hdC5jb3B5ID0gZnVuY3Rpb24obWF0KSB7XG4gICAgICAgIHZhciBtYXRfID0gbmV3IG1hdChtYXQuc2l6ZS54LCBtYXQuc2l6ZS55LCBtYXQuc2l6ZS5kZXB0aCk7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbWF0LmQubGVuZ3RoOyBpKyspIHsgbWF0Xy5kW2ldID0gbWF0LmRbaV07IH1cbiAgICAgICAgcmV0dXJuIG1hdF87XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUubWF4aSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgaiA9IDAsIG0gPSAtSW5maW5pdHk7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmRbaV0gPiBtKSB7XG4gICAgICAgICAgICAgICAgaiA9IGksIG0gPSB0aGlzLmRbaV07XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gajtcbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbih4LCB5LCB6KSB7XG4gICAgICAgIHJldHVybiB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgel07XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24oeCwgeSwgeiwgdikge1xuICAgICAgICB0aGlzLmRbKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgel0gPSB2O1xuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmFkZCA9IGZ1bmN0aW9uKHgsIHksIHosIHYpIHtcbiAgICAgICAgdGhpcy5kWyh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHpdICs9IHY7XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuYWxsID0gZnVuY3Rpb24odikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSB2OyB9XG4gICAgfTtcblxuICAgIE1hdC5wcm90b3R5cGUuY29weSA9IGZ1bmN0aW9uKGEsIHMsIGIpIHtcbiAgICAgICAgaWYgKHMgPT09IHVuZGVmaW5lZCkgcyA9IDE7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IGFbaV0gLyBzICsgYjsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24oYSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBhLmRbaV07IH1cbiAgICB9O1xuXG4gICAgTWF0LnByb3RvdHlwZS5yYW5kZiA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gbWF0aC5yYW5kZihhLCBiKTsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLnJhbmRuID0gZnVuY3Rpb24oc2NhbGUpIHtcbiAgICAgICAgc2NhbGUgPSBzY2FsZSB8fCBNYXRoLnNxcnQoMS4wIC8gKHRoaXMuc2l6ZS54ICogdGhpcy5zaXplLnkgKiB0aGlzLnNpemUuZGVwdGgpKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gbWF0aC5yYW5kbigwLjAsIHNjYWxlKTsgfVxuICAgIH07XG5cbiAgICBNYXQucHJvdG90eXBlLmNsb25lID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBtYXQuY29weSh0aGlzKTtcbiAgICB9O1xuXG4gICAgLy8gYWNjZXNzb3JcbiAgICAvLyBbICh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHogXVxuXG5cbiAgICBmdW5jdGlvbiBCbG9iKHgsIHksIHosIGEsIGIpIHtcbiAgICAgICAgdGhpcy5zaXplID0gbGliLlNpemUzKHgsIHksIHopO1xuICAgICAgICB0aGlzLncgPSBuZXcgTWF0KHgsIHksIHopO1xuICAgICAgICB0aGlzLmR3ID0gbmV3IE1hdCh4LCB5LCB6KTtcblxuICAgICAgICBpZiAoYSAhPT0gdW5kZWZpbmVkICYmIGIgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgdGhpcy53LnJhbmRmKGEsIGIpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy53LnJhbmRuKCk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBsaWIuTWF0aFUgPSBtYXRoO1xuICAgIGxpYi5TaXplMiA9IFNpemUyO1xuICAgIGxpYi5TaXplMyA9IFNpemUzO1xuICAgIGxpYi5NYXQgPSBNYXQ7XG4gICAgbGliLkJsb2IgPSBCbG9iO1xuXG59KShubmpzKTtcbiIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgLyoqXG4gICAgICogSGVscGVyIGZ1bmN0aW9uLCB0aGF0IGNvbnZlcnRzIGEgZGVzY3JpcHRpb24gaW50byBhbiBhY3R1YWwgbGF5ZXIgb2JqZWN0XG4gICAgICogQHBhcmFtIHtvYmplY3R9IGRlc2NyaXB0aW9uXG4gICAgICovXG4gICAgZnVuY3Rpb24gTGF5ZXIob3B0LCBuZXQpIHtcbiAgICAgICAgc3dpdGNoIChvcHQudHlwZSkge1xuICAgICAgICAgICAgY2FzZSAnaW5wdXQnOiByZXR1cm4gbmV3IGxpYi5JbnB1dExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2RvdCc6IHJldHVybiBuZXcgbGliLkRvdExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2NvbnYnOiByZXR1cm4gbmV3IGxpYi5Db252b2x1dGlvbmFsTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnbHN0bSc6IHJldHVybiBuZXcgbGliLkxvbmdTaG9ydFRlcm1NZW1vcnlMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdwb29sJzogcmV0dXJuIG5ldyBsaWIuUG9vbGluZ0xheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3NpZ21vaWQnOiByZXR1cm4gbmV3IGxpYi5TaWdtb2lkTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAncmVsdSc6IHJldHVybiBuZXcgbGliLlJlbHVMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICd0YW5oJzogcmV0dXJuIG5ldyBsaWIuVGFuaExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2Ryb3BvdXQnOiByZXR1cm4gbmV3IGxpYi5Ecm9wT3V0TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnc29mdG1heCc6IHJldHVybiBuZXcgbGliLlNvZnRtYXhMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdoc20nOiByZXR1cm4gbmV3IGxpYi5IaWVyYXJjaGljYWxTb2Z0bWF4KG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3JlZ3Jlc3Npb24nOiByZXR1cm4gbmV3IGxpYi5SZWdyZXNzaW9uTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gTmV0d29ya1N0cnVjdHVyZShkZXNjLCBuZXQpIHtcbiAgICAgICAgdGhpcy5uZXQgPSBuZXQ7XG4gICAgICAgIHRoaXMuZGVzY3JpcHRpb24gPSBkZXNjO1xuICAgICAgICB0aGlzLmxlbmd0aCA9IGRlc2MubGVuZ3RoOyAvLyBjb252aWVuaWVuY2VcbiAgICAgICAgdGhpcy5yZWN1cnJlbnQgPSBmYWxzZTtcblxuICAgICAgICB0aGlzLkJ1aWxkKCk7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdHJ1Y3R1cmUucHJvdG90eXBlLkJ1aWxkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB0aGlzLmxpc3QgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRlc2NyaXB0aW9uLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoaSA+IDApIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlc2NyaXB0aW9uW2ldLmlucHV0ID0gdGhpcy5saXN0W2kgLSAxXS5vdXQ7IC8vIHNldCBpbnB1dCB0byB0aGlzIGxheWVyIHRvIHRoZSBvdXRwdXQgb2YgbGFzdCBsYXllclxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLmxpc3RbaV0gPSBMYXllcih0aGlzLmRlc2NyaXB0aW9uW2ldLCB0aGlzLm5ldCk7XG5cbiAgICAgICAgICAgIGlmICh0aGlzLmxpc3RbaV0ucmVjdXJyZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZWN1cnJlbnQgPSB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTsgIFxuXG4gICAgTmV0d29ya1N0cnVjdHVyZS5wcm90b3R5cGUuc3RhdHMgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciBzdGF0cyA9IHsgcGFyYW1ldGVyczogMCB9O1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBzdGF0cy5wYXJhbWV0ZXJzICs9IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnNbal0uc2l6ZS5sZW5ndGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXRzLnBhcmFtZXRlcnMgKz0gdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuYmlhc2VzLnNpemUubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRzO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RydWN0dXJlLnByb3RvdHlwZS5wYXJhbWV0ZXJzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgcGFyYW1ldGVycyA9IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgb2JqZWN0ID0geyBmaWx0ZXJzOiBbXSwgYmlhc2VzOiB0aGlzLmxpc3RbaV0ucGFyYW1ldGVycy5iaWFzZXMudy5kIH07XG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBvYmplY3QuZmlsdGVyc1tqXSA9IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnNbal0udy5kO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBwYXJhbWV0ZXJzW2ldID0gb2JqZWN0O1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHBhcmFtZXRlcnM7XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdHJ1Y3R1cmUucHJvdG90eXBlLmF0ID0gZnVuY3Rpb24gKGkpIHtcbiAgICAgICAgaSA9IGkgPj0gMCA/IGkgOiB0aGlzLmxlbmd0aCArIGk7XG4gICAgICAgIHJldHVybiB0aGlzLmxpc3RbaV07XG4gICAgfTtcblxuICAgIC8vIGN1cnJlbnQgc3RhdGVcbiAgICBmdW5jdGlvbiBOZXR3b3JrU3RhdGUobmV0KSB7XG4gICAgICAgIHRoaXMubmV0ID0gbmV0O1xuICAgICAgICB0aGlzLmxheWVycyA9IG5ldC5sYXllcnM7XG4gICAgICAgIHRoaXMud2lkdGggPSBuZXQubGF5ZXJzLmxlbmd0aDsgLy8gaG93IG1hbnkgbGF5ZXJzP1xuICAgICAgICB0aGlzLmhlaWdodCA9IHRoaXMubGF5ZXJzLnJlY3VycmVudCA/IHRoaXMubmV0LmxlYXJuZXIudGltZXNwYW4gOiAxOyAvLyBob3cgbG9uZyBicHR0PyAvIHRpbWUgc3RlcHNcbiAgICAgICAgXG4gICAgICAgIGlmICh0aGlzLmxheWVycy5yZWN1cnJlbnQpIHtcbiAgICAgICAgICAgIHRoaXMuYmxvYnMgPSB0aGlzLkJ1aWxkKHRoaXMubmV0LmxlYXJuZXIudGltZXNwYW4gKyAxKTsgLy8gbGFzdCBvbmUgbmVlZHMgcmVmZXJlbmNlIHRvIHByZXZpb3VzXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmJsb2JzID0gdGhpcy5CdWlsZCgxKTsgLy8gb25seSBvbmUgdGltZSBuZWVkZWRcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBbIFsgc3RhdGUgZm9yIFQ9MCBdLCBbIHN0YXRlIGZvciBUPTEgXSwgLi4uIF1cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLkJ1aWxkID0gZnVuY3Rpb24gKGgsIFMpIHtcbiAgICAgICAgdmFyIFQgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgdCA9IDA7IHQgPCBoOyB0KyspIHtcbiAgICAgICAgICAgIFQudW5zaGlmdCh0aGlzLkJ1aWxkU3RhdGUoVCwgUyAhPT0gdW5kZWZpbmVkID8gU1t0XSA6IHVuZGVmaW5lZCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIFQ7XG4gICAgfTtcblxuICAgIC8vIFsgWyBCbG9iIGZvciBsYXllciAxIF0sIFsgQmxvYiBmb3IgbGF5ZXIgMiBdLCAuLi4gXVxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUuQnVpbGRTdGF0ZSA9IGZ1bmN0aW9uIChULCBTKSB7XG4gICAgICAgIFMgPSBTIHx8IFtdO1xuXG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5sYXllcnMubGlzdFtpXS5vdXQgIT09ICd1bmRlZmluZWQnICYmIFNbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFNbaV0gPSBuZXcgbGliLkJsb2IodGhpcy5sYXllcnMubGlzdFtpXS5vdXQueCwgdGhpcy5sYXllcnMubGlzdFtpXS5vdXQueSwgdGhpcy5sYXllcnMubGlzdFtpXS5vdXQuZGVwdGgsIDAuMCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKFNbaV0gPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgICAgIFNbaV0gPSB7fTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgU1tpXS53LmFsbCgwKSwgU1tpXS5kdy5hbGwoMCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5sYXllcnMubGlzdFtpXS5yZWN1cnJlbnQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMubGF5ZXJzLmxpc3RbaV0ucmVjdXJyZW50XG4gICAgICAgICAgICAgICAgICAgICYmIFQgIT09IHVuZGVmaW5lZCAmJiBULmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICBTW2ldLnByZXYgPSBUWzBdW2ldO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMubGF5ZXJzLmxpc3RbaV0uUHJlcGFyZVN0YXRlQmxvYiAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmxheWVycy5saXN0W2ldLlByZXBhcmVTdGF0ZUJsb2IoU1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUztcbiAgICB9O1xuXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5ibG9icyA9IHRoaXMuQnVpbGQodGhpcy5ibG9icy5sZW5ndGgsIHRoaXMuYmxvYnMpO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmxheWVycy5yZWN1cnJlbnQpIHsgLy8gb25seSBpZiByZWN1cnJlbnRcbiAgICAgICAgICAgIHZhciBTID0gdGhpcy5ibG9icy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuYmxvYnMudW5zaGlmdCh0aGlzLkJ1aWxkU3RhdGUodGhpcy5ibG9icywgUykpOyAvLyByZXVzYWJpbGl0eVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLndpZHRoLmxlbmd0aDsgaSsrKSB7IHRoaXMuYmxvYnNbdGhpcy5oZWlnaHRdW2ldLnByZXYgPSBudWxsOyB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjbGVhbiBncmFkaWVudHNcbiAgICAgICAgZm9yICh2YXIgdCA9IDA7IHQgPCB0aGlzLmhlaWdodCArIDE7IHQrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLndpZHRoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2JzW3RdW2ldLmR3LmFsbCgwLjApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaSwgdCkge1xuICAgICAgICB0ID0gdCB8fCAwO1xuICAgICAgICB0ID0gdCA+PSAwID8gdCA6IHRoaXMuaGVpZ2h0ICsgdDtcblxuICAgICAgICBpID0gaSB8fCAwO1xuICAgICAgICBpID0gaSA+PSAwID8gaSA6IHRoaXMud2lkdGggKyBpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmJsb2JzW3RdW2ldO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBOZXR3b3JrKG9wdCkge1xuICAgICAgICB0aGlzLmxlYXJuZXIgPSBvcHQubGVhcm5lcjtcbiAgICAgICAgdGhpcy5sZWFybmVyID0gT2JqZWN0LmV4dGVuZCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdzZ2QnLFxuICAgICAgICAgICAgYmF0Y2g6IDEsXG4gICAgICAgICAgICBkZWNheTogeyBsMTogMCwgbDI6IDAgfSxcbiAgICAgICAgICAgIGNsaXA6IEluZmluaXR5LFxuICAgICAgICAgICAgdGltZXNwYW46IDEgLy8gb25seSBmb3Igcm5uXG4gICAgICAgIH0sIHRoaXMubGVhcm5lcik7XG5cbiAgICAgICAgdGhpcy5sZWFybmVyID0gT2JqZWN0LmV4dGVuZCh0aGlzLmdkW3RoaXMubGVhcm5lci5tZXRob2RdLmRlZmF1bHRzLCB0aGlzLmxlYXJuZXIpO1xuICAgICAgICB0aGlzLndlYWsgPSB0cnVlOyAvLyBkcm9wb3V0IGVuYWJsZWQ/XG4gICAgICAgIHRoaXMucGFzcyA9IDA7XG5cbiAgICAgICAgdGhpcy5sYXllcnMgPSBuZXcgTmV0d29ya1N0cnVjdHVyZShvcHQubGF5ZXJzLCB0aGlzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IG5ldyBOZXR3b3JrU3RhdGUodGhpcyk7IC8vIGV4Y2hhbmdhYmxlXG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbihpbnApIHtcbiAgICAgICAgLy8gZ28gZm9yd2FyZHMgdGhyb3VnaCBuZXR3b3JrXG4gICAgICAgIHRoaXMuc3RhdGUubmV4dCgpO1xuICAgICAgICB2YXIgeSA9IHRoaXMubGF5ZXJzLmxpc3RbMF0uZm9yd2FyZChpbnAsIHRoaXMuc3RhdGUuYXQoMCkpO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB5ID0gdGhpcy5sYXllcnMubGlzdFtpXS5mb3J3YXJkKHRoaXMuc3RhdGUuYXQoaSAtIDEpLCB0aGlzLnN0YXRlLmF0KGkpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB5ICE9PSB1bmRlZmluZWQgPyB5IDogdGhpcy5zdGF0ZS5hdCgtMSkudy5kO1xuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uKG91dHApIHtcbiAgICAgICAgdmFyIEUgPSBmYWxzZSwgSSA9IHRoaXMubGF5ZXJzLmxlbmd0aCAtIDI7XG5cbiAgICAgICAgdmFyIGxvc3MgPSB0aGlzLmxheWVycy5hdCgtMSkuYmFja3dhcmQodGhpcy5zdGF0ZS5hdCgtMSksIHRoaXMuc3RhdGUuYXQoLTIpLCBvdXRwKTtcbiAgICAgICAgZm9yICh2YXIgdCA9IDA7IHQgPCB0aGlzLnN0YXRlLmhlaWdodCAmJiAoRSB8fCB0ID09PSAwKTsgdCsrKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gSTsgaSA+PSAwOyBpLS0pIHsgLy8gYWx3YXlzIHN0YXJ0IGJhY2t3YXJkIHBhc3MgYXQgbGFzdCByZWN1cnJlbnQgbGF5ZXIsIG9yIGF0IHNlY29uZC1sYXN0IGxheWVyIGlmIHQ9MFxuXG4gICAgICAgICAgICAgICAgaWYoIUUgJiYgdGhpcy5sYXllcnMubGlzdFtpXS5yZWN1cnJlbnQpIHsgLy8gZXhwYW5kIG5ldHdvcmtcbiAgICAgICAgICAgICAgICAgICAgRSA9IHRydWUsIEkgPSBpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzLmxpc3RbaV0uYmFja3dhcmQodGhpcy5zdGF0ZS5hdChpLCB0KSwgdGhpcy5zdGF0ZS5hdChpIC0gMSwgdCkpO1xuXG4gICAgICAgICAgICB9ICBcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYWRqdXN0KCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4gbG9zcztcbiAgICB9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuYWRqdXN0ID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICgrK3RoaXMucGFzcyAlIHRoaXMubGVhcm5lci5iYXRjaCAhPT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIG1ldGhvZCA9IHRoaXMuZ2RbdGhpcy5sZWFybmVyLm1ldGhvZF07XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5sYXllcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdGhpcy5sYXllcnMubGlzdFtpXS5wYXJhbWV0ZXJzID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgdmFyIHBhcmFtID0gdGhpcy5sYXllcnMubGlzdFtpXS5wYXJhbWV0ZXJzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbS5maWx0ZXJzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGFyYW0uZmlsdGVycy5sZW5ndGg7IGorKykgeyBtZXRob2QuY2FsbCh0aGlzLCB0aGlzLmxlYXJuZXIsIHBhcmFtLmZpbHRlcnNbal0sIDEuMCk7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbS5iaWFzZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kLmNhbGwodGhpcywgdGhpcy5sZWFybmVyLCBwYXJhbS5iaWFzZXMsIDAuMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyogZ3JhZGllbnQgZGVzY2VudCBhbGdvcml0aG1zICovXG4gICAgTmV0d29yay5wcm90b3R5cGUuZ2QgPSB7fTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmdkLnNnZCA9IHtcbiAgICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgICAgIHJhdGU6IDAuMDEsXG4gICAgICAgICAgICBtb21lbnR1bTogMC45XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3JhZ2U6IFsnZ3N1bSddLFxuICAgICAgICBhbGdvcml0aG06IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZHggPSBvcHQubW9tZW50dW0gKiBnc3VtIC0gb3B0LnJhdGUgKiBnaWo7XG4gICAgICAgICAgICBnc3VtID0gZHg7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuZ2QuYWRhZGVsdGEgPSB7XG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICBybzogMC45NSxcbiAgICAgICAgICAgIGVwczogMWUtOFxuICAgICAgICB9LFxuICAgICAgICBzdG9yYWdlOiBbJ2dzdW0nLCAneHN1bSddLFxuICAgICAgICBhbGdvcml0aG06IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZ3N1bSA9IG9wdC5ybyAqIGdzdW0gKyAoMSAtIG9wdC5ybykgKiBnaWogKiBnaWo7XG4gICAgICAgICAgICBkeCA9IC1NYXRoLnNxcnQoKHhzdW0gKyBvcHQuZXBzKSAvIChnc3VtICsgb3B0LmVwcykpICogZ2lqO1xuICAgICAgICAgICAgeHN1bSA9IG9wdC5ybyAqIHhzdW0gKyAoMSAtIG9wdC5ybykgKiBkeCAqIGR4OyAvLyB5ZXMsIHhzdW0gbGFncyBiZWhpbmQgZ3N1bSBieSAxLlxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qIGFsZ29yaXRobXMgY29tcGlsZXIsIHNwZWVkcyB0aGluZ3MgdXAsIGFuZCBtYWtlcyB0aGluZ3MgZWFzaWVyICovXG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZ2RfcHJvdG90eXBlID0gZnVuY3Rpb24ob3B0LCBPLCBkZWNheSkge1xuICAgICAgICAgICAgaWYgKE8ubm9jaGFuZ2UpIHJldHVybjtcbiAgICAgICAgICAgIHZhciBkeCA9IDAsIF9fZ3JhZCA9IDAsIGdpaiA9IDAsIGwxZ3JhZCA9IDAsIGwyZ3JhZCA9IDA7XG4gICAgICAgICAgICBcIlVVMVwiO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBPLnNpemUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBfX2dyYWQgPSBPLmR3LmRbaV07XG4gICAgICAgICAgICAgICAgX19ncmFkID0gX19ncmFkID4gb3B0LmNsaXAgPyBvcHQuY2xpcCA6IChfX2dyYWQgPCAtb3B0LmNsaXAgPyAtb3B0LmNsaXAgOiBfX2dyYWQpO1xuICAgICAgICAgICAgICAgIGwxZ3JhZCA9IGRlY2F5ICogb3B0LmRlY2F5LmwxICogKE8udy5kW2ldID4gMCA/IDEgOiAtMSk7XG4gICAgICAgICAgICAgICAgbDJncmFkID0gZGVjYXkgKiBvcHQuZGVjYXkubDIgKiAoTy53LmRbaV0pO1xuICAgICAgICAgICAgICAgIGdpaiA9IChfX2dyYWQgKyBsMWdyYWQgKyBsMmdyYWQpIC8gb3B0LmJhdGNoO1xuICAgICAgICAgICAgICAgIFwiVVUyXCI7XG4gICAgICAgICAgICAgICAgXCJVVTNcIjtcbiAgICAgICAgICAgICAgICBcIlVVNFwiO1xuICAgICAgICAgICAgICAgIE8udy5kW2ldICs9IGR4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBPLmR3LmFsbCgwLjApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnZF9wcm90b3R5cGVfID0gZ2RfcHJvdG90eXBlLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiBOZXR3b3JrLnByb3RvdHlwZS5nZCkge1xuICAgICAgICAgICAgdmFyIGRlc2NyaXB0aW9uID0gTmV0d29yay5wcm90b3R5cGUuZ2RbbmFtZV07XG4gICAgICAgICAgICB2YXIgY2hlY2tzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLnN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjaGVja3NbaV0gPSAnaWYgKHR5cGVvZiBPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJyA9PT0gXCJ1bmRlZmluZWRcIikgeyBPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJyA9IG5ldyBsaWIuTWF0KE8uc2l6ZS54LCBPLnNpemUueSwgTy5zaXplLmRlcHRoLCAwLjApOyB9JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGV4dHJhY3Rpb25zID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLnN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBleHRyYWN0aW9uc1tpXSA9ICd2YXIgJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnID0gTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcuZFtpXTsnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYWxnID0gZGVzY3JpcHRpb24uYWxnb3JpdGhtLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBhbGcgPSBhbGcuc3Vic3RyaW5nKGFsZy5pbmRleE9mKCd7JykgKyAxLCBhbGcubGVuZ3RoIC0gMSk7XG5cbiAgICAgICAgICAgIHZhciBzdG9yaW5ncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5zdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3RvcmluZ3NbaV0gPSAnTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcuZFtpXSA9ICcgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJzsnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZnVuYyA9IGdkX3Byb3RvdHlwZV8ucmVwbGFjZSgnXCJVVTFcIjsnLCBjaGVja3Muam9pbihcIlwiKSkucmVwbGFjZSgnXCJVVTJcIjsnLCBleHRyYWN0aW9ucy5qb2luKFwiXCIpKS5yZXBsYWNlKCdcIlVVM1wiOycsIGFsZykucmVwbGFjZSgnXCJVVTRcIjsnLCBzdG9yaW5ncy5qb2luKFwiXCIpKTtcbiAgICAgICAgICAgIHZhciBjbWQgPSAnTmV0d29yay5wcm90b3R5cGUuZ2QuJyArIG5hbWUgKyAnID0gJyArIGZ1bmM7XG4gICAgICAgICAgICBldmFsKGNtZCk7XG4gICAgICAgICAgICBOZXR3b3JrLnByb3RvdHlwZS5nZFtuYW1lXS5kZWZhdWx0cyA9IGRlc2NyaXB0aW9uLmRlZmF1bHRzO1xuICAgICAgICB9XG4gICAgfSkoKTtcblxuICAgIGxpYi5OZXR3b3JrID0gTmV0d29yaztcbn0pKG5uanMpO1xuIiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cblx0Lyogc3BhdGlhbCB3ZWlnaHRzICovXG5cdGZ1bmN0aW9uIENvbnZvbHV0aW9uYWxMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMuZmlsdGVyID0gb3B0LmZpbHRlcjtcblx0XHR0aGlzLnN0cmlkZSA9IG9wdC5zdHJpZGU7XG5cdFx0dGhpcy5wYWQgPSBvcHQucGFkO1xuXG5cdFx0dmFyIG94ID0gTWF0aC5mbG9vcigodGhpcy5pbi54ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueCkgLyB0aGlzLnN0cmlkZSArIDEpO1xuXHRcdHZhciBveSA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueSArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLnkpIC8gdGhpcy5zdHJpZGUgKyAxKTtcblx0XHR0aGlzLm91dCA9IGxpYi5TaXplMyhveCwgb3ksIHRoaXMuZmlsdGVyLmRlcHRoKTtcblxuXHRcdHRoaXMucGFyYW1ldGVycyA9IHtcblx0XHRcdGZpbHRlcnM6IFtdLFxuXHRcdFx0Ymlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5maWx0ZXIuZGVwdGgsIDAuMClcblx0XHR9O1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5kZXB0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXSA9IG5ldyBsaWIuQmxvYih0aGlzLmZpbHRlci54LCB0aGlzLmZpbHRlci55LCB0aGlzLmluLmRlcHRoKTtcblx0XHR9XG5cdH07XG5cblx0Q29udm9sdXRpb25hbExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHR2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIFZfeCA9IFYuc2l6ZS54IHwgMCwgVl95ID0gVi5zaXplLnkgfCAwLCBWX2QgPSBWLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDAsIEZfZCA9IHRoaXMuZmlsdGVyLmRlcHRoIHwgMDtcblxuXHRcdHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cdFx0dmFyIGJpYXNlcyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kO1xuXG5cdFx0Zm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuXHRcdCAgICB2YXIgZiA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2RdO1xuXHRcdCAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHsgLy8geHlfc3RyaWRlXG5cdFx0ICAgICAgICB4ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgICAgIGZvciAodmFyIGF4ID0gMDsgYXggPCBBX3g7IHggKz0gc3RyaWRlLCBheCsrKSB7IC8vIHh5X3N0cmlkZVxuXG5cdFx0ICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBwYXJ0aWN1bGFyIGxvY2F0aW9uIFtheCwgYXldXG5cdFx0ICAgICAgICAgICAgdmFyIGEgPSAwLjA7XG5cdFx0ICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwO1xuXHRcdCAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcblx0XHQgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcblx0XHQgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmZCA9IDA7IGZkIDwgRl9kOyBmZCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEud1theCwgYXksIGRdICs9IGYud1sgZngsIGZ5LCBmZCBdICogVi53WyBveCwgb3ksIGZkIF1cblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSArPSBmLncuZFsoZnkgKiBGX3ggKyBmeCkgKiBGX2QgKyBmZF0gKiBWLncuZFsob3kgKiBWX3ggKyBveCkgKiBWX2QgKyBmZF07XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgfVxuXG5cdFx0ICAgICAgICAgICAgQS53LmRbKGF5ICogQV94ICsgYXgpICogQV9kICsgZF0gPSBhICsgYmlhc2VzW2RdO1xuXHRcdCAgICAgICAgfVxuXHRcdCAgICB9XG5cdFx0fVxuXHR9O1xuXG5cdENvbnZvbHV0aW9uYWxMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdHZhciBBX3ggPSBBLnNpemUueCB8IDAsIEFfeSA9IEEuc2l6ZS55IHwgMCwgQV9kID0gQS5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMCwgRl9kID0gdGhpcy5maWx0ZXIuZGVwdGggfCAwO1xuXG5cdFx0dmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcblx0XHR2YXIgYmlhc2VzID0gdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kO1xuXG5cdFx0dmFyIHYxID0gMCwgdjIgPSAwO1xuXG5cdFx0Zm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuXHRcdCAgICB2YXIgZiA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2RdO1xuXHRcdCAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHtcblx0XHQgICAgICAgIHggPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgeCArPSBzdHJpZGUsIGF4KyspIHtcblxuXHRcdCAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgbG9jYXRpb24gW2F4LCBheV1cblx0XHQgICAgICAgICAgICB2YXIgZEEgPSBBLmR3LmRbKGF5ICogQV94ICsgYXgpICogQV9kICsgZF07XG5cdFx0ICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwO1xuXHRcdCAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcblx0XHQgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcblx0XHQgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmZCA9IDA7IGZkIDwgRl9kOyBmZCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGYuZHdbZngsIGZ5LCBmZF0gKz0gVi53W294LCBveSwgZmRdICogQS5kd1theCwgYXksIGRdXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBWLmR3W294LCBveSwgZmRdICs9IGYud1tmeCwgZnksIGZkXSAqIEEuZHdbYXgsIGF5LCBkXVxuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2MSA9IChmeSAqIEZfeCArIGZ4KSAqIEZfZCArIGZkO1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2MiA9IChveSAqIFZfeCArIG94KSAqIFZfZCArIGZkO1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmLmR3LmRbdjFdICs9IFYudy5kW3YyXSpkQTtcblx0ICAgICAgICAgICAgICAgICAgICBcdFx0XHRWLmR3LmRbdjJdICs9IGYudy5kW3YxXSpkQTtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICB9XG5cblx0XHQgICAgICAgICAgICBiaWFzZXNbZF0gKz0gZEE7XG5cdFx0ICAgICAgICB9XG5cdFx0ICAgIH1cblx0XHR9XG5cdH07XG5cblx0LyogUG9vbGluZyBsYXllciwgc2VsZWN0IGJpZ2dlc3QgdmFsdWUgZnJvbSBjb252b2x1dGlvbiAqL1xuXHRmdW5jdGlvbiBQb29saW5nTGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLmZpbHRlciA9IG9wdC5maWx0ZXI7XG5cdFx0dGhpcy5zdHJpZGUgPSBvcHQuc3RyaWRlO1xuXHRcdHRoaXMucGFkID0gb3B0LnBhZDtcblxuXHRcdHZhciBveCA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueCArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLngpIC8gdGhpcy5zdHJpZGUgKyAxKTtcblx0XHR2YXIgb3kgPSBNYXRoLmZsb29yKCh0aGlzLmluLnkgKyB0aGlzLnBhZCAqIDIgLSB0aGlzLmZpbHRlci55KSAvIHRoaXMuc3RyaWRlICsgMSk7XG5cdFx0dGhpcy5vdXQgPSBsaWIuU2l6ZTMob3gsIG95LCB0aGlzLmluLmRlcHRoKTtcblx0fTtcblxuXHRQb29saW5nTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdHZhciBBX3ggPSBBLnNpemUueCB8IDAsIEFfeSA9IEEuc2l6ZS55IHwgMCwgQV9kID0gQS5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMDsgXG5cblx0XHR2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGUgfCAwO1xuXG5cdFx0Zm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuXHRcdCAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHtcblx0XHQgICAgICAgIHggPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgeCArPSBzdHJpZGUsIGF4KyspIHtcblxuXHRcdCAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgbG9jYXRpb24gW2F4LCBheV1cblx0XHQgICAgICAgICAgICB2YXIgc2VsdiA9IC1NYXRoLkluZmluaXR5LCBzZWx4ID0gMCwgc2VseTtcblx0XHQgICAgICAgICAgICB2YXIgb3ggPSAwLCBveSA9IDAsIHEgPSAwO1xuXHRcdCAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcblx0XHQgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcblx0XHQgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcblx0XHQgICAgICAgICAgICAgICAgICAgIFx0cSA9IFYudy5kWyhveSAqIFZfeCArIG94KSAqIFZfZCArIGRdO1xuXHRcdCAgICAgICAgICAgICAgICAgICAgXHRpZiAocSA+IHNlbHYpIHsgc2VsdiA9IHE7IHNlbHggPSBveDsgc2VseSA9IG95OyB9XG5cdFx0ICAgICAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICB9XG5cblx0XHQgICAgICAgICAgICB2YXIgaXggPSAoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkO1xuXHRcdCAgICAgICAgICAgIEEucHhbaXhdID0gc2VseDtcblx0XHQgICAgICAgICAgICBBLnB5W2l4XSA9IHNlbHk7XG5cdFx0ICAgICAgICAgICAgQS53LmRbaXhdID0gc2Vsdjtcblx0XHQgICAgICAgIH1cblx0XHQgICAgfVxuXHRcdH1cblx0fTtcblxuXHRQb29saW5nTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHR2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIFZfeCA9IFYuc2l6ZS54IHwgMCwgVl95ID0gVi5zaXplLnkgfCAwLCBWX2QgPSBWLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDA7IFxuXG5cdFx0dmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcblxuXHRcdGZvciAodmFyIGQgPSAwOyBkIDwgQV9kOyBkKyspIHtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgYXkrKykge1xuXHRcdCAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgYXgrKykge1xuXHRcdCAgICAgICAgXHR2YXIgaXggPSAoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkO1xuXHRcdCAgICAgICAgXHR2YXIgZEEgPSBBLmR3LmRbaXhdO1xuXG5cdFx0ICAgICAgICBcdHZhciBzZWx4ID0gQS5weFtpeF07IFxuXHRcdCAgICAgICAgXHR2YXIgc2VseSA9IEEucHlbaXhdO1xuXG5cdFx0ICAgICAgICBcdFYuZHcuZFsoc2VseSAqIFZfeCArIHNlbHgpICogVl9kICsgZF0gPSBkQTsgLy8gb25seSB0cmFuc2ZlciB3ZWlnaHRzIGZyb20gc2VsZWN0ZWQgbG9jYXRpb25zXG5cdFx0ICAgICAgICB9XG5cdFx0ICAgIH1cblx0XHR9XG5cdH07XG5cblx0UG9vbGluZ0xheWVyLnByb3RvdHlwZS5QcmVwYXJlU3RhdGVCbG9iID0gZnVuY3Rpb24gKEEpIHtcblx0XHRBLnB4ID0gbGliLk1hdC5DcmVhdGVBcnJheSh0aGlzLm91dC5kZXB0aCAqIHRoaXMub3V0LnkgKiB0aGlzLm91dC54LCAwLCAnVWludDE2QXJyYXknKTtcblx0XHRBLnB5ID0gbGliLk1hdC5DcmVhdGVBcnJheSh0aGlzLm91dC5kZXB0aCAqIHRoaXMub3V0LnkgKiB0aGlzLm91dC54LCAwLCAnVWludDE2QXJyYXknKTtcblx0fTtcblxuXHRsaWIuQ29udm9sdXRpb25hbExheWVyID0gQ29udm9sdXRpb25hbExheWVyO1xuXHRsaWIuUG9vbGluZ0xheWVyID0gUG9vbGluZ0xheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cdC8qKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gaW5wdXQsIHNpemVcblx0ICovXG5cdGZ1bmN0aW9uIERvdExheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBsaWIuU2l6ZTMoMSwgMSwgb3B0LnNpemUpO1xuXHRcdHRoaXMucGFyYW1ldGVycyA9IHtcblx0XHRcdGZpbHRlcnM6IFtdLFxuXHRcdFx0Ymlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5vdXQuZGVwdGgsIDAuMClcblx0XHR9O1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5pbi5sZW5ndGgpO1xuXHRcdH1cblx0fTtcblxuXHREb3RMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHN1bSA9IDAuMDtcblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRzdW0gKz0gVi53LmRbal0gKiB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbal07XG5cdFx0XHR9XG5cblx0XHRcdEEudy5kW2ldID0gc3VtICsgdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmRbaV07XG5cdFx0fVxuXHR9O1xuXG5cdERvdExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGRBID0gQS5kdy5kW2ldO1xuXHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLmR3LmRbal0gKz0gVi53LmRbal0gKiBkQTtcblx0XHRcdFx0Vi5kdy5kW2pdICs9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXSAqIGRBO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLmR3LmRbaV0gKz0gZEE7XG5cdFx0fVxuXHR9O1xuXG5cdGxpYi5Eb3RMYXllciA9IERvdExheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cblx0ZnVuY3Rpb24gRHJvcE91dExheWVyKG9wdCwgbmV0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm5ldCA9IG5ldDtcblx0XHR0aGlzLnByb2JhYmlsaXR5ID0gb3B0LnByb2JhYmlsaXR5IHx8IDAuMjU7XG5cdH1cblxuXHREcm9wT3V0TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdGlmICghdGhpcy5uZXQud2Vhaykge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7IEEudy5kW2ldID0gVi53LmRbaV0gKiB0aGlzLnByb2JhYmlsaXR5OyB9IHJldHVybiA7XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoTWF0aC5yYW5kb20oKSA8IHRoaXMucHJvYmFiaWxpdHkpIHtcblx0XHRcdFx0QS53LmRbaV0gPSAwLjA7XG5cdFx0XHRcdEEuZHJvcHBlZE91dFtpXSA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRBLncuZFtpXSA9IFYudy5kW2ldO1xuXHRcdFx0XHRBLmRyb3BwZWRPdXRbaV0gPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0RHJvcE91dExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG5cdFx0aWYgKCF0aGlzLm5ldC53ZWFrIHx8IEEuZHJvcHBlZE91dC5sZW5ndGggIT09IHRoaXMuaW4ubGVuZ3RoKSByZXR1cm4gO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZighQS5kcm9wcGVkT3V0W2ldKSB7XG5cdFx0XHRcdFYuZHcuZFtpXSA9IEEuZHcuZFtpXTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0RHJvcE91dExheWVyLnByb3RvdHlwZS5QcmVwYXJlU3RhdGVCbG9iID0gZnVuY3Rpb24gKEEpIHtcblx0XHRBLmRyb3BwZWRPdXQgPSBbXTtcblx0fTtcblxuXHRsaWIuRHJvcE91dExheWVyID0gRHJvcE91dExheWVyO1xuXHRcbn0pKG5uanMpOyIsIihmdW5jdGlvbihsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBmdW5jdGlvbiBJbnB1dExheWVyKG9wdCkge1xuICAgICAgICB0aGlzLm91dCA9IG9wdC5zaXplO1xuICAgICAgICB0aGlzLnNjYWxlID0gb3B0LnNjYWxlIHx8IDEuMDtcbiAgICAgICAgdGhpcy5iaWFzID0gb3B0LmJpYXMgfHwgMC4wO1xuICAgIH07XG5cbiAgICBJbnB1dExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24oViwgQSkge1xuICAgICAgICBBLncuY29weShWLCB0aGlzLnNjYWxlLCB0aGlzLmJpYXMpO1xuICAgIH07XG5cbiAgICBJbnB1dExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uKEEsIFYpIHt9O1xuXG4gICAgbGliLklucHV0TGF5ZXIgPSBJbnB1dExheWVyO1xufSkobm5qcyk7XG4iLCIoZnVuY3Rpb24obGliKSB7XG4gICAgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBmdW5jdGlvbiBzaWdtKHgpIHtcbiAgICAgICAgcmV0dXJuIDEuMCAvICgxLjAgKyBNYXRoLmV4cCgteCkpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRzaWdtKHkpIHtcbiAgICAgICAgcmV0dXJuIHkgKiAoMSAtIHkpO1xuICAgIH1cblxuICAgIC8vIHNlZSBodHRwOi8vcGVvcGxlLmlkc2lhLmNoL35qdWVyZ2VuL2xzdG0vc2xkMDE5Lmh0bVxuICAgIGZ1bmN0aW9uIExvbmdTaG9ydFRlcm1NZW1vcnlMYXllcihvcHQpIHtcbiAgICAgICAgdGhpcy5pbiA9IG9wdC5pbnB1dDtcbiAgICAgICAgdGhpcy5vdXQgPSBvcHQuaW5wdXQ7IC8vIDEgdG8gMSBtYXBwaW5nXG5cbiAgICAgICAgdGhpcy5yZWN1cnJlbnQgPSB0cnVlO1xuICAgICAgICB0aGlzLnBhcmFtZXRlcnMgPSB7XG4gICAgICAgICAgICBmaWx0ZXJzOiBbXSxcbiAgICAgICAgICAgIGJpYXNlczogbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMub3V0LmRlcHRoLCAwLjApXG4gICAgICAgIH07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgOSwgMCwgMC4wOCk7XG4gICAgICAgIFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kWzJdID0gLTE7IC8vIGF0IGJlZ2lubmluZyBuZWdhdGl2ZSBwZWVwaG9sZSBjb25uZWN0aW9uc1xuICAgICAgICBcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFs1XSA9IC0xOyAvLyB0byBtaW5pbWl6ZSBleHBsb2RpbmdcbiAgICAgICAgXHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbOF0gPSAtMTsgLy8gY2VsbCBzdGF0ZVxuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcyA9IG5ldyBsaWIuQmxvYigxLCB0aGlzLmluLmxlbmd0aCwgMywgMC4wKTtcbiAgICB9O1xuXG4gICAgTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24oViwgQSkge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW0gPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmQ7XG4gICAgICAgICAgICB2YXIgYmlhcyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kO1xuXG4gICAgICAgICAgICB2YXIgeCA9IFYudy5kW2ldO1xuICAgICAgICAgICAgdmFyIGhfID0gQS5wcmV2LncuZFtpXTtcbiAgICAgICAgICAgIHZhciBjXyA9IEEucHJldi5sc3RtLmNlbGxzLncuZFtpXTtcblxuICAgICAgICAgICAgdmFyIGlnID0gc2lnbSh4ICogcGFyYW1bMF0gKyBoXyAqIHBhcmFtWzFdICsgY18gKiBwYXJhbVsyXSArIGJpYXNbaSAqIDMgKyAwXSk7XG4gICAgICAgICAgICB2YXIgZmcgPSBzaWdtKHggKiBwYXJhbVszXSArIGhfICogcGFyYW1bNF0gKyBjXyAqIHBhcmFtWzVdICsgYmlhc1tpICogMyArIDFdKTtcbiAgICAgICAgICAgIHZhciBjID0gaWcgKiB4ICsgZmcgKiBjXztcbiAgICAgICAgICAgIHZhciBvZyA9IHNpZ20oeCAqIHBhcmFtWzZdICsgaF8gKiBwYXJhbVs3XSArIGMgICogcGFyYW1bOF0gKyBiaWFzW2kgKiAzICsgMl0pO1xuICAgICAgICAgICAgdmFyIGggPSBvZyAqIGM7XG5cbiAgICAgICAgICAgIEEubHN0bS5nYXRlcy5pbi5kW2ldID0gaWc7XG4gICAgICAgICAgICBBLmxzdG0uZ2F0ZXMuZm9yZ2V0LmRbaV0gPSBmZztcbiAgICAgICAgICAgIEEubHN0bS5nYXRlcy5vdXQuZFtpXSA9IG9nO1xuXG4gICAgICAgICAgICBBLmxzdG0uY2VsbHMudy5kW2ldID0gYztcbiAgICAgICAgICAgIEEudy5kW2ldID0gaDtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24oQSwgVikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW0gPSB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmQ7XG4gICAgICAgICAgICB2YXIgYmlhcyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kO1xuXG4gICAgICAgICAgICB2YXIgaWcgPSBBLmxzdG0uZ2F0ZXMuaW4uZFtpXTtcbiAgICAgICAgICAgIHZhciBmZyA9IEEubHN0bS5nYXRlcy5mb3JnZXQuZFtpXTtcbiAgICAgICAgICAgIHZhciBvZyA9IEEubHN0bS5nYXRlcy5vdXQuZFtpXTtcbiAgICAgICAgICAgIHZhciBjID0gQS5sc3RtLmNlbGxzLncuZFtpXTtcblxuICAgICAgICAgICAgdmFyIHggPSBWLncuZFtpXTtcbiAgICAgICAgICAgIHZhciBoXyA9IEEucHJldi53LmRbaV07XG4gICAgICAgICAgICB2YXIgY18gPSBBLnByZXYubHN0bS5jZWxscy53LmRbaV07XG5cbiAgICAgICAgICAgIHZhciBkaCA9IEEuZHcuZFtpXTtcbiAgICAgICAgICAgIHZhciBkYyA9IEEubHN0bS5jZWxscy5kdy5kW2ldO1xuXG4gICAgICAgICAgICB2YXIgZG9nID0gZHNpZ20ob2cpICogYyAqIGRoO1xuICAgICAgICAgICAgZGMgPSBkYyArIHBhcmFtWzhdICogZG9nICsgb2cgKiBkaDtcbiAgICAgICAgICAgIHZhciBkZmcgPSBkc2lnbShmZykgKiBjXyAqIGRjO1xuICAgICAgICAgICAgdmFyIGRpZyA9IGRzaWdtKGlnKSAqIHggKiBkYztcbiAgICAgICAgICAgIHZhciBkeCA9IGlnICogZGMgKyBwYXJhbVs2XSAqIGRvZyArIHBhcmFtWzNdICogZGZnICsgcGFyYW1bMF0gKiBkaWc7XG5cbiAgICAgICAgICAgIHZhciBkY18gPSBmZyAqIGRjICsgcGFyYW1bNV0gKiBkZmcgKyBwYXJhbVsyXSAqIGRpZztcbiAgICAgICAgICAgIHZhciBkaF8gPSBwYXJhbVs3XSAqIGRvZyArIHBhcmFtWzRdICogZGZnICsgcGFyYW1bMV0gKiBkaWc7XG5cbiAgICAgICAgICAgIEEucHJldi5sc3RtLmNlbGxzLmR3LmRbaV0gPSBkY187XG4gICAgICAgICAgICBBLnByZXYuZHcuZFtpXSArPSBkaF87IC8vIGFkZCB0byBhbHJlYWR5IGJhY2twcm9wcGVkIHZhbHVlXG4gICAgICAgICAgICBWLmR3LmRbaV0gPSBkeDtcblxuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFswXSArPSB4ICogZGlnO1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFsxXSArPSBoXyAqIGRpZztcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLmR3LmRbMl0gKz0gY18gKiBkaWc7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5kdy5kWzNdICs9IHggKiBkZmc7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5kdy5kWzRdICs9IGhfICogZGZnO1xuICAgICAgICAgICAgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFs1XSArPSBjXyAqIGRmZztcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLmR3LmRbNl0gKz0geCAqIGRvZztcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLmR3LmRbN10gKz0gaF8gKiBkb2c7XG4gICAgICAgICAgICB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5kdy5kWzhdICs9IGMgKiBkb2c7XG5cbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuZFtpICogMyArIDBdICs9IDEuMCAqIGRpZztcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuZFtpICogMyArIDFdICs9IDEuMCAqIGRmZztcbiAgICAgICAgICAgIHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuZFtpICogMyArIDJdICs9IDEuMCAqIGRvZztcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIucHJvdG90eXBlLlByZXBhcmVTdGF0ZUJsb2IgPSBmdW5jdGlvbihBKSB7XG4gICAgICAgIGlmICh0eXBlb2YgQS5zdGF0ZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgIEEubHN0bSA9IHtcbiAgICAgICAgICAgICAgICBjZWxsczogbmV3IGxpYi5CbG9iKHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApLFxuICAgICAgICAgICAgICAgIGdhdGVzOiB7IGluIDogbmV3IGxpYi5NYXQodGhpcy5vdXQueCwgdGhpcy5vdXQueSwgdGhpcy5vdXQuZGVwdGgsIDAuMCksXG4gICAgICAgICAgICAgICAgICAgIG91dDogbmV3IGxpYi5NYXQodGhpcy5vdXQueCwgdGhpcy5vdXQueSwgdGhpcy5vdXQuZGVwdGgsIDAuMCksXG4gICAgICAgICAgICAgICAgICAgIGZvcmdldDogbmV3IGxpYi5NYXQodGhpcy5vdXQueCwgdGhpcy5vdXQueSwgdGhpcy5vdXQuZGVwdGgsIDAuMClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgQS5sc3RtLmNlbGxzLncuYWxsKDApO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxpYi5Mb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIgPSBMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXI7XG59KShubmpzKTtcbiIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXHRmdW5jdGlvbiBTaWdtb2lkTGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IG9wdC5pbnB1dDtcblx0fTtcblxuXHRTaWdtb2lkTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0QS53LmRbaV0gPSAxLjAvKDEuMCtNYXRoLmV4cCgtVi53LmRbaV0pKTtcblx0XHR9XG5cdH1cblxuXHRTaWdtb2lkTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFYuZHcuZFtpXSA9IEEudy5kW2ldICogKC1BLncuZFtpXSArIDEuMCkgKiBBLmR3LmRbaV07XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIFJlbHVMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gb3B0LmlucHV0O1xuXHR9O1xuXG5cdFJlbHVMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRBLncuZFtpXSA9IFYudy5kW2ldIDwgMCA/IDAgOiBWLncuZFtpXTtcblx0XHR9XG5cdH1cblxuXHRSZWx1TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmKEEudy5kW2ldIDw9IDApIFYuZHcuZFtpXSA9IDA7IC8vIHRocmVzaG9sZFxuXHQgICAgICAgIGVsc2UgVi5kdy5kW2ldID0gQS5kdy5kW2ldO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiBUYW5oTGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IG9wdC5pbnB1dDtcblx0fTtcblxuXHRUYW5oTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0QS53LmRbaV0gPSBsaWIuTWF0aFUudGFuaChWLncuZFtpXSk7XG5cdFx0fVxuXHR9XG5cblx0VGFuaExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRWLmR3LmRbaV0gPSAoMS4wIC0gQS53LmRbaV0gKiBBLncuZFtpXSkgKiBBLmR3LmRbaV07XG5cdCBcdH1cblx0fTtcblxuXHRsaWIuU2lnbW9pZExheWVyID0gU2lnbW9pZExheWVyO1xuXHRsaWIuUmVsdUxheWVyID0gUmVsdUxheWVyO1xuXHRsaWIuVGFuaExheWVyID0gVGFuaExheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cblx0ZnVuY3Rpb24gUmVncmVzc2lvbkxheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG5cdH07XG5cblx0UmVncmVzc2lvbkxheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHRBLncud3JpdGUoVi53KTtcblx0fTtcblxuXHRSZWdyZXNzaW9uTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYsIGRlc2lyZWQpIHtcblx0XHR2YXIgbG9zcyA9IDAuMDtcblx0XHRpZihkZXNpcmVkIGluc3RhbmNlb2YgQXJyYXkgfHwgZGVzaXJlZCBpbnN0YW5jZW9mIEZsb2F0NjRBcnJheSkge1xuXHRcdFx0Zm9yKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgKytpKSB7XG5cdFx0XHRcdFYuZHcuZFtpXSA9IEEudy5kW2ldIC0gZGVzaXJlZFtpXTtcblx0XHRcdFx0bG9zcyArPSAwLjUqVi5kdy5kW2ldKlYuZHcuZFtpXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gbG9zcztcblx0fTtcblxuXHRsaWIuUmVncmVzc2lvbkxheWVyID0gUmVncmVzc2lvbkxheWVyO1xuXG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuXHRmdW5jdGlvbiBTb2Z0bWF4TGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IGxpYi5TaXplMygxLCAxLCB0aGlzLmluLnggKiB0aGlzLmluLnkgKiB0aGlzLmluLmRlcHRoKTtcblx0XHR0aGlzLmNsYXNzZXMgPSB0aGlzLm91dC5kZXB0aDtcblx0fTtcblxuXHRTb2Z0bWF4TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdC8vIGNvbXB1dGUgbWF4IGFjdGl2YXRpb25cblx0XHR2YXIgYW1heCA9IFYudy5kWzBdO1xuXHRcdGZvciAodmFyIGkgPSAxOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcblx0XHRcdGlmKFYudy5kW2ldID4gYW1heCkgYW1heCA9IFYudy5kW2ldO1xuXHRcdH1cblxuXHRcdC8vIGNvbXB1dGUgZXhwb25lbnRpYWxzIChjYXJlZnVsbHkgdG8gbm90IGJsb3cgdXApXG5cdFx0dmFyIGVzID0gbGliLk1hdC5DcmVhdGVBcnJheSh0aGlzLm91dC5kZXB0aCwgMC4wKSwgZXN1bSA9IDAuMDtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuY2xhc3NlczsgaSsrKSB7XG5cdFx0XHR2YXIgZSA9IE1hdGguZXhwKFYudy5kW2ldIC0gYW1heCk7XG5cdFx0XHRlc3VtICs9IGU7XG5cdFx0XHRlc1tpXSA9IGU7XG5cdFx0fVxuXG5cdFx0Ly8gbm9ybWFsaXplIGFuZCBvdXRwdXQgdG8gc3VtIHRvIG9uZVxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcblx0XHRcdGVzW2ldIC89IGVzdW07XG5cdFx0XHRBLncuZFtpXSA9IGVzW2ldO1xuXHRcdH1cblxuXHRcdHJldHVybiBBLncubWF4aSgpO1xuXHR9O1xuXG5cdFNvZnRtYXhMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgViwgZGVzaXJlZCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcblx0XHRcdHZhciBpbmRpY2F0b3IgPSBpID09PSBkZXNpcmVkID8gMS4wIDogMC4wO1xuXHRcdFx0Vi5kdy5kW2ldID0gQS53LmRbaV0gLSBpbmRpY2F0b3I7XG5cdFx0fVxuXG5cdFx0Ly8gbG9zcyBpcyB0aGUgY2xhc3MgbmVnYXRpdmUgbG9nIGxpa2VsaWhvb2Rcblx0XHRyZXR1cm4gLU1hdGgubG9nKEEudy5kW2Rlc2lyZWRdKTtcblx0fTtcblxuXHQvKiBhcHByb3guIDMwMHggZmFzdGVyIHRoYW4gc29mdG1heCwgZGVjcmVhc2UgaW4gYWNjdXJhY3kgYW5kIHBlcmZvcm1hbmNlICovXG5cdC8qKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gdHJlZSBbb2JqZWN0XSBvciBjbGFzc2VzIFtpbnRdXG5cdCAqL1xuXHRmdW5jdGlvbiBIaWVyYXJjaGljYWxTb2Z0bWF4KG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cblx0XHRpZiAob3B0LnRyZWUpIHtcblx0XHRcdHRoaXMudHJlZSA9IG9wdC50cmVlO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHR0aGlzLnRyZWUgPSB0aGlzLkJ1aWxkVHJlZShvcHQuY2xhc3Nlcyk7XG5cdFx0fVxuXG5cdFx0dGhpcy5QcmVwYXJlVHJlZSgpO1xuXG5cdFx0YXNzZXJ0KG9wdC5jbGFzc2VzID09PSB1bmRlZmluZWQgfHwgKG9wdC5jbGFzc2VzID09PSB0aGlzLmNsYXNzZXMpLCAnSGllcmFyY2hpY2FsU29mdG1heDogdHJlZSBub3Qgc3VwcG9ydGVkJyk7XG5cblx0XHR0aGlzLm5vZGVzID0gdGhpcy5jbGFzc2VzIC0gMTtcblx0XHR0aGlzLnBhcmFtZXRlcnMgPSB7XG5cdFx0XHRmaWx0ZXJzOiBbXSxcblx0XHRcdGJpYXNlczogbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMubm9kZXMsIDAuMClcblx0XHR9O1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm5vZGVzOyBpKyspIHtcblx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldID0gbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMuaW4ubGVuZ3RoKTtcblx0XHR9XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSID0gMDtcblx0SGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUiA9IDE7XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuQnVpbGRUcmVlID0gZnVuY3Rpb24gKGNsYXNzZXMpIHtcblx0XHQvLyBjcmVhdGUgdHJlZSBvZiBzaXplIGxvZyhjbGFzc2VzKVxuXHRcdHZhciBkZXB0aCA9IE1hdGguZmxvb3IoTWF0aC5sb2cyKGNsYXNzZXMpKTtcblx0XHR2YXIgdHJlZSA9IHRoaXMuQ3JlYXRlTm9kZShkZXB0aCwgbnVsbCk7XG5cblx0XHQvLyBhZGQgcmVtYWluaW5nIG5vZGVzIHRvIHRyZWVcblx0XHR2YXIgcmVtYWluZGVyID0gY2xhc3NlcyAtIE1hdGgucG93KDIsIGRlcHRoKTtcblx0XHR0aGlzLnRyYXZlcnNlKHRyZWUsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0XHRpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SICYmIHJlbWFpbmRlciA+IDApIHtcblx0XHRcdFx0bm9kZS50eXBlID0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSO1xuXHRcdFx0XHRub2RlLmEgPSB0aGlzLkNyZWF0ZU5vZGUoMCwgbm9kZSk7XG5cdFx0XHRcdG5vZGUuYiA9IHRoaXMuQ3JlYXRlTm9kZSgwLCBub2RlKTtcblxuXHRcdFx0XHRyZW1haW5kZXItLTtcblxuXHRcdFx0XHRyZXR1cm4gZmFsc2U7XG5cdFx0XHR9XG5cblx0XHRcdHJldHVybiB0cnVlO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIHRyZWU7XG5cdH07IFxuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLlByZXBhcmVUcmVlID0gZnVuY3Rpb24gKCkge1xuXHRcdHZhciBzZWwgPSAwLCBwdHIgPSAwLCB0YWJsZSA9IHt9O1xuXHRcdHRoaXMudHJhdmVyc2UodGhpcy50cmVlLCBmdW5jdGlvbiAobm9kZSkge1xuXHRcdFx0aWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUikge1xuXHRcdFx0XHR0YWJsZVtzZWxdID0gbm9kZTtcblx0XHRcdFx0bm9kZS5pbmRleCA9IHNlbDtcblx0XHRcdCsrc2VsO31cblxuXHRcdFx0ZWxzZSBpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVIpIHtcblx0XHRcdFx0bm9kZS5pbmRleCA9IHB0cjtcblx0XHRcdHB0cisrO31cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSk7XG5cblx0XHR0aGlzLmNsYXNzZXMgPSBzZWw7XG5cdFx0dGhpcy5ub2RlcyA9IHB0cjtcblx0XHR0aGlzLnRhYmxlID0gdGFibGU7XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuQ3JlYXRlTm9kZSA9IGZ1bmN0aW9uIChkZXB0aCwgcGFyZW50KSB7XG5cdFx0dmFyIG5vZGUgPSB7IHBhcmVudDogcGFyZW50IH07XG5cblx0XHRpZiAoZGVwdGggPD0gMCkge1xuXHRcdFx0bm9kZS50eXBlID0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUjtcblx0XHR9IGVsc2Uge1xuXHRcdFx0bm9kZS50eXBlID0gSGllcmFyY2hpY2FsU29mdG1heC5QT0lOVEVSO1xuXHRcdFx0bm9kZS5hID0gdGhpcy5DcmVhdGVOb2RlKGRlcHRoLTEsIG5vZGUpO1xuXHRcdFx0bm9kZS5iID0gdGhpcy5DcmVhdGVOb2RlKGRlcHRoLTEsIG5vZGUpO1xuXHRcdH1cblxuXHRcdHJldHVybiBub2RlO1xuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLnRyYXZlcnNlID0gZnVuY3Rpb24gKG5vZGUsIGNiKSB7XG5cdFx0aWYgKGNiLmNhbGwodGhpcywgbm9kZSkgJiYgbm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVIpIHtcblx0XHRcdHRoaXMudHJhdmVyc2Uobm9kZS5hLCBjYik7XG5cdFx0XHR0aGlzLnRyYXZlcnNlKG5vZGUuYiwgY2IpO1xuXHRcdH1cblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5hc2NlbmQgPSBmdW5jdGlvbiAobm9kZSwgY2IpIHtcblx0XHRpZiAobm9kZS5wYXJlbnQgPT09IG51bGwpIHJldHVybiA7XG5cdFx0Y2IuY2FsbCh0aGlzLCBub2RlLnBhcmVudCwgbm9kZSA9PT0gbm9kZS5wYXJlbnQuYSA/IC0xLjAgOiAxLjApO1xuXHRcdHRoaXMuYXNjZW5kKG5vZGUucGFyZW50LCBjYik7XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuZGVzY2VuZCA9IGZ1bmN0aW9uIChub2RlLCBjYikge1xuXHRcdHZhciBkID0gY2IuY2FsbCh0aGlzLCBub2RlKTtcblxuXHRcdGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IgfHwgZCBpbnN0YW5jZW9mIE9iamVjdCB8fCBkID09PSBudWxsKSB7XG5cdFx0XHRyZXR1cm4gZDtcblx0XHR9XG5cblx0XHRpZiAoZCA+IDAuMCkgeyAvLyBuZWdhdGl2ZSBtZWFucyBsZWZ0LCBwb3NpdGl2ZSBtZWFucyByaWdodFxuXHRcdFx0cmV0dXJuIHRoaXMuZGVzY2VuZChub2RlLmIsIGNiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0cmV0dXJuIHRoaXMuZGVzY2VuZChub2RlLmEsIGNiKTtcblx0XHR9XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuYWN0aXZhdGUgPSBmdW5jdGlvbiAoViwgaSkge1xuXHRcdHZhciBzdW0gPSAwLjA7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRzdW0gKz0gVi53LmRbal0gKiB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbal07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIGxpYi5NYXRoVS50YW5oKHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kW2ldICsgc3VtKTtcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5ncmFkaWVudCA9IGZ1bmN0aW9uIChWLCBpLCBkaXJlY3Rpb24pIHtcblx0XHR2YXIgYWN0ID0gdGhpcy5hY3RpdmF0ZShWLCBpKSxcblx0XHRcdFx0ZXJyID0gYWN0IC0gZGlyZWN0aW9uO1xuXG5cdFx0dmFyIGR3ID0gKDEuMCAtIGFjdCAqIGFjdCkgKiBlcnI7XG5cdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0ubm9jaGFuZ2UgPSBmYWxzZTtcblxuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFtqXSArPSBWLncuZFtqXSAqIGR3O1xuXHRcdFx0Vi5kdy5kW2pdICs9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXSAqIGR3O1xuXHRcdH1cblxuXHRcdHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuZFtpXSArPSBkdztcblxuXHRcdHJldHVybiAoZGlyZWN0aW9uIDwgMCA/IDEgLSAoYWN0ICogMC41ICsgMC41KSA6IChhY3QgKiAwLjUgKyAwLjUpKTsgLy8gcHJvYmFiaWxpdHkgdG8gZ28gdGhlIHJpZ2h0IHdheVxuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdHZhciBzZWxlY3RlZCA9IHRoaXMuZGVzY2VuZCh0aGlzLnRyZWUsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0XHRpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVIpIHtcblx0XHRcdFx0cmV0dXJuIHRoaXMuYWN0aXZhdGUoViwgbm9kZS5pbmRleCk7XG5cdFx0XHR9XG5cblx0XHRcdGVsc2UgaWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUikge1xuXHRcdFx0XHRyZXR1cm4gbm9kZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gKEEuaW5kZXggPSBzZWxlY3RlZC5pbmRleCk7XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgViwgZGVzaXJlZCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLm5vY2hhbmdlID0gdHJ1ZTtcblx0XHR9XG5cblx0XHR2YXIgcHJvYiA9IDEuMDtcblx0XHR0aGlzLmFzY2VuZCh0aGlzLnRhYmxlW2Rlc2lyZWRdLCBmdW5jdGlvbiAobm9kZSwgZGlyZWN0aW9uKSB7XG5cdFx0XHRwcm9iID0gcHJvYiAqIHRoaXMuZ3JhZGllbnQoViwgbm9kZS5pbmRleCwgZGlyZWN0aW9uKTtcblx0XHR9KTtcblxuXHRcdHJldHVybiAxLjAgLSBwcm9iOyAvLyBwcm9iYWJpbGl0eSB0byBOT1QgZ28gdGhlIHJpZ2h0IHdheVxuXHR9O1xuXG5cdGxpYi5Tb2Z0bWF4TGF5ZXIgPSBTb2Z0bWF4TGF5ZXI7XG5cdGxpYi5IaWVyYXJjaGljYWxTb2Z0bWF4ID0gSGllcmFyY2hpY2FsU29mdG1heDtcbn0pKG5uanMpOyIsIihmdW5jdGlvbihsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICBpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJ1bmRlZmluZWRcIiB8fCB0eXBlb2YgbW9kdWxlLmV4cG9ydHMgPT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgd2luZG93Lm5uID0gbGliO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIG1vZHVsZS5leHBvcnRzID0gbGliO1xuICAgIH1cbiAgICBcbn0pKG5uanMpO1xuIl0sInNvdXJjZVJvb3QiOiIvc291cmNlLyJ9
