const SAMPLES_BATCH = 3000;
const IMAGE_SIZE = 28;

var data = null;
var samples = [];
var net = null, k = 0;

ww.on('start', function (d) {
    console.log('worker received ' + d.batches.length + ' batches'); 
    data = PrepareData(d);
    Start();
});

function CreateNet() {
    var layers = [
        { type: 'input', size: nn.Size3(28, 28, 1) },
        { type: 'conv', filter: nn.Size3(5, 5, 8), stride: 1, pad: 2, activation: 'relu' },
        { type: 'pool', filter: nn.Size2(2, 2), stride: 2 },
        { type: 'conv', filter: nn.Size3(5, 5, 16), stride: 1, pad: 2, activation: 'relu' },
        { type: 'pool', filter: nn.Size2(3, 3), stride: 3 },
        { type: 'softmax', classes: 10 }
    ];

    net = new nn.Network({
        layers: layers,
        learner: { method: 'adadelta', batch: 20, decay: { l2: 1e-3 } }
    });
}

function PrepareData(d) {
    for (var i = 0; i < d.batches.length; i++) {
        d.batches[i] = new Uint8ClampedArray(d.batches[i]);
    }

    return d;
}

function GetSample(k, n) {
    var imagedata = data.batches[n];

    var mat = new nn.Mat(IMAGE_SIZE, IMAGE_SIZE, 1, 0.0);
    var offset = IMAGE_SIZE * IMAGE_SIZE * k;
    for (var x = 0; x < IMAGE_SIZE; x++) {
        for (var y = 0; y < IMAGE_SIZE; y++) {
            mat.d[y * IMAGE_SIZE + x] = imagedata[(offset + y * IMAGE_SIZE + x) * 4 + 0] / 255.0 - 0.5;
        }
    }

    return mat;
};

function GetImageData(input) {
    var img = new Uint8ClampedArray(IMAGE_SIZE * IMAGE_SIZE * 4);
    for (var x = 0; x < IMAGE_SIZE; x++) {
        for (var y = 0; y < IMAGE_SIZE; y++) {
            var v = (input.d[y * IMAGE_SIZE + x] + 0.5) * 255;
            img[(y * IMAGE_SIZE + x) * 4 + 0] = v;
            img[(y * IMAGE_SIZE + x) * 4 + 1] = v;
            img[(y * IMAGE_SIZE + x) * 4 + 2] = v;
            img[(y * IMAGE_SIZE + x) * 4 + 3] = 255;
        }
    }

    return img;
}

function GetSamples() {
    for (var i = 0; i < data.batches.length; i++) {
        ww.trigger('log', 'Processing batch ' + i);
        for (var k = 0; k < SAMPLES_BATCH; k++) {
            samples.push({ input: GetSample(k, i), label: data.labels[i * SAMPLES_BATCH + k] });
        }
    }
}

var mw = new nn.MovingWindow(1000);
var time = Date.now();
function Step() {
    var S = samples[Math.floor(Math.random() * samples.length)];
    var predicted = net.forward(S.input.d);
    var loss = net.backward(S.label);

    mw.add(predicted === S.label ? 1 : 0);

    if (k % 1000 == 0) {
        // var imgdata = GetImageData(S.input).buffer;
        var now = Date.now();
        ww.trigger('display', { iteration: k, ratio: mw.average() * 100, loss: loss, time: (now - time) });
        time = Date.now();
    }
    
    ++k; 
}

function Start() {
    CreateNet();
    GetSamples();

    while(true) 
        Step();
}
