import {
  Config,
  getOrganization,
  getStack,
  StackReference,
  StackReferenceOutputDetails
} from "@pulumi/pulumi";

// See https://www.pulumi.com/registry/packages/random/api-docs/randompassword/#inputs
type Constraints = {
  length?: number,
  lower?: boolean,
  minLower?: number,
  minNumeric?: number,
  minSpecial?: number,
  minUpper?: number,
  numeric?: boolean,
  overrideSpecial?: string,
  upper?: boolean,
}

type Passwords = { [key: string]: Constraints };

export const getConfig = async () => {
  const stack = getStack();
  const stackConfig = new Config();

  let secretArn = stackConfig.get("secretArn");
  let sesSmtpUser: string | undefined = undefined;
  let username = stackConfig.get("username");

  if (!secretArn) {
    const outputs = await getOutputs(
      "awsResourcesStack",
      "secretArn,sesSmtpUser,username"
    );

    secretArn = outputs ? outputs[0] as string : undefined;
    sesSmtpUser = outputs ? outputs[1] as string : undefined;
    username = outputs ? outputs[2] as string : undefined;
  }

  let config: { [key: string]: any } = {
    name: stackConfig.get("name") || stack,
    passwordLength: stackConfig.getNumber("passwordLength"),
    passwords: stackConfig.requireObject<Passwords>("passwords"),
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    secretArn,
    sesSmtpUser,
    timestamp: stackConfig.require("timestamp"),
    username
  };

  return config;
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
