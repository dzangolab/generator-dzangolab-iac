import {
  Config,
  getStack,
  StackReferenceOutputDetails
} from "@pulumi/pulumi";

export const getConfig = async () => {
  const stack = getStack();
  const stackConfig = new Config();

  return {
    dataVolumeSize: stackConfig.requireNumber("dataVolumeSize"),
    description: stackConfig.get("description") || `${stack} infrastructure`,
    environment: stackConfig.get("environment") || stack,
    ipRange: stackConfig.get("ipRange"),
    name: `${stack}`,
    protect: stackConfig.getBoolean("protect"),
    region: stackConfig.require("region"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
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