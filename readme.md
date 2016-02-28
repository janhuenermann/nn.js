# A generalized approach to neural networks
This library is intended to be a generalized model of neural networks, which enable computer to learn. The idea is to combine existing NN-ideas and combine them into one project, so you not only have to have different libraries, but you can also combine the different algorithms.

### Why JavaScript?
The language itself is one of the most-adopted and easiest to learn languages you can choose. Being able to just load a webpage and having the library do its job is very important. In addition through the use of NodeJS you can run the library on the server-side, enabling new possibilites for usage in recommendation engines and other computer learning problems.

## Features
- A generalized BPTT (back-propagation through time) algorithm for use in either recurrent or feed-forward models
- Abstract layer-network model
- Network model & network data-flow are seperated
- Web worker support for fast asynchronous background processing

## Current layer implementations
- Fully connected layer (Dot)
- Convolutional layer
- Long Short-Term memory layer
- Softmax and hierarchical softmax layer
- Non-linear layers like sigmoid, tanh and rectifier
- Regression and input layer
- Drop-out layer

## Example
Here is an example for how to create a simple neural net that can predict a XOR-gate:
```javascript
// create a neural network, which has 6 layers, including 2 fully-connected layers
var layers = [
    { type: 'input', size: nn.Size3(1, 1, 2) }, 
    { type: 'dot', size: 20 }, 
    { type: 'tanh' }, 
    { type: 'dot', size: 1 }, 
    { type: 'sigmoid' },
    { type: 'regression' }
];

// create network from layers, use adadelta as gradient descent algorithm
var net = new nn.Network({
    layers: layers,
    learner: { method: 'adadelta' }
});

for (var i = 0; i < 10000; i++) {
    // random input values
    var in1 = Math.random() > 0.5 ? 1 : 0;
    var in2 = Math.random() > 0.5 ? 1 : 0;
    // calculate the desired output
    var out = a != b;
    // forward pass of the network, prediction
    var prediction = net.forward([ in1, in2 ]);
    // backward pass of the network, learning; teaching the net that 'in1' and 'in2' should result in 'out'
    var loss = net.backward([ out ]);
    // every 100th iteration output loss, how close the network predicts its outputs to the desired values
    if (i % 100 == 0) { 
        console.log(loss); 
    }
} // repeat 10000
```

## Future
- More & better demos (MNIST demo, CIFAR-10 demo, char-rnn demo, performance tests, etc)
- Reinforcement learning
- Embedding layer

## Acknowledgments
I would like to thank @karpathy (Andrej Karpathy) for his rigorous work on JavaScript deep-learning libraries, which I took inspiration and help from. (In parts you can see that in the code)

## License
MIT