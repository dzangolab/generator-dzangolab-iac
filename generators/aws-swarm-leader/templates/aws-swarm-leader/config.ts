import {
  Config,
  getOrganization,
  getStack,
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

  /** Get Bastion IP address */
  let bastionIp = stackConfig.get("bastionIp");

  if (!bastionIp) {
    const outputs = await getOutputs(
      "bastionStack",
      "publicIp"
    );

    bastionIp = outputs ? outputs[0] as string : undefined;
  }

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

  /** Get instance profile */
  let iamInstanceProfile = stackConfig.get("iamInstanceProfile");

  if (!iamInstanceProfile) {
    const outputs = await getOutputs(
      "iamInstanceProfileStack",
      "id"
    );

    iamInstanceProfile = outputs ? outputs[0] as string : undefined;
  }

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

  /** Get security group ids */
  const useBastion = stackConfig.getBoolean("useBastion");

  let securityGroupIds = stackConfig.getObject<string[]>("securityGroupIds");

  if (!securityGroupIds) {
    const securityGroupNames = useBastion
      ? "swarm-managers,web,ssh-bastion"
      : "swarm-managers,web";

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

      if (useBastion) {
        const bastion = outputs[2] as { "arn": string; "id": string };
        securityGroupIds.push(bastion["id"]);
      }
    } catch (e) {
      throw new Error("Required security groups could not be found");
    }
  }

  /** Get subnet id **/
  const subnetId = stackConfig.require("subnetId");

  const useNFS = stackConfig.getBoolean("useNFS");

  /** Get volume id **/
  let volumeId = stackConfig.get("volumeId");

  if (!volumeId) {
    const outputs = await getOutputs(
      "volumeStack",
      "id"
    );

    volumeId = outputs ? outputs[0] as string : undefined;
  }

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
  }

  /** User data **/
  const pathToSshKeysFolder = stackConfig.get("pathToSshKeysFolder") || "../../../ssh-keys";

  const publicKeyNames = stackConfig.requireObject("publicKeyNames") as string[];

  const userData = generateUserData(
    stackConfig.get("userDataTemplate") || "./cloud-config.al2023.njx",
    {
      dockerNetworks: stackConfig.getObject<string[]>("dockerNetworks"),
      packages: stackConfig.getObject<string[]>("packages"),
      publicKeyNames: getPublicKeys(publicKeyNames, pathToSshKeysFolder),
      volumes: useNFS ? undefined : [
        {
          device: stackConfig.get("volumeDevice") || "/dev/xvdf",
          filesystem: stackConfig.get("volumeFilesystem") || "ext4",
          label: stackConfig.get("volumeLabel") || "data",
          path: "/mnt/data"
        }
      ],
    }
  );

  return {
    ami: stackConfig.require("ami"),
    associatePublicIpAddress: stackConfig.getBoolean("associatePublicIpAddress"),
    availabilityZone,
    bastionIp,
    cidrBlock,
    disableApiTermination: stackConfig.getBoolean("disableApiTermination"),
    eip,
    eipId,
    iamInstanceProfile,
    instanceType: stackConfig.require("instanceType"),
    keypair,
    monitoring: stackConfig.getBoolean("monitoring"),
    name,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    rootBlockDevice: {
      volumeSize: stackConfig.requireNumber("rootBlockDeviceSize"),
    },
    securityGroupIds,
    subnetId,
    tags: stackConfig.getObject<{ [key: string]: string }>("tags"),
    useBastion,
    useNFS,
    userData,
    volumeId,
    vpcId,
  };
};

function generateUserData(
  template: string,
  context: { [key: string]: any },
): string {
  const env = new Environment([
    new FileSystemLoader(),
  ]);

  return env.render(template, context);
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
