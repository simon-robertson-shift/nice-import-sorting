const { parsers: javascriptParsers } = require('prettier/parser-babel');
const { parsers: typescriptParsers } = require('prettier/parser-typescript');

/**
 * @typedef {object} ImportStatementInfo
 * @property {string} name
 * @property {string[]} names
 * @property {string} path
 * @property {string} root
 * @property {string} group
 * @property {boolean} isAnonymous
 * @property {boolean} isDefault
 * @property {boolean} isNamed
 * @property {boolean} isMultiline
 */

/**
 * @typedef {object} OutputOptions
 * @property {string[]} sortingGroups
 * @property {string[]} sortingRoots
 * @property {string[]} output
 */

/**
 * @typedef {object} PluginOptions
 * @property {string[]} niceImportSortingGroups
 * @property {string[]} niceImportSortingRoots
 * @property {string} endOfLine
 * @property {boolean} singleQuote
 * @property {number} tabWidth
 * @property {string} trailingComma
 * @property {boolean} useTabs
 */

/**
 * @param {string} source
 * @param {PluginOptions} options
 * @return {string}
 */
function process(source, options) {
  // Make sure we are processing the entire file.
  if (options.rangeStart !== 0 || options.rangeEnd !== source.length) {
    return;
  }

  const sortingRoots = options.niceImportSortingRoots.slice(0);
  const sortingGroups = options.niceImportSortingGroups.slice(0);

  for (let i = 0; i < sortingRoots.length; i++) {
    sortingRoots[i] = trimPathSeparators(sortingRoots[i]);
  }

  for (let i = 0; i < sortingGroups.length; i++) {
    sortingGroups[i] = trimPathSeparators(sortingGroups[i]);
  }

  const sortingGroupsPrioritized = sortingGroups.slice(0);

  sortingGroupsPrioritized.sort((a, b) => {
    return b.length - a.length;
  });

  /** @type {string[]} */
  const directives = [];

  /** @type {ImportStatementInfo[]} */
  const imports = [];

  /** @type {ImportStatementInfo[]} */
  const importsRooted = [];

  /** @type {ImportStatementInfo[]} */
  const importsRelative = [];

  /** @type {ImportStatementInfo[]} */
  const importsAnonymous = [];

  /** @type {string[]} */
  const outputLines = [];
  const sourceLines = source.split(/\r?\n/);

  while (sourceLines.length > 0) {
    const line = sourceLines.shift();

    if (line.length === 0) {
      outputLines.push(line);
      continue;
    }

    if (line.substring(1, 5) === 'use ') {
      directives.push(line.substring(1, line.length - 1));
      continue;
    }

    if (line.substring(0, 7) !== 'import ') {
      outputLines.push(line);
      continue;
    }

    const info = extractImportStatementInfo(line, sourceLines);

    if (info.isAnonymous) {
      importsAnonymous.push(info);
      continue;
    }

    if (info.path.substring(0, 1) === '.') {
      importsRelative.push(info);
      continue;
    }

    let rooted = false;

    for (let i = 0; i < sortingRoots.length; i++) {
      if (info.path.startsWith(sortingRoots[i] + '/')) {
        info.root = sortingRoots[i];
        rooted = true;
        break;
      }
    }

    if (rooted) {
      for (let i = 0; i < sortingGroupsPrioritized.length; i++) {
        if (info.path.startsWith(sortingGroupsPrioritized[i])) {
          info.group = sortingGroupsPrioritized[i];
          break;
        }
      }

      importsRooted.push(info);
      continue;
    }

    imports.push(info);
  }

  while (outputLines.length > 0 && outputLines[0].length === 0) {
    outputLines.shift();
  }

  /** @type {OutputOptions} */
  const outputOptions = {
    sortingGroups: sortingGroups,
    sortingRoots: sortingRoots,
    output: [],
  };

  outputDirectives(directives, outputOptions);
  outputImports(imports, outputOptions);

  /** @type {ImportStatementInfo[]} */
  const importsUngrouped = [];

  for (const sortingGroup of sortingGroups) {
    /** @type {ImportStatementInfo[]} */
    const importsGrouped = [];

    for (const statement of importsRooted) {
      if (statement.group === sortingGroup) {
        importsGrouped.push(statement);
        continue;
      }

      if (
        statement.group.length === 0 &&
        importsUngrouped.includes(statement) === false
      ) {
        importsUngrouped.push(statement);
      }
    }

    outputImports(importsGrouped, outputOptions);
  }

  outputImports(importsUngrouped, outputOptions);
  outputImports(importsRelative, outputOptions);
  outputImports(importsAnonymous, outputOptions);

  const eol = '\n';

  if (outputOptions.output.length > 0) {
    return outputOptions.output.join(eol) + eol + outputLines.join(eol);
  }

  return outputLines.joins(eol);
}

/**
 * @param {string[]} directives
 * @param {OutputOptions} options
 * @return {void}
 */
