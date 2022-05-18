#!/usr/bin/env node

import { validateDirectory, validateWithSchema } from './lib';
import { program } from 'commander';

function run() {
    program
        .command('dir', { isDefault: true })
        .argument('<root-directory>')
        .option('--yamlVersion', 'YAML version to use for validation')
        .description('Validate YAML files of a directory.')
        .action((rootPath, options) => {
            if (rootPath) {
                validateDirectory({ yamlVersion: options.yamlVersion }, rootPath);
            }
        });

    program
        .command('schema')
        .argument('<schema>', 'schema to use for validation')
        .argument('<patterns...>', 'glob patterns for YAML files to be validated')
        .option('--yamlVersion', 'YAML version to use for validation')
        .description('Validate YAML files against the given schema path or URI.')
        .action((schema, files, options) => {
            validateWithSchema({ yamlVersion: options.yamlVersion }, schema, files);
        });

    if (!process.argv.slice(2).length) {
        program.outputHelp();
        return;
    }

    program.parse(process.argv);
}

run();
