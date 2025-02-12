import { digitalocean } from "@dzangolab/pulumi";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  for (let i = 1; i <= count; i++) {
    const name = `${config.name}-manager-${i}`; // Ensure unique worker names

    if (config.dataVolumeSize) {
      const volume = new Volume(
        config.name,
        {
          description: `Block-storage volume for ${config.name}`,
          initialFilesystemType: "ext4",
          name:config.name,
          region: config.region,
          size: config.dataVolumeSize,
        },
        options
      );
  
      outputs["volumeId"] = interpolate`${volume.id}`;
      outputs["volumeName"] = interpolate`${volume.name}`;
    }
    const droplet = new digitalocean.Droplet(
      config.name,
      {
        image: config.image,
        packages: config.packages,
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

    managers.push({
      id: interpolate`${droplet.id}`,
      ipv4Address: interpolate`${droplet.ipv4Address}`,
      ipv4AddressPrivate: interpolate`${droplet.ipv4AddressPrivate}`,
      name: interpolate`${droplet.name}`
    });
  }
  return {
    id: interpolate`${droplet.id}`,
    ipv4Address: interpolate`${droplet.ipv4Address}`,
    ipv4AddressPrivate: interpolate`${droplet.ipv4AddressPrivate}`,
    name: interpolate`${droplet.name}`
  };
};
