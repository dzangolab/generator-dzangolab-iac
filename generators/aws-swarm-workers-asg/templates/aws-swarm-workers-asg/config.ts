import {
  all,
  Config,
  getOrganization,
  getStack,
  output,
  StackReference,
} from "@pulumi/pulumi";
import { Environment, FileSystemLoader } from "nunjucks";
import type { Output, StackReferenceOutputDetails } from "@pulumi/pulumi";

import getPublicKeys from "./public-keys";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  const name = stackConfig.get("name") || `${organization}-${stack}`;

  /** Get instance profile */
  let iamInstanceProfile = stackConfig.get("iamInstanceProfile");

  if (!iamInstanceProfile) {
    const outputs = await getOutputs(
      "iamInstanceProfileStack",
      "id"
    );

    if(outputs){
      iamInstanceProfile = outputs[0] as string;
    }
  }

  /** Get keypair */
  let keypair = stackConfig.get("keypair");

  if (!keypair) {
    const keyName = stackConfig.require("keyName");

    const outputs = await getOutputs<{ [key: string]: string }>(
      "keypairsStack",
      keyName
    );

    if(outputs){
      keypair = outputs[0]["name"] as string;
    }
  }

  /** Get security group ids */
  const useBastion = stackConfig.getBoolean("useBastion");

  let securityGroupIds = stackConfig.getObject<string[]>("securityGroupIds");

  if (!securityGroupIds) {
    const securityGroupNames = useBastion
      ? "swarm-workers,ssh-bastion"
      : "swarm-workers";

    const outputs = await getOutputs<{ "arn": string; "id": string }>(
      "securityGroupsStack",
      securityGroupNames
    );

    if (!outputs) {
      throw new Error("Required security group could not be found");
    }

    try {
      const workers = outputs[0] as { "arn": string; "id": string };

      securityGroupIds = [workers["id"]];

      if (useBastion) {
        const bastion = outputs[1] as { "arn": string; "id": string };
        securityGroupIds.push(bastion["id"]);
      }
    } catch (e) {
      throw new Error("Required security groups could not be found");
    }
  }

  /** Get VPC id */
  let publicSubnetIds = undefined as unknown as string[];
  let vpcId = stackConfig.get("vpcId");

  if (!vpcId) {
    const outputs = await getOutputs(
      "vpcStack",
      "publicSubnetIds,vpcId"
    );

    if (outputs) {
      publicSubnetIds = outputs[0].split(",") as string[];
      vpcId = outputs[0] as string;
    }
  }

  /** Get worker token */
  let workerToken: Output<string>;

  let output = await getSecret(
    "swarmTokensStack",
    "workerToken"
  );
  
  workerToken =  output![0];

  /** User data **/
  const pathToSshKeysFolder = stackConfig.get("pathToSshKeysFolder") || "../../ssh-keys";

  const publicKeyNames = stackConfig.requireObject("publicKeyNames") as string[];

  const userData = 
    all({
      workerToken: workerToken,
    }).apply(({workerToken}) => {
      return generateUserData(
        stackConfig.get("userDataTemplate") || "./cloud-config.al2023.njx",
        {
          publicKeyNames: getPublicKeys(publicKeyNames, pathToSshKeysFolder),
          swarmWorkerToken: workerToken,
        }
      );
    });

  return {
    ami: stackConfig.require("ami"),
    associatePublicIpAddress: stackConfig.getBoolean("associatePublicIpAddress"),
    disableApiTermination: stackConfig.getBoolean("disableApiTermination"),
    iamInstanceProfile,
    instanceType: stackConfig.require("instanceType"),
    keypair,
    maxSize: stackConfig.getNumber("maxSize") || 2,
    minSize: stackConfig.getNumber("minSize") || 1,
    monitoring: stackConfig.getBoolean("monitoring"),
    name,
    publicSubnetIds,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    rootBlockDevice: {
      volumeSize: stackConfig.getNumber("rootBlockDeviceSize") || 16,
    },
    securityGroupIds,
    tags: stackConfig.getObject<{ [key: string]: string }>("tags"),
    userData,
    vpcId
  };
};

const stacks: { [key: string]: StackReference } = {};

function generateUserData(
  template: string,
  context: { [key: string]: any },
): string {
  const env = new Environment([
    new FileSystemLoader(),
  ]);

  const raw = env.render(template, context);

  return Buffer.from(raw).toString("base64");
}

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

async function getSecret<T = string>(
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
