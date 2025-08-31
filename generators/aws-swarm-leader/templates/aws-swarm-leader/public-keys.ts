import { readFileSync } from "fs";

function getPublicKeys(
  keyNames: string[],
  pathToSshKeysFolder = "../../../ssh-keys"
): string[] {
  var publicKeys: string[];
  publicKeys = [];

  for (var i = 0; i < keyNames.length; i++) {
    const name = keyNames[i];

    const key = readFileSync(
      `${pathToSshKeysFolder}/${name}.pub`,
      {
        encoding: "utf-8",
      }
    );

    publicKeys.push(key);
  }

  return publicKeys;
}

export default getPublicKeys;
