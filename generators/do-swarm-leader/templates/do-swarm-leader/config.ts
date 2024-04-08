import {
  Config,
  getOrganization,
  getStack,
  StackReference,
  StackReferenceOutputDetails
} from "@pulumi/pulumi";

import getPublicKeys from "./public-keys";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  const doResourcesStack = stackConfig.get("do-resources-stack") || "do-resources";

  const resourcesStack = new StackReference(`${organization}/${doResourcesStack}/${stack}`);

  const projectIdOutput = await resourcesStack.getOutputDetails("projectId");
  const projectId = getValue<string>(projectIdOutput);

  const reservedIpIdOutput = await resourcesStack.getOutputDetails("reservedIpId");
  const reservedIpId = getValue<string>(reservedIpIdOutput);

  const username = stackConfig.require("username");

  const dataVolumeIdOutput = await resourcesStack.getOutputDetails("volumeId");
  const dataVolumeId = getValue<string>(dataVolumeIdOutput);

  const dataVolumeNameOutput = await resourcesStack.getOutputDetails("volumeName");
  const dataVolumeName = getValue<string>(dataVolumeNameOutput);

  const vpcUuidOutput = await resourcesStack.getOutputDetails("vpcId");
  const vpcUuid = getValue<string>(vpcUuidOutput);

  const publicKeyNames = stackConfig.requireObject("publicKeyNames") as string[];
  const pathToSshKeysFolder = stackConfig.get("pathToSshKeysFolder") || "../../ssh-keys";

  return {
    image: stackConfig.require("image"),
    name: stack,
    projectId,
    protect: stackConfig.getBoolean("protect"),
    region: stackConfig.require("region"),
    reservedIpId,
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    size: stackConfig.require("size"),
    userDataTemplate: "./cloud-config.njx",
    users: [
      {
        username,
        groups: "sudo, docker",
        publicKeys: getPublicKeys(publicKeyNames, pathToSshKeysFolder)
        
      },
    ],
    volumeIds: [dataVolumeId],
    volumes: [
      {
        group: username,
        name: dataVolumeName,
        path: "/mnt/data",
        user: username
      },
    ],
    vpcUuid,
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