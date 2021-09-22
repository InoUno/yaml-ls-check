# YAML schema validator

Provides an easy way to validate YAML files against given schemas utilizing the [yaml-language-server](https://github.com/redhat-developer/yaml-language-server) project.

This package contains a CLI, a GitHub action, and the library itself.

## CLI

Install the CLI via npm:

```bash
npm install --global yaml-ls-check
```

The CLI should now be accessible as `yaml-ls-check` or the short-hand `ylsc`, and can be used to validate YAML files:

```bash
# Validate all YAML files in the given directory, using the .vscode/settings.json file in it, if present.
ylsc <directory>
ylsc dir <directory>

# Validate given YAML files against the given schema.
# Schema can either be a local or remote one. File paths can be given as glob patterns.
ylsc schema <schema> <files...>
```

## GitHub Action

If you have a `.vscode/settings.json` in the root of your repository directory, you can just use the action directly:

```yaml
steps:
- uses: actions/checkout@v2
- uses: InoUno/yaml-ls-check@v1.0.0
```

Additional settings for it are:

* `root`: If the repository root should not act as root for the validation.
* `schemaMapping`: Specify mapping of schema to file patterns that should match the schema. This overwrites the mapping found in any potential `.vscode/settings.json` file.


```yaml
steps:
- uses: actions/checkout@v2
- uses: InoUno/yaml-ls-check@v1.0.0
  with:
    root: data
    schemaMapping: |
    {
        "schemas/my-schema.json": [ "files/*.yml" ]
    }
```


## Library

```bash
npm install yaml-ls-check
```


```ts
import { validateDirectory } from 'yaml-ls-check';

async function someFunction() {
    const invalidFiles = await validateDirectory('path/to/a/folder');
    // invalidFiles is now an array containing paths to files that failed validation
    // and the found errors in the form: { filePath: string, errors: Diagnostics[] }
}
```
