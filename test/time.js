require('console-stamp')(console, 'HH:MM:ss.l');
var nn = require('../build/nn.js');

var layers = [
    { type: 'input', size: nn.Size3(1, 1, 1) },
    { type: 'dot', size: 1 },
    { type: 'lstm' },
    { type: 'regression' }
];

var net = new nn.Network({
    layers: layers,
    learner: {
        method: 'adadelta',
        timespan: 5,
        decay: { l1: 0, l2: 1e-5 }
    }
});

console.time("nn");
var k = 0;
for (var i = 0; i < 100000; i++) {
    if (Math.random() < 0.3) {
    	var seq = [];
        seq.push(Math.round(net.forward([1])[0]));
        net.backward([0]);

        for (var t = 0; t < 3; t++) {
            seq.push(Math.round(net.forward([0])[0]));
            net.backward([0]);
        }

        seq.push(Math.round(net.forward([0])[0]));
        var loss = net.backward([1]);

        if (k % 1000 === 0) {
        	console.log(seq);
        	console.log(loss);
        }
        ++k;
    }

    net.forward([0]);
}

var stats = net.layers.stats();
console.log('100,000 iterations of network with ' + stats.parameters + ' parameters and ' + stats.nodes + ' nodes');
console.timeEnd("nn");
