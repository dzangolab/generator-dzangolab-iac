import {
  Config,
  getOrganization,
  getStack,
  StackReference,
} from "@pulumi/pulumi";
import type { Output } from "@pulumi/pulumi";

export const getConfig = async () => {
  const stackConfig = new Config();

  let managerToken = stackConfig.getSecret("managerToken");
  let workerToken = stackConfig.getSecret("workerToken");

  if (!managerToken || !workerToken){
    const outputs = await getSecrets(
      "leaderStack",
      "managerToken,workerToken"
    );

    if (outputs){
      managerToken =  outputs[0];
      workerToken =  outputs[1];
    }
  }

  return {
    managerToken: managerToken,
    workerToken: workerToken
  };
};

const stacks: { [key: string]: StackReference } = {};

async function getSecrets<T = string>(
  stackConfigVar: string,
  defaultOutputNames: string
): Promise<undefined | Output<T>[]> {

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

  const outputs: Output<T>[] = [];
  for (const name of outputNames) {
    const output: Output<T> = otherStack.getOutput(name) as Output<T>;
    outputs.push(output);
  }

  return outputs;
}
