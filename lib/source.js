'use strict';

/**
 * @param {string} source
 * @returns {string[]}
 */
function getSourceLines(source) {
    const sourceLines = source.trim().split(/\r?\n/g);

    for (let i = 0; i < sourceLines.length; i++) {
        sourceLines[i] = sourceLines[i].trim();
    }

    return sourceLines;
}

/**
 * @param {string[]} sourceLines
 * @return {import('./types.js').ImportStatement[]}
 */
function getImportStatements(sourceLines) {
    /** @type {import('./types.js').Cursor} */
    const cursor = {
        line: 0,
    };

    /** @type {import('./types.js').ImportStatement[]} */
    const importStatements = [];

    while (true) {
        const importStatement = readImportStatement(cursor, sourceLines);

        if (importStatement === null) {
            break;
        }

        importStatements.push(importStatement);
    }

    return importStatements;
}

/**
 * @param {import('./types.js').Cursor} cursor
 * @param {string[]} sourceLines
 * @returns {import('./types.js').ImportStatement | null}
 */
function readImportStatement(cursor, sourceLines) {
    while (cursor.line < sourceLines.length) {
        const line = sourceLines[cursor.line];

        if (!line.startsWith('import ')) {
            cursor.line += 1;
            continue;
        }

        let sourceLineStart = cursor.line;

        const tokens = readImportStatementTokens(cursor, sourceLines);
        const sourceLineEnd = cursor.line - 1;
        const comments = readImportStatementComments(sourceLineStart - 1, sourceLines);
        const group = 0;

        if (comments !== null) {
            sourceLineStart -= comments.length;
        }

        /** @type {import('./types.js').ImportStatement} */
        const importStatement = {
            path: tokens[tokens.length - 1],
            default: null,
            named: null,
            comments,
            sourceLineStart,
            sourceLineEnd,
            group,
        };

        if (tokens.length === 2) {
            return importStatement;
        }

        let tokenIndex = 1;

        if (tokens[tokenIndex] !== '{') {
            importStatement.default = {
                name: '',
                alias: '',
                type: false,
            };

            tokenIndex = readImportStatementType(tokenIndex, tokens, importStatement.default);
        }

        if (tokens[tokenIndex] === '{') {
            tokenIndex++;

            importStatement.named = [];

            while (tokens[tokenIndex] !== '}' && tokenIndex < tokens.length) {
                /** @type {import('./types.js').Import} */
                const named = {
                    name: '',
                    alias: '',
                    type: false,
                };

                tokenIndex = readImportStatementType(tokenIndex, tokens, named);

                importStatement.named[importStatement.named.length] = named;
            }

            tokenIndex++;
        }

        if (tokens[tokenIndex] !== 'from') {
            throw new Error('');
        }

        return importStatement;
    }

    return null;
}

/**
 * @param {number} index
 * @param {string[]} tokens
 * @param {import('./types.js').Import} output
 * @returns {number}
 */
function readImportStatementType(index, tokens, output) {
    if (tokens[index] === 'type') {
        output.type = true;
        index++;
    }

    output.name = tokens[index];
    index++;

    if (tokens[index] === 'as') {
        index++;
        output.alias = tokens[index];
        index++;
    }

    return index;
}

/**
 * @param {import('./types.js').Cursor} cursor
 * @param {string[]} sourceLines
 * @returns {string[]}
 */
function readImportStatementTokens(cursor, sourceLines) {
    /** @type {string[]} */
    const tokens = [];

    while (true) {
        const line = sourceLines[cursor.line];

        if (line === undefined) {
            throw new Error('Unable to read import tokens from line ' + cursor.line);
        }

        cursor.line++;

        const lineTokens = line.split(/[\s,;]+/g);

        for (let i = 0; i < lineTokens.length; i++) {
            const token = lineTokens[i].trim();

            if (token.length > 0) {
                tokens[tokens.length] = token;
            }
        }

        if (tokens.includes('from')) {
            break;
        }

        const lastToken = tokens[tokens.length - 1];

        if (lastToken.startsWith('"') && lastToken.endsWith('"')) {
            break;
        }

        if (lastToken.startsWith("'") && lastToken.endsWith("'")) {
            break;
        }
    }

    return tokens;
}

/**
 * @param {number} lineIndex
 * @param {string[]} sourceLines
 */
function readImportStatementComments(lineIndex, sourceLines) {
    /** @type {string[]|null} */
    let comments = null;

    while (true) {
        const line = sourceLines[lineIndex];

        if (line === undefined || !line.startsWith('//')) {
            break;
        }

        if (comments === null) {
            comments = [];
        }

        comments.unshift(sourceLines[lineIndex]);
        lineIndex--;
    }

    return comments;
}

module.exports = {
    /**
     * @param {string} source
     * @throws {Error}
     * @returns {import('./types.js').ProcessingResult}
     */
    processSource(source) {
        const sourceLines = getSourceLines(source);
        const importStatements = getImportStatements(sourceLines);

        return {
            sourceLines,
            importStatements,
        };
    },
};
