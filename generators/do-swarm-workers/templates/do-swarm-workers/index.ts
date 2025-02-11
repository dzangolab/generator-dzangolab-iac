import { digitalocean } from "@dzangolab/pulumi";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  // Desired worker count
  const count = Number(config.count) || 1;

  const workers = [];

  for (let i = 1; i <= count; i++) {
    const name = `${config.name}-worker-${i}`; // Ensure unique worker names

    const droplet = new digitalocean.Droplet(
      name, // Unique name per droplet
      {
        image: config.image,
        packages: config.packages,
        projectId: config.projectId,
        region: config.region,
        size: config.size,
        sshKeyNames: config.sshKeyNames,
        userDataTemplate: config.userDataTemplate,
        users: config.users,
        vpcUuid: config.vpcId,
      },
      options
    );

    workers.push({
      id: interpolate`${droplet.id}`,
      ipv4Address: interpolate`${droplet.ipv4Address}`,
      ipv4AddressPrivate: interpolate`${droplet.ipv4AddressPrivate}`,
      name: interpolate`${droplet.name}`
    });
  }

  return {
    workers,
  };
};

