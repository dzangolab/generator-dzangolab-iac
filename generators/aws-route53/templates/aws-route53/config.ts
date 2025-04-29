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

  let ip = stackConfig.get("ip");

  /** OR: Obtain ip address form another pulumi project  **/
  if (!ip) {
    const outputs = await getOutputs(
      "ipStack",
      "ip"
    );

    ip = outputs ? outputs[0] as string : undefined;
  }

  let host = stackConfig.get("host");

  /** OR: get host from another pulumi project **/
  if (!host) {
    const outputs = await getOutputs(
      "swarmLeaderStack",
      "name"
    );

    host = outputs ? outputs[0] as string : undefined;
  }

  return {
    aliases: stackConfig.requireObject<string[]>("aliases"),
    domain: stackConfig.require("domain"),
    host,
    ip,
    name: stackConfig.get("name") || stack,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    subdomain: stackConfig.get("subdomain"),
    ttl: stackConfig.getNumber("ttl") || 3600,
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