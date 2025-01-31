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

  const doResourcesProject = stackConfig.get("doResourcesProject") || "do-resources";

  const imageNfs = "sharklabs-dropletnfsserver";

  const resourcesStack = new StackReference(`${organization}/${doResourcesProject}/${stack}`);

  const projectIdOutput = await resourcesStack.getOutputDetails("projectId");
  const projectId = getValue<string>(projectIdOutput);

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
    image: imageNfs,
    name: stackConfig.get("name") || stack,
    projectId,
    protect: stackConfig.getBoolean("protect"),
    region: stackConfig.require("region"),
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
        path: "/mnt/nfs",
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