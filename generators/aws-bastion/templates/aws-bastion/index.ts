import { Instance } from "@pulumi/aws/ec2";
import { local } from "@pulumi/command";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const bastion: Instance = new Instance(
    config.name,
    {
      ami: config.ami,
      associatePublicIpAddress: config.associatePublicIpAddress,
      availabilityZone: config.availabilityZone,
      disableApiTermination: config.disableApiTermination,
      instanceType: config.instanceType,
      keyName: config.keypair,
      monitoring: config.monitoring,
      rootBlockDevice: {
        ...config.rootBlockDevice,
        tags: {
          Name: `${config.name}-root`,
        },
      },
      subnetId: config.subnetId,
      tags: {
        Name: config.name,
        ...config.tags,
      },
      userData: config.userData,
      userDataReplaceOnChange: true,
      vpcSecurityGroupIds: config.securityGroupIds,
    },
    {
      deleteBeforeReplace: true,
      ...options
    }
  );

  new local.Command(
    "addOrRemoveDropletToOrFromKnownHosts",
    {
      create: interpolate`sleep 30 && ssh-keyscan ${bastion.publicIp} 2>&1 | grep -vE '^#' >> ~/.ssh/known_hosts`,
      delete: interpolate`sed -i -e '/^${bastion.publicIp} .*/d' ~/.ssh/known_hosts`,
      update: interpolate`sleep 30 && ssh-keyscan ${bastion.publicIp} 2>&1 | grep -vE '^#' >> ~/.ssh/known_hosts`,
    },
    {
      dependsOn: bastion,
    },
  );

  return {
    arn: interpolate`${bastion.arn}`,
    availabilityZone: interpolate`${bastion.availabilityZone}`,
    id: interpolate`${bastion.id}`,
    name: config.name,
    privateIp: interpolate`${bastion.privateIp}`,
    publicDns: interpolate`${bastion.publicDns}`,
    publicIp: interpolate`${bastion.publicIp}`,
  };
};
