import * as path from 'path';
import { getValidationResults } from '../../src/lib';

const rootPath = path.resolve(__dirname);

describe('schema mapping from vscode settings JSON', () => {
    it('valid files pass, and invalid one fails', async () => {
        const invalidFiles = await getValidationResults(
            ['valid-name.yml', 'valid-count.yml', 'invalid-count.yml', 'no-schema.yml'],
            { rootDir: rootPath },
        );
        expect(invalidFiles.length).toBe(1);
        expect(invalidFiles[0].filePath).toMatch(/invalid-count.yml$/);
    });
});
