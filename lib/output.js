'use strict';

/**
 * @param {string[]} sourceLines
 * @param {import('./types.js').ImportStatement[]} importStatements
 * @returns {string[]}
 */
function removeImportStatementsFromSource(sourceLines, importStatements) {
    const outputLines = sourceLines.slice();

    for (let i = 0; i < importStatements.length; i++) {
        const start = importStatements[i].sourceLineStart;
        const end = importStatements[i].sourceLineEnd;

        for (let n = start; n <= end; n++) {
            outputLines[n] = '';
        }
    }

    return outputLines;
}

/**
 * @param {string[]} sourceLines
 * @returns {string[]}
 */
function collapseSourceLines(sourceLines) {
    /** @type {string[]} */
    const outputLines = [];

    for (let i = 0; i < sourceLines.length; i++) {
        if (sourceLines[i] === '' && sourceLines[i + 1] === '') {
            continue;
        }

        outputLines.push(sourceLines[i]);
    }

    return outputLines;
}

/**
 * @param {string[]} sourceLines
 * @param {import('./types.js').ImportStatement[]} importStatements
 * @returns {string[]}
 */
function insertImportStatementsAsGroups(sourceLines, importStatements) {
    /** @type {string[]} */
    const output = [];

    let sourceIndex = 0;

    while (sourceIndex < sourceLines.length) {
        const line = sourceLines[sourceIndex++];

        if (line !== '') {
            output.push(line);
            continue;
        }

        break;
    }

    let currentGroup = 0;

    for (let i = 0; i < importStatements.length; i++) {
        const statement = importStatements[i];

        if (currentGroup !== statement.group) {
            output.push('');
            currentGroup = statement.group;
        }

        if (statement.comments !== null) {
            output.push(...statement.comments);
        }

        output.push(composeImportStatement(statement));
    }

    output.push('');

    while (sourceIndex < sourceLines.length) {
        output.push(sourceLines[sourceIndex++]);
    }

    return output;
}

/**
 * @param {import('./types.js').ImportStatement} importStatement
 * @returns {string}
 */
function composeImportStatement(importStatement) {
    /** @type {string[]} */
    const output = ['import'];

    if (importStatement.default !== null) {
        output.push(composeImportStatementType(importStatement.default));
    }

    if (importStatement.named !== null) {
        output.push('{');

        for (let i = 0; i < importStatement.named.length; i++) {
            output.push(composeImportStatementType(importStatement.named[i]));

            if (i < importStatement.named.length - 1) {
                output.push(',');
            }
        }

        output.push('}');
    }

    if (importStatement.default !== null || importStatement.named !== null) {
        output.push('from');
    }

    output.push(importStatement.path);

    return output.join(' ');
}

/**
 * @param {import('./types.js').Import} importStatementType
 * @returns {string}
 */
function composeImportStatementType(importStatementType) {
    /** @type {string[]} */
    const output = [];

    if (importStatementType.type) {
        output.push('type');
    }

    output.push(importStatementType.name);

    if (importStatementType.alias) {
        output.push('as');
        output.push(importStatementType.alias);
    }

    return output.join(' ');
}

module.exports = {
    /**
     * @param {string[]} sourceLines
     * @param {import('./types.js').ImportStatement[]} importStatements
     */
    composeOutput(sourceLines, importStatements) {
        sourceLines = removeImportStatementsFromSource(sourceLines, importStatements);
        sourceLines = collapseSourceLines(sourceLines);
        sourceLines = insertImportStatementsAsGroups(sourceLines, importStatements);

        return sourceLines.join('\n');
    },
};
