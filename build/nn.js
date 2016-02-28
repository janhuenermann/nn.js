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

(function (lib) {"use strict";
	var math = {
		gauss_: { a: false, b: 0.0 },
		gauss: function () {
			if(math.gauss_.a) {  math.gauss_.a = false; return math.gauss_.b; }
			var u = 2*Math.random()-1;
			var v = 2*Math.random()-1;
			var r = u*u + v*v;
			if(r == 0 || r > 1) return math.gauss();
			var c = Math.sqrt(-2*Math.log(r)/r);
			math.gauss_.b = v*c; // cache this
			math.gauss_.a = true;
			return u*c;
		},

		randf: function (a, b) {
			return Math.random()*(b-a)+a;
		},

		randi: function (a, b) {
			return Math.floor(Math.random()*(b-a)+a);
		},

		randn: function (mu, std) {
			return mu+math.gauss()*std;
		},

		tanh: typeof Math.tanh === "undefined" ? function (x) { var y = Math.exp(2 * x); return (y - 1) / (y + 1); } : Math.tanh
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

	Mat.CreateArray = function (length, v, t) {
		var arr = null;
		
		v = v || 0;
		t = t || 'Float64Array';

		if(typeof ArrayBuffer === 'undefined') {
			arr = new Array(length);
		} else {
			arr = eval('new ' + t + '(length)');
		}

		for (var i = 0; i < length; ++i) { arr[i] = v; }
		return arr;
	};

	Mat.copy = function (mat) {
		var mat_ = new mat(mat.size.x, mat.size.y, mat.size.depth);
		for (var i = 0; i < mat.d.length; i++) { mat_.d[i] = mat.d[i]; }
		return mat_;
	};

	Mat.prototype.maxi = function () {
		for (var i = 0, j = 0, m = -Infinity; i < this.d.length; i++) {
			if (this.d[i] > m) {
				j = i, m = this.d[i];
			}
		}

		return j;
	};

	Mat.prototype.get = function (x, y, z) {
		return this.d[ (y * this.size.x + x) * this.size.depth + z ];
	};

	Mat.prototype.set = function (x, y, z, v) {
		this.d[ (y * this.size.x + x) * this.size.depth + z ] = v;
	};

	Mat.prototype.add = function (x, y, z, v) {
		this.d[ (y * this.size.x + x) * this.size.depth + z ] += v;
	};

	Mat.prototype.all = function (v) {
		for (var i = 0; i < this.d.length; i++) { this.d[i] = v; }
	};

	Mat.prototype.copy = function (a, s, b) {
		if (s === undefined) s = 1;
		for (var i = 0; i < this.d.length; i++) { this.d[i] = a[i] / s + b; }
	};

	Mat.prototype.write = function (a) {
		for (var i = 0; i < this.d.length; i++) { this.d[i] = a.d[i]; }
	};

	Mat.prototype.randf = function (a, b) {
		for (var i = 0; i < this.d.length; i++) { this.d[i] = math.randf(a, b); }
	};

	Mat.prototype.randn = function (scale) {
		scale = scale || Math.sqrt(1.0/(this.size.x*this.size.y*this.size.depth));
		for (var i = 0; i < this.d.length; i++) { this.d[i] = math.randn(0.0, scale); }
	};

	Mat.prototype.clone = function () {
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
        var stats = { parameters: 0, nodes: 0 };

        for (var i = 0; i < this.length; i++) {
            stats.nodes += this.list[i].out.length;

            if (this.list[i].parameters === undefined) continue;

            for (var j = 0; j < this.list[i].parameters.filters.length; j++) {
                stats.parameters += this.list[i].parameters.filters[j].size.length;
            }

            stats.parameters += this.list[i].parameters.biases.size.length;
        }

        return stats;
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
            if (typeof this.layers.at(i).out !== 'undefined' && S[i] === undefined) {
                S[i] = new lib.Blob(this.layers.at(i).out.x, this.layers.at(i).out.y, this.layers.at(i).out.depth, 0.0);
            } else if (S[i] === undefined) {
                S[i] = {};
            } else {
                S[i].w.all(0), S[i].dw.all(0);
            }

            if (typeof this.layers.at(i).recurrent !== 'undefined' && this.layers.at(i).recurrent
                    && T !== undefined && T.length > 0) {
                S[i].prev = T[0][i];
            }

            if (typeof this.layers.at(i).PrepareStateBlob !== 'undefined') {
                this.layers.at(i).PrepareStateBlob(S[i]);
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
            for (var i = 0; i < this.width.length; i++) { this.at(i, this.height).prev = null; }
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

        return this.blobs[t||0][i];
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
        var y = this.layers.at(0).forward(inp, this.state.at(0));
        for (var i = 1; i < this.layers.length; ++i) {
            y = this.layers.at(i).forward(this.state.at(i - 1), this.state.at(i));
        }

        return y !== undefined ? y : this.state.at(-1).w.d;
    };

    Network.prototype.backward = function(outp) {
        var E = false, I = this.layers.length - 2;

        var loss = this.layers.at(-1).backward(this.state.at(-1), this.state.at(-2), outp);
        for (var t = 0; t < this.state.height && (E || t === 0); t++) {
            for (var i = I; i >= 0; i--) { // always start backward pass at last recurrent layer, or at second-last layer if t=0

                if(!E && this.layers.at(i).recurrent) { // expand network
                    E = true, I = i;
                }

                this.layers.at(i).backward(this.state.at(i, t), this.state.at(i - 1, t));

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
            if (typeof this.layers.at(i).parameters === 'undefined')
                continue;

            var param = this.layers.at(i).parameters;
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
(function (lib) {"use strict";
	function InputLayer(opt) {
		this.out = opt.size;
		this.scale = opt.scale || 1.0;
		this.bias = opt.bias || 0.0;
	};

	InputLayer.prototype.forward = function (V, A) {
		A.w.copy(V, this.scale, this.bias);
	};

	InputLayer.prototype.backward = function (A, V) {};

	lib.InputLayer = InputLayer;
})(nnjs);
(function (lib) { "use strict";

	function sigm(x) {
		return 1.0/(1.0+Math.exp(-x));
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

		this.parameters.filters[0] = new lib.Blob(1, 9, this.in.length, 0, 0.08);
		for (var i = 0; i < this.in.length; i++) {
			this.parameters.filters[0].w.set(0, 2, i, -1);
			this.parameters.filters[0].w.set(0, 5, i, -1);
			this.parameters.filters[0].w.set(0, 8, i, -1);
		}

		this.parameters.biases = new lib.Blob(1, 4, this.in.length, 0.0);
	};

	LongShortTermMemoryLayer.prototype.forward = function (V, A) {
		for (var i = 0; i < this.out.length; i++) {
			var param = lib.Mat.prototype.get.bind(this.parameters.filters[0].w);
			var bias = lib.Mat.prototype.get.bind(this.parameters.biases.w);

			var x = V.w.d[i];
			var h_ = A.prev.w.d[i];
			var c_ = A.prev.lstm.cells.w.d[i];

			var ig = sigm(x * param(0, 0, i) + h_ * param(0, 1, i) + c_ * param(0, 2, i) + bias(0, 0, i));
			var fg = sigm(x * param(0, 3, i) + h_ * param(0, 4, i) + c_ * param(0, 5, i) + bias(0, 1, i));
			var c = ig * x + fg * c_;
			var og = sigm(x * param(0, 6, i) + h_ * param(0, 7, i) + c * param(0, 8, i) + bias(0, 2, i));
			var h = og * c;

			A.lstm.gates.in.d[i] = ig;
			A.lstm.gates.forget.d[i] = fg;
			A.lstm.gates.out.d[i] = og;

			A.lstm.cells.w.d[i] = c;
			A.w.d[i] = h;
		}
	};

	LongShortTermMemoryLayer.prototype.backward = function (A, V) {
		for (var i = 0; i < this.out.length; i++) {
			var param = lib.Mat.prototype.get.bind(this.parameters.filters[0].w);
			var bias = lib.Mat.prototype.get.bind(this.parameters.biases.w);

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
				dc = dc + param(0, 8, i) * dog + og * dh;
			var dfg = dsigm(fg) * c_ * dc;
			var dig = dsigm(ig) * x * dc;
			var dx = ig * dc + param(0, 6, i) * dog + param(0, 3, i) * dfg + param(0, 0, i) * dig;
		
			var dc_ = fg * dc + param(0, 5, i) * dfg + param(0, 2, i) * dig;
			var dh_ = param(0, 7, i) * dog + param(0, 4, i) * dfg + param(0, 1, i) * dig;

			A.prev.lstm.cells.dw.d[i] = dc_;
			A.prev.dw.d[i] += dh_; // add to already backpropped value
			V.dw.d[i] = dx;

			this.parameters.filters[0].dw.add(0, 0, i, x * dig);
			this.parameters.filters[0].dw.add(0, 1, i, h_ * dig);
			this.parameters.filters[0].dw.add(0, 2, i, c_ * dig);
			this.parameters.filters[0].dw.add(0, 3, i, x * dfg);
			this.parameters.filters[0].dw.add(0, 4, i, h_ * dfg);
			this.parameters.filters[0].dw.add(0, 5, i, c_ * dfg);
			this.parameters.filters[0].dw.add(0, 6, i, x * dog);
			this.parameters.filters[0].dw.add(0, 7, i, h_ * dog);
			this.parameters.filters[0].dw.add(0, 8, i, c * dog);

			this.parameters.biases.dw.add(0, 0, i, 1.0 * dig);
			this.parameters.biases.dw.add(0, 1, i, 1.0 * dfg);
			this.parameters.biases.dw.add(0, 2, i, 1.0 * dog);
		}
	};

	LongShortTermMemoryLayer.prototype.PrepareStateBlob = function (A) {
		if (typeof A.state === 'undefined') {
			A.lstm = {
				cells: new lib.Blob(this.out.x, this.out.y, this.out.depth, 0.0),
				gates: {
					in: new lib.Mat(this.out.x, this.out.y, this.out.depth, 0.0),
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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5uLmluaXQuanMiLCJubi5tYXRoLmpzIiwiYXBpL25ldHdvcmsubm4uanMiLCJsYXllcnMvY29udm9sdXRpb25hbC5ubi5qcyIsImxheWVycy9kb3Qubm4uanMiLCJsYXllcnMvZHJvcG91dC5ubi5qcyIsImxheWVycy9pbnB1dC5ubi5qcyIsImxheWVycy9sc3RtLm5uLmpzIiwibGF5ZXJzL25vbi1saW5lYXIubm4uanMiLCJsYXllcnMvcmVncmVzc2lvbi5ubi5qcyIsImxheWVycy9zb2Z0bWF4Lm5uLmpzIiwibm4uZXhwb3J0LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvSUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMvU0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2TEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN4REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibm4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgbm5qcyA9IHt9O1xuXG4vLyBVdGlsaXR5IGZ1blxuZnVuY3Rpb24gYXNzZXJ0KGNvbmRpdGlvbiwgbWVzc2FnZSkge1xuICAgIC8vIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNTMxMzQxOC9qYXZhc2NyaXB0LWFzc2VydFxuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiQXNzZXJ0aW9uIGZhaWxlZFwiO1xuICAgICAgICBpZiAodHlwZW9mIEVycm9yICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbWVzc2FnZTsgLy8gRmFsbGJhY2tcbiAgICB9XG59XG5cbihmdW5jdGlvbigpIHtcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICB2YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gICAgdmFyIGlzQXJyYXkgPSBmdW5jdGlvbiBpc0FycmF5KGFycikge1xuICAgICAgICBpZiAodHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGFycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9TdHIuY2FsbChhcnIpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG5cbiAgICB2YXIgaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqKSB7XG4gICAgICAgIGlmICghb2JqIHx8IHRvU3RyLmNhbGwob2JqKSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBoYXNPd25Db25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG4gICAgICAgIHZhciBoYXNJc1Byb3RvdHlwZU9mID0gb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgJiYgaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcbiAgICAgICAgLy8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuICAgICAgICBpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNPd25Db25zdHJ1Y3RvciAmJiAhaGFzSXNQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3duIHByb3BlcnRpZXMgYXJlIGVudW1lcmF0ZWQgZmlyc3RseSwgc28gdG8gc3BlZWQgdXAsXG4gICAgICAgIC8vIGlmIGxhc3Qgb25lIGlzIG93biwgdGhlbiBhbGwgcHJvcGVydGllcyBhcmUgb3duLlxuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHsgLyoqLyB9XG5cbiAgICAgICAgcmV0dXJuIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgICAgICB2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmU7XG4gICAgICAgIHZhciB0YXJnZXQgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIHZhciBpID0gMTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIHZhciBkZWVwID0gZmFsc2U7XG5cbiAgICAgICAgLy8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuICAgICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBkZWVwID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuICAgICAgICAgICAgLy8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuICAgICAgICAgICAgaSA9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB0YXJnZXQgIT09ICdvYmplY3QnICYmIHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicpIHx8IHRhcmdldCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuICAgICAgICAgICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYyA9IHRhcmdldFtuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgY29weSA9IG9wdGlvbnNbbmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBuZXZlci1lbmRpbmcgbG9vcFxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0ICE9PSBjb3B5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWVwICYmIGNvcHkgJiYgKGlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gaXNBcnJheShjb3B5KSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcHlJc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlJc0FycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5ldmVyIG1vdmUgb3JpZ2luYWwgb2JqZWN0cywgY2xvbmUgdGhlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb3B5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGNvcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICBPYmplY3QuZXh0ZW5kID0gZXh0ZW5kO1xufSkoKTtcbiIsIihmdW5jdGlvbiAobGliKSB7XCJ1c2Ugc3RyaWN0XCI7XG5cdHZhciBtYXRoID0ge1xuXHRcdGdhdXNzXzogeyBhOiBmYWxzZSwgYjogMC4wIH0sXG5cdFx0Z2F1c3M6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmKG1hdGguZ2F1c3NfLmEpIHsgIG1hdGguZ2F1c3NfLmEgPSBmYWxzZTsgcmV0dXJuIG1hdGguZ2F1c3NfLmI7IH1cblx0XHRcdHZhciB1ID0gMipNYXRoLnJhbmRvbSgpLTE7XG5cdFx0XHR2YXIgdiA9IDIqTWF0aC5yYW5kb20oKS0xO1xuXHRcdFx0dmFyIHIgPSB1KnUgKyB2KnY7XG5cdFx0XHRpZihyID09IDAgfHwgciA+IDEpIHJldHVybiBtYXRoLmdhdXNzKCk7XG5cdFx0XHR2YXIgYyA9IE1hdGguc3FydCgtMipNYXRoLmxvZyhyKS9yKTtcblx0XHRcdG1hdGguZ2F1c3NfLmIgPSB2KmM7IC8vIGNhY2hlIHRoaXNcblx0XHRcdG1hdGguZ2F1c3NfLmEgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIHUqYztcblx0XHR9LFxuXG5cdFx0cmFuZGY6IGZ1bmN0aW9uIChhLCBiKSB7XG5cdFx0XHRyZXR1cm4gTWF0aC5yYW5kb20oKSooYi1hKSthO1xuXHRcdH0sXG5cblx0XHRyYW5kaTogZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRcdHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqKGItYSkrYSk7XG5cdFx0fSxcblxuXHRcdHJhbmRuOiBmdW5jdGlvbiAobXUsIHN0ZCkge1xuXHRcdFx0cmV0dXJuIG11K21hdGguZ2F1c3MoKSpzdGQ7XG5cdFx0fSxcblxuXHRcdHRhbmg6IHR5cGVvZiBNYXRoLnRhbmggPT09IFwidW5kZWZpbmVkXCIgPyBmdW5jdGlvbiAoeCkgeyB2YXIgeSA9IE1hdGguZXhwKDIgKiB4KTsgcmV0dXJuICh5IC0gMSkgLyAoeSArIDEpOyB9IDogTWF0aC50YW5oXG5cdH07XG5cblx0Ly9cblx0Ly9cblx0Ly9cblx0ZnVuY3Rpb24gU2l6ZTIoeCwgeSkge1xuXHRcdHJldHVybiB7IHg6IHgsIHk6IHksIGxlbmd0aDogeCAqIHkgfTtcblx0fTtcblxuXHRmdW5jdGlvbiBTaXplMyh4LCB5LCB6KSB7XG5cdFx0cmV0dXJuIHsgeDogeCwgeTogeSwgZGVwdGg6IHosIGxlbmd0aDogeCAqIHkgKiB6IH07XG5cdH07XG5cblxuXHQvL1xuXHQvL1xuXHQvL1xuXHRmdW5jdGlvbiBNYXQoeCwgeSwgeiwgdikge1xuXHRcdHRoaXMuc2l6ZSA9IGxpYi5TaXplMyh4LCB5LCB6KTtcblx0XHR0aGlzLmQgPSBNYXQuQ3JlYXRlQXJyYXkoeCAqIHkgKiB6LCB2ID09PSB1bmRlZmluZWQgPyAwLjAgOiB2LCAnRmxvYXQ2NEFycmF5Jyk7XG5cdH07XG5cblx0TWF0LkNyZWF0ZUFycmF5ID0gZnVuY3Rpb24gKGxlbmd0aCwgdiwgdCkge1xuXHRcdHZhciBhcnIgPSBudWxsO1xuXHRcdFxuXHRcdHYgPSB2IHx8IDA7XG5cdFx0dCA9IHQgfHwgJ0Zsb2F0NjRBcnJheSc7XG5cblx0XHRpZih0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRhcnIgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXJyID0gZXZhbCgnbmV3ICcgKyB0ICsgJyhsZW5ndGgpJyk7XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkgeyBhcnJbaV0gPSB2OyB9XG5cdFx0cmV0dXJuIGFycjtcblx0fTtcblxuXHRNYXQuY29weSA9IGZ1bmN0aW9uIChtYXQpIHtcblx0XHR2YXIgbWF0XyA9IG5ldyBtYXQobWF0LnNpemUueCwgbWF0LnNpemUueSwgbWF0LnNpemUuZGVwdGgpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbWF0LmQubGVuZ3RoOyBpKyspIHsgbWF0Xy5kW2ldID0gbWF0LmRbaV07IH1cblx0XHRyZXR1cm4gbWF0Xztcblx0fTtcblxuXHRNYXQucHJvdG90eXBlLm1heGkgPSBmdW5jdGlvbiAoKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGogPSAwLCBtID0gLUluZmluaXR5OyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAodGhpcy5kW2ldID4gbSkge1xuXHRcdFx0XHRqID0gaSwgbSA9IHRoaXMuZFtpXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gajtcblx0fTtcblxuXHRNYXQucHJvdG90eXBlLmdldCA9IGZ1bmN0aW9uICh4LCB5LCB6KSB7XG5cdFx0cmV0dXJuIHRoaXMuZFsgKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgeiBdO1xuXHR9O1xuXG5cdE1hdC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKHgsIHksIHosIHYpIHtcblx0XHR0aGlzLmRbICh5ICogdGhpcy5zaXplLnggKyB4KSAqIHRoaXMuc2l6ZS5kZXB0aCArIHogXSA9IHY7XG5cdH07XG5cblx0TWF0LnByb3RvdHlwZS5hZGQgPSBmdW5jdGlvbiAoeCwgeSwgeiwgdikge1xuXHRcdHRoaXMuZFsgKHkgKiB0aGlzLnNpemUueCArIHgpICogdGhpcy5zaXplLmRlcHRoICsgeiBdICs9IHY7XG5cdH07XG5cblx0TWF0LnByb3RvdHlwZS5hbGwgPSBmdW5jdGlvbiAodikge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IHY7IH1cblx0fTtcblxuXHRNYXQucHJvdG90eXBlLmNvcHkgPSBmdW5jdGlvbiAoYSwgcywgYikge1xuXHRcdGlmIChzID09PSB1bmRlZmluZWQpIHMgPSAxO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IGFbaV0gLyBzICsgYjsgfVxuXHR9O1xuXG5cdE1hdC5wcm90b3R5cGUud3JpdGUgPSBmdW5jdGlvbiAoYSkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IGEuZFtpXTsgfVxuXHR9O1xuXG5cdE1hdC5wcm90b3R5cGUucmFuZGYgPSBmdW5jdGlvbiAoYSwgYikge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7IHRoaXMuZFtpXSA9IG1hdGgucmFuZGYoYSwgYik7IH1cblx0fTtcblxuXHRNYXQucHJvdG90eXBlLnJhbmRuID0gZnVuY3Rpb24gKHNjYWxlKSB7XG5cdFx0c2NhbGUgPSBzY2FsZSB8fCBNYXRoLnNxcnQoMS4wLyh0aGlzLnNpemUueCp0aGlzLnNpemUueSp0aGlzLnNpemUuZGVwdGgpKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBtYXRoLnJhbmRuKDAuMCwgc2NhbGUpOyB9XG5cdH07XG5cblx0TWF0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbWF0LmNvcHkodGhpcyk7XG5cdH07XG5cblx0Ly8gYWNjZXNzb3Jcblx0Ly8gWyAoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyB6IF1cblxuXG5cdGZ1bmN0aW9uIEJsb2IoeCwgeSwgeiwgYSwgYikge1xuXHRcdHRoaXMuc2l6ZSA9IGxpYi5TaXplMyh4LCB5LCB6KTtcblx0XHR0aGlzLncgPSBuZXcgTWF0KHgsIHksIHopO1xuXHRcdHRoaXMuZHcgPSBuZXcgTWF0KHgsIHksIHopO1xuXG5cdFx0aWYgKGEgIT09IHVuZGVmaW5lZCAmJiBiICE9PSB1bmRlZmluZWQpIHtcblx0XHRcdHRoaXMudy5yYW5kZihhLCBiKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0dGhpcy53LnJhbmRuKCk7XG5cdFx0fVxuXHRcdFxuXHR9O1xuXG5cdGxpYi5NYXRoVSA9IG1hdGg7XG5cdGxpYi5TaXplMiA9IFNpemUyO1xuXHRsaWIuU2l6ZTMgPSBTaXplMztcblx0bGliLk1hdCA9IE1hdDtcblx0bGliLkJsb2IgPSBCbG9iO1xuXG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIC8qKlxuICAgICAqIEhlbHBlciBmdW5jdGlvbiwgdGhhdCBjb252ZXJ0cyBhIGRlc2NyaXB0aW9uIGludG8gYW4gYWN0dWFsIGxheWVyIG9iamVjdFxuICAgICAqIEBwYXJhbSB7b2JqZWN0fSBkZXNjcmlwdGlvblxuICAgICAqL1xuICAgIGZ1bmN0aW9uIExheWVyKG9wdCwgbmV0KSB7XG4gICAgICAgIHN3aXRjaCAob3B0LnR5cGUpIHtcbiAgICAgICAgICAgIGNhc2UgJ2lucHV0JzogcmV0dXJuIG5ldyBsaWIuSW5wdXRMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdkb3QnOiByZXR1cm4gbmV3IGxpYi5Eb3RMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdjb252JzogcmV0dXJuIG5ldyBsaWIuQ29udm9sdXRpb25hbExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2xzdG0nOiByZXR1cm4gbmV3IGxpYi5Mb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAncG9vbCc6IHJldHVybiBuZXcgbGliLlBvb2xpbmdMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdzaWdtb2lkJzogcmV0dXJuIG5ldyBsaWIuU2lnbW9pZExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3JlbHUnOiByZXR1cm4gbmV3IGxpYi5SZWx1TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAndGFuaCc6IHJldHVybiBuZXcgbGliLlRhbmhMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdkcm9wb3V0JzogcmV0dXJuIG5ldyBsaWIuRHJvcE91dExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3NvZnRtYXgnOiByZXR1cm4gbmV3IGxpYi5Tb2Z0bWF4TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnaHNtJzogcmV0dXJuIG5ldyBsaWIuSGllcmFyY2hpY2FsU29mdG1heChvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdyZWdyZXNzaW9uJzogcmV0dXJuIG5ldyBsaWIuUmVncmVzc2lvbkxheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIE5ldHdvcmtTdHJ1Y3R1cmUoZGVzYywgbmV0KSB7XG4gICAgICAgIHRoaXMubmV0ID0gbmV0O1xuICAgICAgICB0aGlzLmRlc2NyaXB0aW9uID0gZGVzYztcbiAgICAgICAgdGhpcy5sZW5ndGggPSBkZXNjLmxlbmd0aDsgLy8gY29udmllbmllbmNlXG4gICAgICAgIHRoaXMucmVjdXJyZW50ID0gZmFsc2U7XG5cbiAgICAgICAgdGhpcy5CdWlsZCgpO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RydWN0dXJlLnByb3RvdHlwZS5CdWlsZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5saXN0ID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5kZXNjcmlwdGlvbi5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5kZXNjcmlwdGlvbltpXS5pbnB1dCA9IHRoaXMubGlzdFtpIC0gMV0ub3V0OyAvLyBzZXQgaW5wdXQgdG8gdGhpcyBsYXllciB0byB0aGUgb3V0cHV0IG9mIGxhc3QgbGF5ZXJcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdGhpcy5saXN0W2ldID0gTGF5ZXIodGhpcy5kZXNjcmlwdGlvbltpXSwgdGhpcy5uZXQpO1xuXG4gICAgICAgICAgICBpZiAodGhpcy5saXN0W2ldLnJlY3VycmVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVjdXJyZW50ID0gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07ICBcblxuICAgIE5ldHdvcmtTdHJ1Y3R1cmUucHJvdG90eXBlLnN0YXRzID0gZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgc3RhdHMgPSB7IHBhcmFtZXRlcnM6IDAsIG5vZGVzOiAwIH07XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzdGF0cy5ub2RlcyArPSB0aGlzLmxpc3RbaV0ub3V0Lmxlbmd0aDtcblxuICAgICAgICAgICAgaWYgKHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzID09PSB1bmRlZmluZWQpIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnMubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBzdGF0cy5wYXJhbWV0ZXJzICs9IHRoaXMubGlzdFtpXS5wYXJhbWV0ZXJzLmZpbHRlcnNbal0uc2l6ZS5sZW5ndGg7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHN0YXRzLnBhcmFtZXRlcnMgKz0gdGhpcy5saXN0W2ldLnBhcmFtZXRlcnMuYmlhc2VzLnNpemUubGVuZ3RoO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXRzO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RydWN0dXJlLnByb3RvdHlwZS5hdCA9IGZ1bmN0aW9uIChpKSB7XG4gICAgICAgIGkgPSBpID49IDAgPyBpIDogdGhpcy5sZW5ndGggKyBpO1xuICAgICAgICByZXR1cm4gdGhpcy5saXN0W2ldO1xuICAgIH07XG5cbiAgICAvLyBjdXJyZW50IHN0YXRlXG4gICAgZnVuY3Rpb24gTmV0d29ya1N0YXRlKG5ldCkge1xuICAgICAgICB0aGlzLm5ldCA9IG5ldDtcbiAgICAgICAgdGhpcy5sYXllcnMgPSBuZXQubGF5ZXJzO1xuICAgICAgICB0aGlzLndpZHRoID0gbmV0LmxheWVycy5sZW5ndGg7IC8vIGhvdyBtYW55IGxheWVycz9cbiAgICAgICAgdGhpcy5oZWlnaHQgPSB0aGlzLmxheWVycy5yZWN1cnJlbnQgPyB0aGlzLm5ldC5sZWFybmVyLnRpbWVzcGFuIDogMTsgLy8gaG93IGxvbmcgYnB0dD8gLyB0aW1lIHN0ZXBzXG4gICAgICAgIFxuICAgICAgICBpZiAodGhpcy5sYXllcnMucmVjdXJyZW50KSB7XG4gICAgICAgICAgICB0aGlzLmJsb2JzID0gdGhpcy5CdWlsZCh0aGlzLm5ldC5sZWFybmVyLnRpbWVzcGFuICsgMSk7IC8vIGxhc3Qgb25lIG5lZWRzIHJlZmVyZW5jZSB0byBwcmV2aW91c1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdGhpcy5ibG9icyA9IHRoaXMuQnVpbGQoMSk7IC8vIG9ubHkgb25lIHRpbWUgbmVlZGVkXG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gWyBbIHN0YXRlIGZvciBUPTAgXSwgWyBzdGF0ZSBmb3IgVD0xIF0sIC4uLiBdXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5CdWlsZCA9IGZ1bmN0aW9uIChoLCBTKSB7XG4gICAgICAgIHZhciBUID0gW107XG4gICAgICAgIGZvciAodmFyIHQgPSAwOyB0IDwgaDsgdCsrKSB7XG4gICAgICAgICAgICBULnVuc2hpZnQodGhpcy5CdWlsZFN0YXRlKFQsIFMgIT09IHVuZGVmaW5lZCA/IFNbdF0gOiB1bmRlZmluZWQpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBUO1xuICAgIH07XG5cbiAgICAvLyBbIFsgQmxvYiBmb3IgbGF5ZXIgMSBdLCBbIEJsb2IgZm9yIGxheWVyIDIgXSwgLi4uIF1cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLkJ1aWxkU3RhdGUgPSBmdW5jdGlvbiAoVCwgUykge1xuICAgICAgICBTID0gUyB8fCBbXTtcblxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMubGF5ZXJzLmF0KGkpLm91dCAhPT0gJ3VuZGVmaW5lZCcgJiYgU1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgU1tpXSA9IG5ldyBsaWIuQmxvYih0aGlzLmxheWVycy5hdChpKS5vdXQueCwgdGhpcy5sYXllcnMuYXQoaSkub3V0LnksIHRoaXMubGF5ZXJzLmF0KGkpLm91dC5kZXB0aCwgMC4wKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoU1tpXSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICAgICAgU1tpXSA9IHt9O1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBTW2ldLncuYWxsKDApLCBTW2ldLmR3LmFsbCgwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVycy5hdChpKS5yZWN1cnJlbnQgIT09ICd1bmRlZmluZWQnICYmIHRoaXMubGF5ZXJzLmF0KGkpLnJlY3VycmVudFxuICAgICAgICAgICAgICAgICAgICAmJiBUICE9PSB1bmRlZmluZWQgJiYgVC5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgU1tpXS5wcmV2ID0gVFswXVtpXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVycy5hdChpKS5QcmVwYXJlU3RhdGVCbG9iICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzLmF0KGkpLlByZXBhcmVTdGF0ZUJsb2IoU1tpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gUztcbiAgICB9O1xuXG4gICAgTmV0d29ya1N0YXRlLnByb3RvdHlwZS5yZXNldCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdGhpcy5ibG9icyA9IHRoaXMuQnVpbGQodGhpcy5ibG9icy5sZW5ndGgsIHRoaXMuYmxvYnMpO1xuICAgIH07XG5cbiAgICBOZXR3b3JrU3RhdGUucHJvdG90eXBlLm5leHQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmICh0aGlzLmxheWVycy5yZWN1cnJlbnQpIHsgLy8gb25seSBpZiByZWN1cnJlbnRcbiAgICAgICAgICAgIHZhciBTID0gdGhpcy5ibG9icy5wb3AoKTtcbiAgICAgICAgICAgIHRoaXMuYmxvYnMudW5zaGlmdCh0aGlzLkJ1aWxkU3RhdGUodGhpcy5ibG9icywgUykpOyAvLyByZXVzYWJpbGl0eVxuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLndpZHRoLmxlbmd0aDsgaSsrKSB7IHRoaXMuYXQoaSwgdGhpcy5oZWlnaHQpLnByZXYgPSBudWxsOyB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBjbGVhbiBncmFkaWVudHNcbiAgICAgICAgZm9yICh2YXIgdCA9IDA7IHQgPCB0aGlzLmhlaWdodCArIDE7IHQrKykge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLndpZHRoOyBpKyspIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJsb2JzW3RdW2ldLmR3LmFsbCgwLjApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIE5ldHdvcmtTdGF0ZS5wcm90b3R5cGUuYXQgPSBmdW5jdGlvbiAoaSwgdCkge1xuICAgICAgICB0ID0gdCB8fCAwO1xuICAgICAgICB0ID0gdCA+PSAwID8gdCA6IHRoaXMuaGVpZ2h0ICsgdDtcblxuICAgICAgICBpID0gaSB8fCAwO1xuICAgICAgICBpID0gaSA+PSAwID8gaSA6IHRoaXMud2lkdGggKyBpO1xuXG4gICAgICAgIHJldHVybiB0aGlzLmJsb2JzW3R8fDBdW2ldO1xuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBAcGFyYW0ge29iamVjdH1cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBOZXR3b3JrKG9wdCkge1xuICAgICAgICB0aGlzLmxlYXJuZXIgPSBvcHQubGVhcm5lcjtcbiAgICAgICAgdGhpcy5sZWFybmVyID0gT2JqZWN0LmV4dGVuZCh7XG4gICAgICAgICAgICBtZXRob2Q6ICdzZ2QnLFxuICAgICAgICAgICAgYmF0Y2g6IDEsXG4gICAgICAgICAgICBkZWNheTogeyBsMTogMCwgbDI6IDAgfSxcbiAgICAgICAgICAgIGNsaXA6IEluZmluaXR5LFxuICAgICAgICAgICAgdGltZXNwYW46IDEgLy8gb25seSBmb3Igcm5uXG4gICAgICAgIH0sIHRoaXMubGVhcm5lcik7XG5cbiAgICAgICAgdGhpcy5sZWFybmVyID0gT2JqZWN0LmV4dGVuZCh0aGlzLmdkW3RoaXMubGVhcm5lci5tZXRob2RdLmRlZmF1bHRzLCB0aGlzLmxlYXJuZXIpO1xuICAgICAgICB0aGlzLndlYWsgPSB0cnVlOyAvLyBkcm9wb3V0IGVuYWJsZWQ/XG4gICAgICAgIHRoaXMucGFzcyA9IDA7XG5cbiAgICAgICAgdGhpcy5sYXllcnMgPSBuZXcgTmV0d29ya1N0cnVjdHVyZShvcHQubGF5ZXJzLCB0aGlzKTtcbiAgICAgICAgdGhpcy5zdGF0ZSA9IG5ldyBOZXR3b3JrU3RhdGUodGhpcyk7IC8vIGV4Y2hhbmdhYmxlXG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbihpbnApIHtcbiAgICAgICAgLy8gZ28gZm9yd2FyZHMgdGhyb3VnaCBuZXR3b3JrXG4gICAgICAgIHRoaXMuc3RhdGUubmV4dCgpO1xuICAgICAgICB2YXIgeSA9IHRoaXMubGF5ZXJzLmF0KDApLmZvcndhcmQoaW5wLCB0aGlzLnN0YXRlLmF0KDApKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7ICsraSkge1xuICAgICAgICAgICAgeSA9IHRoaXMubGF5ZXJzLmF0KGkpLmZvcndhcmQodGhpcy5zdGF0ZS5hdChpIC0gMSksIHRoaXMuc3RhdGUuYXQoaSkpO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHkgIT09IHVuZGVmaW5lZCA/IHkgOiB0aGlzLnN0YXRlLmF0KC0xKS53LmQ7XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24ob3V0cCkge1xuICAgICAgICB2YXIgRSA9IGZhbHNlLCBJID0gdGhpcy5sYXllcnMubGVuZ3RoIC0gMjtcblxuICAgICAgICB2YXIgbG9zcyA9IHRoaXMubGF5ZXJzLmF0KC0xKS5iYWNrd2FyZCh0aGlzLnN0YXRlLmF0KC0xKSwgdGhpcy5zdGF0ZS5hdCgtMiksIG91dHApO1xuICAgICAgICBmb3IgKHZhciB0ID0gMDsgdCA8IHRoaXMuc3RhdGUuaGVpZ2h0ICYmIChFIHx8IHQgPT09IDApOyB0KyspIHtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSBJOyBpID49IDA7IGktLSkgeyAvLyBhbHdheXMgc3RhcnQgYmFja3dhcmQgcGFzcyBhdCBsYXN0IHJlY3VycmVudCBsYXllciwgb3IgYXQgc2Vjb25kLWxhc3QgbGF5ZXIgaWYgdD0wXG5cbiAgICAgICAgICAgICAgICBpZighRSAmJiB0aGlzLmxheWVycy5hdChpKS5yZWN1cnJlbnQpIHsgLy8gZXhwYW5kIG5ldHdvcmtcbiAgICAgICAgICAgICAgICAgICAgRSA9IHRydWUsIEkgPSBpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHRoaXMubGF5ZXJzLmF0KGkpLmJhY2t3YXJkKHRoaXMuc3RhdGUuYXQoaSwgdCksIHRoaXMuc3RhdGUuYXQoaSAtIDEsIHQpKTtcblxuICAgICAgICAgICAgfSAgXG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkanVzdCgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIGxvc3M7XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmFkanVzdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoKyt0aGlzLnBhc3MgJSB0aGlzLmxlYXJuZXIuYmF0Y2ggIT09IDApIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBtZXRob2QgPSB0aGlzLmdkW3RoaXMubGVhcm5lci5tZXRob2RdO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMubGF5ZXJzLmF0KGkpLnBhcmFtZXRlcnMgPT09ICd1bmRlZmluZWQnKVxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW0gPSB0aGlzLmxheWVycy5hdChpKS5wYXJhbWV0ZXJzO1xuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbS5maWx0ZXJzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGogPSAwOyBqIDwgcGFyYW0uZmlsdGVycy5sZW5ndGg7IGorKykgeyBtZXRob2QuY2FsbCh0aGlzLCB0aGlzLmxlYXJuZXIsIHBhcmFtLmZpbHRlcnNbal0sIDEuMCk7IH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBwYXJhbS5iaWFzZXMgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgbWV0aG9kLmNhbGwodGhpcywgdGhpcy5sZWFybmVyLCBwYXJhbS5iaWFzZXMsIDAuMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgLyogZ3JhZGllbnQgZGVzY2VudCBhbGdvcml0aG1zICovXG4gICAgTmV0d29yay5wcm90b3R5cGUuZ2QgPSB7fTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmdkLnNnZCA9IHtcbiAgICAgICAgZGVmYXVsdHM6IHtcbiAgICAgICAgICAgIHJhdGU6IDAuMDEsXG4gICAgICAgICAgICBtb21lbnR1bTogMC45XG4gICAgICAgIH0sXG4gICAgICAgIHN0b3JhZ2U6IFsnZ3N1bSddLFxuICAgICAgICBhbGdvcml0aG06IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZHggPSBvcHQubW9tZW50dW0gKiBnc3VtIC0gb3B0LnJhdGUgKiBnaWo7XG4gICAgICAgICAgICBnc3VtID0gZHg7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgTmV0d29yay5wcm90b3R5cGUuZ2QuYWRhZGVsdGEgPSB7XG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICBybzogMC45NSxcbiAgICAgICAgICAgIGVwczogMWUtOFxuICAgICAgICB9LFxuICAgICAgICBzdG9yYWdlOiBbJ2dzdW0nLCAneHN1bSddLFxuICAgICAgICBhbGdvcml0aG06IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgZ3N1bSA9IG9wdC5ybyAqIGdzdW0gKyAoMSAtIG9wdC5ybykgKiBnaWogKiBnaWo7XG4gICAgICAgICAgICBkeCA9IC1NYXRoLnNxcnQoKHhzdW0gKyBvcHQuZXBzKSAvIChnc3VtICsgb3B0LmVwcykpICogZ2lqO1xuICAgICAgICAgICAgeHN1bSA9IG9wdC5ybyAqIHhzdW0gKyAoMSAtIG9wdC5ybykgKiBkeCAqIGR4OyAvLyB5ZXMsIHhzdW0gbGFncyBiZWhpbmQgZ3N1bSBieSAxLlxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qIGFsZ29yaXRobXMgY29tcGlsZXIsIHNwZWVkcyB0aGluZ3MgdXAsIGFuZCBtYWtlcyB0aGluZ3MgZWFzaWVyICovXG4gICAgKGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZ2RfcHJvdG90eXBlID0gZnVuY3Rpb24ob3B0LCBPLCBkZWNheSkge1xuICAgICAgICAgICAgaWYgKE8ubm9jaGFuZ2UpIHJldHVybjtcbiAgICAgICAgICAgIHZhciBkeCA9IDAsIF9fZ3JhZCA9IDAsIGdpaiA9IDAsIGwxZ3JhZCA9IDAsIGwyZ3JhZCA9IDA7XG4gICAgICAgICAgICBcIlVVMVwiO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBPLnNpemUubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBfX2dyYWQgPSBPLmR3LmRbaV07XG4gICAgICAgICAgICAgICAgX19ncmFkID0gX19ncmFkID4gb3B0LmNsaXAgPyBvcHQuY2xpcCA6IChfX2dyYWQgPCAtb3B0LmNsaXAgPyAtb3B0LmNsaXAgOiBfX2dyYWQpO1xuICAgICAgICAgICAgICAgIGwxZ3JhZCA9IGRlY2F5ICogb3B0LmRlY2F5LmwxICogKE8udy5kW2ldID4gMCA/IDEgOiAtMSk7XG4gICAgICAgICAgICAgICAgbDJncmFkID0gZGVjYXkgKiBvcHQuZGVjYXkubDIgKiAoTy53LmRbaV0pO1xuICAgICAgICAgICAgICAgIGdpaiA9IChfX2dyYWQgKyBsMWdyYWQgKyBsMmdyYWQpIC8gb3B0LmJhdGNoO1xuICAgICAgICAgICAgICAgIFwiVVUyXCI7XG4gICAgICAgICAgICAgICAgXCJVVTNcIjtcbiAgICAgICAgICAgICAgICBcIlVVNFwiO1xuICAgICAgICAgICAgICAgIE8udy5kW2ldICs9IGR4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBPLmR3LmFsbCgwLjApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnZF9wcm90b3R5cGVfID0gZ2RfcHJvdG90eXBlLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiBOZXR3b3JrLnByb3RvdHlwZS5nZCkge1xuICAgICAgICAgICAgdmFyIGRlc2NyaXB0aW9uID0gTmV0d29yay5wcm90b3R5cGUuZ2RbbmFtZV07XG4gICAgICAgICAgICB2YXIgY2hlY2tzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLnN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjaGVja3NbaV0gPSAnaWYgKHR5cGVvZiBPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJyA9PT0gXCJ1bmRlZmluZWRcIikgeyBPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJyA9IG5ldyBsaWIuTWF0KE8uc2l6ZS54LCBPLnNpemUueSwgTy5zaXplLmRlcHRoLCAwLjApOyB9JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGV4dHJhY3Rpb25zID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLnN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBleHRyYWN0aW9uc1tpXSA9ICd2YXIgJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnID0gTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcuZFtpXTsnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYWxnID0gZGVzY3JpcHRpb24uYWxnb3JpdGhtLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBhbGcgPSBhbGcuc3Vic3RyaW5nKGFsZy5pbmRleE9mKCd7JykgKyAxLCBhbGcubGVuZ3RoIC0gMSk7XG5cbiAgICAgICAgICAgIHZhciBzdG9yaW5ncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5zdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3RvcmluZ3NbaV0gPSAnTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcuZFtpXSA9ICcgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJzsnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZnVuYyA9IGdkX3Byb3RvdHlwZV8ucmVwbGFjZSgnXCJVVTFcIjsnLCBjaGVja3Muam9pbihcIlwiKSkucmVwbGFjZSgnXCJVVTJcIjsnLCBleHRyYWN0aW9ucy5qb2luKFwiXCIpKS5yZXBsYWNlKCdcIlVVM1wiOycsIGFsZykucmVwbGFjZSgnXCJVVTRcIjsnLCBzdG9yaW5ncy5qb2luKFwiXCIpKTtcbiAgICAgICAgICAgIHZhciBjbWQgPSAnTmV0d29yay5wcm90b3R5cGUuZ2QuJyArIG5hbWUgKyAnID0gJyArIGZ1bmM7XG4gICAgICAgICAgICBldmFsKGNtZCk7XG4gICAgICAgICAgICBOZXR3b3JrLnByb3RvdHlwZS5nZFtuYW1lXS5kZWZhdWx0cyA9IGRlc2NyaXB0aW9uLmRlZmF1bHRzO1xuICAgICAgICB9XG4gICAgfSkoKTtcblxuICAgIGxpYi5OZXR3b3JrID0gTmV0d29yaztcbn0pKG5uanMpO1xuIiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cblx0Lyogc3BhdGlhbCB3ZWlnaHRzICovXG5cdGZ1bmN0aW9uIENvbnZvbHV0aW9uYWxMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMuZmlsdGVyID0gb3B0LmZpbHRlcjtcblx0XHR0aGlzLnN0cmlkZSA9IG9wdC5zdHJpZGU7XG5cdFx0dGhpcy5wYWQgPSBvcHQucGFkO1xuXG5cdFx0dmFyIG94ID0gTWF0aC5mbG9vcigodGhpcy5pbi54ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueCkgLyB0aGlzLnN0cmlkZSArIDEpO1xuXHRcdHZhciBveSA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueSArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLnkpIC8gdGhpcy5zdHJpZGUgKyAxKTtcblx0XHR0aGlzLm91dCA9IGxpYi5TaXplMyhveCwgb3ksIHRoaXMuZmlsdGVyLmRlcHRoKTtcblxuXHRcdHRoaXMucGFyYW1ldGVycyA9IHtcblx0XHRcdGZpbHRlcnM6IFtdLFxuXHRcdFx0Ymlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5maWx0ZXIuZGVwdGgsIDAuMClcblx0XHR9O1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5kZXB0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXSA9IG5ldyBsaWIuQmxvYih0aGlzLmZpbHRlci54LCB0aGlzLmZpbHRlci55LCB0aGlzLmluLmRlcHRoKTtcblx0XHR9XG5cdH07XG5cblx0Q29udm9sdXRpb25hbExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHR2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIFZfeCA9IFYuc2l6ZS54IHwgMCwgVl95ID0gVi5zaXplLnkgfCAwLCBWX2QgPSBWLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDAsIEZfZCA9IHRoaXMuZmlsdGVyLmRlcHRoIHwgMDtcblxuXHRcdHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cdFx0dmFyIGJpYXNlcyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kO1xuXG5cdFx0Zm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuXHRcdCAgICB2YXIgZiA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2RdO1xuXHRcdCAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHsgLy8geHlfc3RyaWRlXG5cdFx0ICAgICAgICB4ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgICAgIGZvciAodmFyIGF4ID0gMDsgYXggPCBBX3g7IHggKz0gc3RyaWRlLCBheCsrKSB7IC8vIHh5X3N0cmlkZVxuXG5cdFx0ICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBwYXJ0aWN1bGFyIGxvY2F0aW9uIFtheCwgYXldXG5cdFx0ICAgICAgICAgICAgdmFyIGEgPSAwLjA7XG5cdFx0ICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwO1xuXHRcdCAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcblx0XHQgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcblx0XHQgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmZCA9IDA7IGZkIDwgRl9kOyBmZCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEud1theCwgYXksIGRdICs9IGYud1sgZngsIGZ5LCBmZCBdICogVi53WyBveCwgb3ksIGZkIF1cblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSArPSBmLncuZFsoZnkgKiBGX3ggKyBmeCkgKiBGX2QgKyBmZF0gKiBWLncuZFsob3kgKiBWX3ggKyBveCkgKiBWX2QgKyBmZF07XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgfVxuXG5cdFx0ICAgICAgICAgICAgQS53LmRbKGF5ICogQV94ICsgYXgpICogQV9kICsgZF0gPSBhICsgYmlhc2VzW2RdO1xuXHRcdCAgICAgICAgfVxuXHRcdCAgICB9XG5cdFx0fVxuXHR9O1xuXG5cdENvbnZvbHV0aW9uYWxMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdHZhciBBX3ggPSBBLnNpemUueCB8IDAsIEFfeSA9IEEuc2l6ZS55IHwgMCwgQV9kID0gQS5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMCwgRl9kID0gdGhpcy5maWx0ZXIuZGVwdGggfCAwO1xuXG5cdFx0dmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcblx0XHR2YXIgYmlhc2VzID0gdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kO1xuXG5cdFx0dmFyIHYxID0gMCwgdjIgPSAwO1xuXG5cdFx0Zm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuXHRcdCAgICB2YXIgZiA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2RdO1xuXHRcdCAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHtcblx0XHQgICAgICAgIHggPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgeCArPSBzdHJpZGUsIGF4KyspIHtcblxuXHRcdCAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgbG9jYXRpb24gW2F4LCBheV1cblx0XHQgICAgICAgICAgICB2YXIgZEEgPSBBLmR3LmRbKGF5ICogQV94ICsgYXgpICogQV9kICsgZF07XG5cdFx0ICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwO1xuXHRcdCAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcblx0XHQgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcblx0XHQgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmZCA9IDA7IGZkIDwgRl9kOyBmZCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIGYuZHdbZngsIGZ5LCBmZF0gKz0gVi53W294LCBveSwgZmRdICogQS5kd1theCwgYXksIGRdXG5cdFx0XHRcdFx0XHRcdFx0XHQvLyBWLmR3W294LCBveSwgZmRdICs9IGYud1tmeCwgZnksIGZkXSAqIEEuZHdbYXgsIGF5LCBkXVxuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2MSA9IChmeSAqIEZfeCArIGZ4KSAqIEZfZCArIGZkO1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICB2MiA9IChveSAqIFZfeCArIG94KSAqIFZfZCArIGZkO1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgICAgICBmLmR3LmRbdjFdICs9IFYudy5kW3YyXSpkQTtcblx0ICAgICAgICAgICAgICAgICAgICBcdFx0XHRWLmR3LmRbdjJdICs9IGYudy5kW3YxXSpkQTtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICB9XG5cblx0XHQgICAgICAgICAgICBiaWFzZXNbZF0gKz0gZEE7XG5cdFx0ICAgICAgICB9XG5cdFx0ICAgIH1cblx0XHR9XG5cdH07XG5cblx0LyogUG9vbGluZyBsYXllciwgc2VsZWN0IGJpZ2dlc3QgdmFsdWUgZnJvbSBjb252b2x1dGlvbiAqL1xuXHRmdW5jdGlvbiBQb29saW5nTGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLmZpbHRlciA9IG9wdC5maWx0ZXI7XG5cdFx0dGhpcy5zdHJpZGUgPSBvcHQuc3RyaWRlO1xuXHRcdHRoaXMucGFkID0gb3B0LnBhZDtcblxuXHRcdHZhciBveCA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueCArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLngpIC8gdGhpcy5zdHJpZGUgKyAxKTtcblx0XHR2YXIgb3kgPSBNYXRoLmZsb29yKCh0aGlzLmluLnkgKyB0aGlzLnBhZCAqIDIgLSB0aGlzLmZpbHRlci55KSAvIHRoaXMuc3RyaWRlICsgMSk7XG5cdFx0dGhpcy5vdXQgPSBsaWIuU2l6ZTMob3gsIG95LCB0aGlzLmluLmRlcHRoKTtcblx0fTtcblxuXHRQb29saW5nTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdHZhciBBX3ggPSBBLnNpemUueCB8IDAsIEFfeSA9IEEuc2l6ZS55IHwgMCwgQV9kID0gQS5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgVl94ID0gVi5zaXplLnggfCAwLCBWX3kgPSBWLnNpemUueSB8IDAsIFZfZCA9IFYuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIEZfeCA9IHRoaXMuZmlsdGVyLnggfCAwLCBGX3kgPSB0aGlzLmZpbHRlci55IHwgMDsgXG5cblx0XHR2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGUgfCAwO1xuXG5cdFx0Zm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuXHRcdCAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHtcblx0XHQgICAgICAgIHggPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgeCArPSBzdHJpZGUsIGF4KyspIHtcblxuXHRcdCAgICAgICAgICAgIC8vIGNvbnZvbHZlIGNlbnRlcmVkIGF0IHRoaXMgbG9jYXRpb24gW2F4LCBheV1cblx0XHQgICAgICAgICAgICB2YXIgc2VsdiA9IC1NYXRoLkluZmluaXR5LCBzZWx4ID0gMCwgc2VseTtcblx0XHQgICAgICAgICAgICB2YXIgb3ggPSAwLCBveSA9IDAsIHEgPSAwO1xuXHRcdCAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcblx0XHQgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcblx0XHQgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcblx0XHQgICAgICAgICAgICAgICAgICAgIFx0cSA9IFYudy5kWyhveSAqIFZfeCArIG94KSAqIFZfZCArIGRdO1xuXHRcdCAgICAgICAgICAgICAgICAgICAgXHRpZiAocSA+IHNlbHYpIHsgc2VsdiA9IHE7IHNlbHggPSBveDsgc2VseSA9IG95OyB9XG5cdFx0ICAgICAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICB9XG5cblx0XHQgICAgICAgICAgICB2YXIgaXggPSAoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkO1xuXHRcdCAgICAgICAgICAgIEEucHhbaXhdID0gc2VseDtcblx0XHQgICAgICAgICAgICBBLnB5W2l4XSA9IHNlbHk7XG5cdFx0ICAgICAgICAgICAgQS53LmRbaXhdID0gc2Vsdjtcblx0XHQgICAgICAgIH1cblx0XHQgICAgfVxuXHRcdH1cblx0fTtcblxuXHRQb29saW5nTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHR2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIFZfeCA9IFYuc2l6ZS54IHwgMCwgVl95ID0gVi5zaXplLnkgfCAwLCBWX2QgPSBWLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDA7IFxuXG5cdFx0dmFyIHN0cmlkZSA9IHRoaXMuc3RyaWRlIHwgMDtcblxuXHRcdGZvciAodmFyIGQgPSAwOyBkIDwgQV9kOyBkKyspIHtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgYXkrKykge1xuXHRcdCAgICAgICAgZm9yICh2YXIgYXggPSAwOyBheCA8IEFfeDsgYXgrKykge1xuXHRcdCAgICAgICAgXHR2YXIgaXggPSAoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkO1xuXHRcdCAgICAgICAgXHR2YXIgZEEgPSBBLmR3LmRbaXhdO1xuXG5cdFx0ICAgICAgICBcdHZhciBzZWx4ID0gQS5weFtpeF07IFxuXHRcdCAgICAgICAgXHR2YXIgc2VseSA9IEEucHlbaXhdO1xuXG5cdFx0ICAgICAgICBcdFYuZHcuZFsoc2VseSAqIFZfeCArIHNlbHgpICogVl9kICsgZF0gPSBkQTsgLy8gb25seSB0cmFuc2ZlciB3ZWlnaHRzIGZyb20gc2VsZWN0ZWQgbG9jYXRpb25zXG5cdFx0ICAgICAgICB9XG5cdFx0ICAgIH1cblx0XHR9XG5cdH07XG5cblx0UG9vbGluZ0xheWVyLnByb3RvdHlwZS5QcmVwYXJlU3RhdGVCbG9iID0gZnVuY3Rpb24gKEEpIHtcblx0XHRBLnB4ID0gbGliLk1hdC5DcmVhdGVBcnJheSh0aGlzLm91dC5kZXB0aCAqIHRoaXMub3V0LnkgKiB0aGlzLm91dC54LCAwLCAnVWludDE2QXJyYXknKTtcblx0XHRBLnB5ID0gbGliLk1hdC5DcmVhdGVBcnJheSh0aGlzLm91dC5kZXB0aCAqIHRoaXMub3V0LnkgKiB0aGlzLm91dC54LCAwLCAnVWludDE2QXJyYXknKTtcblx0fTtcblxuXHRsaWIuQ29udm9sdXRpb25hbExheWVyID0gQ29udm9sdXRpb25hbExheWVyO1xuXHRsaWIuUG9vbGluZ0xheWVyID0gUG9vbGluZ0xheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cdC8qKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gaW5wdXQsIHNpemVcblx0ICovXG5cdGZ1bmN0aW9uIERvdExheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBsaWIuU2l6ZTMoMSwgMSwgb3B0LnNpemUpO1xuXHRcdHRoaXMucGFyYW1ldGVycyA9IHtcblx0XHRcdGZpbHRlcnM6IFtdLFxuXHRcdFx0Ymlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5vdXQuZGVwdGgsIDAuMClcblx0XHR9O1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5pbi5sZW5ndGgpO1xuXHRcdH1cblx0fTtcblxuXHREb3RMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHN1bSA9IDAuMDtcblx0XHRcdGZvciAodmFyIGogPSAwOyBqIDwgdGhpcy5pbi5sZW5ndGg7IGorKykge1xuXHRcdFx0XHRzdW0gKz0gVi53LmRbal0gKiB0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS53LmRbal07XG5cdFx0XHR9XG5cblx0XHRcdEEudy5kW2ldID0gc3VtICsgdGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmRbaV07XG5cdFx0fVxuXHR9O1xuXG5cdERvdExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIGRBID0gQS5kdy5kW2ldO1xuXHRcdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG5cdFx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLmR3LmRbal0gKz0gVi53LmRbal0gKiBkQTtcblx0XHRcdFx0Vi5kdy5kW2pdICs9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXSAqIGRBO1xuXHRcdFx0fVxuXG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLmR3LmRbaV0gKz0gZEE7XG5cdFx0fVxuXHR9O1xuXG5cdGxpYi5Eb3RMYXllciA9IERvdExheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cblx0ZnVuY3Rpb24gRHJvcE91dExheWVyKG9wdCwgbmV0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm5ldCA9IG5ldDtcblx0XHR0aGlzLnByb2JhYmlsaXR5ID0gb3B0LnByb2JhYmlsaXR5IHx8IDAuMjU7XG5cdH1cblxuXHREcm9wT3V0TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdGlmICghdGhpcy5uZXQud2Vhaykge1xuXHRcdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7IEEudy5kW2ldID0gVi53LmRbaV0gKiB0aGlzLnByb2JhYmlsaXR5OyB9IHJldHVybiA7XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAoTWF0aC5yYW5kb20oKSA8IHRoaXMucHJvYmFiaWxpdHkpIHtcblx0XHRcdFx0QS53LmRbaV0gPSAwLjA7XG5cdFx0XHRcdEEuZHJvcHBlZE91dFtpXSA9IHRydWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRBLncuZFtpXSA9IFYudy5kW2ldO1xuXHRcdFx0XHRBLmRyb3BwZWRPdXRbaV0gPSBmYWxzZTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0RHJvcE91dExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7XG5cdFx0aWYgKCF0aGlzLm5ldC53ZWFrIHx8IEEuZHJvcHBlZE91dC5sZW5ndGggIT09IHRoaXMuaW4ubGVuZ3RoKSByZXR1cm4gO1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZighQS5kcm9wcGVkT3V0W2ldKSB7XG5cdFx0XHRcdFYuZHcuZFtpXSA9IEEuZHcuZFtpXTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblx0RHJvcE91dExheWVyLnByb3RvdHlwZS5QcmVwYXJlU3RhdGVCbG9iID0gZnVuY3Rpb24gKEEpIHtcblx0XHRBLmRyb3BwZWRPdXQgPSBbXTtcblx0fTtcblxuXHRsaWIuRHJvcE91dExheWVyID0gRHJvcE91dExheWVyO1xuXHRcbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7XCJ1c2Ugc3RyaWN0XCI7XG5cdGZ1bmN0aW9uIElucHV0TGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5vdXQgPSBvcHQuc2l6ZTtcblx0XHR0aGlzLnNjYWxlID0gb3B0LnNjYWxlIHx8IDEuMDtcblx0XHR0aGlzLmJpYXMgPSBvcHQuYmlhcyB8fCAwLjA7XG5cdH07XG5cblx0SW5wdXRMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0QS53LmNvcHkoViwgdGhpcy5zY2FsZSwgdGhpcy5iaWFzKTtcblx0fTtcblxuXHRJbnB1dExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWKSB7fTtcblxuXHRsaWIuSW5wdXRMYXllciA9IElucHV0TGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuXHRmdW5jdGlvbiBzaWdtKHgpIHtcblx0XHRyZXR1cm4gMS4wLygxLjArTWF0aC5leHAoLXgpKTtcblx0fVxuXG5cdGZ1bmN0aW9uIGRzaWdtKHkpIHtcblx0XHRyZXR1cm4geSAqICgxIC0geSk7XG5cdH1cblxuXHQvLyBzZWUgaHR0cDovL3Blb3BsZS5pZHNpYS5jaC9+anVlcmdlbi9sc3RtL3NsZDAxOS5odG1cblx0ZnVuY3Rpb24gTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBvcHQuaW5wdXQ7IC8vIDEgdG8gMSBtYXBwaW5nXG5cblx0XHR0aGlzLnJlY3VycmVudCA9IHRydWU7XG5cdFx0dGhpcy5wYXJhbWV0ZXJzID0ge1xuXHRcdFx0ZmlsdGVyczogW10sXG5cdFx0XHRiaWFzZXM6IG5ldyBsaWIuQmxvYigxLCAxLCB0aGlzLm91dC5kZXB0aCwgMC4wKVxuXHRcdH07XG5cblx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1swXSA9IG5ldyBsaWIuQmxvYigxLCA5LCB0aGlzLmluLmxlbmd0aCwgMCwgMC4wOCk7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1swXS53LnNldCgwLCAyLCBpLCAtMSk7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1swXS53LnNldCgwLCA1LCBpLCAtMSk7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1swXS53LnNldCgwLCA4LCBpLCAtMSk7XG5cdFx0fVxuXG5cdFx0dGhpcy5wYXJhbWV0ZXJzLmJpYXNlcyA9IG5ldyBsaWIuQmxvYigxLCA0LCB0aGlzLmluLmxlbmd0aCwgMC4wKTtcblx0fTtcblxuXHRMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBwYXJhbSA9IGxpYi5NYXQucHJvdG90eXBlLmdldC5iaW5kKHRoaXMucGFyYW1ldGVycy5maWx0ZXJzWzBdLncpO1xuXHRcdFx0dmFyIGJpYXMgPSBsaWIuTWF0LnByb3RvdHlwZS5nZXQuYmluZCh0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLncpO1xuXG5cdFx0XHR2YXIgeCA9IFYudy5kW2ldO1xuXHRcdFx0dmFyIGhfID0gQS5wcmV2LncuZFtpXTtcblx0XHRcdHZhciBjXyA9IEEucHJldi5sc3RtLmNlbGxzLncuZFtpXTtcblxuXHRcdFx0dmFyIGlnID0gc2lnbSh4ICogcGFyYW0oMCwgMCwgaSkgKyBoXyAqIHBhcmFtKDAsIDEsIGkpICsgY18gKiBwYXJhbSgwLCAyLCBpKSArIGJpYXMoMCwgMCwgaSkpO1xuXHRcdFx0dmFyIGZnID0gc2lnbSh4ICogcGFyYW0oMCwgMywgaSkgKyBoXyAqIHBhcmFtKDAsIDQsIGkpICsgY18gKiBwYXJhbSgwLCA1LCBpKSArIGJpYXMoMCwgMSwgaSkpO1xuXHRcdFx0dmFyIGMgPSBpZyAqIHggKyBmZyAqIGNfO1xuXHRcdFx0dmFyIG9nID0gc2lnbSh4ICogcGFyYW0oMCwgNiwgaSkgKyBoXyAqIHBhcmFtKDAsIDcsIGkpICsgYyAqIHBhcmFtKDAsIDgsIGkpICsgYmlhcygwLCAyLCBpKSk7XG5cdFx0XHR2YXIgaCA9IG9nICogYztcblxuXHRcdFx0QS5sc3RtLmdhdGVzLmluLmRbaV0gPSBpZztcblx0XHRcdEEubHN0bS5nYXRlcy5mb3JnZXQuZFtpXSA9IGZnO1xuXHRcdFx0QS5sc3RtLmdhdGVzLm91dC5kW2ldID0gb2c7XG5cblx0XHRcdEEubHN0bS5jZWxscy53LmRbaV0gPSBjO1xuXHRcdFx0QS53LmRbaV0gPSBoO1xuXHRcdH1cblx0fTtcblxuXHRMb25nU2hvcnRUZXJtTWVtb3J5TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgcGFyYW0gPSBsaWIuTWF0LnByb3RvdHlwZS5nZXQuYmluZCh0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1swXS53KTtcblx0XHRcdHZhciBiaWFzID0gbGliLk1hdC5wcm90b3R5cGUuZ2V0LmJpbmQodGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53KTtcblxuXHRcdFx0dmFyIGlnID0gQS5sc3RtLmdhdGVzLmluLmRbaV07XG5cdFx0XHR2YXIgZmcgPSBBLmxzdG0uZ2F0ZXMuZm9yZ2V0LmRbaV07XG5cdFx0XHR2YXIgb2cgPSBBLmxzdG0uZ2F0ZXMub3V0LmRbaV07XG5cdFx0XHR2YXIgYyA9IEEubHN0bS5jZWxscy53LmRbaV07XG5cblx0XHRcdHZhciB4ID0gVi53LmRbaV07XG5cdFx0XHR2YXIgaF8gPSBBLnByZXYudy5kW2ldO1xuXHRcdFx0dmFyIGNfID0gQS5wcmV2LmxzdG0uY2VsbHMudy5kW2ldO1xuXG5cdFx0XHR2YXIgZGggPSBBLmR3LmRbaV07XG5cdFx0XHR2YXIgZGMgPSBBLmxzdG0uY2VsbHMuZHcuZFtpXTtcblxuXHRcdFx0dmFyIGRvZyA9IGRzaWdtKG9nKSAqIGMgKiBkaDtcblx0XHRcdFx0ZGMgPSBkYyArIHBhcmFtKDAsIDgsIGkpICogZG9nICsgb2cgKiBkaDtcblx0XHRcdHZhciBkZmcgPSBkc2lnbShmZykgKiBjXyAqIGRjO1xuXHRcdFx0dmFyIGRpZyA9IGRzaWdtKGlnKSAqIHggKiBkYztcblx0XHRcdHZhciBkeCA9IGlnICogZGMgKyBwYXJhbSgwLCA2LCBpKSAqIGRvZyArIHBhcmFtKDAsIDMsIGkpICogZGZnICsgcGFyYW0oMCwgMCwgaSkgKiBkaWc7XG5cdFx0XG5cdFx0XHR2YXIgZGNfID0gZmcgKiBkYyArIHBhcmFtKDAsIDUsIGkpICogZGZnICsgcGFyYW0oMCwgMiwgaSkgKiBkaWc7XG5cdFx0XHR2YXIgZGhfID0gcGFyYW0oMCwgNywgaSkgKiBkb2cgKyBwYXJhbSgwLCA0LCBpKSAqIGRmZyArIHBhcmFtKDAsIDEsIGkpICogZGlnO1xuXG5cdFx0XHRBLnByZXYubHN0bS5jZWxscy5kdy5kW2ldID0gZGNfO1xuXHRcdFx0QS5wcmV2LmR3LmRbaV0gKz0gZGhfOyAvLyBhZGQgdG8gYWxyZWFkeSBiYWNrcHJvcHBlZCB2YWx1ZVxuXHRcdFx0Vi5kdy5kW2ldID0gZHg7XG5cblx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzWzBdLmR3LmFkZCgwLCAwLCBpLCB4ICogZGlnKTtcblx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzWzBdLmR3LmFkZCgwLCAxLCBpLCBoXyAqIGRpZyk7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1swXS5kdy5hZGQoMCwgMiwgaSwgY18gKiBkaWcpO1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbMF0uZHcuYWRkKDAsIDMsIGksIHggKiBkZmcpO1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbMF0uZHcuYWRkKDAsIDQsIGksIGhfICogZGZnKTtcblx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzWzBdLmR3LmFkZCgwLCA1LCBpLCBjXyAqIGRmZyk7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1swXS5kdy5hZGQoMCwgNiwgaSwgeCAqIGRvZyk7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1swXS5kdy5hZGQoMCwgNywgaSwgaF8gKiBkb2cpO1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbMF0uZHcuYWRkKDAsIDgsIGksIGMgKiBkb2cpO1xuXG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLmR3LmFkZCgwLCAwLCBpLCAxLjAgKiBkaWcpO1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5hZGQoMCwgMSwgaSwgMS4wICogZGZnKTtcblx0XHRcdHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuYWRkKDAsIDIsIGksIDEuMCAqIGRvZyk7XG5cdFx0fVxuXHR9O1xuXG5cdExvbmdTaG9ydFRlcm1NZW1vcnlMYXllci5wcm90b3R5cGUuUHJlcGFyZVN0YXRlQmxvYiA9IGZ1bmN0aW9uIChBKSB7XG5cdFx0aWYgKHR5cGVvZiBBLnN0YXRlID09PSAndW5kZWZpbmVkJykge1xuXHRcdFx0QS5sc3RtID0ge1xuXHRcdFx0XHRjZWxsczogbmV3IGxpYi5CbG9iKHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApLFxuXHRcdFx0XHRnYXRlczoge1xuXHRcdFx0XHRcdGluOiBuZXcgbGliLk1hdCh0aGlzLm91dC54LCB0aGlzLm91dC55LCB0aGlzLm91dC5kZXB0aCwgMC4wKSxcblx0XHRcdFx0XHRvdXQ6IG5ldyBsaWIuTWF0KHRoaXMub3V0LngsIHRoaXMub3V0LnksIHRoaXMub3V0LmRlcHRoLCAwLjApLFxuXHRcdFx0XHRcdGZvcmdldDogbmV3IGxpYi5NYXQodGhpcy5vdXQueCwgdGhpcy5vdXQueSwgdGhpcy5vdXQuZGVwdGgsIDAuMClcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0QS5sc3RtLmNlbGxzLncuYWxsKDApO1xuXHRcdH1cblx0fTtcblxuXHRsaWIuTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyID0gTG9uZ1Nob3J0VGVybU1lbW9yeUxheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cdGZ1bmN0aW9uIFNpZ21vaWRMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gb3B0LmlucHV0O1xuXHR9O1xuXG5cdFNpZ21vaWRMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRBLncuZFtpXSA9IDEuMC8oMS4wK01hdGguZXhwKC1WLncuZFtpXSkpO1xuXHRcdH1cblx0fVxuXG5cdFNpZ21vaWRMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0Vi5kdy5kW2ldID0gQS53LmRbaV0gKiAoLUEudy5kW2ldICsgMS4wKSAqIEEuZHcuZFtpXTtcblx0XHR9XG5cdH07XG5cblx0ZnVuY3Rpb24gUmVsdUxheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG5cdH07XG5cblx0UmVsdUxheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdEEudy5kW2ldID0gVi53LmRbaV0gPCAwID8gMCA6IFYudy5kW2ldO1xuXHRcdH1cblx0fVxuXG5cdFJlbHVMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYoQS53LmRbaV0gPD0gMCkgVi5kdy5kW2ldID0gMDsgLy8gdGhyZXNob2xkXG5cdCAgICAgICAgZWxzZSBWLmR3LmRbaV0gPSBBLmR3LmRbaV07XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIFRhbmhMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gb3B0LmlucHV0O1xuXHR9O1xuXG5cdFRhbmhMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRBLncuZFtpXSA9IGxpYi5NYXRoVS50YW5oKFYudy5kW2ldKTtcblx0XHR9XG5cdH1cblxuXHRUYW5oTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFYuZHcuZFtpXSA9ICgxLjAgLSBBLncuZFtpXSAqIEEudy5kW2ldKSAqIEEuZHcuZFtpXTtcblx0IFx0fVxuXHR9O1xuXG5cdGxpYi5TaWdtb2lkTGF5ZXIgPSBTaWdtb2lkTGF5ZXI7XG5cdGxpYi5SZWx1TGF5ZXIgPSBSZWx1TGF5ZXI7XG5cdGxpYi5UYW5oTGF5ZXIgPSBUYW5oTGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuXHRmdW5jdGlvbiBSZWdyZXNzaW9uTGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IG9wdC5pbnB1dDtcblx0fTtcblxuXHRSZWdyZXNzaW9uTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdEEudy53cml0ZShWLncpO1xuXHR9O1xuXG5cdFJlZ3Jlc3Npb25MYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgViwgZGVzaXJlZCkge1xuXHRcdHZhciBsb3NzID0gMC4wO1xuXHRcdGlmKGRlc2lyZWQgaW5zdGFuY2VvZiBBcnJheSB8fCBkZXNpcmVkIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB7XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0Vi5kdy5kW2ldID0gQS53LmRbaV0gLSBkZXNpcmVkW2ldO1xuXHRcdFx0XHRsb3NzICs9IDAuNSpWLmR3LmRbaV0qVi5kdy5kW2ldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBsb3NzO1xuXHR9O1xuXG5cdGxpYi5SZWdyZXNzaW9uTGF5ZXIgPSBSZWdyZXNzaW9uTGF5ZXI7XG5cbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG5cdGZ1bmN0aW9uIFNvZnRtYXhMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gbGliLlNpemUzKDEsIDEsIHRoaXMuaW4ueCAqIHRoaXMuaW4ueSAqIHRoaXMuaW4uZGVwdGgpO1xuXHRcdHRoaXMuY2xhc3NlcyA9IHRoaXMub3V0LmRlcHRoO1xuXHR9O1xuXG5cdFNvZnRtYXhMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Ly8gY29tcHV0ZSBtYXggYWN0aXZhdGlvblxuXHRcdHZhciBhbWF4ID0gVi53LmRbMF07XG5cdFx0Zm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuXHRcdFx0aWYoVi53LmRbaV0gPiBhbWF4KSBhbWF4ID0gVi53LmRbaV07XG5cdFx0fVxuXG5cdFx0Ly8gY29tcHV0ZSBleHBvbmVudGlhbHMgKGNhcmVmdWxseSB0byBub3QgYmxvdyB1cClcblx0XHR2YXIgZXMgPSBsaWIuTWF0LkNyZWF0ZUFycmF5KHRoaXMub3V0LmRlcHRoLCAwLjApLCBlc3VtID0gMC4wO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcblx0XHRcdHZhciBlID0gTWF0aC5leHAoVi53LmRbaV0gLSBhbWF4KTtcblx0XHRcdGVzdW0gKz0gZTtcblx0XHRcdGVzW2ldID0gZTtcblx0XHR9XG5cblx0XHQvLyBub3JtYWxpemUgYW5kIG91dHB1dCB0byBzdW0gdG8gb25lXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuXHRcdFx0ZXNbaV0gLz0gZXN1bTtcblx0XHRcdEEudy5kW2ldID0gZXNbaV07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEEudy5tYXhpKCk7XG5cdH07XG5cblx0U29mdG1heExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWLCBkZXNpcmVkKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuXHRcdFx0dmFyIGluZGljYXRvciA9IGkgPT09IGRlc2lyZWQgPyAxLjAgOiAwLjA7XG5cdFx0XHRWLmR3LmRbaV0gPSBBLncuZFtpXSAtIGluZGljYXRvcjtcblx0XHR9XG5cblx0XHQvLyBsb3NzIGlzIHRoZSBjbGFzcyBuZWdhdGl2ZSBsb2cgbGlrZWxpaG9vZFxuXHRcdHJldHVybiAtTWF0aC5sb2coQS53LmRbZGVzaXJlZF0pO1xuXHR9O1xuXG5cdC8qIGFwcHJveC4gMzAweCBmYXN0ZXIgdGhhbiBzb2Z0bWF4LCBkZWNyZWFzZSBpbiBhY2N1cmFjeSBhbmQgcGVyZm9ybWFuY2UgKi9cblx0LyoqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB0cmVlIFtvYmplY3RdIG9yIGNsYXNzZXMgW2ludF1cblx0ICovXG5cdGZ1bmN0aW9uIEhpZXJhcmNoaWNhbFNvZnRtYXgob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblxuXHRcdGlmIChvcHQudHJlZSkge1xuXHRcdFx0dGhpcy50cmVlID0gb3B0LnRyZWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudHJlZSA9IHRoaXMuQnVpbGRUcmVlKG9wdC5jbGFzc2VzKTtcblx0XHR9XG5cblx0XHR0aGlzLlByZXBhcmVUcmVlKCk7XG5cblx0XHRhc3NlcnQob3B0LmNsYXNzZXMgPT09IHVuZGVmaW5lZCB8fCAob3B0LmNsYXNzZXMgPT09IHRoaXMuY2xhc3NlcyksICdIaWVyYXJjaGljYWxTb2Z0bWF4OiB0cmVlIG5vdCBzdXBwb3J0ZWQnKTtcblxuXHRcdHRoaXMubm9kZXMgPSB0aGlzLmNsYXNzZXMgLSAxO1xuXHRcdHRoaXMucGFyYW1ldGVycyA9IHtcblx0XHRcdGZpbHRlcnM6IFtdLFxuXHRcdFx0Ymlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5ub2RlcywgMC4wKVxuXHRcdH07XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubm9kZXM7IGkrKykge1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5pbi5sZW5ndGgpO1xuXHRcdH1cblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVIgPSAwO1xuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SID0gMTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5CdWlsZFRyZWUgPSBmdW5jdGlvbiAoY2xhc3Nlcykge1xuXHRcdC8vIGNyZWF0ZSB0cmVlIG9mIHNpemUgbG9nKGNsYXNzZXMpXG5cdFx0dmFyIGRlcHRoID0gTWF0aC5mbG9vcihNYXRoLmxvZzIoY2xhc3NlcykpO1xuXHRcdHZhciB0cmVlID0gdGhpcy5DcmVhdGVOb2RlKGRlcHRoLCBudWxsKTtcblxuXHRcdC8vIGFkZCByZW1haW5pbmcgbm9kZXMgdG8gdHJlZVxuXHRcdHZhciByZW1haW5kZXIgPSBjbGFzc2VzIC0gTWF0aC5wb3coMiwgZGVwdGgpO1xuXHRcdHRoaXMudHJhdmVyc2UodHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRcdGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IgJiYgcmVtYWluZGVyID4gMCkge1xuXHRcdFx0XHRub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVI7XG5cdFx0XHRcdG5vZGUuYSA9IHRoaXMuQ3JlYXRlTm9kZSgwLCBub2RlKTtcblx0XHRcdFx0bm9kZS5iID0gdGhpcy5DcmVhdGVOb2RlKDAsIG5vZGUpO1xuXG5cdFx0XHRcdHJlbWFpbmRlci0tO1xuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJlZTtcblx0fTsgXG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuUHJlcGFyZVRyZWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbCA9IDAsIHB0ciA9IDAsIHRhYmxlID0ge307XG5cdFx0dGhpcy50cmF2ZXJzZSh0aGlzLnRyZWUsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0XHRpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SKSB7XG5cdFx0XHRcdHRhYmxlW3NlbF0gPSBub2RlO1xuXHRcdFx0XHRub2RlLmluZGV4ID0gc2VsO1xuXHRcdFx0KytzZWw7fVxuXG5cdFx0XHRlbHNlIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuXHRcdFx0XHRub2RlLmluZGV4ID0gcHRyO1xuXHRcdFx0cHRyKys7fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KTtcblxuXHRcdHRoaXMuY2xhc3NlcyA9IHNlbDtcblx0XHR0aGlzLm5vZGVzID0gcHRyO1xuXHRcdHRoaXMudGFibGUgPSB0YWJsZTtcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5DcmVhdGVOb2RlID0gZnVuY3Rpb24gKGRlcHRoLCBwYXJlbnQpIHtcblx0XHR2YXIgbm9kZSA9IHsgcGFyZW50OiBwYXJlbnQgfTtcblxuXHRcdGlmIChkZXB0aCA8PSAwKSB7XG5cdFx0XHRub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVI7XG5cdFx0XHRub2RlLmEgPSB0aGlzLkNyZWF0ZU5vZGUoZGVwdGgtMSwgbm9kZSk7XG5cdFx0XHRub2RlLmIgPSB0aGlzLkNyZWF0ZU5vZGUoZGVwdGgtMSwgbm9kZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5vZGU7XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUudHJhdmVyc2UgPSBmdW5jdGlvbiAobm9kZSwgY2IpIHtcblx0XHRpZiAoY2IuY2FsbCh0aGlzLCBub2RlKSAmJiBub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuXHRcdFx0dGhpcy50cmF2ZXJzZShub2RlLmEsIGNiKTtcblx0XHRcdHRoaXMudHJhdmVyc2Uobm9kZS5iLCBjYik7XG5cdFx0fVxuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmFzY2VuZCA9IGZ1bmN0aW9uIChub2RlLCBjYikge1xuXHRcdGlmIChub2RlLnBhcmVudCA9PT0gbnVsbCkgcmV0dXJuIDtcblx0XHRjYi5jYWxsKHRoaXMsIG5vZGUucGFyZW50LCBub2RlID09PSBub2RlLnBhcmVudC5hID8gLTEuMCA6IDEuMCk7XG5cdFx0dGhpcy5hc2NlbmQobm9kZS5wYXJlbnQsIGNiKTtcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5kZXNjZW5kID0gZnVuY3Rpb24gKG5vZGUsIGNiKSB7XG5cdFx0dmFyIGQgPSBjYi5jYWxsKHRoaXMsIG5vZGUpO1xuXG5cdFx0aWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUiB8fCBkIGluc3RhbmNlb2YgT2JqZWN0IHx8IGQgPT09IG51bGwpIHtcblx0XHRcdHJldHVybiBkO1xuXHRcdH1cblxuXHRcdGlmIChkID4gMC4wKSB7IC8vIG5lZ2F0aXZlIG1lYW5zIGxlZnQsIHBvc2l0aXZlIG1lYW5zIHJpZ2h0XG5cdFx0XHRyZXR1cm4gdGhpcy5kZXNjZW5kKG5vZGUuYiwgY2IpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5kZXNjZW5kKG5vZGUuYSwgY2IpO1xuXHRcdH1cblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uIChWLCBpKSB7XG5cdFx0dmFyIHN1bSA9IDAuMDtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHN1bSArPSBWLncuZFtqXSAqIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbGliLk1hdGhVLnRhbmgodGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmRbaV0gKyBzdW0pO1xuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmdyYWRpZW50ID0gZnVuY3Rpb24gKFYsIGksIGRpcmVjdGlvbikge1xuXHRcdHZhciBhY3QgPSB0aGlzLmFjdGl2YXRlKFYsIGkpLFxuXHRcdFx0XHRlcnIgPSBhY3QgLSBkaXJlY3Rpb247XG5cblx0XHR2YXIgZHcgPSAoMS4wIC0gYWN0ICogYWN0KSAqIGVycjtcblx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5ub2NoYW5nZSA9IGZhbHNlO1xuXG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5kdy5kW2pdICs9IFYudy5kW2pdICogZHc7XG5cdFx0XHRWLmR3LmRbal0gKz0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdICogZHc7XG5cdFx0fVxuXG5cdFx0dGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kW2ldICs9IGR3O1xuXG5cdFx0cmV0dXJuIChkaXJlY3Rpb24gPCAwID8gMSAtIChhY3QgKiAwLjUgKyAwLjUpIDogKGFjdCAqIDAuNSArIDAuNSkpOyAvLyBwcm9iYWJpbGl0eSB0byBnbyB0aGUgcmlnaHQgd2F5XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0dmFyIHNlbGVjdGVkID0gdGhpcy5kZXNjZW5kKHRoaXMudHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRcdGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5hY3RpdmF0ZShWLCBub2RlLmluZGV4KTtcblx0XHRcdH1cblxuXHRcdFx0ZWxzZSBpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SKSB7XG5cdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9KTtcblxuXHRcdHJldHVybiAoQS5pbmRleCA9IHNlbGVjdGVkLmluZGV4KTtcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWLCBkZXNpcmVkKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnBhcmFtZXRlcnMuZmlsdGVycy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0ubm9jaGFuZ2UgPSB0cnVlO1xuXHRcdH1cblxuXHRcdHZhciBwcm9iID0gMS4wO1xuXHRcdHRoaXMuYXNjZW5kKHRoaXMudGFibGVbZGVzaXJlZF0sIGZ1bmN0aW9uIChub2RlLCBkaXJlY3Rpb24pIHtcblx0XHRcdHByb2IgPSBwcm9iICogdGhpcy5ncmFkaWVudChWLCBub2RlLmluZGV4LCBkaXJlY3Rpb24pO1xuXHRcdH0pO1xuXG5cdFx0cmV0dXJuIDEuMCAtIHByb2I7IC8vIHByb2JhYmlsaXR5IHRvIE5PVCBnbyB0aGUgcmlnaHQgd2F5XG5cdH07XG5cblx0bGliLlNvZnRtYXhMYXllciA9IFNvZnRtYXhMYXllcjtcblx0bGliLkhpZXJhcmNoaWNhbFNvZnRtYXggPSBIaWVyYXJjaGljYWxTb2Z0bWF4O1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuICAgIGlmICh0eXBlb2YgbW9kdWxlID09PSBcInVuZGVmaW5lZFwiIHx8IHR5cGVvZiBtb2R1bGUuZXhwb3J0cyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICB3aW5kb3cubm4gPSBsaWI7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgbW9kdWxlLmV4cG9ydHMgPSBsaWI7XG4gICAgfVxuICAgIFxufSkobm5qcyk7XG4iXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
