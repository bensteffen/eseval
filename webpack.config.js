const path = require('path');

module.exports = {
    output: {
        library: 'EsEval',
        libraryTarget: 'umd',
        filename: 'eseval.js',
        // path: path.resolve(__dirname, 'res/js')
        // auxiliaryComment: 'Test Comment'
    },
    optimization: {
        minimize: false
    },
};
