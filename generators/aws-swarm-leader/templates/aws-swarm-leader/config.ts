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

  /** Get Availability zone **/ 
  let availabilityZone = stackConfig.require("availabilityZone");

  if (!availabilityZone) {
    const vpcProject= stackConfig.get("vpcProject") || "aws-vpc";
    const vpcStack = new StackReference(
      `${organization}/${vpcProject}/${stack}`,
    );

    const availabilityZonesOutput = await.vpcStack.getOutputDetails("availabtilityZones");
    const availabilityZones = getValue<string[]>(availabilityZonesOutput);

    availabilityZone = availabilityZones[0];
  }

  /** Get subnet id **/
  const subnetId = stackConfig.require("subnetId");
  
  /** Gets security group id */
  let securityGroupId = stackConfig.get("securityGroupId");

  if (!securityGroupId) {
    const securityGroupProject= stackConfig.get("securityGroupProject") || "aws-security-group";
    const securityGroupStack = new StackReference(
      `${organization}/${securityGroupProject}/${stack}`,
    );

    const securityGroupIdOutput = await securityGroupStack.getOutputDetails("id");
    securityGroupId = getValue<string>(securityGroupIdOutput);
  }

  /** Get volume **/
  // const volumeIdOutput = await resourcesStack.getOutputDetails("volumeId");
  // const volumeId = getValue<string>(volumeIdOutput);

  /** Get instance profile */
  const instanceProfileProject = stackConfig.get("instanceProfileProject") || "aws-instance-profile";

  const instanceProfileStack = new StackReference(
    `${organization}/${instanceProfileProject}/${stack}`,
  );

  const profileNameOutput = await instanceProfileStack.getOutputDetails("name");
  const profileName = getValue<string>(profileNameOutput);

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
    instanceProfile: profileName, 
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
    suffix: stackConfig.require("suffix"),
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