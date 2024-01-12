import * as core from '@actions/core';
import * as path from 'path';
import { YamlVersion } from 'yaml-language-server/out/server/src/languageservice/parser/yamlParser07';
import { SchemaMapping, validateDirectory } from '../src';
import { MarkupContent } from 'vscode-languageserver-types';

import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

async function run() {
    marked.use(markedTerminal() as any);

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

    let yamlVersionInput = core.getInput('yamlVersion');

    let yamlVersion: YamlVersion | undefined = yamlVersionInput == '' ? undefined : (yamlVersionInput as YamlVersion);
    if (yamlVersion) {
        console.log('Using YAML specification version:', yamlVersion);
    }

    const results = await validateDirectory({ yamlVersion }, rootPath, schemaMapping);

    if (results && results.length > 0) {
        for (const result of results) {
            for (const error of result.error) {
                const { diag, hover } = error;
                const hoverMessage =
                    hover && MarkupContent.is(hover.contents) ? `\n\n${marked(hover.contents.value)}` : '';

                core.error(diag.message + hoverMessage, {
                    title: `${diag.message}${diag.source ? ' ' + diag.source + '.' : ''}`,
                    file: result.filePath,
                    startLine: diag.range.start.line + 1,
                    endLine: diag.range.end.line + 1,
                    startColumn: diag.range.start.character,
                    endColumn: diag.range.end.character,
                });
            }
        }

        core.setFailed(`${results.length} file(s) failed validation`);
        core.setOutput(
            'invalidFiles',
            results.map((result) => result.filePath),
        );
    }
}

try {
    run();
} catch (error: any) {
    core.setFailed(error.message);
}
