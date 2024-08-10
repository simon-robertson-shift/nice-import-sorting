'use strict';

const { parsers: javascriptParsers } = require('prettier/parser-babel');
const { parsers: typescriptParsers } = require('prettier/parser-typescript');

const { composeOutput } = require('./lib/output.js');
const { sortImportStatements } = require('./lib/sort.js');
const { processSource } = require('./lib/source.js');

/**
 * @typedef {object} ProcessOptions
 * @property {string[]} niceImportSortingRoots
 * @property {number} rangeStart
 * @property {number} rangeEnd
 */

/**
 * @param {string} contents
 * @param {ProcessOptions} options
 * @return {string}
 */
function process(contents, options) {
    if (options.rangeStart > 0 || options.rangeEnd < contents.length - 1) {
        return contents;
    }

    const { importStatements, sourceLines } = processSource(contents);

    if (importStatements.length === 0 || sourceLines.length === 0) {
        return conetnts;
    }

    const importStatementsSorted = sortImportStatements(importStatements, options);

    return composeOutput(sourceLines, importStatementsSorted);
}

/**
 * @param {string} contents
 * @param {ProcessOptions} options
 * @return {string}
 */
function preprocess(contents, options) {
    let output = contents;

    try {
        output = process(contents, options);
    } catch (error) {
        console.error('Nice Import Sorting Failed');
        console.error(error);
    }

    return output;
}

module.exports = {
    options: {
        niceImportSortingRoots: {
            type: 'path',
            array: true,
            category: 'Global',
            default: [{ value: [] }],
            description: 'Deprecated',
        },
        niceImportSortingGroups: {
            type: 'path',
            array: true,
            category: 'Global',
            default: [{ value: [] }],
            description: 'Deprecated',
        },
    },
    parsers: {
        typescript: {
            ...typescriptParsers.typescript,
            preprocess,
        },
        babel: {
            ...javascriptParsers.babel,
            preprocess,
        },
        jsx: {
            ...javascriptParsers.babel,
            preprocess,
        },
        tsx: {
            ...typescriptParsers.tsx,
            preprocess,
        },
    },
};
