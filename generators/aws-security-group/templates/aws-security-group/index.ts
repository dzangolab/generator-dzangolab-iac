import { SecurityGroup } from "@pulumi/aws/ec2";
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

  return {
    arn: interpolate`${securityGroup.arn}`,
    id: interpolate`${securityGroup.id}`
  };
}
