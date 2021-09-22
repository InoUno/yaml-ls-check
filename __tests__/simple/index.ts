import * as path from 'path';
import { getValidationResults } from '../../src/lib';

function getRelativeFile(filename: string) {
    return path.resolve(__dirname, filename);
}

function validateFile(filename: string) {
    return getValidationResults([getRelativeFile(filename)], { schema: getRelativeFile('schema.json') });
}

describe('simple schema validation', () => {
    it('valid file passes validation', async () => {
        const invalidFiles = await validateFile('valid.yml');
        expect(invalidFiles.length).toBe(0);
    });

    it('invalid value for property fails', async () => {
        const invalidFiles = await validateFile('invalid-1.yml');
        expect(invalidFiles.length).toBeGreaterThan(0);
    });

    it('missing required field fails', async () => {
        const invalidFiles = await validateFile('invalid-2.yml');
        expect(invalidFiles.length).toBeGreaterThan(0);
    });
});
