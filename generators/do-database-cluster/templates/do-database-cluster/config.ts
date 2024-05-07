import {
  Config,
  getOrganization,
  getStack,
  StackReference,
  StackReferenceOutputDetails
} from "@pulumi/pulumi";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  const doResourcesProject = stackConfig.get("doResourcesProject") || "do-resources";

  const resourcesStack = new StackReference(`${organization}/${doResourcesProject}/${stack}`);

  const projectIdOutput = await resourcesStack.getOutputDetails("projectId");
  const projectId = getValue<string>(projectIdOutput);

  const vpcIpRangeOutput = await resourcesStack.getOutputDetails("vpcIpRange");
  const vpcIpRange = getValue<string>(vpcIpRangeOutput);

  const vpcUuidOutput = await resourcesStack.getOutputDetails("vpcId");
  const vpcUuid = getValue<string>(vpcUuidOutput);

  return {
    database: stackConfig.get("database") || `${organization}`,
    databaseUsername: stackConfig.get("databaseUsername") || `${organization}`,
    engine: stackConfig.get("engine") || "pg",
    name: stackConfig.get("name") || stack,
    nodeCount: stackConfig.getNumber("nodeCount") || 1,
    projectId,
    protect: stackConfig.getBoolean("protect"),
    region: stackConfig.require("region"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    size: stackConfig.get("size") || "db-s-1vcpu-1gb",
    version: stackConfig.get("version") || "16",
    vpcIpRange,
    vpcUuid
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