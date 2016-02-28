(function(lib) {

    function WebWorker(main, nnjs) {
        this.events = {};
        this.CreateWorker(main, nnjs, function () {
            WebWorker.API.listen(this.events, this.worker);
        });
    };

    WebWorker.prototype.CreateWorker = function(main, nnjs, completion) {
        var compile = (function (code) {
            this.worker = new Worker(this.CreateURL(code, nnjs));
            completion.call(this);
        }).bind(this);

        if (main instanceof Function) {
            compile(this.FunctionToString(main));
        } else if (typeof main === 'string') {
            var request = new XMLHttpRequest();

            request.addEventListener("load", function () {
                compile(this.responseText);
            });

            request.addEventListener("error", function () {
                console.log('Error loading worker "' + main + '"');
            });
            request.open("GET", this.ConvertRelativeURI(main));
            request.send();
        }
    };

    WebWorker.prototype.CreateURL = function(code, nnjs) {
        var workerString = this.AddRequiredStuff(nnjs) + '\n' + code;
        var data = this.CreateBlob(workerString);
        return window.URL.createObjectURL(data);
    };

    WebWorker.prototype.CreateBlob = function(string) {
        var blob;
        try {
            blob = new Blob([string], { type: 'application/javascript' });
        } catch (e) { // Backwards-compatibility
            window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
            blob = new BlobBuilder();
            blob.append(string);
            blob = blob.getBlob();
        }

        return blob;
    };

    WebWorker.prototype.FunctionToString = function(func) {
        var string = worker.toString();
        var beg = string.indexOf('{') + 1;
        var end = string.lastIndexOf('}');
        return string.substring(beg, end).trim();
    };

    WebWorker.prototype.AddRequiredStuff = function(nnjs) {
        var str = 'importScripts("' + this.ConvertRelativeURI(nnjs) + '"); var nn = nnjs; ';
        str += "var WebWorker = {}; WebWorker.API = {";

        var api = [];
        for (var key in WebWorker.API) {
            api.push(key + ': ' + WebWorker.API[key].toString());
        }

        str += api.join(',') + '}; ww = WebWorker.API;';
        str += 'ww.events = {}; ww.listen();';

        return str;
    };

    WebWorker.prototype.ConvertRelativeURI = function(relative) {
        var absolute = null;
        (function (e) {
            e.href = relative; absolute = e.href;
        })(document.createElement('a'));
        return absolute;
    };

    WebWorker.prototype.on = function(event, func) {
        WebWorker.API.on(event, func, this.events);
    };

    WebWorker.prototype.trigger = function(event, data, transfer) {
        WebWorker.API.trigger(event, data, transfer, this.worker);
    };

    WebWorker.API = {
        listen: function(store, w) {
            store = store || (ww ? ww.events : null);
            w = w || self;
            w.onmessage = function(e) {
                var received = e.data;
                var stored = store[received.name];
                for (var i = 0; stored !== undefined && stored instanceof Array && i < stored.length; i++) {
                    stored[i].apply(undefined, [].concat(received.parameter, received.transfer));
                }
            };
        },
        on: function(name, func, store) {
            store = store || (ww ? ww.events : null);
            if (store[name] === undefined) {
                store[name] = [];
            }

            store[name].push(func);
        },
        trigger: function(event, data, transfer, w) {
            w = w || self;
            w.postMessage({
                name: event,
                parameter: data,
                transfer: transfer
            }, transfer);
        }
    };

    lib.WebWorker = WebWorker;

})(nnjs);
