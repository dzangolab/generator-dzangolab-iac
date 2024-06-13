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

  const createHostRecord = stackConfig.getBoolean("createHostRecord");

  let ip = null;

  if (createHostRecord) {
    let ip = stackConfig.get("ip");

    if (!ip) {
      const ipProject = stackConfig.get("ipProject") || "do-resources";
      const resourcesStack = new StackReference(`${organization}/${ipProject}/${stack}`);
      const ipOutput = await resourcesStack.getOutputDetails("ip");
      ip = getValue<string>(ipOutput);
    }
  }

  let host = stackConfig.get("host");

  if (!host) {
    const hostProject = stackConfig.get("hostProject") || "do-swarm-leader";
    const hostStack = new StackReference(`${organization}/${hostProject}/${stack}`);
    const hostOutput = await hostStack.getOutputDetails("name");
    host = getValue<string>(hostOutput);
  }

  return {
    aliases: stackConfig.getObject<string[]>("aliases") || [],
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
