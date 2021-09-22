import * as path from 'path';
import { SchemaMapping, getValidationResults } from '../../src/lib';

const rootPath = path.resolve(__dirname);
const files = ['valid-name.yml', 'valid-count.yml', 'invalid-count.yml'];

function validateWithSchemaMapping(schemaMapping: SchemaMapping) {
    return getValidationResults(files, {
        rootDir: rootPath,
        schemaMapping,
    });
}

describe('schema mapping to files', () => {
    it('valid files pass validation', async () => {
        const invalidFiles = await validateWithSchemaMapping({
            'schema_with_name.json': ['valid-name.yml'],
            'schema_with_count.json': ['valid-count.yml'],
        });
        expect(invalidFiles.length).toBe(0);
    });

    it('no mapped schema passes validation', async () => {
        const invalidFiles = await validateWithSchemaMapping({});
        expect(invalidFiles.length).toBe(0);
    });

    it('mismatched file fails', async () => {
        const invalidFiles = await validateWithSchemaMapping({
            'schema_with_name.json': ['valid-name.yml'],
            'schema_with_count.json': ['invalid-count.yml'],
        });
        expect(invalidFiles.length).toBeGreaterThan(0);
    });
});
