import { 
  NatGatewayStrategy,
  SubnetAllocationStrategy
} from "@pulumi/awsx/ec2";
import {
  Config,
  getOrganization,
  getStack,
  StackReferenceOutputDetails
} from "@pulumi/pulumi";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  return {
    availabilityZoneNames: stackConfig.getObject<string[]>("availabilityZoneNames"),
    cidrBlock: stackConfig.get("cidrBlock") || "10.0.0.0/16",
    enableDnsHostnames: stackConfig.getBoolean("enableDnsHostnames") || false,
    enableDnsSupport: stackConfig.getBoolean("enableDnsSupport") || true,
    name: stackConfig.get("name") || stack,
    natGatewayStrategy: stackConfig.get<NatGatewayStrategy>("natGatewayStrategy") || "None",
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    subnetSpecs: stackConfig.getObject<any | undefined>("subnetSpecs"),
    subnetStrategy: stackConfig.get<SubnetAllocationStrategy>("subnetStrategy") || "Auto",
    suffix: stackConfig.require("suffix"),
    tags: stackConfig.getObject<{[key: string]: string}>("tags")
  };
};

function getValue<T>(input: StackReferenceOutputDetails, defaultValue?: T): T {
  if (input && input.value) {
    return <T>input.value!;
  }

  if (input && input.secretValue) {
    return <T>input.secretValue!;
  }

  if (!defaultValue) {
    throw new Error("A value is required");
  }

  return defaultValue;
}