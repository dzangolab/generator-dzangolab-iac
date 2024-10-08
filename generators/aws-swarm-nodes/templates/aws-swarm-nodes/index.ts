import {
  EipAssociation,
  Instance,
  VolumeAttachment
} from "@pulumi/aws/ec2";
import { local } from "@pulumi/command";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";
import render from "./render";

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
        Name: `${config.name}`,
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
    options
  );

  if (config.volumeId) {
    new VolumeAttachment(
      config.name,
      {
        instanceId: instance.id,
        volumeId: config.volumeId,
        deviceName: "/dev/xvdf",
      },
      options
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

  new local.Command(
    "updateAnsibleSwarmVar",
    {
      create: interpolate`echo 'private_ip: '${instance.privateIp} > ${config.ansibleSwarmVarFile}`,
      delete: interpolate`rm ${config.ansibleSwarmVarFile}`,
      update: interpolate`echo 'private_ip: '${instance.privateIp} > ${config.ansibleSwarmVarFile}`,
    },
    {
      dependsOn: instance,
    },
  );

  const ansibleInventory = render(
    "./templates/ansible-inventory.njk",
    {
      managers: [
        {
          publicIp: config.eip,
        }
      ]
    }
  );

  new local.Command(
    "generateAnsibleInventory",
    {
      create: interpolate`echo '${ansibleInventory}' > ${config.ansibleInventory}`,
      delete: interpolate`rm ${config.ansibleInventory}`,
      update: interpolate`echo '${ansibleInventory}' > ${config.ansibleInventory}`,
    },
    {
      dependsOn: instance,
    },
  );

  return {
    managers: [
      {
        arn: interpolate`${instance.arn}`,
        availabilityZone: interpolate`${instance.availabilityZone}`,
        id: interpolate`${instance.id}`,
        name: config.name,
        privateIp: interpolate`${instance.privateIp}`,
        publicIp: config.eip,
      }
    ]
  };
}
