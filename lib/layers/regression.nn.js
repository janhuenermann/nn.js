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