import {
  EipAssociation,
  Instance,
  SecurityGroup,
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

  const securityGroup = new SecurityGroup(
    config.name,
    {
      description: "Swarm leader security group",
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
          cidrBlocks: [config.bastionIp ? config.cidrBlock : "0.0.0.0/0"],
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
        {
          description: "HTTP from anywhere",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "HTTPS from anywhere",
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
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
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
        {
          description: "Overlay network traffic (UDP 4789)",
          fromPort: 4789,
          toPort: 4789,
          protocol: "udp",
          cidrBlocks: [config.cidrBlock],
        },
      ],
      tags: {
        Name: config.name,
      },
      vpcId: config.vpcId,
    },
    options
  );

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
      tags: {
        Name: `${config.name}`,
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
    arn: interpolate`${instance.arn}`,
    availabilityZone: interpolate`${instance.availabilityZone}`,
    id: interpolate`${instance.id}`,
    name: config.name,
    privateIp: interpolate`${instance.privateIp}`,
    publicIp: config.eip,
    securityGroupIds: config.securityGroupIds,
    vpcId: config.vpcId,
  };
}
