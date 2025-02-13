import {
  ReservedIp,
  Volume,
} from "@pulumi/digitalocean";
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
   const count = Number(config.count) || 1;

   const managers = [];

  for (let i = 1; i <= count; i++) {
    const name = `${config.name}-manager-${i}`; // Ensure unique worker names

    const reservedIp = new ReservedIp(
      config.name,
      {
        region: config.region,
      },
      options
    );
  
    const volume = new Volume(
      config.name,
      {
        description: `Block-storage volume for ${config.name}-manager-${i}`,
        initialFilesystemType: "ext4",
        name:config.name,
        region: config.region,
        size: config.dataVolumeSize,
      },
      options
    );
    
    const reservedIpId = reservedIp.id.toString();
    const volumeId = volume.id.toString();


    const droplet = new digitalocean.Droplet(
      name,
      {
        image: config.image,
        packages: config.packages,
        projectId: config.projectId,
        region: config.region,
        reservedIpId: reservedIpId,
        size: config.size,
        sshKeyNames: config.sshKeyNames,
        userDataTemplate: config.userDataTemplate,
        users: config.users,
        volumeIds: [volumeId],
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
