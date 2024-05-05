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
    name: stackConfig.get("name") || stack,
    policies: {
      ecr: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly",
    },
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    secretRecoveryWindowInDays: stackConfig.requireNumber("secretRecoveryWindowInDays"),
    useSesSmtp: stackConfig.getBoolean("useSesSmtp")
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