import {
  Config,
  getOrganization,
  getStack,
  StackReference,
} from "@pulumi/pulumi";
import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const stackConfig = new Config();

  const useBastion = stackConfig.getBoolean("useBastion");

  let bastionIp = undefined as unknown as string | undefined;

  if (useBastion) {
    bastionIp = stackConfig.get("bastionIp");
    
    if (!bastionIp) {
      const outputs = await getOutputs(
        "bastionStack",
        "publicIp"
      );

      bastionIp = outputs ? outputs[0] : undefined;
    }
  }

  let managerIp = stackConfig.get("managerIp");

  if (!managerIp) {
    const outputs = await getOutputs(
      "managerStack",
      "privateIp"
    );

    managerIp = outputs ? outputs[0] as string : undefined;
  }

  return {
    bastionIp,
    managerIp,
    useBastion,
    user: stackConfig.get("user") || "ec2-user",
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
