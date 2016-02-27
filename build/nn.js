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

	Mat.prototype.all = function (v) {
		for (var i = 0; i < this.d.length; i++) { this.d[i] = v; }
	};

	Mat.prototype.set = function (a, s, b) {
		if (s === undefined) s = 1;
		for (var i = 0; i < this.d.length; i++) { this.d[i] = a[i] / s + b; }
	};

	Mat.prototype.write = function (a) {
		for (var i = 0; i < this.d.length; i++) { this.d[i] = a.d[i]; }
	};

	Mat.prototype.rand = function (scale) {
		if (scale === undefined) scale = Math.sqrt(1.0/(this.size.x*this.size.y*this.size.depth));
		for (var i = 0; i < this.d.length; i++) { this.d[i] = math.randn(0.0, scale); }
	};

	Mat.prototype.clone = function () {
		return mat.copy(this);
	};

	// accessor
	// [ (y * this.size.x + x) * this.size.depth + z ]


	function Blob(x, y, z, v) {
		this.size = lib.Size3(x, y, z);
		this.w = new Mat(x, y, z);
		this.dw = new Mat(x, y, z);

		if (v === undefined) this.w.rand();
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
		V.dw.all(0);

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
		V.dw.all(0);

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
		V.dw.all(0.0); // empty

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
		A.w.set(V, this.scale, this.bias);
	};

	InputLayer.prototype.backward = function (A, V) {};

	lib.InputLayer = InputLayer;
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
		V.dw.all(0);

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

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5uLmluaXQuanMiLCJubi5tYXRoLmpzIiwiYXBpL25ldHdvcmsubm4uanMiLCJsYXllcnMvY29udm9sdXRpb25hbC5ubi5qcyIsImxheWVycy9kb3Qubm4uanMiLCJsYXllcnMvZHJvcG91dC5ubi5qcyIsImxheWVycy9pbnB1dC5ubi5qcyIsImxheWVycy9ub24tbGluZWFyLm5uLmpzIiwibGF5ZXJzL3JlZ3Jlc3Npb24ubm4uanMiLCJsYXllcnMvc29mdG1heC5ubi5qcyIsIm5uLmV4cG9ydC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNyR0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDMUhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQy9MQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDM0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMzQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3hEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN6TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoibm4uanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgbm5qcyA9IHt9O1xuXG4vLyBVdGlsaXR5IGZ1blxuZnVuY3Rpb24gYXNzZXJ0KGNvbmRpdGlvbiwgbWVzc2FnZSkge1xuICAgIC8vIGZyb20gaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xNTMxMzQxOC9qYXZhc2NyaXB0LWFzc2VydFxuICAgIGlmICghY29uZGl0aW9uKSB7XG4gICAgICAgIG1lc3NhZ2UgPSBtZXNzYWdlIHx8IFwiQXNzZXJ0aW9uIGZhaWxlZFwiO1xuICAgICAgICBpZiAodHlwZW9mIEVycm9yICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IobWVzc2FnZSk7XG4gICAgICAgIH1cbiAgICAgICAgdGhyb3cgbWVzc2FnZTsgLy8gRmFsbGJhY2tcbiAgICB9XG59XG5cbihmdW5jdGlvbigpIHtcInVzZSBzdHJpY3RcIjtcbiAgICB2YXIgaGFzT3duID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcbiAgICB2YXIgdG9TdHIgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nO1xuXG4gICAgdmFyIGlzQXJyYXkgPSBmdW5jdGlvbiBpc0FycmF5KGFycikge1xuICAgICAgICBpZiAodHlwZW9mIEFycmF5LmlzQXJyYXkgPT09ICdmdW5jdGlvbicpIHtcbiAgICAgICAgICAgIHJldHVybiBBcnJheS5pc0FycmF5KGFycik7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdG9TdHIuY2FsbChhcnIpID09PSAnW29iamVjdCBBcnJheV0nO1xuICAgIH07XG5cbiAgICB2YXIgaXNQbGFpbk9iamVjdCA9IGZ1bmN0aW9uIGlzUGxhaW5PYmplY3Qob2JqKSB7XG4gICAgICAgIGlmICghb2JqIHx8IHRvU3RyLmNhbGwob2JqKSAhPT0gJ1tvYmplY3QgT2JqZWN0XScpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBoYXNPd25Db25zdHJ1Y3RvciA9IGhhc093bi5jYWxsKG9iaiwgJ2NvbnN0cnVjdG9yJyk7XG4gICAgICAgIHZhciBoYXNJc1Byb3RvdHlwZU9mID0gb2JqLmNvbnN0cnVjdG9yICYmIG9iai5jb25zdHJ1Y3Rvci5wcm90b3R5cGUgJiYgaGFzT3duLmNhbGwob2JqLmNvbnN0cnVjdG9yLnByb3RvdHlwZSwgJ2lzUHJvdG90eXBlT2YnKTtcbiAgICAgICAgLy8gTm90IG93biBjb25zdHJ1Y3RvciBwcm9wZXJ0eSBtdXN0IGJlIE9iamVjdFxuICAgICAgICBpZiAob2JqLmNvbnN0cnVjdG9yICYmICFoYXNPd25Db25zdHJ1Y3RvciAmJiAhaGFzSXNQcm90b3R5cGVPZikge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gT3duIHByb3BlcnRpZXMgYXJlIGVudW1lcmF0ZWQgZmlyc3RseSwgc28gdG8gc3BlZWQgdXAsXG4gICAgICAgIC8vIGlmIGxhc3Qgb25lIGlzIG93biwgdGhlbiBhbGwgcHJvcGVydGllcyBhcmUgb3duLlxuICAgICAgICB2YXIga2V5O1xuICAgICAgICBmb3IgKGtleSBpbiBvYmopIHsgLyoqLyB9XG5cbiAgICAgICAgcmV0dXJuIHR5cGVvZiBrZXkgPT09ICd1bmRlZmluZWQnIHx8IGhhc093bi5jYWxsKG9iaiwga2V5KTtcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gZXh0ZW5kKCkge1xuICAgICAgICB2YXIgb3B0aW9ucywgbmFtZSwgc3JjLCBjb3B5LCBjb3B5SXNBcnJheSwgY2xvbmU7XG4gICAgICAgIHZhciB0YXJnZXQgPSBhcmd1bWVudHNbMF07XG4gICAgICAgIHZhciBpID0gMTtcbiAgICAgICAgdmFyIGxlbmd0aCA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIHZhciBkZWVwID0gZmFsc2U7XG5cbiAgICAgICAgLy8gSGFuZGxlIGEgZGVlcCBjb3B5IHNpdHVhdGlvblxuICAgICAgICBpZiAodHlwZW9mIHRhcmdldCA9PT0gJ2Jvb2xlYW4nKSB7XG4gICAgICAgICAgICBkZWVwID0gdGFyZ2V0O1xuICAgICAgICAgICAgdGFyZ2V0ID0gYXJndW1lbnRzWzFdIHx8IHt9O1xuICAgICAgICAgICAgLy8gc2tpcCB0aGUgYm9vbGVhbiBhbmQgdGhlIHRhcmdldFxuICAgICAgICAgICAgaSA9IDI7XG4gICAgICAgIH0gZWxzZSBpZiAoKHR5cGVvZiB0YXJnZXQgIT09ICdvYmplY3QnICYmIHR5cGVvZiB0YXJnZXQgIT09ICdmdW5jdGlvbicpIHx8IHRhcmdldCA9PSBudWxsKSB7XG4gICAgICAgICAgICB0YXJnZXQgPSB7fTtcbiAgICAgICAgfVxuXG4gICAgICAgIGZvciAoOyBpIDwgbGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIG9wdGlvbnMgPSBhcmd1bWVudHNbaV07XG4gICAgICAgICAgICAvLyBPbmx5IGRlYWwgd2l0aCBub24tbnVsbC91bmRlZmluZWQgdmFsdWVzXG4gICAgICAgICAgICBpZiAob3B0aW9ucyAhPSBudWxsKSB7XG4gICAgICAgICAgICAgICAgLy8gRXh0ZW5kIHRoZSBiYXNlIG9iamVjdFxuICAgICAgICAgICAgICAgIGZvciAobmFtZSBpbiBvcHRpb25zKSB7XG4gICAgICAgICAgICAgICAgICAgIHNyYyA9IHRhcmdldFtuYW1lXTtcbiAgICAgICAgICAgICAgICAgICAgY29weSA9IG9wdGlvbnNbbmFtZV07XG5cbiAgICAgICAgICAgICAgICAgICAgLy8gUHJldmVudCBuZXZlci1lbmRpbmcgbG9vcFxuICAgICAgICAgICAgICAgICAgICBpZiAodGFyZ2V0ICE9PSBjb3B5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBSZWN1cnNlIGlmIHdlJ3JlIG1lcmdpbmcgcGxhaW4gb2JqZWN0cyBvciBhcnJheXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChkZWVwICYmIGNvcHkgJiYgKGlzUGxhaW5PYmplY3QoY29weSkgfHwgKGNvcHlJc0FycmF5ID0gaXNBcnJheShjb3B5KSkpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGNvcHlJc0FycmF5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvcHlJc0FycmF5ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzQXJyYXkoc3JjKSA/IHNyYyA6IFtdO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNsb25lID0gc3JjICYmIGlzUGxhaW5PYmplY3Qoc3JjKSA/IHNyYyA6IHt9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIE5ldmVyIG1vdmUgb3JpZ2luYWwgb2JqZWN0cywgY2xvbmUgdGhlbVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGV4dGVuZChkZWVwLCBjbG9uZSwgY29weSk7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBEb24ndCBicmluZyBpbiB1bmRlZmluZWQgdmFsdWVzXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiBjb3B5ICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRhcmdldFtuYW1lXSA9IGNvcHk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBSZXR1cm4gdGhlIG1vZGlmaWVkIG9iamVjdFxuICAgICAgICByZXR1cm4gdGFyZ2V0O1xuICAgIH07XG5cbiAgICBPYmplY3QuZXh0ZW5kID0gZXh0ZW5kO1xufSkoKTtcbiIsIihmdW5jdGlvbiAobGliKSB7XCJ1c2Ugc3RyaWN0XCI7XG5cdHZhciBtYXRoID0ge1xuXHRcdGdhdXNzXzogeyBhOiBmYWxzZSwgYjogMC4wIH0sXG5cdFx0Z2F1c3M6IGZ1bmN0aW9uICgpIHtcblx0XHRcdGlmKG1hdGguZ2F1c3NfLmEpIHsgIG1hdGguZ2F1c3NfLmEgPSBmYWxzZTsgcmV0dXJuIG1hdGguZ2F1c3NfLmI7IH1cblx0XHRcdHZhciB1ID0gMipNYXRoLnJhbmRvbSgpLTE7XG5cdFx0XHR2YXIgdiA9IDIqTWF0aC5yYW5kb20oKS0xO1xuXHRcdFx0dmFyIHIgPSB1KnUgKyB2KnY7XG5cdFx0XHRpZihyID09IDAgfHwgciA+IDEpIHJldHVybiBtYXRoLmdhdXNzKCk7XG5cdFx0XHR2YXIgYyA9IE1hdGguc3FydCgtMipNYXRoLmxvZyhyKS9yKTtcblx0XHRcdG1hdGguZ2F1c3NfLmIgPSB2KmM7IC8vIGNhY2hlIHRoaXNcblx0XHRcdG1hdGguZ2F1c3NfLmEgPSB0cnVlO1xuXHRcdFx0cmV0dXJuIHUqYztcblx0XHR9LFxuXG5cdFx0cmFuZGY6IGZ1bmN0aW9uIChhLCBiKSB7XG5cdFx0XHRyZXR1cm4gTWF0aC5yYW5kb20oKSooYi1hKSthO1xuXHRcdH0sXG5cblx0XHRyYW5kaTogZnVuY3Rpb24gKGEsIGIpIHtcblx0XHRcdHJldHVybiBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkqKGItYSkrYSk7XG5cdFx0fSxcblxuXHRcdHJhbmRuOiBmdW5jdGlvbiAobXUsIHN0ZCkge1xuXHRcdFx0cmV0dXJuIG11K21hdGguZ2F1c3MoKSpzdGQ7XG5cdFx0fSxcblxuXHRcdHRhbmg6IHR5cGVvZiBNYXRoLnRhbmggPT09IFwidW5kZWZpbmVkXCIgPyBmdW5jdGlvbiAoeCkgeyB2YXIgeSA9IE1hdGguZXhwKDIgKiB4KTsgcmV0dXJuICh5IC0gMSkgLyAoeSArIDEpOyB9IDogTWF0aC50YW5oXG5cdH07XG5cblx0Ly9cblx0Ly9cblx0Ly9cblx0ZnVuY3Rpb24gU2l6ZTIoeCwgeSkge1xuXHRcdHJldHVybiB7IHg6IHgsIHk6IHksIGxlbmd0aDogeCAqIHkgfTtcblx0fTtcblxuXHRmdW5jdGlvbiBTaXplMyh4LCB5LCB6KSB7XG5cdFx0cmV0dXJuIHsgeDogeCwgeTogeSwgZGVwdGg6IHosIGxlbmd0aDogeCAqIHkgKiB6IH07XG5cdH07XG5cblxuXHQvL1xuXHQvL1xuXHQvL1xuXHRmdW5jdGlvbiBNYXQoeCwgeSwgeiwgdikge1xuXHRcdHRoaXMuc2l6ZSA9IGxpYi5TaXplMyh4LCB5LCB6KTtcblx0XHR0aGlzLmQgPSBNYXQuQ3JlYXRlQXJyYXkoeCAqIHkgKiB6LCB2ID09PSB1bmRlZmluZWQgPyAwLjAgOiB2LCAnRmxvYXQ2NEFycmF5Jyk7XG5cdH07XG5cblx0TWF0LkNyZWF0ZUFycmF5ID0gZnVuY3Rpb24gKGxlbmd0aCwgdiwgdCkge1xuXHRcdHZhciBhcnIgPSBudWxsO1xuXHRcdFxuXHRcdHYgPSB2IHx8IDA7XG5cdFx0dCA9IHQgfHwgJ0Zsb2F0NjRBcnJheSc7XG5cblx0XHRpZih0eXBlb2YgQXJyYXlCdWZmZXIgPT09ICd1bmRlZmluZWQnKSB7XG5cdFx0XHRhcnIgPSBuZXcgQXJyYXkobGVuZ3RoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0YXJyID0gZXZhbCgnbmV3ICcgKyB0ICsgJyhsZW5ndGgpJyk7XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7ICsraSkgeyBhcnJbaV0gPSB2OyB9XG5cdFx0cmV0dXJuIGFycjtcblx0fTtcblxuXHRNYXQuY29weSA9IGZ1bmN0aW9uIChtYXQpIHtcblx0XHR2YXIgbWF0XyA9IG5ldyBtYXQobWF0LnNpemUueCwgbWF0LnNpemUueSwgbWF0LnNpemUuZGVwdGgpO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbWF0LmQubGVuZ3RoOyBpKyspIHsgbWF0Xy5kW2ldID0gbWF0LmRbaV07IH1cblx0XHRyZXR1cm4gbWF0Xztcblx0fTtcblxuXHRNYXQucHJvdG90eXBlLm1heGkgPSBmdW5jdGlvbiAoKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDAsIGogPSAwLCBtID0gLUluZmluaXR5OyBpIDwgdGhpcy5kLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRpZiAodGhpcy5kW2ldID4gbSkge1xuXHRcdFx0XHRqID0gaSwgbSA9IHRoaXMuZFtpXTtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRyZXR1cm4gajtcblx0fTtcblxuXHRNYXQucHJvdG90eXBlLmFsbCA9IGZ1bmN0aW9uICh2KSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmQubGVuZ3RoOyBpKyspIHsgdGhpcy5kW2ldID0gdjsgfVxuXHR9O1xuXG5cdE1hdC5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGEsIHMsIGIpIHtcblx0XHRpZiAocyA9PT0gdW5kZWZpbmVkKSBzID0gMTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBhW2ldIC8gcyArIGI7IH1cblx0fTtcblxuXHRNYXQucHJvdG90eXBlLndyaXRlID0gZnVuY3Rpb24gKGEpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBhLmRbaV07IH1cblx0fTtcblxuXHRNYXQucHJvdG90eXBlLnJhbmQgPSBmdW5jdGlvbiAoc2NhbGUpIHtcblx0XHRpZiAoc2NhbGUgPT09IHVuZGVmaW5lZCkgc2NhbGUgPSBNYXRoLnNxcnQoMS4wLyh0aGlzLnNpemUueCp0aGlzLnNpemUueSp0aGlzLnNpemUuZGVwdGgpKTtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZC5sZW5ndGg7IGkrKykgeyB0aGlzLmRbaV0gPSBtYXRoLnJhbmRuKDAuMCwgc2NhbGUpOyB9XG5cdH07XG5cblx0TWF0LnByb3RvdHlwZS5jbG9uZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbWF0LmNvcHkodGhpcyk7XG5cdH07XG5cblx0Ly8gYWNjZXNzb3Jcblx0Ly8gWyAoeSAqIHRoaXMuc2l6ZS54ICsgeCkgKiB0aGlzLnNpemUuZGVwdGggKyB6IF1cblxuXG5cdGZ1bmN0aW9uIEJsb2IoeCwgeSwgeiwgdikge1xuXHRcdHRoaXMuc2l6ZSA9IGxpYi5TaXplMyh4LCB5LCB6KTtcblx0XHR0aGlzLncgPSBuZXcgTWF0KHgsIHksIHopO1xuXHRcdHRoaXMuZHcgPSBuZXcgTWF0KHgsIHksIHopO1xuXG5cdFx0aWYgKHYgPT09IHVuZGVmaW5lZCkgdGhpcy53LnJhbmQoKTtcblx0fTtcblxuXHRsaWIuTWF0aFUgPSBtYXRoO1xuXHRsaWIuU2l6ZTIgPSBTaXplMjtcblx0bGliLlNpemUzID0gU2l6ZTM7XG5cdGxpYi5NYXQgPSBNYXQ7XG5cdGxpYi5CbG9iID0gQmxvYjtcblxufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXIgZnVuY3Rpb24sIHRoYXQgY29udmVydHMgYSBkZXNjcmlwdGlvbiBpbnRvIGFuIGFjdHVhbCBsYXllciBvYmplY3RcbiAgICAgKiBAcGFyYW0ge29iamVjdH0gZGVzY3JpcHRpb25cbiAgICAgKi9cbiAgICBmdW5jdGlvbiBMYXllcihvcHQsIG5ldCkge1xuICAgICAgICBzd2l0Y2ggKG9wdC50eXBlKSB7XG4gICAgICAgICAgICBjYXNlICdpbnB1dCc6IHJldHVybiBuZXcgbGliLklucHV0TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnZG90JzogcmV0dXJuIG5ldyBsaWIuRG90TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnY29udic6IHJldHVybiBuZXcgbGliLkNvbnZvbHV0aW9uYWxMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdwb29sJzogcmV0dXJuIG5ldyBsaWIuUG9vbGluZ0xheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3NpZ21vaWQnOiByZXR1cm4gbmV3IGxpYi5TaWdtb2lkTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAncmVsdSc6IHJldHVybiBuZXcgbGliLlJlbHVMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICd0YW5oJzogcmV0dXJuIG5ldyBsaWIuVGFuaExheWVyKG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ2Ryb3BvdXQnOiByZXR1cm4gbmV3IGxpYi5Ecm9wT3V0TGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICAgICAgY2FzZSAnc29mdG1heCc6IHJldHVybiBuZXcgbGliLlNvZnRtYXhMYXllcihvcHQsIG5ldCk7XG4gICAgICAgICAgICBjYXNlICdoc20nOiByZXR1cm4gbmV3IGxpYi5IaWVyYXJjaGljYWxTb2Z0bWF4KG9wdCwgbmV0KTtcbiAgICAgICAgICAgIGNhc2UgJ3JlZ3Jlc3Npb24nOiByZXR1cm4gbmV3IGxpYi5SZWdyZXNzaW9uTGF5ZXIob3B0LCBuZXQpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogQHBhcmFtIHtvYmplY3R9XG4gICAgICovXG4gICAgdmFyIE5ldHdvcmsgPSBmdW5jdGlvbihvcHQpIHtcbiAgICAgICAgdGhpcy5sZWFybmVyID0gb3B0LmxlYXJuZXI7XG4gICAgICAgIHRoaXMubGVhcm5lciA9IE9iamVjdC5leHRlbmQoe1xuICAgICAgICAgICAgbWV0aG9kOiAnc2dkJyxcbiAgICAgICAgICAgIGJhdGNoOiAxLFxuICAgICAgICAgICAgZGVjYXk6IHtcbiAgICAgICAgICAgICAgICBsMTogMCxcbiAgICAgICAgICAgICAgICBsMjogMFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgdGhpcy5sZWFybmVyKTtcblxuICAgICAgICB0aGlzLmxlYXJuZXIgPSBPYmplY3QuZXh0ZW5kKHRoaXMuZ2RbdGhpcy5sZWFybmVyLm1ldGhvZF0uZGVmYXVsdHMsIHRoaXMubGVhcm5lcik7XG4gICAgICAgIHRoaXMud2VhayA9IHRydWU7IC8vIGRyb3BvdXQgZW5hYmxlZD9cblxuICAgICAgICB0aGlzLnN0cnVjdHVyZSA9IG9wdC5sYXllcnM7XG4gICAgICAgIHRoaXMucGFzcyA9IDA7XG4gICAgICAgIHRoaXMubGF5ZXJzID0gW107XG5cbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLnN0cnVjdHVyZS5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKGkgPiAwKSB0aGlzLnN0cnVjdHVyZVtpXS5pbnB1dCA9IHRoaXMubGF5ZXJzW2kgLSAxXS5vdXQ7IC8vIHNldCBpbnB1dCB0byB0aGlzIGxheWVyIHRvIHRoZSBvdXRwdXQgb2YgbGFzdCBsYXllclxuICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0gPSBMYXllcih0aGlzLnN0cnVjdHVyZVtpXSwgdGhpcyk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLnN0YXRlID0gdGhpcy5DcmVhdGVTdGF0ZSgpO1xuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5DcmVhdGVTdGF0ZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgdmFyIHMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVyc1tpXS5vdXQgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgc1tpXSA9IG5ldyBsaWIuQmxvYih0aGlzLmxheWVyc1tpXS5vdXQueCwgdGhpcy5sYXllcnNbaV0ub3V0LnksIHRoaXMubGF5ZXJzW2ldLm91dC5kZXB0aCwgMC4wKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc1tpXSA9IHt9O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHRoaXMubGF5ZXJzW2ldLlByZXBhcmVTdGF0ZUJsb2IgIT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5sYXllcnNbaV0uUHJlcGFyZVN0YXRlQmxvYihzW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzO1xuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24oaW5wKSB7XG4gICAgICAgIC8vIGdvIGZvcndhcmRzIHRocm91Z2ggbmV0d29ya1xuICAgICAgICB2YXIgeSA9IHVuZGVmaW5lZDsgLy8gZi5lLiBmb3Igc29mdG1heCB0byByZXR1cm4gYW4gaW5kZXhcbiAgICAgICAgdGhpcy5sYXllcnNbMF0uZm9yd2FyZChpbnAsIHRoaXMuc3RhdGVbMF0pO1xuICAgICAgICBmb3IgKHZhciBpID0gMTsgaSA8IHRoaXMubGF5ZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB5ID0gdGhpcy5sYXllcnNbaV0uZm9yd2FyZCh0aGlzLnN0YXRlW2kgLSAxXSwgdGhpcy5zdGF0ZVtpXSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4geSA9PT0gdW5kZWZpbmVkID8gdGhpcy5zdGF0ZVt0aGlzLmxheWVycy5sZW5ndGggLSAxXS53LmQgOiB5O1xuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uKG91dHApIHtcbiAgICAgICAgLy8gZ28gYmFja3dhcmRzIHRocm91Z2ggbmV0d29ya1xuICAgICAgICB2YXIgbG9zcyA9IHRoaXMubGF5ZXJzLnNsaWNlKC0xKVswXS5iYWNrd2FyZCh0aGlzLnN0YXRlW3RoaXMubGF5ZXJzLmxlbmd0aCAtIDFdLCB0aGlzLnN0YXRlW3RoaXMubGF5ZXJzLmxlbmd0aCAtIDJdLCBvdXRwKTtcbiAgICAgICAgZm9yICh2YXIgaSA9IHRoaXMubGF5ZXJzLmxlbmd0aCAtIDI7IGkgPj0gMDsgaS0tKSB7XG4gICAgICAgICAgICB0aGlzLmxheWVyc1tpXS5iYWNrd2FyZCh0aGlzLnN0YXRlW2ldLCB0aGlzLnN0YXRlW2kgLSAxXSk7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmFkanVzdCgpO1xuXG4gICAgICAgIHJldHVybiBsb3NzO1xuICAgIH07XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5hZGp1c3QgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKCsrdGhpcy5wYXNzICUgdGhpcy5sZWFybmVyLmJhdGNoICE9PSAwKSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgbWV0aG9kID0gdGhpcy5nZFt0aGlzLmxlYXJuZXIubWV0aG9kXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxheWVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB0aGlzLmxheWVyc1tpXS5wYXJhbWV0ZXJzID09PSAndW5kZWZpbmVkJylcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcblxuICAgICAgICAgICAgdmFyIHBhcmFtID0gdGhpcy5sYXllcnNbaV0ucGFyYW1ldGVycztcbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0uZmlsdGVycyAhPT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBqID0gMDsgaiA8IHBhcmFtLmZpbHRlcnMubGVuZ3RoOyBqKyspIHsgbWV0aG9kLmNhbGwodGhpcywgdGhpcy5sZWFybmVyLCBwYXJhbS5maWx0ZXJzW2pdLCAxLjApOyB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcGFyYW0uYmlhc2VzICE9PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgICAgIG1ldGhvZC5jYWxsKHRoaXMsIHRoaXMubGVhcm5lciwgcGFyYW0uYmlhc2VzLCAwLjApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8qIGdyYWRpZW50IGRlc2NlbnQgYWxnb3JpdGhtcyAqL1xuICAgIE5ldHdvcmsucHJvdG90eXBlLmdkID0ge307XG5cbiAgICBOZXR3b3JrLnByb3RvdHlwZS5nZC5zZ2QgPSB7XG4gICAgICAgIGRlZmF1bHRzOiB7XG4gICAgICAgICAgICByYXRlOiAwLjAxLFxuICAgICAgICAgICAgbW9tZW50dW06IDAuOVxuICAgICAgICB9LFxuICAgICAgICBzdG9yYWdlOiBbJ2dzdW0nXSxcbiAgICAgICAgYWxnb3JpdGhtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGR4ID0gb3B0Lm1vbWVudHVtICogZ3N1bSAtIG9wdC5yYXRlICogZ2lqO1xuICAgICAgICAgICAgZ3N1bSA9IGR4O1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIE5ldHdvcmsucHJvdG90eXBlLmdkLmFkYWRlbHRhID0ge1xuICAgICAgICBkZWZhdWx0czoge1xuICAgICAgICAgICAgcm86IDAuOTUsXG4gICAgICAgICAgICBlcHM6IDFlLThcbiAgICAgICAgfSxcbiAgICAgICAgc3RvcmFnZTogWydnc3VtJywgJ3hzdW0nXSxcbiAgICAgICAgYWxnb3JpdGhtOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGdzdW0gPSBvcHQucm8gKiBnc3VtICsgKDEgLSBvcHQucm8pICogZ2lqICogZ2lqO1xuICAgICAgICAgICAgZHggPSAtTWF0aC5zcXJ0KCh4c3VtICsgb3B0LmVwcykgLyAoZ3N1bSArIG9wdC5lcHMpKSAqIGdpajtcbiAgICAgICAgICAgIHhzdW0gPSBvcHQucm8gKiB4c3VtICsgKDEgLSBvcHQucm8pICogZHggKiBkeDsgLy8geWVzLCB4c3VtIGxhZ3MgYmVoaW5kIGdzdW0gYnkgMS5cbiAgICAgICAgfVxuICAgIH07XG5cbiAgICAvKiBhbGdvcml0aG1zIGNvbXBpbGVyLCBzcGVlZHMgdGhpbmdzIHVwLCBhbmQgbWFrZXMgdGhpbmdzIGVhc2llciAqL1xuICAgIChmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGdkX3Byb3RvdHlwZSA9IGZ1bmN0aW9uKG9wdCwgTywgZGVjYXkpIHtcbiAgICAgICAgICAgIGlmIChPLm5vY2hhbmdlKSByZXR1cm47XG4gICAgICAgICAgICB2YXIgZHggPSAwLCBfX2dyYWQgPSAwLCBnaWogPSAwLCBsMWdyYWQgPSAwLCBsMmdyYWQgPSAwO1xuICAgICAgICAgICAgXCJVVTFcIjtcbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgTy5zaXplLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgX19ncmFkID0gTy5kdy5kW2ldO1xuICAgICAgICAgICAgICAgIGwxZ3JhZCA9IGRlY2F5ICogb3B0LmRlY2F5LmwxICogKE8udy5kW2ldID4gMCA/IDEgOiAtMSk7XG4gICAgICAgICAgICAgICAgbDJncmFkID0gZGVjYXkgKiBvcHQuZGVjYXkubDIgKiAoTy53LmRbaV0pO1xuICAgICAgICAgICAgICAgIGdpaiA9IChfX2dyYWQgKyBsMWdyYWQgKyBsMmdyYWQpIC8gb3B0LmJhdGNoO1xuICAgICAgICAgICAgICAgIFwiVVUyXCI7XG4gICAgICAgICAgICAgICAgXCJVVTNcIjtcbiAgICAgICAgICAgICAgICBcIlVVNFwiO1xuICAgICAgICAgICAgICAgIE8udy5kW2ldICs9IGR4O1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBPLmR3LmFsbCgwLjApO1xuICAgICAgICB9O1xuXG4gICAgICAgIHZhciBnZF9wcm90b3R5cGVfID0gZ2RfcHJvdG90eXBlLnRvU3RyaW5nKCk7XG5cbiAgICAgICAgZm9yICh2YXIgbmFtZSBpbiBOZXR3b3JrLnByb3RvdHlwZS5nZCkge1xuICAgICAgICAgICAgdmFyIGRlc2NyaXB0aW9uID0gTmV0d29yay5wcm90b3R5cGUuZ2RbbmFtZV07XG4gICAgICAgICAgICB2YXIgY2hlY2tzID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLnN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBjaGVja3NbaV0gPSAnaWYgKHR5cGVvZiBPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJyA9PT0gXCJ1bmRlZmluZWRcIikgeyBPLicgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJyA9IG5ldyBsaWIuTWF0KE8uc2l6ZS54LCBPLnNpemUueSwgTy5zaXplLmRlcHRoLCAwLjApOyB9JztcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIGV4dHJhY3Rpb25zID0gW107XG4gICAgICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IGRlc2NyaXB0aW9uLnN0b3JhZ2UubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgICAgICBleHRyYWN0aW9uc1tpXSA9ICd2YXIgJyArIGRlc2NyaXB0aW9uLnN0b3JhZ2VbaV0gKyAnID0gTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcuZFtpXTsnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYWxnID0gZGVzY3JpcHRpb24uYWxnb3JpdGhtLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICBhbGcgPSBhbGcuc3Vic3RyaW5nKGFsZy5pbmRleE9mKCd7JykgKyAxLCBhbGcubGVuZ3RoIC0gMSk7XG5cbiAgICAgICAgICAgIHZhciBzdG9yaW5ncyA9IFtdO1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5zdG9yYWdlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgc3RvcmluZ3NbaV0gPSAnTy4nICsgZGVzY3JpcHRpb24uc3RvcmFnZVtpXSArICcuZFtpXSA9ICcgKyBkZXNjcmlwdGlvbi5zdG9yYWdlW2ldICsgJzsnO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgZnVuYyA9IGdkX3Byb3RvdHlwZV8ucmVwbGFjZSgnXCJVVTFcIjsnLCBjaGVja3Muam9pbihcIlwiKSkucmVwbGFjZSgnXCJVVTJcIjsnLCBleHRyYWN0aW9ucy5qb2luKFwiXCIpKS5yZXBsYWNlKCdcIlVVM1wiOycsIGFsZykucmVwbGFjZSgnXCJVVTRcIjsnLCBzdG9yaW5ncy5qb2luKFwiXCIpKTtcbiAgICAgICAgICAgIHZhciBjbWQgPSAnTmV0d29yay5wcm90b3R5cGUuZ2QuJyArIG5hbWUgKyAnID0gJyArIGZ1bmM7XG4gICAgICAgICAgICBldmFsKGNtZCk7XG4gICAgICAgICAgICBOZXR3b3JrLnByb3RvdHlwZS5nZFtuYW1lXS5kZWZhdWx0cyA9IGRlc2NyaXB0aW9uLmRlZmF1bHRzO1xuICAgICAgICB9XG4gICAgfSkoKTtcblxuICAgIGxpYi5OZXR3b3JrID0gTmV0d29yaztcbn0pKG5uanMpO1xuIiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cblx0Lyogc3BhdGlhbCB3ZWlnaHRzICovXG5cdGZ1bmN0aW9uIENvbnZvbHV0aW9uYWxMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMuZmlsdGVyID0gb3B0LmZpbHRlcjtcblx0XHR0aGlzLnN0cmlkZSA9IG9wdC5zdHJpZGU7XG5cdFx0dGhpcy5wYWQgPSBvcHQucGFkO1xuXG5cdFx0dmFyIG94ID0gTWF0aC5mbG9vcigodGhpcy5pbi54ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueCkgLyB0aGlzLnN0cmlkZSArIDEpO1xuXHRcdHZhciBveSA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueSArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLnkpIC8gdGhpcy5zdHJpZGUgKyAxKTtcblx0XHR0aGlzLm91dCA9IGxpYi5TaXplMyhveCwgb3ksIHRoaXMuZmlsdGVyLmRlcHRoKTtcblxuXHRcdHRoaXMucGFyYW1ldGVycyA9IHtcblx0XHRcdGZpbHRlcnM6IFtdLFxuXHRcdFx0Ymlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5maWx0ZXIuZGVwdGgsIDAuMClcblx0XHR9O1xuXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLm91dC5kZXB0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXSA9IG5ldyBsaWIuQmxvYih0aGlzLmZpbHRlci54LCB0aGlzLmZpbHRlci55LCB0aGlzLmluLmRlcHRoKTtcblx0XHR9XG5cdH07XG5cblx0Q29udm9sdXRpb25hbExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHR2YXIgQV94ID0gQS5zaXplLnggfCAwLCBBX3kgPSBBLnNpemUueSB8IDAsIEFfZCA9IEEuc2l6ZS5kZXB0aCB8IDA7XG5cdFx0dmFyIFZfeCA9IFYuc2l6ZS54IHwgMCwgVl95ID0gVi5zaXplLnkgfCAwLCBWX2QgPSBWLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBGX3ggPSB0aGlzLmZpbHRlci54IHwgMCwgRl95ID0gdGhpcy5maWx0ZXIueSB8IDAsIEZfZCA9IHRoaXMuZmlsdGVyLmRlcHRoIHwgMDtcblxuXHRcdHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cdFx0dmFyIGJpYXNlcyA9IHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kO1xuXG5cdFx0Zm9yICh2YXIgZCA9IDA7IGQgPCBBX2Q7IGQrKykge1xuXHRcdCAgICB2YXIgZiA9IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2RdO1xuXHRcdCAgICB2YXIgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgIHZhciB5ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgZm9yICh2YXIgYXkgPSAwOyBheSA8IEFfeTsgeSArPSBzdHJpZGUsIGF5KyspIHsgLy8geHlfc3RyaWRlXG5cdFx0ICAgICAgICB4ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgICAgIGZvciAodmFyIGF4ID0gMDsgYXggPCBBX3g7IHggKz0gc3RyaWRlLCBheCsrKSB7IC8vIHh5X3N0cmlkZVxuXG5cdFx0ICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBwYXJ0aWN1bGFyIGxvY2F0aW9uIFtheCwgYXldXG5cdFx0ICAgICAgICAgICAgdmFyIGEgPSAwLjA7XG5cdFx0ICAgICAgICAgICAgdmFyIG94ID0gMCwgb3kgPSAwO1xuXHRcdCAgICAgICAgICAgIGZvciAodmFyIGZ5ID0gMDsgZnkgPCBGX3k7IGZ5KyspIHtcblx0XHQgICAgICAgICAgICAgICAgb3kgPSB5ICsgZnk7IC8vIGNvb3JkaW5hdGVzIGluIHRoZSBvcmlnaW5hbCBpbnB1dCBhcnJheSBjb29yZGluYXRlc1xuXHRcdCAgICAgICAgICAgICAgICBmb3IgKHZhciBmeCA9IDA7IGZ4IDwgRl94OyBmeCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICBveCA9IHggKyBmeDtcblx0XHQgICAgICAgICAgICAgICAgICAgIGlmIChveSA+PSAwICYmIG95IDwgVl95ICYmIG94ID49IDAgJiYgb3ggPCBWX3gpIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBmZCA9IDA7IGZkIDwgRl9kOyBmZCsrKSB7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIEEud1theCwgYXksIGRdICs9IGYud1sgZngsIGZ5LCBmZCBdICogVi53WyBveCwgb3ksIGZkIF1cblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgYSArPSBmLncuZFsoZnkgKiBGX3ggKyBmeCkgKiBGX2QgKyBmZF0gKiBWLncuZFsob3kgKiBWX3ggKyBveCkgKiBWX2QgKyBmZF07XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgICAgICB9XG5cdFx0ICAgICAgICAgICAgfVxuXG5cdFx0ICAgICAgICAgICAgQS53LmRbKGF5ICogQV94ICsgYXgpICogQV9kICsgZF0gPSBhICsgYmlhc2VzW2RdO1xuXHRcdCAgICAgICAgfVxuXHRcdCAgICB9XG5cdFx0fVxuXHR9O1xuXG5cdENvbnZvbHV0aW9uYWxMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdFYuZHcuYWxsKDApO1xuXG5cdFx0dmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgRl94ID0gdGhpcy5maWx0ZXIueCB8IDAsIEZfeSA9IHRoaXMuZmlsdGVyLnkgfCAwLCBGX2QgPSB0aGlzLmZpbHRlci5kZXB0aCB8IDA7XG5cblx0XHR2YXIgc3RyaWRlID0gdGhpcy5zdHJpZGUgfCAwO1xuXHRcdHZhciBiaWFzZXMgPSB0aGlzLnBhcmFtZXRlcnMuYmlhc2VzLmR3LmQ7XG5cblx0XHR2YXIgdjEgPSAwLCB2MiA9IDA7XG5cblx0XHRmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG5cdFx0ICAgIHZhciBmID0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbZF07XG5cdFx0ICAgIHZhciB4ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyB5ICs9IHN0cmlkZSwgYXkrKykge1xuXHRcdCAgICAgICAgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykge1xuXG5cdFx0ICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBsb2NhdGlvbiBbYXgsIGF5XVxuXHRcdCAgICAgICAgICAgIHZhciBkQSA9IEEuZHcuZFsoYXkgKiBBX3ggKyBheCkgKiBBX2QgKyBkXTtcblx0XHQgICAgICAgICAgICB2YXIgb3ggPSAwLCBveSA9IDA7XG5cdFx0ICAgICAgICAgICAgZm9yICh2YXIgZnkgPSAwOyBmeSA8IEZfeTsgZnkrKykge1xuXHRcdCAgICAgICAgICAgICAgICBveSA9IHkgKyBmeTsgLy8gY29vcmRpbmF0ZXMgaW4gdGhlIG9yaWdpbmFsIGlucHV0IGFycmF5IGNvb3JkaW5hdGVzXG5cdFx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGZ4ID0gMDsgZnggPCBGX3g7IGZ4KyspIHtcblx0XHQgICAgICAgICAgICAgICAgICAgIG94ID0geCArIGZ4O1xuXHRcdCAgICAgICAgICAgICAgICAgICAgaWYgKG95ID49IDAgJiYgb3kgPCBWX3kgJiYgb3ggPj0gMCAmJiBveCA8IFZfeCkge1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGZkID0gMDsgZmQgPCBGX2Q7IGZkKyspIHtcblx0XHQgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZi5kd1tmeCwgZnksIGZkXSArPSBWLndbb3gsIG95LCBmZF0gKiBBLmR3W2F4LCBheSwgZF1cblx0XHRcdFx0XHRcdFx0XHRcdC8vIFYuZHdbb3gsIG95LCBmZF0gKz0gZi53W2Z4LCBmeSwgZmRdICogQS5kd1theCwgYXksIGRdXG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYxID0gKGZ5ICogRl94ICsgZngpICogRl9kICsgZmQ7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIHYyID0gKG95ICogVl94ICsgb3gpICogVl9kICsgZmQ7XG5cdFx0ICAgICAgICAgICAgICAgICAgICAgICAgICAgIGYuZHcuZFt2MV0gKz0gVi53LmRbdjJdKmRBO1xuXHQgICAgICAgICAgICAgICAgICAgIFx0XHRcdFYuZHcuZFt2Ml0gKz0gZi53LmRbdjFdKmRBO1xuXHRcdCAgICAgICAgICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgIH1cblxuXHRcdCAgICAgICAgICAgIGJpYXNlc1tkXSArPSBkQTtcblx0XHQgICAgICAgIH1cblx0XHQgICAgfVxuXHRcdH1cblx0fTtcblxuXHQvKiBQb29saW5nIGxheWVyLCBzZWxlY3QgYmlnZ2VzdCB2YWx1ZSBmcm9tIGNvbnZvbHV0aW9uICovXG5cdGZ1bmN0aW9uIFBvb2xpbmdMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMuZmlsdGVyID0gb3B0LmZpbHRlcjtcblx0XHR0aGlzLnN0cmlkZSA9IG9wdC5zdHJpZGU7XG5cdFx0dGhpcy5wYWQgPSBvcHQucGFkO1xuXG5cdFx0dmFyIG94ID0gTWF0aC5mbG9vcigodGhpcy5pbi54ICsgdGhpcy5wYWQgKiAyIC0gdGhpcy5maWx0ZXIueCkgLyB0aGlzLnN0cmlkZSArIDEpO1xuXHRcdHZhciBveSA9IE1hdGguZmxvb3IoKHRoaXMuaW4ueSArIHRoaXMucGFkICogMiAtIHRoaXMuZmlsdGVyLnkpIC8gdGhpcy5zdHJpZGUgKyAxKTtcblx0XHR0aGlzLm91dCA9IGxpYi5TaXplMyhveCwgb3ksIHRoaXMuaW4uZGVwdGgpO1xuXHR9O1xuXG5cdFBvb2xpbmdMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0dmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgRl94ID0gdGhpcy5maWx0ZXIueCB8IDAsIEZfeSA9IHRoaXMuZmlsdGVyLnkgfCAwOyBcblxuXHRcdHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cblx0XHRmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG5cdFx0ICAgIHZhciB4ID0gLXRoaXMucGFkIHwgMDtcblx0XHQgICAgdmFyIHkgPSAtdGhpcy5wYWQgfCAwO1xuXHRcdCAgICBmb3IgKHZhciBheSA9IDA7IGF5IDwgQV95OyB5ICs9IHN0cmlkZSwgYXkrKykge1xuXHRcdCAgICAgICAgeCA9IC10aGlzLnBhZCB8IDA7XG5cdFx0ICAgICAgICBmb3IgKHZhciBheCA9IDA7IGF4IDwgQV94OyB4ICs9IHN0cmlkZSwgYXgrKykge1xuXG5cdFx0ICAgICAgICAgICAgLy8gY29udm9sdmUgY2VudGVyZWQgYXQgdGhpcyBsb2NhdGlvbiBbYXgsIGF5XVxuXHRcdCAgICAgICAgICAgIHZhciBzZWx2ID0gLU1hdGguSW5maW5pdHksIHNlbHggPSAwLCBzZWx5O1xuXHRcdCAgICAgICAgICAgIHZhciBveCA9IDAsIG95ID0gMCwgcSA9IDA7XG5cdFx0ICAgICAgICAgICAgZm9yICh2YXIgZnkgPSAwOyBmeSA8IEZfeTsgZnkrKykge1xuXHRcdCAgICAgICAgICAgICAgICBveSA9IHkgKyBmeTsgLy8gY29vcmRpbmF0ZXMgaW4gdGhlIG9yaWdpbmFsIGlucHV0IGFycmF5IGNvb3JkaW5hdGVzXG5cdFx0ICAgICAgICAgICAgICAgIGZvciAodmFyIGZ4ID0gMDsgZnggPCBGX3g7IGZ4KyspIHtcblx0XHQgICAgICAgICAgICAgICAgICAgIG94ID0geCArIGZ4O1xuXHRcdCAgICAgICAgICAgICAgICAgICAgaWYgKG95ID49IDAgJiYgb3kgPCBWX3kgJiYgb3ggPj0gMCAmJiBveCA8IFZfeCkge1xuXHRcdCAgICAgICAgICAgICAgICAgICAgXHRxID0gVi53LmRbKG95ICogVl94ICsgb3gpICogVl9kICsgZF07XG5cdFx0ICAgICAgICAgICAgICAgICAgICBcdGlmIChxID4gc2VsdikgeyBzZWx2ID0gcTsgc2VseCA9IG94OyBzZWx5ID0gb3k7IH1cblx0XHQgICAgICAgICAgICAgICAgICAgIH1cblx0XHQgICAgICAgICAgICAgICAgfVxuXHRcdCAgICAgICAgICAgIH1cblxuXHRcdCAgICAgICAgICAgIHZhciBpeCA9IChheSAqIEFfeCArIGF4KSAqIEFfZCArIGQ7XG5cdFx0ICAgICAgICAgICAgQS5weFtpeF0gPSBzZWx4O1xuXHRcdCAgICAgICAgICAgIEEucHlbaXhdID0gc2VseTtcblx0XHQgICAgICAgICAgICBBLncuZFtpeF0gPSBzZWx2O1xuXHRcdCAgICAgICAgfVxuXHRcdCAgICB9XG5cdFx0fVxuXHR9O1xuXG5cdFBvb2xpbmdMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdFYuZHcuYWxsKDApO1xuXG5cdFx0dmFyIEFfeCA9IEEuc2l6ZS54IHwgMCwgQV95ID0gQS5zaXplLnkgfCAwLCBBX2QgPSBBLnNpemUuZGVwdGggfCAwO1xuXHRcdHZhciBWX3ggPSBWLnNpemUueCB8IDAsIFZfeSA9IFYuc2l6ZS55IHwgMCwgVl9kID0gVi5zaXplLmRlcHRoIHwgMDtcblx0XHR2YXIgRl94ID0gdGhpcy5maWx0ZXIueCB8IDAsIEZfeSA9IHRoaXMuZmlsdGVyLnkgfCAwOyBcblxuXHRcdHZhciBzdHJpZGUgPSB0aGlzLnN0cmlkZSB8IDA7XG5cblx0XHRmb3IgKHZhciBkID0gMDsgZCA8IEFfZDsgZCsrKSB7XG5cdFx0ICAgIGZvciAodmFyIGF5ID0gMDsgYXkgPCBBX3k7IGF5KyspIHtcblx0XHQgICAgICAgIGZvciAodmFyIGF4ID0gMDsgYXggPCBBX3g7IGF4KyspIHtcblx0XHQgICAgICAgIFx0dmFyIGl4ID0gKGF5ICogQV94ICsgYXgpICogQV9kICsgZDtcblx0XHQgICAgICAgIFx0dmFyIGRBID0gQS5kdy5kW2l4XTtcblxuXHRcdCAgICAgICAgXHR2YXIgc2VseCA9IEEucHhbaXhdOyBcblx0XHQgICAgICAgIFx0dmFyIHNlbHkgPSBBLnB5W2l4XTtcblxuXHRcdCAgICAgICAgXHRWLmR3LmRbKHNlbHkgKiBWX3ggKyBzZWx4KSAqIFZfZCArIGRdID0gZEE7IC8vIG9ubHkgdHJhbnNmZXIgd2VpZ2h0cyBmcm9tIHNlbGVjdGVkIGxvY2F0aW9uc1xuXHRcdCAgICAgICAgfVxuXHRcdCAgICB9XG5cdFx0fVxuXHR9O1xuXG5cdFBvb2xpbmdMYXllci5wcm90b3R5cGUuUHJlcGFyZVN0YXRlQmxvYiA9IGZ1bmN0aW9uIChBKSB7XG5cdFx0QS5weCA9IGxpYi5NYXQuQ3JlYXRlQXJyYXkodGhpcy5vdXQuZGVwdGggKiB0aGlzLm91dC55ICogdGhpcy5vdXQueCwgMCwgJ1VpbnQxNkFycmF5Jyk7XG5cdFx0QS5weSA9IGxpYi5NYXQuQ3JlYXRlQXJyYXkodGhpcy5vdXQuZGVwdGggKiB0aGlzLm91dC55ICogdGhpcy5vdXQueCwgMCwgJ1VpbnQxNkFycmF5Jyk7XG5cdH07XG5cblx0bGliLkNvbnZvbHV0aW9uYWxMYXllciA9IENvbnZvbHV0aW9uYWxMYXllcjtcblx0bGliLlBvb2xpbmdMYXllciA9IFBvb2xpbmdMYXllcjtcbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXHQvKipcblx0ICogQHBhcmFtIHtvYmplY3R9IGlucHV0LCBzaXplXG5cdCAqL1xuXHRmdW5jdGlvbiBEb3RMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gbGliLlNpemUzKDEsIDEsIG9wdC5zaXplKTtcblx0XHR0aGlzLnBhcmFtZXRlcnMgPSB7XG5cdFx0XHRmaWx0ZXJzOiBbXSxcblx0XHRcdGJpYXNlczogbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMub3V0LmRlcHRoLCAwLjApXG5cdFx0fTtcblxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcblx0XHRcdHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldID0gbmV3IGxpYi5CbG9iKDEsIDEsIHRoaXMuaW4ubGVuZ3RoKTtcblx0XHR9XG5cdH07XG5cblx0RG90TGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBzdW0gPSAwLjA7XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0c3VtICs9IFYudy5kW2pdICogdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdO1xuXHRcdFx0fVxuXG5cdFx0XHRBLncuZFtpXSA9IHN1bSArIHRoaXMucGFyYW1ldGVycy5iaWFzZXMudy5kW2ldO1xuXHRcdH1cblx0fTtcblxuXHREb3RMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdFYuZHcuYWxsKDAuMCk7IC8vIGVtcHR5XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMub3V0Lmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR2YXIgZEEgPSBBLmR3LmRbaV07XG5cdFx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0uZHcuZFtqXSArPSBWLncuZFtqXSAqIGRBO1xuXHRcdFx0XHRWLmR3LmRbal0gKz0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdICogZEE7XG5cdFx0XHR9XG5cblx0XHRcdHRoaXMucGFyYW1ldGVycy5iaWFzZXMuZHcuZFtpXSArPSBkQTtcblx0XHR9XG5cdH07XG5cblx0bGliLkRvdExheWVyID0gRG90TGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuXHRmdW5jdGlvbiBEcm9wT3V0TGF5ZXIob3B0LCBuZXQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gb3B0LmlucHV0O1xuXHRcdHRoaXMubmV0ID0gbmV0O1xuXHRcdHRoaXMucHJvYmFiaWxpdHkgPSBvcHQucHJvYmFiaWxpdHkgfHwgMC4yNTtcblx0fVxuXG5cdERyb3BPdXRMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0aWYgKCF0aGlzLm5ldC53ZWFrKSB7XG5cdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHsgQS53LmRbaV0gPSBWLncuZFtpXSAqIHRoaXMucHJvYmFiaWxpdHk7IH0gcmV0dXJuIDtcblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChNYXRoLnJhbmRvbSgpIDwgdGhpcy5wcm9iYWJpbGl0eSkge1xuXHRcdFx0XHRBLncuZFtpXSA9IDAuMDtcblx0XHRcdFx0QS5kcm9wcGVkT3V0W2ldID0gdHJ1ZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdEEudy5kW2ldID0gVi53LmRbaV07XG5cdFx0XHRcdEEuZHJvcHBlZE91dFtpXSA9IGZhbHNlO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHREcm9wT3V0TGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHRpZiAoIXRoaXMubmV0LndlYWsgfHwgQS5kcm9wcGVkT3V0Lmxlbmd0aCAhPT0gdGhpcy5pbi5sZW5ndGgpIHJldHVybiA7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmKCFBLmRyb3BwZWRPdXRbaV0pIHtcblx0XHRcdFx0Vi5kdy5kW2ldID0gQS5kdy5kW2ldO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblxuXHREcm9wT3V0TGF5ZXIucHJvdG90eXBlLlByZXBhcmVTdGF0ZUJsb2IgPSBmdW5jdGlvbiAoQSkge1xuXHRcdEEuZHJvcHBlZE91dCA9IFtdO1xuXHR9O1xuXG5cdGxpYi5Ecm9wT3V0TGF5ZXIgPSBEcm9wT3V0TGF5ZXI7XG5cdFxufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHtcInVzZSBzdHJpY3RcIjtcblx0ZnVuY3Rpb24gSW5wdXRMYXllcihvcHQpIHtcblx0XHR0aGlzLm91dCA9IG9wdC5zaXplO1xuXHRcdHRoaXMuc2NhbGUgPSBvcHQuc2NhbGUgfHwgMS4wO1xuXHRcdHRoaXMuYmlhcyA9IG9wdC5iaWFzIHx8IDAuMDtcblx0fTtcblxuXHRJbnB1dExheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHRBLncuc2V0KFYsIHRoaXMuc2NhbGUsIHRoaXMuYmlhcyk7XG5cdH07XG5cblx0SW5wdXRMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge307XG5cblx0bGliLklucHV0TGF5ZXIgPSBJbnB1dExheWVyO1xufSkobm5qcyk7IiwiKGZ1bmN0aW9uIChsaWIpIHsgXCJ1c2Ugc3RyaWN0XCI7XG5cdGZ1bmN0aW9uIFNpZ21vaWRMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gb3B0LmlucHV0O1xuXHR9O1xuXG5cdFNpZ21vaWRMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRBLncuZFtpXSA9IDEuMC8oMS4wK01hdGguZXhwKC1WLncuZFtpXSkpO1xuXHRcdH1cblx0fVxuXG5cdFNpZ21vaWRMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0Vi5kdy5kW2ldID0gQS53LmRbaV0gKiAoLUEudy5kW2ldICsgMS4wKSAqIEEuZHcuZFtpXTtcblx0XHR9XG5cdH07XG5cblx0ZnVuY3Rpb24gUmVsdUxheWVyKG9wdCkge1xuXHRcdHRoaXMuaW4gPSBvcHQuaW5wdXQ7XG5cdFx0dGhpcy5vdXQgPSBvcHQuaW5wdXQ7XG5cdH07XG5cblx0UmVsdUxheWVyLnByb3RvdHlwZS5mb3J3YXJkID0gZnVuY3Rpb24gKFYsIEEpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdEEudy5kW2ldID0gVi53LmRbaV0gPCAwID8gMCA6IFYudy5kW2ldO1xuXHRcdH1cblx0fVxuXG5cdFJlbHVMYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgVikge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5pbi5sZW5ndGg7IGkrKykge1xuXHRcdFx0aWYoQS53LmRbaV0gPD0gMCkgVi5kdy5kW2ldID0gMDsgLy8gdGhyZXNob2xkXG5cdCAgICAgICAgZWxzZSBWLmR3LmRbaV0gPSBBLmR3LmRbaV07XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIFRhbmhMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gb3B0LmlucHV0O1xuXHR9O1xuXG5cdFRhbmhMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmluLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHRBLncuZFtpXSA9IGxpYi5NYXRoVS50YW5oKFYudy5kW2ldKTtcblx0XHR9XG5cdH1cblxuXHRUYW5oTGF5ZXIucHJvdG90eXBlLmJhY2t3YXJkID0gZnVuY3Rpb24gKEEsIFYpIHtcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuaW4ubGVuZ3RoOyBpKyspIHtcblx0XHRcdFYuZHcuZFtpXSA9ICgxLjAgLSBBLncuZFtpXSAqIEEudy5kW2ldKSAqIEEuZHcuZFtpXTtcblx0IFx0fVxuXHR9O1xuXG5cdGxpYi5TaWdtb2lkTGF5ZXIgPSBTaWdtb2lkTGF5ZXI7XG5cdGxpYi5SZWx1TGF5ZXIgPSBSZWx1TGF5ZXI7XG5cdGxpYi5UYW5oTGF5ZXIgPSBUYW5oTGF5ZXI7XG59KShubmpzKTsiLCIoZnVuY3Rpb24gKGxpYikgeyBcInVzZSBzdHJpY3RcIjtcblxuXHRmdW5jdGlvbiBSZWdyZXNzaW9uTGF5ZXIob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblx0XHR0aGlzLm91dCA9IG9wdC5pbnB1dDtcblx0fTtcblxuXHRSZWdyZXNzaW9uTGF5ZXIucHJvdG90eXBlLmZvcndhcmQgPSBmdW5jdGlvbiAoViwgQSkge1xuXHRcdEEudy53cml0ZShWLncpO1xuXHR9O1xuXG5cdFJlZ3Jlc3Npb25MYXllci5wcm90b3R5cGUuYmFja3dhcmQgPSBmdW5jdGlvbiAoQSwgViwgZGVzaXJlZCkge1xuXHRcdHZhciBsb3NzID0gMC4wO1xuXHRcdGlmKGRlc2lyZWQgaW5zdGFuY2VvZiBBcnJheSB8fCBkZXNpcmVkIGluc3RhbmNlb2YgRmxvYXQ2NEFycmF5KSB7XG5cdFx0XHRmb3IodmFyIGkgPSAwOyBpIDwgdGhpcy5vdXQubGVuZ3RoOyArK2kpIHtcblx0XHRcdFx0Vi5kdy5kW2ldID0gQS53LmRbaV0gLSBkZXNpcmVkW2ldO1xuXHRcdFx0XHRsb3NzICs9IDAuNSpWLmR3LmRbaV0qVi5kdy5kW2ldO1xuXHRcdFx0fVxuXHRcdH1cblxuXHRcdHJldHVybiBsb3NzO1xuXHR9O1xuXG5cdGxpYi5SZWdyZXNzaW9uTGF5ZXIgPSBSZWdyZXNzaW9uTGF5ZXI7XG5cbn0pKG5uanMpOyIsIihmdW5jdGlvbiAobGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG5cdGZ1bmN0aW9uIFNvZnRtYXhMYXllcihvcHQpIHtcblx0XHR0aGlzLmluID0gb3B0LmlucHV0O1xuXHRcdHRoaXMub3V0ID0gbGliLlNpemUzKDEsIDEsIHRoaXMuaW4ueCAqIHRoaXMuaW4ueSAqIHRoaXMuaW4uZGVwdGgpO1xuXHRcdHRoaXMuY2xhc3NlcyA9IHRoaXMub3V0LmRlcHRoO1xuXHR9O1xuXG5cdFNvZnRtYXhMYXllci5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0Ly8gY29tcHV0ZSBtYXggYWN0aXZhdGlvblxuXHRcdHZhciBhbWF4ID0gVi53LmRbMF07XG5cdFx0Zm9yICh2YXIgaSA9IDE7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuXHRcdFx0aWYoVi53LmRbaV0gPiBhbWF4KSBhbWF4ID0gVi53LmRbaV07XG5cdFx0fVxuXG5cdFx0Ly8gY29tcHV0ZSBleHBvbmVudGlhbHMgKGNhcmVmdWxseSB0byBub3QgYmxvdyB1cClcblx0XHR2YXIgZXMgPSBsaWIuTWF0LkNyZWF0ZUFycmF5KHRoaXMub3V0LmRlcHRoLCAwLjApLCBlc3VtID0gMC4wO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5jbGFzc2VzOyBpKyspIHtcblx0XHRcdHZhciBlID0gTWF0aC5leHAoVi53LmRbaV0gLSBhbWF4KTtcblx0XHRcdGVzdW0gKz0gZTtcblx0XHRcdGVzW2ldID0gZTtcblx0XHR9XG5cblx0XHQvLyBub3JtYWxpemUgYW5kIG91dHB1dCB0byBzdW0gdG8gb25lXG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuXHRcdFx0ZXNbaV0gLz0gZXN1bTtcblx0XHRcdEEudy5kW2ldID0gZXNbaV07XG5cdFx0fVxuXG5cdFx0cmV0dXJuIEEudy5tYXhpKCk7XG5cdH07XG5cblx0U29mdG1heExheWVyLnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWLCBkZXNpcmVkKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmNsYXNzZXM7IGkrKykge1xuXHRcdFx0dmFyIGluZGljYXRvciA9IGkgPT09IGRlc2lyZWQgPyAxLjAgOiAwLjA7XG5cdFx0XHRWLmR3LmRbaV0gPSBBLncuZFtpXSAtIGluZGljYXRvcjtcblx0XHR9XG5cblx0XHQvLyBsb3NzIGlzIHRoZSBjbGFzcyBuZWdhdGl2ZSBsb2cgbGlrZWxpaG9vZFxuXHRcdHJldHVybiAtTWF0aC5sb2coQS53LmRbZGVzaXJlZF0pO1xuXHR9O1xuXG5cdC8qIGFwcHJveC4gMzAweCBmYXN0ZXIgdGhhbiBzb2Z0bWF4LCBkZWNyZWFzZSBpbiBhY2N1cmFjeSBhbmQgcGVyZm9ybWFuY2UgKi9cblx0LyoqXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB0cmVlIFtvYmplY3RdIG9yIGNsYXNzZXMgW2ludF1cblx0ICovXG5cdGZ1bmN0aW9uIEhpZXJhcmNoaWNhbFNvZnRtYXgob3B0KSB7XG5cdFx0dGhpcy5pbiA9IG9wdC5pbnB1dDtcblxuXHRcdGlmIChvcHQudHJlZSkge1xuXHRcdFx0dGhpcy50cmVlID0gb3B0LnRyZWU7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMudHJlZSA9IHRoaXMuQnVpbGRUcmVlKG9wdC5jbGFzc2VzKTtcblx0XHR9XG5cblx0XHR0aGlzLlByZXBhcmVUcmVlKCk7XG5cblx0XHRhc3NlcnQob3B0LmNsYXNzZXMgPT09IHVuZGVmaW5lZCB8fCAob3B0LmNsYXNzZXMgPT09IHRoaXMuY2xhc3NlcyksICdIaWVyYXJjaGljYWxTb2Z0bWF4OiB0cmVlIG5vdCBzdXBwb3J0ZWQnKTtcblxuXHRcdHRoaXMubm9kZXMgPSB0aGlzLmNsYXNzZXMgLSAxO1xuXHRcdHRoaXMucGFyYW1ldGVycyA9IHtcblx0XHRcdGZpbHRlcnM6IFtdLFxuXHRcdFx0Ymlhc2VzOiBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5ub2RlcywgMC4wKVxuXHRcdH07XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubm9kZXM7IGkrKykge1xuXHRcdFx0dGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0gPSBuZXcgbGliLkJsb2IoMSwgMSwgdGhpcy5pbi5sZW5ndGgpO1xuXHRcdH1cblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVIgPSAwO1xuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SID0gMTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5CdWlsZFRyZWUgPSBmdW5jdGlvbiAoY2xhc3Nlcykge1xuXHRcdC8vIGNyZWF0ZSB0cmVlIG9mIHNpemUgbG9nKGNsYXNzZXMpXG5cdFx0dmFyIGRlcHRoID0gTWF0aC5mbG9vcihNYXRoLmxvZzIoY2xhc3NlcykpO1xuXHRcdHZhciB0cmVlID0gdGhpcy5DcmVhdGVOb2RlKGRlcHRoLCBudWxsKTtcblxuXHRcdC8vIGFkZCByZW1haW5pbmcgbm9kZXMgdG8gdHJlZVxuXHRcdHZhciByZW1haW5kZXIgPSBjbGFzc2VzIC0gTWF0aC5wb3coMiwgZGVwdGgpO1xuXHRcdHRoaXMudHJhdmVyc2UodHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRcdGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguU0VMRUNUT1IgJiYgcmVtYWluZGVyID4gMCkge1xuXHRcdFx0XHRub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVI7XG5cdFx0XHRcdG5vZGUuYSA9IHRoaXMuQ3JlYXRlTm9kZSgwLCBub2RlKTtcblx0XHRcdFx0bm9kZS5iID0gdGhpcy5DcmVhdGVOb2RlKDAsIG5vZGUpO1xuXG5cdFx0XHRcdHJlbWFpbmRlci0tO1xuXG5cdFx0XHRcdHJldHVybiBmYWxzZTtcblx0XHRcdH1cblxuXHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gdHJlZTtcblx0fTsgXG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuUHJlcGFyZVRyZWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0dmFyIHNlbCA9IDAsIHB0ciA9IDAsIHRhYmxlID0ge307XG5cdFx0dGhpcy50cmF2ZXJzZSh0aGlzLnRyZWUsIGZ1bmN0aW9uIChub2RlKSB7XG5cdFx0XHRpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SKSB7XG5cdFx0XHRcdHRhYmxlW3NlbF0gPSBub2RlO1xuXHRcdFx0XHRub2RlLmluZGV4ID0gc2VsO1xuXHRcdFx0KytzZWw7fVxuXG5cdFx0XHRlbHNlIGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuXHRcdFx0XHRub2RlLmluZGV4ID0gcHRyO1xuXHRcdFx0cHRyKys7fVxuXG5cdFx0XHRyZXR1cm4gdHJ1ZTtcblx0XHR9KTtcblxuXHRcdHRoaXMuY2xhc3NlcyA9IHNlbDtcblx0XHR0aGlzLm5vZGVzID0gcHRyO1xuXHRcdHRoaXMudGFibGUgPSB0YWJsZTtcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5DcmVhdGVOb2RlID0gZnVuY3Rpb24gKGRlcHRoLCBwYXJlbnQpIHtcblx0XHR2YXIgbm9kZSA9IHsgcGFyZW50OiBwYXJlbnQgfTtcblxuXHRcdGlmIChkZXB0aCA8PSAwKSB7XG5cdFx0XHRub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRub2RlLnR5cGUgPSBIaWVyYXJjaGljYWxTb2Z0bWF4LlBPSU5URVI7XG5cdFx0XHRub2RlLmEgPSB0aGlzLkNyZWF0ZU5vZGUoZGVwdGgtMSwgbm9kZSk7XG5cdFx0XHRub2RlLmIgPSB0aGlzLkNyZWF0ZU5vZGUoZGVwdGgtMSwgbm9kZSk7XG5cdFx0fVxuXG5cdFx0cmV0dXJuIG5vZGU7XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUudHJhdmVyc2UgPSBmdW5jdGlvbiAobm9kZSwgY2IpIHtcblx0XHRpZiAoY2IuY2FsbCh0aGlzLCBub2RlKSAmJiBub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuXHRcdFx0dGhpcy50cmF2ZXJzZShub2RlLmEsIGNiKTtcblx0XHRcdHRoaXMudHJhdmVyc2Uobm9kZS5iLCBjYik7XG5cdFx0fVxuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmFzY2VuZCA9IGZ1bmN0aW9uIChub2RlLCBjYikge1xuXHRcdGlmIChub2RlLnBhcmVudCA9PT0gbnVsbCkgcmV0dXJuIDtcblx0XHRjYi5jYWxsKHRoaXMsIG5vZGUucGFyZW50LCBub2RlID09PSBub2RlLnBhcmVudC5hID8gLTEuMCA6IDEuMCk7XG5cdFx0dGhpcy5hc2NlbmQobm9kZS5wYXJlbnQsIGNiKTtcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5kZXNjZW5kID0gZnVuY3Rpb24gKG5vZGUsIGNiKSB7XG5cdFx0dmFyIGQgPSBjYi5jYWxsKHRoaXMsIG5vZGUpO1xuXG5cdFx0aWYgKG5vZGUudHlwZSA9PT0gSGllcmFyY2hpY2FsU29mdG1heC5TRUxFQ1RPUiB8fCBkIGluc3RhbmNlb2YgT2JqZWN0IHx8IGQgPT09IG51bGwpIHtcblx0XHRcdHJldHVybiBkO1xuXHRcdH1cblxuXHRcdGlmIChkID4gMC4wKSB7IC8vIG5lZ2F0aXZlIG1lYW5zIGxlZnQsIHBvc2l0aXZlIG1lYW5zIHJpZ2h0XG5cdFx0XHRyZXR1cm4gdGhpcy5kZXNjZW5kKG5vZGUuYiwgY2IpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5kZXNjZW5kKG5vZGUuYSwgY2IpO1xuXHRcdH1cblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5hY3RpdmF0ZSA9IGZ1bmN0aW9uIChWLCBpKSB7XG5cdFx0dmFyIHN1bSA9IDAuMDtcblx0XHRmb3IgKHZhciBqID0gMDsgaiA8IHRoaXMuaW4ubGVuZ3RoOyBqKyspIHtcblx0XHRcdHN1bSArPSBWLncuZFtqXSAqIHRoaXMucGFyYW1ldGVycy5maWx0ZXJzW2ldLncuZFtqXTtcblx0XHR9XG5cblx0XHRyZXR1cm4gbGliLk1hdGhVLnRhbmgodGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy53LmRbaV0gKyBzdW0pO1xuXHR9O1xuXG5cdEhpZXJhcmNoaWNhbFNvZnRtYXgucHJvdG90eXBlLmdyYWRpZW50ID0gZnVuY3Rpb24gKFYsIGksIGRpcmVjdGlvbikge1xuXHRcdHZhciBhY3QgPSB0aGlzLmFjdGl2YXRlKFYsIGkpLFxuXHRcdFx0XHRlcnIgPSBhY3QgLSBkaXJlY3Rpb247XG5cblx0XHR2YXIgZHcgPSAoMS4wIC0gYWN0ICogYWN0KSAqIGVycjtcblx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5ub2NoYW5nZSA9IGZhbHNlO1xuXG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCB0aGlzLmluLmxlbmd0aDsgaisrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5kdy5kW2pdICs9IFYudy5kW2pdICogZHc7XG5cdFx0XHRWLmR3LmRbal0gKz0gdGhpcy5wYXJhbWV0ZXJzLmZpbHRlcnNbaV0udy5kW2pdICogZHc7XG5cdFx0fVxuXG5cdFx0dGhpcy5wYXJhbWV0ZXJzLmJpYXNlcy5kdy5kW2ldICs9IGR3O1xuXG5cdFx0cmV0dXJuIChkaXJlY3Rpb24gPCAwID8gMSAtIChhY3QgKiAwLjUgKyAwLjUpIDogKGFjdCAqIDAuNSArIDAuNSkpOyAvLyBwcm9iYWJpbGl0eSB0byBnbyB0aGUgcmlnaHQgd2F5XG5cdH07XG5cblx0SGllcmFyY2hpY2FsU29mdG1heC5wcm90b3R5cGUuZm9yd2FyZCA9IGZ1bmN0aW9uIChWLCBBKSB7XG5cdFx0dmFyIHNlbGVjdGVkID0gdGhpcy5kZXNjZW5kKHRoaXMudHJlZSwgZnVuY3Rpb24gKG5vZGUpIHtcblx0XHRcdGlmIChub2RlLnR5cGUgPT09IEhpZXJhcmNoaWNhbFNvZnRtYXguUE9JTlRFUikge1xuXHRcdFx0XHRyZXR1cm4gdGhpcy5hY3RpdmF0ZShWLCBub2RlLmluZGV4KTtcblx0XHRcdH1cblxuXHRcdFx0ZWxzZSBpZiAobm9kZS50eXBlID09PSBIaWVyYXJjaGljYWxTb2Z0bWF4LlNFTEVDVE9SKSB7XG5cdFx0XHRcdHJldHVybiBub2RlO1xuXHRcdFx0fVxuXG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9KTtcblxuXHRcdHJldHVybiAoQS5pbmRleCA9IHNlbGVjdGVkLmluZGV4KTtcblx0fTtcblxuXHRIaWVyYXJjaGljYWxTb2Z0bWF4LnByb3RvdHlwZS5iYWNrd2FyZCA9IGZ1bmN0aW9uIChBLCBWLCBkZXNpcmVkKSB7XG5cdFx0Vi5kdy5hbGwoMCk7XG5cblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMucGFyYW1ldGVycy5maWx0ZXJzLmxlbmd0aDsgaSsrKSB7XG5cdFx0XHR0aGlzLnBhcmFtZXRlcnMuZmlsdGVyc1tpXS5ub2NoYW5nZSA9IHRydWU7XG5cdFx0fVxuXG5cdFx0dmFyIHByb2IgPSAxLjA7XG5cdFx0dGhpcy5hc2NlbmQodGhpcy50YWJsZVtkZXNpcmVkXSwgZnVuY3Rpb24gKG5vZGUsIGRpcmVjdGlvbikge1xuXHRcdFx0cHJvYiA9IHByb2IgKiB0aGlzLmdyYWRpZW50KFYsIG5vZGUuaW5kZXgsIGRpcmVjdGlvbik7XG5cdFx0fSk7XG5cblx0XHRyZXR1cm4gMS4wIC0gcHJvYjsgLy8gcHJvYmFiaWxpdHkgdG8gTk9UIGdvIHRoZSByaWdodCB3YXlcblx0fTtcblxuXHRsaWIuU29mdG1heExheWVyID0gU29mdG1heExheWVyO1xuXHRsaWIuSGllcmFyY2hpY2FsU29mdG1heCA9IEhpZXJhcmNoaWNhbFNvZnRtYXg7XG59KShubmpzKTsiLCIoZnVuY3Rpb24obGliKSB7IFwidXNlIHN0cmljdFwiO1xuXG4gICAgaWYgKHR5cGVvZiBtb2R1bGUgPT09IFwidW5kZWZpbmVkXCIgfHwgdHlwZW9mIG1vZHVsZS5leHBvcnRzID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgICAgIHdpbmRvdy5ubiA9IGxpYjtcbiAgICB9IGVsc2Uge1xuICAgICAgICBtb2R1bGUuZXhwb3J0cyA9IGxpYjtcbiAgICB9XG4gICAgXG59KShubmpzKTtcbiJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
