var nn = require('../build/nn.js');

var layers = [{ type: 'input', size: nn.Size3(1, 1, 1) }, { type: 'dot', size: 1 }, { type: 'lstm' }, { type: 'regression' }];
var net = new nn.Network({ layers: layers, learner: { method: 'adadelta', timespan: 5, decay: { l2: 1e-5 } } });

/* learns to delay a number for 4 time steps */
console.time("nn");
var k = 0;
for (var i = 0; i < 500000; i++) {
    if (Math.random() < 0.3) {
        var seq = [];
        seq.push(net.forward([1])[0]);
        net.backward([0]);

        for (var t = 0; t < 3; t++) {
            seq.push(net.forward([0])[0]);
            net.backward([0]);
        }

        seq.push(net.forward([0])[0]);
        var loss = net.backward([1]);

        if (k % 10000 === 0) {
            console.log('run ' + k);
            console.log(seq.toString());
            console.log('loss: ' + loss)
        }
        ++k;
    }

    net.forward([0]);
    net.backward([0]);
}

console.timeEnd("nn");
