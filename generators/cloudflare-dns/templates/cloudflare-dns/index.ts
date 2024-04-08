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

  const host = new Record(
    `${hostname}.${config.domain}`,
    {
      name: hostname,
      proxied: false,
      type: "A",
      ttl: config.ttl,
      value: config.ip,
      zoneId: zone.then((zone) => zone.id),
    },
    options
  );

  for (let i = 0, aliases = config.aliases; i < aliases.length; i++) {
    const alias = getHostname(aliases[i], config.subdomain);

    new Record(
      `${alias}.${config.domain}`,
      {
        name: alias,
        proxied: false,
        type: "CNAME",
        ttl: config.ttl,
        value: `${hostname}.${config.domain}`,
        zoneId: zone.then((zone) => zone.id),
      },
      options
    );
  }

  return {
    a: interpolate`${host}`,
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