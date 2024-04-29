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
      iamInstanceProfile: config.instanceProfile,
      instanceType: config.instanceType,
      keyName: config.keyName,
      monitoring: config.monitoring,
      rootBlockDevice: {
        ...config.rootBlockDevice,
        tags: {
          Name: `${config.name}-root-device`,
        },
      },
      subnetId: config.subnetId,
      tags: {
        Name: `${config.name}-${config.suffix}`,
        ...config.tags,
      },
      userData: config.userData,
      userDataReplaceOnChange: true,
      vpcSecurityGroupIds: [config.securityGroupId],
    },
    options
  );

new EipAssociation(
  config.name,
  {
    instanceId: instance.id,
    allocationId: config.eipId,
  },
  {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  },
);

if (config.volumeId) {
  new VolumeAttachment(
    config.name,
    {
      instanceId: instance.id,
      volumeId: config.volumeId,
      deviceName: "/dev/xvdf",
    },
    {
      protect: config.protect,
      retainOnDelete: config.retainOnDelete,
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
  privateIp: interpolate`${instance.privateIp}`,
  publicIp: config.eip,
  userData: config.userData,
};
