require('console-stamp')(console, 'HH:MM:ss.l');
var nn = require('../build/nn.js');

    var layers = [
        { type: 'input', size: nn.Size3(1, 1, 2) }, 
        { type: 'dot', size: 100 }, 
        { type: 'tanh' }, 
        { type: 'dot', size: 1 }, 
        { type: 'sigmoid' },
        { type: 'regression' }
    ];

var net = new nn.Network({
    layers: layers,
    learner: { method: 'adadelta' }
});

console.time("nn");
for (var i = 0; i < 100000; i++) {
    var a = Math.random() > 0.5;
    var b = Math.random() > 0.5;
    var c = a != b;
    var o = net.forward([a ? 1.0 : 0.0, b ? 1.0 : 0.0]);
    var loss = net.backward([c?1.0:0.0]);
    if (i % 1000 == 0) { console.log(loss); }
}

var stats = net.layers.stats();
console.log('100,000 iterations of network with ' + stats.parameters + ' parameters and ' + stats.nodes + ' nodes');
console.timeEnd("nn");