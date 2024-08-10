'use strict';

/**
 * @typedef {object} Cursor
 * @property {number} line
 */

/**
 * @typedef {object} Import
 * @property {string} name
 * @property {string} alias
 * @property {boolean} type
 */

/**
 * @typedef {object} ImportStatement
 * @property {string} path
 * @property {string} namespace
 * @property {Import|null} default
 * @property {Import[]|null} named
 * @property {string[]|null} comments
 * @property {number} sourceLineStart
 * @property {number} sourceLineEnd
 * @property {number} group
 */

/**
 * @typedef {object} PluginOptions
 * @property {string[]} niceImportSortingRoots
 */

/**
 * @typedef {object} ProcessingResult
 * @property {string[]} sourceLines
 * @property {ImportStatement[]} importStatements
 */

module.exports = {};
