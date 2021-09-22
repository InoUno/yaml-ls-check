import * as path from 'path';
import { getValidationResults } from '../../src/lib';

function getRelativeFile(filename: string) {
    return path.resolve(__dirname, filename);
}

function validateFile(filename: string, schemaUri: string) {
    return getValidationResults([getRelativeFile(filename)], { schema: schemaUri });
}

describe('validate YAML with remote schema', () => {
    it('valid bower file', async () => {
        const invalidFiles = await validateFile('bower-valid.yml', 'https://json.schemastore.org/bower.json');
        expect(invalidFiles.length).toBe(0);
    });

    it('invalid bower file', async () => {
        const invalidFiles = await validateFile('bower-invalid.yml', 'https://json.schemastore.org/bower.json');
        expect(invalidFiles.length).toBeGreaterThan(0);
    });
});
