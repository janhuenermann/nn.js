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
			this.parameters.filters[0].w.set(0, 2, i, -1); // at beginning negative peephole connections
			this.parameters.filters[0].w.set(0, 5, i, -1); // to minimize exploding
			this.parameters.filters[0].w.set(0, 8, i, -1); // cell state
		}

		this.parameters.biases = new lib.Blob(1, 3, this.in.length, 0.0);
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