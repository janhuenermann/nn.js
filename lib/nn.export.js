(function(lib) { "use strict";

    if (typeof module === "undefined" || typeof module.exports === "undefined") {
    	if (typeof window !== 'undefined') { // web worker support; just use nnjs in web worker
    		window.nn = lib;
    	}
    } else {
        module.exports = lib;
    }
    
})(nnjs);
