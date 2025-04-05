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

  /** Get instance profile */
  let instanceProfile = stackConfig.get("instanceProfile");

  if (!instanceProfile) {
    const outputs = await getOutputs(
      "instanceProfileStack",
      "id"
    );

    instanceProfile = outputs ? outputs[0] : undefined;
  }

  /** Get keypair */
  const keypair = stackConfig.get("keypair");

  if (!keypair) {
    const keyName = stackConfig.require("keyName");

    const outputs = await getOutputs(
      "keypairsStack",
      keyName
    );

    keypair = outputs ? outputs[0]["name"] : undefined;
  }

  /** Gets security group id */
  let securityGroupId = stackConfig.get("securityGroupId");

  if (!securityGroupId) {
    const outputs = await getOutputs(
      "securityGroupStack",
      "id"
    );

    securityGroupId = outputs ? outputs[0] : undefined;
  }

  /** Get subnet id **/
  const subnetId = stackConfig.require("subnetId");

  /** Get volume id **/
  let volumeId = stackConfig.get("volumeId");

  if (!volumeId) {
    const outputs = await getOutputs(
      "volumeStack",
      "ids"
    );

    volumeId = outputs ? outputs[0][0] : undefined;
  }

  /** Get user data **/
  const userData = generateUserData(
    stackConfig.get("userDataTemplate") || "./cloud-config.al2023.njx",
    {
      packages: stackConfig.getObject<string[]>("packages"),
      volumes: [
        {
          device: stackConfig.get("volumeDevice") || "/dev/xvdf",
          filesystem: stackConfig.get("volumeFilesystem") || "ext4",
          label: stackConfig.get("volumeLabel") || "data",
          path: "/mnt/nfs"
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

function generateUserData(
  template: string,
  context: { [key: string]: any },
): string {
  const env = new Environment([
    new FileSystemLoader(),
  ]);

  return env.render(template, context);
}
