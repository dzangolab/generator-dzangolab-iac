import {
  Instance,
} from "@pulumi/aws/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  // Desired worker count
  const count = config.count;

  const workers = [];

  for (let i = 1; i <= count; i++) {
    const name = `${config.name}-worker-${i}`; // Ensure unique worker names

    const instance = new Instance(
      name,
      {
        ami: config.ami,
        associatePublicIpAddress: config.associatePublicIpAddress,
        availabilityZone: config.availabilityZone,
        disableApiTermination: config.disableApiTermination,
        iamInstanceProfile: config.instanceProfile,
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
          Name: `${config.name}`,
          ...config.tags,
        },
        userData: config.userData,
        userDataReplaceOnChange: true,
        vpcSecurityGroupIds: [config.securityGroupId],
      },
      options
    );


    workers.push({
      arn: interpolate`${instance.arn}`,
      availabilityZone: interpolate`${instance.availabilityZone}`,
      id: interpolate`${instance.id}`,
      name: config.name,
      publicIp: interpolate`${instance.publicIp}`,
      userData: config.userData,
      securityGroupId: config.securityGroupId,
    });
  }

  return {
    workers
  };
}