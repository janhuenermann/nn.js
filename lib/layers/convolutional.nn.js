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