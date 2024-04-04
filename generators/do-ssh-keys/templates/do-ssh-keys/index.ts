import { SshKey } from "@pulumi/digitalocean";

import { getConfig } from "./config";

export = async () => {
    const config = await getConfig();

    const keys = config.publicKeys;

    var sshKeys: SshKey[] = [];

    for (const name in keys) {
        sshKeys.push(new SshKey(name, {
            name: name,
            publicKey: keys[name],
        }, {
            protect: config.protect,
            retainOnDelete: config.retainOnDelete
        }));
    }

    return sshKeys.map(key => key.id);
}
