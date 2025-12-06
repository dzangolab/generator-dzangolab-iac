import {
  DomainDkim,
  DomainIdentity,
  DomainIdentityVerification
} from "@pulumi/aws/ses";
import { getZoneOutput, DnsRecord } from "@pulumi/cloudflare";
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

    const zone = getZoneOutput({
      filter: {
        name: domain
      }
    });

    const verificationRecord = new DnsRecord(
      `${domain}-${config.name}`,
      {
        content: interpolate`${identity.verificationToken}`,
        name: interpolate`${identity.id}`,
        proxied: false,
        ttl: config.ttl,
        type: "TXT",
        zoneId: zone.zoneId as unknown as string,
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

    const dkimRecords: DnsRecord[] = [];

    for (let i = 0; i < 3; i++) {
      dkimRecords.push(new DnsRecord(
        `${domain}-${config.name}-dkim-${i}`,
        {
          content: dkim.dkimTokens.apply(dkimTokens => `${dkimTokens[i]}.dkim.amazonses.com`),
          name: dkim.dkimTokens.apply(dkimTokens => `${dkimTokens[i]}._domainkey`),
          proxied: false,
          ttl: config.ttl,
          type: "CNAME",
          zoneId: zone.zoneId as unknown as string,
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
