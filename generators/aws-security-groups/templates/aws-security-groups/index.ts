import { SecurityGroup } from "@pulumi/aws/ec2";
import { interpolate, log } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const outputs: { [key: string]: any } = {};
 
  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const data: { [key: string]: {
    description: string;
    ingress: {
      description: string;
      fromPort: number;
      toPort: number;
      protocol: string;
      cidrBlocks: string[];
      ipv6CidrBlocks?: string[];
    }[]; 
  }} = {
    dns: {
      description: "Allow inbound DNS traffic",
      ingress: [
        {
          description: "DNS (TCP)",
          fromPort: 53,
          toPort: 53,
          protocol: "tcp",
          cidrBlocks: config.secure ? [config.cidrBlock] : ["0.0.0.0/0"],
          ipv6CidrBlocks: config.secure ? [config.cidrBlock] : ["::/0"],
        },
        {
          description: "DNS (UDP)",
          fromPort: 53,
          toPort: 53,
          protocol: "udp",
          cidrBlocks: config.secure ? [config.cidrBlock] : ["0.0.0.0/0"],
          ipv6CidrBlocks: config.secure ? [config.cidrBlock] : ["::/0"],
        },
      ],
    },
    nfs: {
      description: "Security group for NFS server",
      ingress: [
        {
          description: "NFS (TCP)",
          fromPort: 2049,
          toPort: 2049,
          protocol: "tcp",
          cidrBlocks: config.secure ? [config.cidrBlock] : ["0.0.0.0/0"],
          ipv6CidrBlocks: config.secure ? [config.cidrBlock] : ["::/0"],
        },
        {
          description: "NFS (UDP)",
          fromPort: 2049,
          toPort: 2049,
          protocol: "udp",
          cidrBlocks: config.secure ? [config.cidrBlock] : ["0.0.0.0/0"],
          ipv6CidrBlocks: config.secure ? [config.cidrBlock] : ["::/0"],
        },
        {
          description: "ICMP",
          fromPort: -1,
          toPort: -1,
          protocol: "icmp",
          cidrBlocks: config.secure ? [config.cidrBlock] : ["0.0.0.0/0"],
          ipv6CidrBlocks: config.secure ? [config.cidrBlock] : ["::/0"],
        },
      ],
    },
    ssh: {
      description: "Allow inbound SSH traffic",
      ingress: [
        {
          description: "SSH",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
      ],
    },
    "swarm-managers": {
      description: "Security group for Docker swarm managers",
      ingress: [
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
    },
    "swarm-workers": {
      description: "Security group for swarm workers",
      ingress: [
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
    },
    web: {
      description: "Allow inbound web traffic",
      ingress: [
        {
          description: "HTTP/TCP",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "HTTPS/TCP",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
      ],
    },
  };

  for (const name of config.securityGroups) {
    const configuration = data[name];

    if (!configuration) {
      log.warn(`No configuration found for security group ${name}`);

      continue;
    }

    const securityGroup = new SecurityGroup(
      `${config.name}-${name}`,
      {
        description: configuration.description,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
            cidrBlocks: ["0.0.0.0/0"],
            ipv6CidrBlocks: ["::/0"],
          },
        ],
        ingress: configuration.ingress,
        tags: {
          Name: `${config.name}-${name}`,
        },
        vpcId: config.vpcId,
      },
      options
    );

    outputs[name] = {
      arn: interpolate`${securityGroup.arn}`,
      id: interpolate`${securityGroup.id},`
    }
  }

  return outputs;
}
