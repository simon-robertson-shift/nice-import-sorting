'use strict';

const fs = require('fs');
const plugin = require('../index.js');

const source = fs.readFileSync('./source.ts').toString();
const options = {
    niceImportSortingRoots: ['app'],
    rangeEnd: source.length - 1,
    rangeStart: 0,
};

const output = plugin.parsers.typescript.preprocess(source, options);

console.log(output);
