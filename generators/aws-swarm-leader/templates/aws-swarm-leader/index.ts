import {
  EipAssociation,
  Instance,
  VolumeAttachment
} from "@pulumi/aws/ec2";
import { local } from "@pulumi/command";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const instance = new Instance(
    config.name,
    {
      ami: config.ami,
      associatePublicIpAddress: config.associatePublicIpAddress,
      availabilityZone: config.availabilityZone,
      disableApiTermination: config.disableApiTermination,
      iamInstanceProfile: config.iamInstanceProfile,
      instanceType: config.instanceType,
      keyName: config.keypair,
      monitoring: config.monitoring,
      rootBlockDevice: {
        ...config.rootBlockDevice,
        tags: {
          Name: `${config.name}-root-device`,
        },
      },
      subnetId: config.subnetId,
      tags: {
        Name: `${config.name}-leader`,
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

  new EipAssociation(
    config.name,
    {
      instanceId: instance.id,
      allocationId: config.eipId,
    },
    {
      dependsOn: instance,
      ...options
    }
  );

  if (!config.useNfs && config.volumeId) {
    new VolumeAttachment(
      config.name,
      {
        instanceId: instance.id,
        volumeId: config.volumeId,
        deviceName: "/dev/xvdf",
      },
    {
      dependsOn: instance,
      ...options
    }
    );
  }

  new local.Command(
    "addOrRemoveDropletToOrFromKnownHosts",
    {
      create: interpolate`sleep 30 && ssh-keyscan ${config.eip} 2>&1 | grep -vE '^#' >> ~/.ssh/known_hosts`,
      delete: interpolate`sed -i -e '/^${config.eip} .*/d' ~/.ssh/known_hosts`,
      update: interpolate`sleep 30 && ssh-keyscan ${config.eip} 2>&1 | grep -vE '^#' >> ~/.ssh/known_hosts`,
    },
    {
      dependsOn: instance,
    },
  );

  return {
    arn: interpolate`${instance.arn}`,
    availabilityZone: interpolate`${instance.availabilityZone}`,
    id: interpolate`${instance.id}`,
    name: config.name,
    privateIp: interpolate`${instance.privateIp}`,
    publicIp: config.eip,
  };
}
