(function(lib) { "use strict";

    function InputLayer(opt) {
        this.out = opt.size;
    };

    InputLayer.prototype.forward = function(V, A) {
        A.w.copy(V);
    };

    InputLayer.prototype.backward = function(A, V) {};

    lib.InputLayer = InputLayer;
})(nnjs);
