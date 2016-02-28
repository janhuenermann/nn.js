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
