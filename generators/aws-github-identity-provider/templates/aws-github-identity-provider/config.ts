import {
  Config,
  StackReferenceOutputDetails
} from "@pulumi/pulumi";

export const getConfig = async () => {
  const stackConfig = new Config();

  return {
    name: stackConfig.get("name") || stack,
    policies: stackConfig.requireObject<string[]>("policyArns"), 
    protect: stackConfig.getBoolean("protect"),
    repos: stackConfig.requireObject<string[]>("repos"),
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