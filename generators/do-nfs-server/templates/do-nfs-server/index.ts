import { digitalocean } from "@dzangolab/pulumi";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const droplet = new digitalocean.Droplet(
    config.name,
    {
      image: config.image,
      projectId: config.projectId,
      region: config.region,
      reservedIpId: config.reservedIpId,
      size: config.size,
      sshKeyNames: config.sshKeyNames,
      userDataTemplate: config.userDataTemplate,
      users: config.users,
      volumeIds: config.volumeIds,
      volumes: config.volumes,
      vpcUuid: config.vpcId,
    },
    options
  );

  return {
    id: interpolate`${droplet.id}`,
    ipv4Address: interpolate`${droplet.ipv4Address}`,
    ipv4AddressPrivate: interpolate`${droplet.ipv4AddressPrivate}`,
    name: interpolate`${droplet.name}`
  };
};
