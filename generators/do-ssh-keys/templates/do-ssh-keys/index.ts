import { SshKey } from "@pulumi/digitalocean";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
    const config = await getConfig();

    const keys = config.publicKeys;

    var sshKeys: SshKey[] = [];

    var outputs = {} as { [key:string]: any };

    for (const name in keys) {
        const sshKey = new SshKey(name, {
            name: name,
            publicKey: keys[name],
        }, {
            protect: config.protect,
            retainOnDelete: config.retainOnDelete
        });

        sshKeys.push(sshKey);

        outputs[name] = interpolate`${sshKey.id}`;
    }

    return outputs;
}
