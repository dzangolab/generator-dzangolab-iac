import {
  Config,
  getOrganization,
  getStack,
  StackReference,
} from "@pulumi/pulumi";
import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const stackConfig = new Config();

  const name = stackConfig.get("name");

  /** Get EIP */
  let eip = stackConfig.get("eip");
  let eipId = stackConfig.get("eipId");

  if (!eip || !eipId) {
    const outputs = await getOutputs(
      "eipStack",
      "eip,eipId"
    );

    eip = outputs ? outputs[0] as string : undefined;
    eipId = outputs ? outputs[1] as string : undefined;
  }

  let publicSubnetIds: string[] | undefined = stackConfig.get("publicSubnetIds") as string[] | undefined;
  let vpcId = stackConfig.get("vpcId");

  if (!vpcId) {
    const outputs = await getOutputs(
      "vpcStack",
      "publicSubnetIds,vpcId"
    );

    publicSubnetIds = outputs ? outputs[0].split(",") as string[] : undefined
    vpcId = outputs ? outputs[1] as string : undefined
  }

  /** Get security group ids */
  let securityGroupIds = stackConfig.getObject<string[]>("securityGroupIds");

  if (!securityGroupIds) {
    const securityGroupNames = "swarm-managers,web";

    const outputs = await getOutputs<{ "arn": string; "id": string }>(
      "securityGroupsStack",
      securityGroupNames
    );

    if (!outputs) {
      throw new Error("Required security group could not be found");
    }

    try {
      const managers = outputs[0] as { "arn": string; "id": string };
      const web = outputs[1] as { "arn": string; "id": string };

      securityGroupIds = [managers["id"], web["id"]];
    } catch (e) {
      throw new Error("Required security groups could not be found");
    }
  }



  return {
    eip,
    eipId,
    name,
    publicSubnetIds,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    tags: stackConfig.getObject<{ [key: string]: string }>("tags"),
    useHttps: stackConfig.getBoolean("useHttps"),
    vpcId
  };
};

const stacks: { [key: string]: StackReference } = {};

async function getOutputs<T = string>(
  stackConfigVar: string,
  defaultOutputNames: string
): Promise<undefined | T[]> {

  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  const config = stackConfig.get(stackConfigVar);
  if (!config) {
    return undefined;
  }

  let [project, outputNamesString] = config.split(":");

  if (!project) {
    return undefined;
  }

  if (!outputNamesString) {
    outputNamesString = defaultOutputNames;
  }

  if (!outputNamesString) {
    return undefined;
  }

  const outputNames = outputNamesString.split(",");

  let stackName = undefined;
  let _organization = organization;
  let _project = undefined;
  let _stack = stack;

  const tokens = project.split("/");

  switch (tokens.length) {
    case 3:
      [_organization, _project, _stack] = tokens;
      break;

    case 2:
      if (organization == "organization") {
        [_project, _stack] = tokens;
      } else {
        [_organization, _project] = tokens;
      }
      break;

    case 1:
      _project = tokens[0];
      break;
  }

  stackName = `${_organization}/${_project}/${_stack}`;
  let otherStack = stacks[stackName];

  if (!otherStack) {
    otherStack = new StackReference(stackName);
    stacks[stackName] = otherStack;
  }

  let outputs = [];

  for (var i = 0, name = null; name = outputNames[i]; i++) {
    const output = await otherStack.getOutputDetails(name);
    if (output.value != undefined) {
      outputs.push(getValue<T>(output) as T)
    }
    else {
      outputs.push(undefined as unknown as T)
    }
  }

  return outputs;
}

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
