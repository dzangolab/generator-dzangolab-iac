import { readFileSync } from "fs";

function getPublicKeys(
    keyNames: string[],
    path: string
): string[] {
    var publicKeys: string[];
    publicKeys = [];

    for (var i = 0; i < keyNames.length; i++) {
        const name = keyNames[i];

        const key = readFileSync(
            `${path}/${name}.pub`,
            {
                encoding: "utf-8",
            }
        );

        publicKeys.push(key);
    }

    return publicKeys;
}

export default getPublicKeys;
