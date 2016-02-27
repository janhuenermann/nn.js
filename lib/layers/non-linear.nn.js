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