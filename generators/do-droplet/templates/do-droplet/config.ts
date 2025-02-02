import {
  Config,
  getOrganization,
  getStack,
  StackReference,
  StackReferenceOutputDetails
} from "@pulumi/pulumi";

import getPublicKeys from "./public-keys";

export const getConfig = async () => {
  const stack = getStack();
  const stackConfig = new Config();

  const pathToSshKeysFolder = stackConfig.get("pathToSshKeysFolder") || "../../ssh-keys";

  const publicKeyNames = stackConfig.requireObject("publicKeyNames") as string[];

  let projectId = stackConfig.get("projectId");

  if (!projectId) {
    const outputs = await getOutputs(
      "projectStack",
      "projectId"
    );
    
    projectId = outputs ? outputs[0] : undefined;
  }

  let reservedIpId = stackConfig.get("reservedIpId");

  if (!reservedIpId) {
    const outputs = await getOutputs(
      "reservedIpStack",
      "reservedIpId"
    );

    reservedIpId = outputs ? outputs[0] : undefined;
  }

  const sshKeyNames = stackConfig.requireObject("sshKeyNames") as string[];

  const username = stackConfig.require("username");

  const userGroups = stackConfig.get("userGroups");
  const groups = userGroups ? `sudo,${userGroups}` : "sudo";

  let blockVolumeId = stackConfig.get("blockVolumeId") as string | undefined;
  let blockVolumeName = stackConfig.get("blockVolumeName") as string | undefined;

  if (!blockVolumeId) {
    const outputs = await getOutputs(
      "blockVolumeStack",
      "volumeId,volumeName"
    );

    blockVolumeId = outputs ? outputs[0] : undefined;
    blockVolumeName = outputs ? outputs[1] : undefined;
  }
  
  let vpcId = stackConfig.get("vpcId");

  if (!vpcId) {
    const outputs = await getOutputs(
      "vpcStack",
      "vpcId"
    );

    vpcId = outputs ? outputs[0]: undefined;
  }

  return {
    image: stackConfig.require("image"),
    name: stackConfig.get("name") || stack,
    pathToSshKeysFolder,
    projectId,
    protect: stackConfig.getBoolean("protect"),
    region: stackConfig.require("region"),
    reservedIpId,
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    size: stackConfig.require("size"),
    sshKeyNames,
    userDataTemplate: "./cloud-config.njx",
    users: [
      {
        username,
        groups,
        publicKeys: getPublicKeys(publicKeyNames, pathToSshKeysFolder)
        
      },
    ],
    volumeIds: blockVolumeId ? [blockVolumeId] : [],
    volumes: blockVolumeId ? [
      {
        group: username,
        name: blockVolumeName as string,
        path: "/mnt/data",
        user: username
      },
    ] : [],
    vpcId,
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

async function getOutputs(
  stackConfigVar: string,
  defaultOutputs: string
): Promise<undefined | string[]> {
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
    outputNamesString = defaultOutputs;
  }

  if (!outputNamesString) {
    return undefined;
  }
  
  const outputNames = outputNamesString.split(","); 

  const stackName = `${organization}/${project}/${stack}`;
  let otherStack = stacks[stackName];

  if (!otherStack) {
    otherStack = new StackReference(stackName);
    stacks[stackName] = otherStack;
  }

  let outputs = [];

  for (var i = 0, name = null; name = outputNames[i]; i++) {
    const output = await otherStack.getOutputDetails(name);
    
    outputs.push(getValue<string>(output) as string)
  }

  return outputs;
}
