import { getZoneOutput, DnsRecord } from "@pulumi/cloudflare";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const zone = getZoneOutput({ name: config.domain });

  const hostname = getHostname(config.host, config.subdomain)

  const records = [];

  if (config.ip) {
    const record = new DnsRecord(
      `${hostname}.${config.domain}`,
      {
        content: config.ip,
        name: hostname,
        proxied: false,
        type: "A",
        ttl: config.ttl,
        zoneId: zone.zone.Id as unknown as string,
      },
      options
    );

    records.push(interpolate`A ${record.ttl} ${record.name} ${record.content} [proxied: ${record.proxied}]`);
  }

  for (let i = 0, aliases = config.aliases; i < aliases.length; i++) {
    const alias = getHostname(aliases[i], config.subdomain);

    const record = new DnsRecord(
      `${alias}.${config.domain}`,
      {
        content: `${hostname}.${config.domain}`,
        name: alias,
        proxied: false,
        type: "CNAME",
        ttl: config.ttl,
        zoneId: zone.zoneId as unknown as string,
      },
      options
    );

    records.push(interpolate`A ${record.ttl} ${record.name} ${record.content} [proxied: ${record.proxied}]`);
  }

  return {
    domain: config.domain,
    records,
  };
}

function getHostname(host: string, subdomain?: string) {
  const tokens = [host];

  if (subdomain) {
    tokens.push(subdomain);
  }

  return tokens.join(".");
}
