import { Config } from "@pulumi/pulumi";

export type CdnConfig = Awaited<ReturnType<typeof getConfig>>;

export const getConfig = async () => {
  const stackConfig = new Config();

  const domain = stackConfig.get("domain") || undefined;

  return {
    aliases: domain ? stackConfig.getObject<string[]>("aliases") || [] : [],
    bucket: stackConfig.require("bucket"),
<% if (dnsProvider === "other") { -%>
    certificateValidated: stackConfig.getBoolean("certificateValidated") || false,
<% } -%>
    defaultRootObject: stackConfig.get("defaultRootObject") || undefined,
<% if (dnsProvider === "other") { -%>
    domain,
<% } else { -%>
    domain: domain!,
<% } -%>
    priceClass: stackConfig.get("priceClass") || "PriceClass_100",
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
  };
};
