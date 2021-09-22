import * as fs from 'fs';
import * as path from 'path';

import { URI } from 'vscode-uri';

export function trimStartChars(str: string, ch: string) {
    let start = 0;
    while (start < str.length && str[start] === ch) ++start;
    return start > 0 ? str.substring(start) : str;
}

export const relativeToAbsolutePath = (rootPath: string, uri: string): string => {
    // If a root folder was not specified, resolve the relative URI
    // Against the location of the workspace file instead
    if (rootPath) {
        return URI.file(path.join(rootPath, URI.parse(uri).fsPath)).toString();
    }

    // Fallback in case nothing could be applied
    return path.normalize(uri);
};

export function readJson(path: string) {
    return JSON.parse(fs.readFileSync(path).toString());
}
