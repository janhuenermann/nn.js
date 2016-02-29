const NUM_BATCHES = 20;
const BATCHES_SRC = "data/mnist/batch";
const LABELS_SRC = "data/mnist/labels.json";

var worker = null;
var canvas = null, ccontext = null, cscale = 3.0;
var data = {
    batches: [],
    labels: null
};

function LoadJSON(URL, callback) {
    var request = new XMLHttpRequest();

    request.addEventListener("load", function () {
        callback(JSON.parse(this.responseText));
    });
    request.open("GET", URL);
    request.send();
}

function GetImageData(image) {
    var canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    var ctx = canvas.getContext("2d");
    ctx.drawImage(image, 0, 0);
    return ctx.getImageData(0, 0, image.width, image.height);
}

function LoadBatch(n, callback) {
    Log("Loading Batch " + n);
    var image = new Image();
    image.onload = function () {
        data.batches[n] = GetImageData(image).data.buffer;
        callback();
    };
    image.src = BATCHES_SRC + n + '.png';
}

function Next() {
    if (data.batches.length < NUM_BATCHES) {
        LoadBatch(data.batches.length, Next);
    } else {
        StartWorker();
    }
}

function CreateCanvas() {
    cscale *= window.devicePixelRatio;
    canvas = document.createElement('canvas');
    canvas.width = 28;
    canvas.height = 28;
    ccontext = canvas.getContext('2d');
    document.body.appendChild(canvas);
    ccontext.scale(cscale, cscale);
}

function Start() {
    worker = new nn.WebWorker('demo/mnist.worker.js', 'build/nn.js');
    LoadJSON(LABELS_SRC, function (json) {
        data.labels = json;
        Next();
    });
    CreateCanvas();
}

function Log(text) {
    var fragment = document.createDocumentFragment();
        fragment.appendChild(document.createTextNode(text));
        fragment.appendChild(document.createElement('br'));

        var node = document.querySelector("#log");
        if (node.children.length > 200) {
            node.removeChild(node.childNodes[0]);
            node.removeChild(node.childNodes[1]);
        }

        node.appendChild(fragment);
}

function StartWorker() {
    worker.trigger('start', data, data.batches);
    worker.on('log', function (data) {
        Log(data);
    });
    worker.on('display', function (data) {
        // var imgdata = new ImageData(new Uint8ClampedArray(data.image), 28, 28);
        // ccontext.putImageData(imgdata, 0, 0);
        Log(data.iteration + '. Ratio ' + data.ratio + '%; time = ' + (data.time / 1000) + 'ms');
    });
    
}

Start();
