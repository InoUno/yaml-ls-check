import * as core from '@actions/core';
import * as path from 'path';
import { SchemaMapping, validateDirectory } from '../src';

async function run() {
    let rootPath = process.env['GITHUB_WORKSPACE'] as string;
    let relativeToRoot = core.getInput('root', { trimWhitespace: true });
    if (relativeToRoot) {
        rootPath = path.resolve(rootPath, relativeToRoot);
    }

    let schemaMapping: SchemaMapping | undefined;
    let inputSchemaMapping = core.getInput('schemaMapping');
    if (inputSchemaMapping) {
        schemaMapping = JSON.parse(inputSchemaMapping);
        console.log('Using schema mapping:', schemaMapping);
    }

    const results = await validateDirectory(rootPath, schemaMapping);

    core.setOutput(
        'invalidFiles',
        results?.map((result) => result.filePath),
    );
}

try {
    run();
} catch (error: any) {
    core.setFailed(error.message);
}
