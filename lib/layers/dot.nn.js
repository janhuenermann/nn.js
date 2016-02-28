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