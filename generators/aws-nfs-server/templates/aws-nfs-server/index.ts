import {
  EipAssociation,
  getSubnet,
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

  const subnetId = config.subnetId;
  const selected = getSubnet({
      id: subnetId,
  });
  const subnetSecurityGroup = new SecurityGroup("subnet_security_group", {
      vpcId: selected.then(selected => selected.vpcId),
      ingress: [
        {
          description: "Allow SSH access",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          description: "Allow NFS TCP access",
          fromPort: 2049,
          toPort: 2049,
          protocol: "tcp",
          cidrBlocks: [selected.then(selected => selected.cidrBlock)],
        },
        {
          description: "Allow NFS UDP access",
          fromPort: 2049,
          toPort: 2049,
          protocol: "udp",
          cidrBlocks: [selected.then(selected => selected.cidrBlock)],
        },
        {
          description: "Allow ICMP",
          fromPort: -1,
          toPort: -1,
          protocol: "icmp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egress: [
        {
          description: "Allow DNS TCP outbound",
          fromPort: 53,
          toPort: 53,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          description: "Allow DNS UDP outbound",
          fromPort: 53,
          toPort: 53,
          protocol: "udp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          description: "Allow HTTP outbound",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          description: "Allow HTTPS outbound",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          description: "Allow ICMP outbound",
          fromPort: -1,
          toPort: -1,
          protocol: "icmp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
  });

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
        Name: config.name,
        ...config.tags,
      },
      userData: config.userData,
      userDataReplaceOnChange: true,
      vpcSecurityGroupIds: [subnetSecurityGroup.id],
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
    securityGroupId: interpolate`${subnetSecurityGroup.id}`,
    userData: config.userData,
  };
};