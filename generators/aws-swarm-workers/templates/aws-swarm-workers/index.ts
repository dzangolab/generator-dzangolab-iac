import {
  Instance,
  SecurityGroup
} from "@pulumi/aws/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const securityGroup = new SecurityGroup(
    config.name,
    {
      description: "Allow TLS inbound traffic",
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
      ],
      ingress: [
        {
          description: "TLS from VPC",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "TLS from VPC",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "SSH",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "DNS (TCP)",
          fromPort: 53,
          toPort: 53,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "DNS (TCP)",
          fromPort: 2377,
          toPort: 2377,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "DNS (UDP)",
          fromPort: 53,
          toPort: 53,
          protocol: "udp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
      ],
      name: config.name,
      tags: {
        Name: config.name,
      },
      vpcId: config.vpcId,
    },
    options
  );

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
        vpcSecurityGroupIds: [securityGroup.id],
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
      securityGroupId: securityGroup.id,
    });
  }

  return {
    workers
  };
}