function outputDirectives(directives, options) {
  if (directives.length === 0) {
    return;
  }

  for (const directive of directives) {
    options.output.push('"' + directive + '"');
  }

  options.output.push('');
}

/**
 * @param {ImportStatementInfo[]} statements
 * @param {OutputOptions} options
 * @return {void}
 */
function outputImports(statements, options) {
  if (statements.length === 0) {
    return;
  }

  statements.sort((a, b) => {
    if (a.isAnonymous && b.isAnonymous) {
      return a.path.localeCompare(b.path);
    }

    if (a.isDefault && b.isDefault === false) {
      return -1;
    }

    if (a.isDefault === false && b.isDefault) {
      return 1;
    }

    if (a.name.charCodeAt(0) < 97 && b.name.charCodeAt(0) >= 97) {
      return -1;
    }

    return a.name.localeCompare(b.name);
  });

  for (const statement of statements) {
    if (statement.names.length > 0) {
      statement.names.sort((a, b) => {
        return a.localeCompare(b);
      });
    }

    const parts = ['import'];

    if (statement.isDefault) {
      parts.push(statement.name);
    }

    if (statement.isNamed) {
      if (statement.isDefault) {
        parts.push(',');
      }

      parts.push('{');
      parts.push(statement.names.join(','));
      parts.push('}');
    }

    if (statement.isAnonymous === false) {
      parts.push('from');
    }

    parts.push('"' + statement.path + '"');

    options.output.push(parts.join(' '));
  }

  options.output.push('');
}

/**
 * @param {string} path
 * @return {string}
 */
function trimPathSeparators(path) {
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * @param {string} line
 * @param {string[]} lines
 */
function extractImportStatementInfo(line, lines) {
  /** @type {ImportStatementInfo} */
  const info = {
    name: '',
    names: [],
    path: '',
    root: '',
    group: '',
    isAnonymous: false,
    isDefault: false,
    isNamed: false,
    isMultiline: false,
  };

  const chunks = line
    .split(/[\s|;|,]+/)
    .filter(chunk => {
      // The TS `type` syntax will be supported in a future update.
      return chunk !== 'type';
    })
    .filter(chunk => {
      return chunk.length > 0;
    });

  // import 'path'
  if (chunks.length === 2 && chunks[1] !== '{') {
    info.path = extractImportPath(chunks);
    info.isAnonymous = true;
    return info;
  }

  // import X from 'path'
  if (chunks.length === 4) {
    info.name = chunks[1];
    info.path = extractImportPath(chunks);
    info.isDefault = true;
    return info;
  }

  // import X { Y } from 'path'
  if (chunks.length >= 7 && chunks[1] !== '{') {
    info.name = chunks[1];
    info.names = extractImportNames(chunks);
    info.path = extractImportPath(chunks);
    info.isDefault = true;
    info.isNamed = true;
    return info;
  }

  // import { X } from 'path'
  if (chunks.length >= 6 && chunks[1] === '{') {
    info.names = extractImportNames(chunks);
    info.path = extractImportPath(chunks);
    info.isNamed = true;
    return info;
  }

  // import X {
  if (chunks.length === 3) {
    inlineMultilineNamedImports(chunks, lines);
    info.name = chunks[1];
    info.names = extractImportNames(chunks);
    info.path = extractImportPath(chunks);
    info.isDefault = true;
    info.isMultiline = true;
    info.isNamed = true;
    return info;
  }

  // import {
  if (chunks.length === 2) {
    inlineMultilineNamedImports(chunks, lines);
    info.names = extractImportNames(chunks);
    info.path = extractImportPath(chunks);
    info.isMultiline = true;
    info.isNamed = true;
    return info;
  }

  return info;
}

/**
 * @param {string[]} chunks
 * @return {string[]}
 */
function extractImportNames(chunks) {
  const start = chunks.indexOf('{');
  const end = chunks.indexOf('}');

  return chunks.slice(start + 1, end);
}

/**
 * @param {string[]} chunks
 * @return {string}
 */
function extractImportPath(chunks) {
  const path = chunks[chunks.length - 1];

  return path.substring(1, path.length - 1);
}

/**
 * @param {string[]} chunks
 * @param {string[]} links
 * @return {void}
 */
function inlineMultilineNamedImports(chunks, lines) {
  let line = lines.shift();

  while (line.indexOf(' from ') === -1) {
    chunks.push(line.replace(/[\s|,]+/g, ''));
    line = lines.shift();
  }

  chunks.push(...line.split(/[\s|,]+/));
}

function preprocess(source, options) {
  try {
    return process(source, options);
  } catch (error) {
    console.error('Nice Import Sorting Error:', error);
    return source;
  }
}

module.exports = {
  options: {
    niceImportSortingRoots: {
      type: 'path',
      array: true,
      category: 'Global',
      default: [{ value: [] }],
      description: '',
    },
    niceImportSortingGroups: {
      type: 'path',
      array: true,
      category: 'Global',
      default: [{ value: [] }],
      description: '',
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
