import {
  Config,
  getOrganization,
  getStack,
  StackReference,
  StackReferenceOutputDetails,
} from "@pulumi/pulumi";
import { Environment, FileSystemLoader } from "nunjucks";

import getPublicKeys from "./public-keys";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  const name = `${organization}-${stack}`;

  /** Get EIP */
  const eipProject = stackConfig.get("eipProject") || "aws-eip";

  const eipStack = new StackReference(
    `${organization}/${eipProject}/${stack}`,
  );

  const eipOutput = await eipStack.getOutputDetails("eip");
  const eip = getValue<string>(eipOutput);

  const eipIdOutput = await eipStack.getOutputDetails("eipId");
  const eipId = getValue<string>(eipIdOutput);

  /** Get Availabblity zone **/ 
  const availabilityZoneOutput = await resourcesStack.getOutputDetails("availabilityZone");
  const availabilityZone = getValue<string>(availabilityZoneOutput);

  const securityGroupIdOutput = await resourcesStack.getOutputDetails("securityGroupId");
  const securityGroupId = getValue<string>(securityGroupIdOutput);

  const subnetIdsOutput = await resourcesStack.getOutputDetails("publicSubnetIds");
  const subnetId = getValue<string[]>(subnetIdsOutput)[0];

  const volumeIdOutput = await resourcesStack.getOutputDetails("volumeId");
  const volumeId = getValue<string>(volumeIdOutput);

  /** Get key pairs */
  const keypairsProject = stackConfig.get("keypairsProject") || "aws-ssh-keypairs"
;
  const keyPairStack = new StackReference(
    `${organization}/${keypairsProject}/global`,
  );

  const publicKeyName = stackConfig.require("keyName");
  const keyNameOutput = await keyPairStack.getOutputDetails(publicKeyName);
  const keyName = getValue<{ [key: string]: string }>(keyNameOutput)["name"];

  /** Get username **/
  const username = stackConfig.get("username") || organization;

  /** Get group **/
  const group = stackConfig.get("group") || organization;

  /** Get user data **/
  const userData = generateUserData(
    stackConfig.get("userDataTemplate") || "./cloud-config.njx",
    {
      packages: stackConfig.getObject<string[]>("packages"),
      swapFile: stackConfig.get("swapFile"),
      swapSize: stackConfig.get("swapSize"),
      users: [
        {
          groups: "sudo, docker",
          publicKeys: getPublicKeys(stackConfig.requireObject("publicKeyNames") as string[]),
          username,
        },
      ],
      volumes: [
        {
          device: stackConfig.get("volumeDevice") || "/dev/xvdf",
          filesystem: stackConfig.get("volumeFilesystem") || "ext4",
          label: stackConfig.get("volumeLabel") || "data", 
          path: "/mnt/data",
          user: username,
          group: group
        }
      ],
    }
  );

  return {
    ami: stackConfig.require("ami"),
    availabilityZone,
    disableApiTermination: stackConfig.getBoolean("disableApiTermination"),
    eip,
    eipId,
    group,
    instanceType: stackConfig.require("instanceType"),
    keyName,
    monitoring: stackConfig.getBoolean("monitoring"),
    name,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    rootBlockDevice: {
      volumeSize: stackConfig.requireNumber("rootBlockDeviceSize"),
    },
    securityGroupId,
    subnetId,
    userData,
    username,
    volumeId,
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

function generateUserData(
  template: string,
  context: { [key: string]: any },
): string {
  const env = new Environment([
    new FileSystemLoader(),
  ]);

  return env.render(template, context);
}