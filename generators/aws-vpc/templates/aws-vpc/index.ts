import {
  NatGatewayStrategy,
  SubnetAllocationStrategy,
  Vpc
} from "@pulumi/awsx/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const vpc = new Vpc(
    `${config.name}-${config.suffix}`,
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
        Name: `${config.name}-${config.suffix}`
      }
    },
    options
  );

  return {
    eips: interpolate`${vpc.eips}`,
    privateSubnetIds: interpolate`${vpc.privateSubnetIds}`,
    publicSubnetIds: interpolate`${vpc.publicSubnetIds}`,
    vpcId: interpolate`${vpc.vpcId}`
  };
}
