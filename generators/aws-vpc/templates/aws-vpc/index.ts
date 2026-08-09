import {
  NatGatewayStrategy,
  SubnetAllocationStrategy,
  Vpc
} from "@pulumi/awsx/ec2";
import { interpolate } from "@pulumi/pulumi";
import { RandomInteger } from "@pulumi/random";


import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  // Ports 1024–49151 (registered range); avoids well-known (0–1023) and ephemeral (49152–65535).
  const sshPort = config.sshPort !== undefined
    ? config.sshPort
    : new RandomInteger(`${config.name}-ssh-port`, { min: 1024, max: 49151 }).result;

  const vpc = new Vpc(
    config.name,
    {
      availabilityZoneNames: config.availabilityZoneNames,
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: config.enableDnsHostnames,
      enableDnsSupport: config.enableDnsSupport,
      natGateways: {
        strategy: config.natGatewayStrategy as NatGatewayStrategy
      },
      subnetSpecs: config.subnetSpecs,
      subnetStrategy: config.subnetStrategy as SubnetAllocationStrategy,
      tags: {
        Name: config.name
      }
    },
    options
  );

  return {
    cidrBlock: config.cidrBlock,
    eips: interpolate`${vpc.eips}`,
    privateSubnetIds: interpolate`${vpc.privateSubnetIds}`,
    publicSubnetIds: interpolate`${vpc.publicSubnetIds}`,
    sshPort,
    vpcId: interpolate`${vpc.vpcId}`
  };
}
