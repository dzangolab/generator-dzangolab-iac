import {
  Config,
  getOrganization,
  getStack,
  StackReference,
} from "@pulumi/pulumi";
  
import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  let vpcId = stackConfig.get("vpcId");

  if (!vpcId) {
    const vpcProject = stackConfig.get("aws-vpc-project") || "aws-vpc";

    const vpcStack =   new StackReference(
      `${organization}/${vpcProject}/${stack}`,
    );

    const vpcIdOutput = await vpcStack.getOutputDetails("vpcId");
    vpcId = getValue<string>(vpcIdOutput);
  }
  
  return {
      name: stack,
      protect: stackConfig.getBoolean("protect"),
      retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
      suffix: stackConfig.require("suffix"),
      vpcId
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