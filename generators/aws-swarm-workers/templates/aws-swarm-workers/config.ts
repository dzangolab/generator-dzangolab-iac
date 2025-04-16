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

  /** Get user data **/
  const userData = generateUserData(
    stackConfig.get("userDataTemplate") || "./cloud-config.al2023.njx",
    {
      packages: stackConfig.getObject<string[]>("packages"),
    }
  );

  return {
    ami: stackConfig.require("ami"),
    associatePublicIpAddress: stackConfig.getBoolean("associatePublicIpAddress"),
    availabilityZone,
    disableApiTermination: stackConfig.getBoolean("disableApiTermination"),
    instanceProfile,
    instanceType: stackConfig.require("instanceType"),
    keypair,
    monitoring: stackConfig.getBoolean("monitoring"),
    name,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    rootBlockDevice: {
      volumeSize: stackConfig.requireNumber("rootBlockDeviceSize"),
    },
    securityGroupId,
    subnetId,
    tags: stackConfig.getObject<{ [key: string]: string }>("tags"),
    userData,
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
  defaultOutputs: string
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

    outputs.push(getValue<T>(output) as T)
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
