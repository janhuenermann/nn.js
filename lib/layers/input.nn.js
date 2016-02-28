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