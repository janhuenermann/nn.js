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
