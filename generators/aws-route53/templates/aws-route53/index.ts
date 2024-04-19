import { getZone, Record, RecordType } from "@pulumi/aws/route53";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const zone = getZone({ name: config.domain });

  const hostname = getHostname(config.host)
  
  const host = new Record(
    `${hostname}.${config.domain}`,
    {
      name: hostname,
      records: [
        config.ip,
      ],
      type: RecordType.A,
      ttl: config.ttl,
      zoneId: zone.then(zone => zone.zoneId),
    },
    options
  );

  for (let i = 0, aliases = config.aliases; i < aliases.length; i++) {
    const alias = getHostname(aliases[i], config.subdomain);

    new Record(
      `${alias}.${config.domain}`,
      {
        name: alias,
        records: [
          `${hostname}.${config.domain}`,
        ],
        type: RecordType.CNAME,
        ttl: config.ttl,
        zoneId: zone.then(zone => zone.zoneId),
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