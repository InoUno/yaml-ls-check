import * as fs from 'fs';
import * as path from 'path';

import { YAMLSchemaService } from 'yaml-language-server/out/server/src/languageservice/services/yamlSchemaService';
import { YAMLValidation } from 'yaml-language-server/out/server/src/languageservice/services/yamlValidation';
import { YAMLHover } from 'yaml-language-server/out/server/src/languageservice/services/yamlHover';
import { WorkspaceContextService } from 'yaml-language-server/out/server/src/languageservice/yamlLanguageService';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { Diagnostic, Hover } from 'vscode-languageserver-types';

import { readJson } from './util';
import { createSchemaRequestHandler } from './schema-handler';
import { glob } from 'glob';
import { TelemetryEvent } from 'yaml-language-server/out/server/src/languageservice/telemetry';
import { YamlVersion } from 'yaml-language-server/out/server/src/languageservice/parser/yamlParser07';

export class ConsoleTelemetry {
    constructor() {}

    send(event: TelemetryEvent): void {
        console.error('send:', event);
    }
    sendError(name: string, properties: unknown): void {
        console.error('sendError:', name, properties);
    }
    sendTrack(name: string, properties: unknown): void {
        console.error('sendTrack:', name, properties);
    }
}

export interface SchemaMapping {
    [uri: string]: string[] | string;
}

export interface BaseSettings {
    yamlVersion?: YamlVersion;
}

export interface SettingsWithRoot extends BaseSettings {
    rootDir: string;
    schemaMapping?: SchemaMapping;
}

export interface SettingsWithSchema extends BaseSettings {
    schema: string;
}

export type Settings = SettingsWithRoot | SettingsWithSchema;

function hasRootDir(settings?: Settings): settings is SettingsWithRoot {
    return (settings as SettingsWithRoot)?.rootDir !== undefined;
}

function hasSchema(settings?: Settings): settings is SettingsWithSchema {
    return (settings as SettingsWithSchema)?.schema !== undefined;
}

interface FileValidationResult {
    filePath: string;
    error: {
        diag: Diagnostic;
        hover: Hover | null;
    }[]
}

/**
 * Validates YAML files given with the specified settings.
 * @param files Paths to files to validate.
 * @param settings Settings defining how the files should be validated, and against which schemas.
 * @returns A list errors found in the files.
 */
export async function getValidationResults(files: string[], settings?: Settings): Promise<FileValidationResult[]> {
    let workspaceContext: WorkspaceContextService | undefined;
    let schemaMapping: SchemaMapping = {};
    let rootPath: string | undefined;

    if (hasRootDir(settings)) {
        rootPath = settings.rootDir;
        workspaceContext = {
            resolveRelativePath: (relativePath: string, resource: string) => {
                return path.join(settings.rootDir, path.dirname(resource), relativePath);
            },
        };

        if (settings.schemaMapping) {
            schemaMapping = settings.schemaMapping;
        } else {
            const settingsPath = path.join(settings.rootDir, '.vscode', 'settings.json');
            if (fs.existsSync(settingsPath)) {
                schemaMapping = readJson(settingsPath)['yaml.schemas'];
            }
        }
    } else if (hasSchema(settings)) {
        schemaMapping = {
            [settings.schema]: '*',
        };

        workspaceContext = {
            resolveRelativePath: (relativePath: string, resource: string) => {
                return path.join(path.dirname(resource), relativePath);
            },
        };
    }

    const schemaService = new YAMLSchemaService(createSchemaRequestHandler(rootPath), workspaceContext);

    for (const uri in schemaMapping) {
        schemaService.addSchemaPriority(uri, 0);

        let patterns = schemaMapping[uri];
        if (!(patterns instanceof Array)) {
            patterns = [patterns];
        }
        schemaService.registerExternalSchema(uri, patterns);
    }

    const telemetry = new ConsoleTelemetry();
    const yamlValidation = new YAMLValidation(schemaService, telemetry);
    yamlValidation.configure({
        validate: true,
        yamlVersion: settings?.yamlVersion ?? '1.2',
        disableAdditionalProperties: false,
        customTags: [],
    });
    const yamlHover = new YAMLHover(schemaService, telemetry)

    return await Promise.all(
        files.map(async (relativePath: string) => {
            const filePath = rootPath ? path.join(rootPath, relativePath) : relativePath;
            const doc = TextDocument.create(relativePath, 'yaml', 0, fs.readFileSync(filePath).toString());

            const diagnostics = await yamlValidation.doValidation(doc);
            const hovers = await Promise.all(diagnostics.map((diag) => yamlHover.doHover(doc, diag.range.start)));
            return {
                filePath,
                error: diagnostics.map((diagnostics, index) => ({
                    diag: diagnostics,
                    hover: hovers[index]
                }))
            };
        }),
    ).then((rs) => rs.filter((r) => r.error.length > 0));
}

/**
 * Validates the files with the given settings.
 * @param files Paths to files to validate.
 * @param settings Settings defining how the files should be validated, and against which schemas.
 * @returns A list errors found in the files.
 */
async function validateAndOutput(files: string[], settings: Settings) {
    console.log(`Validating ${files.length} YAML files.`);
    const results = await getValidationResults(files, settings);

    if (results.length == 0) {
        console.log(`Validation complete.`);
        return;
    }

    console.error('Found invalid files:');
    for (const result of results) {
        for (const error of result.error) {
            const { diag, hover } = error;
            const sourceMessage = diag.source ? ` ${diag.source}` : '';
            console.error(
                `${result.filePath}:${diag.range.start.line + 1}:${diag.range.start.character + 1}: ${diag.message}${sourceMessage}`,
            );
        }
    }

    return results;
}

/**
 * Validates all YAML files found in the given directory.
 * It will automatically use the schema mapping in .vscode/settings.json, if present.
 * @param rootDir Path to root directory containing the YAML files to be validated.
 * @returns A list errors found in the files.
 */
export async function validateDirectory(settings: BaseSettings, rootDir: string, schemaMapping?: SchemaMapping) {
    console.log(`Looking for YAML files to validate at: ${rootDir}`);
    const filePaths = await new Promise<string[]>((callback, error) => {
        glob('**/*.{yml,yaml}', { cwd: rootDir, silent: true, nodir: true }, (err, files) => {
            if (err) {
                error(err);
            }
            callback(files);
        });
    });

    return validateAndOutput(filePaths, { ...settings, rootDir, schemaMapping });
}

/**
 * Validates any files matching the given pattern(s) against the given schema.
 * @param schema Path to schema file.
 * @param patterns List of glob patterns to files to validate with the given schema.
 * @returns A list errors found in the files.
 */
export async function validateWithSchema(settings: BaseSettings, schema: string, ...patterns: string[]) {
    const files = await Promise.all(
        patterns.map(
            (pattern) =>
                new Promise<string[]>((callback, error) => {
                    glob(pattern, { silent: true, nodir: true }, (err, files) => {
                        if (err) {
                            error(err);
                        }
                        callback(files);
                    });
                }),
        ),
    ).then((filesArrays) => filesArrays.flat());

    return validateAndOutput(files, { ...settings, schema });
}
