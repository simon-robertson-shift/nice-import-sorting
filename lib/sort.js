'use strict';

/**
 * @param {string} a
 * @param {string} b
 * @return {number}
 */
function compare(a, b) {
    const code1 = a.charCodeAt(0);
    const code2 = b.charCodeAt(0);
    const upper1 = code1 > 64 && code1 < 91;
    const upper2 = code2 > 64 && code2 < 91;

    if (upper1 && !upper2) {
        return -1;
    }

    if (!upper1 && upper2) {
        return 1;
    }

    return a.localeCompare(b);
}

/**
 * @param {import('./types.js').ImportStatement[]} importStatements
 * @returns {import('./types.js').ImportStatement[]}
 */
function groupByImportPath(importStatements) {
    return importStatements.sort((a, b) => {
        const path1 = a.path;
        const path2 = b.path;

        if (path1[1] === '@' && path2[1] !== '@') {
            return -1;
        }

        if (path1[1] !== '@' && path2[1] === '@') {
            return 1;
        }

        return compare(path1, path2);
    });
}

/**
 * @param {import('./types.js').ImportStatement[]} importStatements
 * @returns {import('./types.js').ImportStatement[]}
 */
function groupByImportType(importStatements) {
    let currentNamespace = '';
    let currentGroup = 0;

    for (let i = 0; i < importStatements.length; i++) {
        const statement = importStatements[i];

        if (statement.default === null && statement.named === null) {
            statement.group = 2000;
            continue;
        }

        if (statement.path[1] === '.') {
            statement.group = 1000;
            continue;
        }

        if (currentNamespace === statement.namespace) {
            statement.group = currentGroup;
            continue;
        }

        currentNamespace = statement.namespace;
        currentGroup++;

        statement.group = currentGroup;
    }

    return importStatements.sort((a, b) => {
        return a.group - b.group;
    });
}

/**
 * @param {import('./types.js').ImportStatement[]} importStatements
 * @returns {import('./types.js').ImportStatement[]}
 */
function sortByImportName(importStatements) {
    /** @type {import('./types.js').ImportStatement[][]} */
    const groups = [];

    let currentGroup = -1;
    let groupIndex = -1;

    for (let i = 0; i < importStatements.length; i++) {
        if (currentGroup !== importStatements[i].group) {
            currentGroup = importStatements[i].group;
            groupIndex++;
            groups[groupIndex] = [];
        }

        groups[groupIndex].push(importStatements[i]);
    }

    /** @type {import('./types.js').ImportStatement[]} */
    const output = [];

    for (let i = 0; i < groups.length; i++) {
        groups[i].sort((a, b) => {
            let name1 = '';
            let name2 = '';

            if (a.default !== null && b.default === null) {
                return -1;
            }

            if (a.default === null && b.default !== null) {
                return 1;
            }

            if (a.default !== null) {
                name1 = a.default.name;
            } else if (a.named !== null && a.named.length > 0) {
                name1 = a.named[0].name;
            }

            if (b.default !== null) {
                name2 = b.default.name;
            } else if (b.named !== null && b.named.length > 0) {
                name2 = b.named[0].name;
            }

            return compare(name1, name2);
        });

        output.push(...groups[i]);
    }

    return output;
}

module.exports = {
    /**
     * @param {import('./types.js').ImportStatement[]} importStatements
     * @returns {import('./types.js').ImportStatement[]}
     */
    sortImportStatements(importStatements) {
        importStatements = groupByImportPath(importStatements);
        importStatements = groupByImportType(importStatements);

        for (let i = 0; i < importStatements.length; i++) {
            if (importStatements[i].named === null) {
                continue;
            }

            importStatements[i].named.sort((a, b) => {
                return compare(a.name, b.name);
            });
        }

        return sortByImportName(importStatements);
    },
};
