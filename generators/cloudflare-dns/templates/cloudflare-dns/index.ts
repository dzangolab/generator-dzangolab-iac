import { getZone, Record } from "@pulumi/cloudflare";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const zone = getZone({ name: config.domain });

  const hostname = getHostname(config.host, config.subdomain)

  const outputs: { [key: string]: any } = {};

  if (config.ip) {
    const host = new Record(
      `${hostname}.${config.domain}`,
      {
        content: config.ip,
        name: hostname,
        proxied: false,
        type: "A",
        ttl: config.ttl,
        zoneId: zone.then((zone) => zone.id),
      },
      options
    );

    outputs["a"] = interpolate`${host}`;
  }

  for (let i = 0, aliases = config.aliases; i < aliases.length; i++) {
    const alias = getHostname(aliases[i], config.subdomain);

    new Record(
      `${alias}.${config.domain}`,
      {
        content: `${hostname}.${config.domain}`,
        name: alias,
        proxied: false,
        type: "CNAME",
        ttl: config.ttl,
        zoneId: zone.then((zone) => zone.id),
      },
      options
    );
  }

  return {
    ...outputs,
    domain: config.domain,
  };
}

function getHostname(host: string, subdomain?: string) {
  const tokens = [host];

  if (subdomain) {
    tokens.push(subdomain);
  }

  return tokens.join(".");
}
