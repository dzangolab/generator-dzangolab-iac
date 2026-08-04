import { EC2Client, DescribeInstancesCommand } from "@aws-sdk/client-ec2";
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

  let bastionIp: string | undefined = undefined;

  if (useBastion) {
    bastionIp = stackConfig.get("bastionIp");

    if (!bastionIp) {
      const outputs = await getOutputs("bastionStack", "publicIp");
      bastionIp = outputs?.[0] as string | undefined;
    }
  }

  let managerIp = stackConfig.get("managerIp") as string | undefined;

  if (!managerIp) {
    const outputs = await getOutputs(
      "managerStack",
      useBastion ? "privateIp" : "publicIp"
    );
    managerIp = outputs?.[0] as string | undefined;
  }

  if (!managerIp) {
    console.log("No manager IP found in stack outputs, attempting EC2 discovery...");
    managerIp = await discoverManagerIp(!!useBastion);
  }

  if (!managerIp) {
    throw new Error("Failed to determine manager IP. Provide it explicitly via `managerIp`.");
  }

  return {
    bastionIp,
    managerIp,
    useBastion,
    user: stackConfig.get("user") || "ec2-user",
  };
};

async function discoverManagerIp(useBastion: boolean): Promise<string | undefined> {
  const ec2 = new EC2Client({});

  try {
    const result = await ec2.send(new DescribeInstancesCommand({
      Filters: [
        { Name: "tag-key", Values: ["manager"] },
        { Name: "instance-state-name", Values: ["running"] },
      ],
    }));

    const instances = (result.Reservations ?? [])
      .flatMap(r => r.Instances ?? [])
      .filter(i => useBastion ? i.PrivateIpAddress : i.PublicIpAddress);

    if (instances.length === 0) {
      console.warn("No running manager instances found with a usable IP.");
      return undefined;
    }

    const chosen = instances[0];
    return useBastion ? chosen.PrivateIpAddress! : chosen.PublicIpAddress!;
  } catch (error) {
    console.error("Failed to discover manager IP via EC2:", error);
    return undefined;
  }
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
