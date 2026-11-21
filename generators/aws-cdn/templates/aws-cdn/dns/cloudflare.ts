import { acm, cloudfront } from "@pulumi/aws";
import { DnsRecord, getZoneOutput } from "@pulumi/cloudflare";
import type { CustomResourceOptions } from "@pulumi/pulumi";

import { getValidationOption, validateCertificate } from "./certificate";
import type { CdnConfig } from "./config";

// Cloudflare "automatic" TTL
const TTL_AUTO = 1;

export const getCertificateArn = (
  config: CdnConfig,
  hostnames: string[],
  certificate: acm.Certificate,
  options: CustomResourceOptions,
) => {
  const zone = getZoneOutput({ filter: { name: config.domain } });

  const validationRecords = hostnames.map((hostname) => {
    const validationOption = getValidationOption(certificate, hostname);

    return new DnsRecord(
      `${hostname}-certificate-validation`,
      {
        content: validationOption.value.apply(stripTrailingDot),
        name: validationOption.name.apply(stripTrailingDot),
        // Validation records must not be proxied
        proxied: false,
        ttl: TTL_AUTO,
        type: validationOption.type,
        zoneId: zone.zoneId,
      },
      options
    );
  });

  return validateCertificate(
    hostnames,
    certificate,
    undefined,
    {
      ...options,
      dependsOn: validationRecords,
    }
  );
};

export const createRecords = (
  config: CdnConfig,
  hostnames: string[],
  certificate: acm.Certificate,
  distribution: cloudfront.Distribution,
  options: CustomResourceOptions,
) => {
  const zone = getZoneOutput({ filter: { name: config.domain } });

  for (const hostname of hostnames) {
    // Cloudflare flattens CNAME records at the zone apex
    new DnsRecord(
      `${hostname}-CNAME`,
      {
        content: distribution.domainName,
        name: hostname,
        // DNS only: proxying through Cloudflare would put a second CDN in front of CloudFront
        proxied: false,
        ttl: TTL_AUTO,
        type: "CNAME",
        zoneId: zone.zoneId,
      },
      options
    );
  }

  return {};
};

const stripTrailingDot = (value: string) => value.replace(/\.$/, "");
