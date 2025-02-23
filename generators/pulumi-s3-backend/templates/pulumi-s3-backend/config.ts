import { Config, getOrganization } from "@pulumi/pulumi";
import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const stackConfig = new Config();

  return {
    awsAccountArns: stackConfig.requireObject<string[]>("aws-account-arns"),
    forceDestroy: stackConfig.getBoolean("forceDestroy"),
    keyDeletionWindow: stackConfig.getNumber("keyDeletionWindow") || 7,
    name: stackConfig.get("name") || [getOrganization(), "pulumi-state"].join("-"),
    protect: stackConfig.getBoolean("protect"),
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
