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

  const instanceTags = {
    Name: `${config.name}`,
    ...config.tags,
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
          Name: `${config.name}-root`,
        },
      },
      subnetId: config.subnetId,
      tags: instanceTags,
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

  if (!config.useNFS && config.volumeId) {
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

  if (!config.useBastion) {
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
  }

  return {
    ami: config.ami,
    arn: interpolate`${instance.arn}`,
    associatePublicIpAddress: config.associatePublicIpAddress,
    availabilityZone: interpolate`${instance.availabilityZone}`,
    disableApiTermination: config.disableApiTermination,
    eipId: config.eipId,
    iamInstanceProfile: config.iamInstanceProfile,
    id: interpolate`${instance.id}`,
    instanceType: config.instanceType,
    keypair: config.keypair,
    knownHostsHelper: !config.useBastion
      ? "manages this instance's EIP entry in the local ~/.ssh/known_hosts file on create/update/delete."
      : "not provisioned for this stack (`useBastion` = true).",
    monitoring: config.monitoring,
    name: config.name,
    privateIp: interpolate`${instance.privateIp}`,
    publicIp: config.eip,
    rootVolume: `${config.rootBlockDevice.volumeSize} GiB ${config.rootBlockDevice.volumeType}`,
    securityGroupIds: config.securityGroupIds,
    subnetId: config.subnetId,
    tags: instanceTags,
    volumeAttachment: !config.useNFS && config.volumeId
      ? `attaches pre-existing volume \`${config.volumeId}\` at \`/dev/xvdf\`.`
      : "not provisioned for this stack (`useNFS`/`volumeId` not set to attach one).",
    vpcId: config.vpcId,
  };
}
