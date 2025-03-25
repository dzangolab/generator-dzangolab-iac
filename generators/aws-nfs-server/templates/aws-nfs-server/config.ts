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

  /** Get VPC details **/
  const vpcProject = stackConfig.get("vpcProject") || "aws-vpc";
  const vpcStack = new StackReference(
    `${organization}/${vpcProject}/${stack}`,
  );
  const vpcIdOutput = await vpcStack.getOutputDetails("id");
  const vpcId = getValue<string>(vpcIdOutput);
  
  const vpcCidrOutput = await vpcStack.getOutputDetails("cidrBlock");
  const vpcIpRange = getValue<string>(vpcCidrOutput);

  /** Get Availability zone **/
  let availabilityZone = stackConfig.get("availabilityZone");
  if (!availabilityZone) {
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

  /** NFS-specific configuration **/
  const nfsExports = stackConfig.get("nfsExports") || [
    "/mnt/data *(rw,sync,no_subtree_check)"
  ];

  /** Get user data **/
  const userData = generateUserData(
    stackConfig.get("userDataTemplate") || "./nfs-cloud-config.njx",
    {
      packages: ["nfs-utils", ...(stackConfig.getObject<string[]>("packages") || []]],
      nfsExports,
      volumes: [
        {
          device: stackConfig.get("volumeDevice") || "/dev/xvdf",
          filesystem: stackConfig.get("volumeFilesystem") || "ext4",
          label: stackConfig.get("volumeLabel") || "data",
          path: stackConfig.get("volumeMountPoint") || "/mnt/data"
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
    nfsExports,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    rootBlockDevice: {
      volumeSize: stackConfig.requireNumber("rootBlockDeviceSize"),
      volumeType: stackConfig.get("rootBlockDeviceType") || "gp3",
    },
    securityGroupId: stackConfig.get("securityGroupId"), // Will be created in main.ts
    subnetId,
    suffix: stackConfig.require("suffix"),
    tags: stackConfig.getObject<{ [key: string]: string }>("tags"),
    userData,
    volumeId,
    volumeSize: stackConfig.getNumber("volumeSize") || 100,
    volumeType: stackConfig.get("volumeType") || "gp3",
    vpcId,
    vpcIpRange,
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
