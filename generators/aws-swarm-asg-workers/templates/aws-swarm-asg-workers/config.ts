import {
  all,
  Config,
  getOrganization,
  getStack,
  output,
  StackReference
} from "@pulumi/pulumi";
import { Environment, FileSystemLoader } from "nunjucks";

import type { Output, StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  const name = stackConfig.get("name") || `${organization}-${stack}`;

  /** Get Availability zone **/
  let availabilityZone = stackConfig.get("availabilityZone");

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

  /** Get workers token */
  let workerToken = stackConfig.get("workersToken");
  let leaderIp = stackConfig.get("leaderIp");

  if (!workerToken || !leaderIp) {
    const outputs = await getOutputs(
      "leaderStack",
      "privateIp,workerToken"
    );

    leaderIp = outputs ? outputs[0] as string : undefined;
    workerToken = outputs ? outputs[1] as string : undefined;
  }

  /** Gets security group id */
  let securityGroupId = stackConfig.get("securityGroupId");

  if (!securityGroupId) {
    const outputs = await getOutputs(
      "securityGroupStack",
      "id,name"
    );

    securityGroupId = outputs ? outputs[0] as string : undefined;
  }

  /** Get subnet id **/
  const subnetId = stackConfig.require("subnetId");

  // let userData: Output<string>;

  /** Get user data **/
  const userData = all([
  ]).apply(([token, managerIp]) => {
      return generateUserData(
          stackConfig.get("userDataTemplate") || "./cloud-config.njx",
          {
              packages: stackConfig.getObject<string[]>("packages"),
              swarmWorkerToken: workerToken,
              swarmManagerIp: leaderIp
          }
      );
  });

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

  return {
    ami: stackConfig.require("ami"),
    associatePublicIpAddress: stackConfig.getBoolean("associatePublicIpAddress"),
    availabilityZone,
    cidrBlock,
    count: stackConfig.getNumber("count") || 1,
    desiredCapacity: stackConfig.getNumber("desireCapacity"),
    disableApiTermination: stackConfig.getBoolean("disableApiTermination"),
    iamInstanceProfile,
    instanceType: stackConfig.require("instanceType"),
    keypair,
    maxSize: stackConfig.getNumber("maxSize"),
    minSize: stackConfig.getNumber("minSize"),
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
): Output<string> {
  const env = new Environment([
    new FileSystemLoader(),
  ]);

  return output(env.render(template, context));
}
