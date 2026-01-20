import {
  Config,
  getOrganization,
  getStack,
  interpolate,
  log,
  StackReference
} from "@pulumi/pulumi";
import { Environment, FileSystemLoader } from "nunjucks";

import getPublicKeys from "./public-keys";

import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  const name = stackConfig.get("name") || `${organization}-${stack}`;

  /** Get Availability zone **/
  let availabilityZone = stackConfig.require("availabilityZone");

  /** Get keypair */
  let keypair = stackConfig.get("keypair");

  if (!keypair) {
    const keyName = stackConfig.require("keyName");

    const outputs = await getOutputs<{ [key: string]: string }>(
      "keypairsStack",
      keyName
    );

    keypair = outputs ? outputs[0]["name"] as string : undefined;
  }

  /** Gets security group ids */
  let securityGroupIds = stackConfig.getObject<string[]>("securityGroupIds");

  if (!securityGroupIds) {
    const outputs = await getOutputs<{ "arn": string; "id": string }>(
      "securityGroupsStack",
      "ssh"
    );

    if (!outputs) {
      throw new Error("SSH security group id not found");
    }

    try {
      const ssh = outputs[0] as { "arn": string; "id": string };
      
      securityGroupIds = [ssh["id"]];
    } catch (e) {
      throw new Error("SSH security group id is required but could not be found");
    }
  }

  /** Get subnet id **/
  const subnetId = stackConfig.require("subnetId");

  /** Get VPC id and cidr block */
  let vpcId = stackConfig.get("vpcId");

  if (!vpcId) {
    const outputs = await getOutputs(
      "vpcStack",
      "vpcId,cidrBlock"
    );

    if (outputs) {
      vpcId = outputs[0] as string;
    }
  }

  /** Get user data **/
  const pathToSshKeysFolder = stackConfig.get("pathToSshKeysFolder") || "../../../ssh-keys";

  const publicKeyNames = stackConfig.requireObject("publicKeyNames") as string[];

  const userData = generateUserData(
    stackConfig.get("userDataTemplate") || "./cloud-config.al2023.njx",
    {
      packages: stackConfig.getObject<string[]>("packages"),
      publicKeyNames: getPublicKeys(publicKeyNames, pathToSshKeysFolder),
    }
  );

  return {
    ami: stackConfig.require("ami"),
    associatePublicIpAddress: stackConfig.getBoolean("associatePublicIpAddress"),
    availabilityZone,
    disableApiTermination: stackConfig.getBoolean("disableApiTermination"),
    instanceType: stackConfig.require("instanceType"),
    keypair,
    monitoring: stackConfig.getBoolean("monitoring"),
    name,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    rootBlockDevice: {
      volumeSize: stackConfig.getNumber("rootBlockDeviceSize") || 8,
    },
    securityGroupIds,
    subnetId,
    tags: stackConfig.getObject<{ [key: string]: string }>("tags"),
    userData,
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

function generateUserData(
  template: string,
  context: { [key: string]: any },
): string {
  const env = new Environment([
    new FileSystemLoader(),
  ]);

  return env.render(template, context);
}
