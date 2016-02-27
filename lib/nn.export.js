(function(lib) { "use strict";

    if (typeof module === "undefined" || typeof module.exports === "undefined") {
        window.nn = lib;
    } else {
        module.exports = lib;
    }
    
})(nnjs);
