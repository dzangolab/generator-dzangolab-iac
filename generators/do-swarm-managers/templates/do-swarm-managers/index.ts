import { digitalocean } from "@dzangolab/pulumi";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  // Desired manager count
  const count = config.count;

  const managers = [];

  for (let i = 1; i <= count; i++) {
    const name = `${config.name}-manager-${i}`; // Ensure unique worker names
    
    const droplet = new digitalocean.Droplet(
      name,
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

    managers.push({
      id: interpolate`${droplet.id}`,
      ipv4Address: interpolate`${droplet.ipv4Address}`,
      ipv4AddressPrivate: interpolate`${droplet.ipv4AddressPrivate}`,
      name: interpolate`${droplet.name}`
    });
  }
  return {
    managers
  };
};
