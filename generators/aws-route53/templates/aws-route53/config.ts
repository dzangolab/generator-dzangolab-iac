import {
  Config,
  getOrganization,
  getStack,
  StackReference,
} from "@pulumi/pulumi";
  
import type { StackReferenceOutputDetails } from "@pulumi/pulumi";

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();

  let ip = stackConfig.get("ip");

  /** OR: Obtain ip address form another pulumi project  **/
  if (!ip) {
    const ipStack = 
      new StackReference(`${organization}/PROJECT/${stack}`);
    const ipOutput = await ipStack.getOutputDetails("ip");
    ip = getValue<string>(ipOutput);
  }

  let host = stackConfig.get("host");

  /** OR: get host from another pulumi project **/

  if (!host) {
    const swarmLeaderStack = 
      new StackReference(`${organization}/PROJECT/${stack}`);
    const hostOutput = await swarmLeaderStack.getOutputDetails("name");
    host = getValue<string>(hostOutput);
  }

  return {
    aliases: stackConfig.requireObject<string[]>("aliases"),
    domain: stackConfig.require("domain"),
    host,
    ip,
    name: stack,
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