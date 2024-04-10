import { KeyPair } from "@pulumi/aws/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
    const config = await getConfig();

    const publicKeys = config.publicKeys;

    const keys: { [key: string]: any } = {};

    var outputs = {} as { [key:string]: any };

    for (const name in publicKeys) {
        const keyPair = new KeyPair(
            name,
            {
              publicKey: publicKeys[name],
              tags: {
                Name: name,
              }
            },
            {
              protect: config.protect,
              retainOnDelete: config.retainOnDelete,
            }
          );

        keys[name] = {
            arn: interpolate`${keyPair.arn}`,
            fingerprint: interpolate`${keyPair.fingerprint}`,
            id: interpolate`${keyPair.id}`,
            keyPairId: interpolate`${keyPair.keyPairId}`,
            name: interpolate`${keyPair.keyName}`,
        };
    }

  return keys;
}
