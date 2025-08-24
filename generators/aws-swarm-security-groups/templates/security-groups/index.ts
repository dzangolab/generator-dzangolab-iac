import { SecurityGroup } from "@pulumi/aws/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const outputs: { [key: string]: any } = {};

  const managersSecurityGroup = new SecurityGroup(
    `${config.name}-managers`,
    {
      description: "Security group for swarm managers",
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
          description: "SSH",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: config.useBastion ? [config.cidrBlock] : ["0.0.0.0/0"],
        },
        {
          description: "DNS (TCP)",
          fromPort: 53,
          toPort: 53,
          protocol: "tcp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "DNS (UDP)",
          fromPort: 53,
          toPort: 53,
          protocol: "udp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "Http from anywhere",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "Https from anywhere",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "DNS (TCP)",
          fromPort: 2377,
          toPort: 2377,
          protocol: "tcp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "Overlay network traffic (UDP 4789)",
          fromPort: 4789,
          toPort: 4789,
          protocol: "udp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "Swarm node discovery (TCP)",
          fromPort: 7946,
          toPort: 7946,
          protocol: "tcp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "Swarm node discovery (UDP)",
          fromPort: 7946,
          toPort: 7946,
          protocol: "udp",
          cidrBlocks: [config.cidrBlock],
        },
      ],
      tags: {
        Name: `${config.name}-managers`,
      },
      vpcId: config.vpcId,
    },
    options
  );

  outputs.managersSecurityGroupArn = interpolate`${managersSecurityGroup.arn}`;
  outputs.managersSecurityGroupId = interpolate`${managersSecurityGroup.id}`;

  if (config.useBastion) {
    const bastionSecurityGroup = new SecurityGroup(
      `${config.name}-bastion`,
      {
        description: "Security group for swarm bastion",
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
            description: "SSH",
            fromPort: 22,
            toPort: 22,
            protocol: "tcp",
            cidrBlocks: ["0.0.0.0/0"],
          },
          {
            description: "DNS (TCP)",
            fromPort: 53,
            toPort: 53,
            protocol: "tcp",
            cidrBlocks: ["0.0.0.0/0"],
          },
          {
            description: "DNS (UDP)",
            fromPort: 53,
            toPort: 53,
            protocol: "udp",
            cidrBlocks: ["0.0.0.0/0"],
          },
        ],
        tags: {
          Name: `${config.name}-bastion`,
        },
        vpcId: config.vpcId,
      },
      options
    );

    outputs.bastionSecurityGroupArn = interpolate`${bastionSecurityGroup.arn}`;
    outputs.bastionSecurityGroupId = interpolate`${bastionSecurityGroup.id}`;
  }

  if (config.useNFS) {
    const nfsSecurityGroup = new SecurityGroup(
      `${config.name}-nfs`,
      {
        description: "Security group for NFS server",
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
            description: "SSH",
            fromPort: 22,
            toPort: 22,
            protocol: "tcp",
            cidrBlocks: config.useBastion ? [config.cidrBlock] : ["0.0.0.0/0"],
          },
          {
            description: "NFS (TCP)",
            fromPort: 2049,
            toPort: 2049,
            protocol: "tcp",
            cidrBlocks: [config.cidrBlock],
          },
          {
            description: "NFS (UDP)",
            fromPort: 2049,
            toPort: 2049,
            protocol: "udp",
            cidrBlocks: [config.cidrBlock],
          },
          {
            description: "ICMP",
            fromPort: -1,
            toPort: -1,
            protocol: "icmp",
            cidrBlocks: [config.cidrBlock],
          },
        ],
        tags: {
          Name: `${config.name}-nfs`,
        },
        vpcId: config.vpcId,
      },
      options
    );

    outputs.nfsSecurityGroupArn = interpolate`${nfsSecurityGroup.arn}`;
    outputs.nfsSecurityGroupId = interpolate`${nfsSecurityGroup.id}`;
  }

  if (config.useWorkers) {
    const workersSecurityGroup = new SecurityGroup(
      `${config.name}-workers`,
      {
        description: "Security group for swarm workers",
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
            description: "SSH",
            fromPort: 22,
            toPort: 22,
            protocol: "tcp",
            cidrBlocks: config.useBastion ? [config.cidrBlock] : ["0.0.0.0/0"],
          },
          {
            description: "DNS (TCP)",
            fromPort: 53,
            toPort: 53,
            protocol: "tcp",
            cidrBlocks: [config.cidrBlock],
          },
          {
            description: "DNS (UDP)",
            fromPort: 53,
            toPort: 53,
            protocol: "udp",
            cidrBlocks: [config.cidrBlock],
          },
          {
            description: "Http from anywhere",
            fromPort: 80,
            toPort: 80,
            protocol: "tcp",
            cidrBlocks: [config.cidrBlock],
          },
          {
            description: "Https from anywhere",
            fromPort: 443,
            toPort: 443,
            protocol: "tcp",
            cidrBlocks: [config.cidrBlock],
          },
          {
            description: "Overlay network traffic (UDP 4789)",
            fromPort: 4789,
            toPort: 4789,
            protocol: "udp",
            cidrBlocks: [config.cidrBlock],
          },
          {
            description: "Swarm node discovery (TCP)",
            fromPort: 7946,
            toPort: 7946,
            protocol: "tcp",
            cidrBlocks: [config.cidrBlock],
          },
          {
            description: "Swarm node discovery (UDP)",
            fromPort: 7946,
            toPort: 7946,
            protocol: "udp",
            cidrBlocks: [config.cidrBlock],
          },
        ],
        tags: {
          Name: `${config.name}-workers`,
        },
        vpcId: config.vpcId,
      },
      options
    );

    outputs.workersSecurityGroupArn = interpolate`${workersSecurityGroup.arn}`;
    outputs.workersSecurityGroupId = interpolate`${workersSecurityGroup.id}`;
  }

  return outputs;
}
