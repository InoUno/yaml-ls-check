#!/usr/bin/env node

import { validateDirectory, validateWithSchema } from './lib';
import { program } from 'commander';

function run() {
    program
        .command('dir', { isDefault: true })
        .argument('<root-directory>')
        .description('Validate YAML files of a directory.')
        .action((rootPath) => {
            if (rootPath) {
                validateDirectory(rootPath);
            }
        });

    program
        .command('schema')
        .argument('<schema>', 'schema to use for validation')
        .argument('<patterns...>', 'glob patterns for YAML files to be validated')
        .description('Validate YAML files against the given schema path or URI.')
        .action((schema, files) => {
            validateWithSchema(schema, files);
        });

    if (!process.argv.slice(2).length) {
        program.outputHelp();
        return;
    }

    program.parse(process.argv);
}

run();
