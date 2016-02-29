(function (lib) { "use strict";

    function DropOutLayer(opt) {
        this.in = opt.input;
        this.out = opt.input;
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