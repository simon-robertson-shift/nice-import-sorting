## nice-import-sorting

A Prettier plugin that sorts import statements within JS, JSX, TS, and TSX files using the import names instead of the import paths.

### Installation

NPM

```
npm install @nomemo/nice-import-sorting@latest
```

Yarn

```
yarn add @nomemo/nice-import-sorting@latest
```

### Setup

You will need to add the plugin to your Prettier config file.

```json
{
  "plugins": "@nomemo/nice-import-sorting"
}
```

#### Options

```json
{
  "niceImportSortingRoots": [],
  "niceImportSortingGroups": []
}
```
