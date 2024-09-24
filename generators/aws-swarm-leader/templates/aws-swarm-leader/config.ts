import {
  Config,
  getOrganization,
  getStack,
  StackReference
} from "@pulumi/pulumi";
import { Environment, FileSystemLoader } from "nunjucks";

import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  const name = stackConfig.get("name") || `${organization}-${stack}`;

  /** Get Availability zone **/
  let availabilityZone = stackConfig.require("availabilityZone");

  if (!availabilityZone) {
    const vpcProject = stackConfig.get("vpcProject") || "aws-vpc";
    const vpcStack = new StackReference(
      `${organization}/${vpcProject}/${stack}`,
    );

    const availabilityZonesOutput = await vpcStack.getOutputDetails("availabilityZones");
    const availabilityZones = getValue<string[]>(availabilityZonesOutput);

    availabilityZone = availabilityZones[0];
  }

  /** Get EIP */
  let eip = stackConfig.get("eip");
  let eipId = stackConfig.get("eipId");

  if (!eip || !eipId) {
    const eipProject = stackConfig.get("eipProject") || "aws-eip";

    const eipStack = new StackReference(
      `${organization}/${eipProject}/${stack}`,
    );

    const eipOutput = await eipStack.getOutputDetails("eip");
    eip = getValue<string>(eipOutput);

    const eipIdOutput = await eipStack.getOutputDetails("eipId");
    eipId = getValue<string>(eipIdOutput);
  }

  /** Get instance profile */
  let instanceProfile = stackConfig.get("instanceProfile");

  if (!instanceProfile) {
    const instanceProfileProject = stackConfig.get("instanceProfileProject") || "aws-instance-profile";

    const instanceProfileStack = new StackReference(
      `${organization}/${instanceProfileProject}/${stack}`,
    );

    const instanceProfileOutput = await instanceProfileStack.getOutputDetails("name");
    instanceProfile = getValue<string>(instanceProfileOutput);
  }

  /** Get keyName */
  const keypairsProject = stackConfig.get("keypairsProject") || "aws-ssh-keypairs";
  const keypairsStack = new StackReference(
    `${organization}/${keypairsProject}/global`,
  );

  const publicKeyName = stackConfig.require("keyName");
  const keyNameOutput = await keypairsStack.getOutputDetails(publicKeyName);
  const keyName = getValue<{ [key: string]: string }>(keyNameOutput)["name"];

  /** Gets security group id */
  let securityGroupId = stackConfig.get("securityGroupId");

  if (!securityGroupId) {
    const securityGroupProject = stackConfig.get("securityGroupProject") || "aws-security-group";
    const securityGroupStack = new StackReference(
      `${organization}/${securityGroupProject}/${stack}`,
    );

    const securityGroupIdOutput = await securityGroupStack.getOutputDetails("id");
    securityGroupId = getValue<string>(securityGroupIdOutput);
  }

  /** Get subnet id **/
  const subnetId = stackConfig.require("subnetId");

  /** Get volume id **/
  let volumeId = stackConfig.get("volumeId");

  if (!volumeId) {
    const ebsProject = stackConfig.get("ebsProject") || "aws-ebs";
    const ebsStack = new StackReference(
      `${organization}/${ebsProject}/${stack}`,
    );

    const volumeIdsOutput = await ebsStack.getOutputDetails("ids");
    volumeId = getValue<string[]>(volumeIdsOutput)[0];
  }

  /** Get user data **/
  const userData = generateUserData(
    stackConfig.get("userDataTemplate") || "./cloud-config.njx",
    {
      packages: stackConfig.getObject<string[]>("packages"),
      volumes: [
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
    disableApiTermination: stackConfig.getBoolean("disableApiTermination"),
    eip,
    eipId,
    instanceProfile,
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
    tags: stackConfig.getObject<{ [key: string]: string }>("tags"),
    userData,
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
