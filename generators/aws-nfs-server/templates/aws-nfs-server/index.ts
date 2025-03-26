import {
  EipAssociation,
  Instance,
  SecurityGroup,
  SecurityGroupRule,
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


  // Inbound rules 
  new SecurityGroupRule(
    `${config.name}-ssh-inbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "ingress",
      description: "Allow SSH access",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"], // Consider restricting this to your IP
    },
    options
  );

  new SecurityGroupRule(
    `${config.name}-nfs-tcp-inbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "ingress",
      description: "Allow NFS TCP access",
      fromPort: 2049,
      toPort: 2049,
      protocol: "tcp",
      cidrBlocks: [config.vpcIpRange],
    },
    options
  );

  new SecurityGroupRule(
    `${config.name}-nfs-udp-inbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "ingress",
      description: "Allow NFS UDP access",
      fromPort: 2049,
      toPort: 2049,
      protocol: "udp",
      cidrBlocks: [config.vpcIpRange],
    },
    options
  );

  new SecurityGroupRule(
    `${config.name}-icmp-inbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "ingress",
      description: "Allow ICMP",
      fromPort: -1,
      toPort: -1,
      protocol: "icmp",
      cidrBlocks: ["0.0.0.0/0"],
    },
    options
  );

  // Outbound rules (equivalent to DigitalOcean firewall outboundRules)
  new SecurityGroupRule(
    `${config.name}-dns-tcp-outbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "egress",
      description: "Allow DNS TCP outbound",
      fromPort: 53,
      toPort: 53,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
    },
    options
  );

  new SecurityGroupRule(
    `${config.name}-dns-udp-outbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "egress",
      description: "Allow DNS UDP outbound",
      fromPort: 53,
      toPort: 53,
      protocol: "udp",
      cidrBlocks: ["0.0.0.0/0"],
    },
    options
  );

  new SecurityGroupRule(
    `${config.name}-http-outbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "egress",
      description: "Allow HTTP outbound",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
    },
    options
  );

  new SecurityGroupRule(
    `${config.name}-https-outbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "egress",
      description: "Allow HTTPS outbound",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
    },
    options
  );

  new SecurityGroupRule(
    `${config.name}-icmp-outbound`,
    {
      securityGroupId: config.securityGroupId,
      type: "egress",
      description: "Allow ICMP outbound",
      fromPort: -1,
      toPort: -1,
      protocol: "icmp",
      cidrBlocks: ["0.0.0.0/0"],
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
      vpcSecurityGroupIds: [config.securityGroupId], // Use our new security group
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

  return {
    arn: interpolate`${instance.arn}`,
    availabilityZone: interpolate`${instance.availabilityZone}`,
    id: interpolate`${instance.id}`,
    name: config.name,
    privateIp: interpolate`${instance.privateIp}`,
    publicIp: config.eip,
    securityGroupId: config.securityGroupId,
    userData: config.userData,
  };
};