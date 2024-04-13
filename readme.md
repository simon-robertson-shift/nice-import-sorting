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

You can add the following customization options to your Prettier config file.

```json
{
  "niceImportSortingRoots": [],
  "niceImportSortingGroups": []
}
```

The `niceImportSortingRoots` array contains the top-level module paths (roots) that are defined within your app. For example, if you import a component from `app/components/header` the module root is `app`. This allows the plugin separate your module paths from third-party module paths.

```json
{
  "niceImportSortingRoots": ["app"]
}
```

The `niceImportSortingGroups` array contains full or partial module paths that can be used to group imports together. Groups will be separated with an empty line.

```json
{
  "niceImportSortingGroups": ["app/components", "app/network", "app/types"]
}
```
