import {
  getSubnet,
  Instance,
  SecurityGroup,
  VolumeAttachment
} from "@pulumi/aws/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const subnetId = config.subnetId;
  const selected = getSubnet({
    id: subnetId,
  });

  const securityGroup = new SecurityGroup(
    `${config.name}-nfs`,
    {
      description: "Allow NFS inbound traffic and all outbound traffic",
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
          description: "SSH temporarily",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
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
      name: config.name,
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
          Name: `${config.name}-root-device`,
        },
      },
      subnetId: config.subnetId,
      tags: {
        Name: config.name,
        ...config.tags,
      },
      userData: config.userData,
      userDataReplaceOnChange: true,
      vpcSecurityGroupIds: [securityGroup.id],
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

  return {
    arn: interpolate`${instance.arn}`,
    availabilityZone: interpolate`${instance.availabilityZone}`,
    id: interpolate`${instance.id}`,
    name: config.name,
    privateIp: interpolate`${instance.privateIp}`,
    publicIp: interpolate`${instance.publicIp}`,
    securityGroupId: securityGroup.id,
  };
};