import { getZone, Record } from "@pulumi/cloudflare";
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

  let ip = stackConfig.get("ip");

  if (!ip) {
    const doResourcesProject = stackConfig.get("do-resources-stack") || "do-resources";
    const resourcesStack = new StackReference(`${organization}/${doResourcesProject}/${stack}`);
    const reservedIpIdOutput = await resourcesStack.getOutputDetails("reservedIpId");
    ip = getValue<string>(reservedIpIdOutput);
  }

  let host = stackConfig.get("host");

  if (!host) {
    const doSwarmLeaderProject = stackConfig.get("do-swarm-leader-stack") || "do-swarm-leader";
    const swarmLeaderStack = new StackReference(`${organization}/${doSwarmLeaderProject}/${stack}`);
    const hostOutput = await swarmLeaderStack.getOutputDetails("name");
    host = getValue<string>(hostOutput);
  }

  return {
    aliases: stackConfig.requireObject<string[]>("aliases"),
    domain: stackConfig.require("domain"),
    host,
    ip,
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    subdomain: stackConfig.get("subdomain"),
    ttl: stackConfig.getNumber("ttl") || 3600,
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