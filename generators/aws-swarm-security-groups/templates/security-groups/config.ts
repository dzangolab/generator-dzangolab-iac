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

  /** Get Bastion */
  let bastionIp = stackConfig.get("bastionIp");

  if (!bastionIp) {
    const outputs = await getOutputs(
      "bastionStack",
      "publicIp"
    );

    bastionIp = outputs ? outputs[0] as string : undefined;
  }

  /** get uses */
  let useBastion = stackConfig.getBoolean("useBastion");
  let useNFS = stackConfig.getBoolean("useNFS");
  let useWorkers = stackConfig.getBoolean("useWorkers");

  /** Get VPC id and CIDR block */
  let vpcId = stackConfig.get("vpcId");
  let cidrBlock = undefined as unknown as string;

  if (!vpcId) {
    const outputs = await getOutputs(
      "vpcStack",
      "vpcId,cidrBlock"
    );

    if (outputs) {
      vpcId = outputs[0] as string;
      cidrBlock = outputs[1] as string;
    }
  } else if (!cidrBlock) {
    throw new Error("A CIDR block must be defined");
  }

  return {
    cidrBlock,
    name: stackConfig.require("name"),
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    useBastion,
    useNFS,
    useWorkers,
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
