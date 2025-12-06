import {
  DomainDkim,
  DomainIdentity,
  DomainIdentityVerification
} from "@pulumi/aws/ses";
import { getZone, DNSRecord } from "@pulumi/cloudflare";
import { interpolate } from "@pulumi/pulumi";
import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const outputs: { [key: string]: any } = {};

  const domains = config.domains;

  for (const domain of domains) {
    const identity = new DomainIdentity(
      `${domain}-${config.name}`,
      {
        domain
      },
      options
    );

    const zone = getZone({ name: domain });

    const verificationRecord = new DNSRecord(
      `${domain}-${config.name}`,
      {
        content: interpolate`${identity.verificationToken}`,
        name: interpolate`${identity.id}`,
        proxied: false,
        type: "TXT",
        zoneId: zone.then((zone) => zone.id),
      },
      options
    );
    
    new DomainIdentityVerification(
      `${domain}-${config.name}`,
      {
        domain, 
      },
      {
        dependsOn: [verificationRecord],
      }
    );

    const dkim = new DomainDkim(
      `${domain}-${config.name}`,
      {
        domain,
      }
    );

    const dkimRecords: DNSRecord[] = [];

    for (let i = 0; i < 3; i++) {
      dkimRecords.push(new DNSRecord(
        `${domain}-${config.name}-dkim-${i}`,
        {
          name: dkim.dkimTokens.apply(dkimTokens => `${dkimTokens[i]}._domainkey`),
          proxied: false,
          type: "CNAME",
          value: dkim.dkimTokens.apply(dkimTokens => `${dkimTokens[i]}.dkim.amazonses.com`),
          zoneId: zone.then((zone) => zone.id),
        }
      ));
    }

    outputs[domain]= {
      arn: interpolate`${identity.arn}`,
      id: interpolate`${identity.id}`,
      verificationToken: interpolate`${identity.verificationToken}`,
    };
  }

  return outputs;
}
