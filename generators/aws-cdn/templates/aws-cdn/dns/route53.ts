import { acm, cloudfront, route53 } from "@pulumi/aws";
import type { CustomResourceOptions } from "@pulumi/pulumi";

import { getValidationOption, validateCertificate } from "./certificate";
import type { CdnConfig } from "./config";

export const getCertificateArn = (
  config: CdnConfig,
  hostnames: string[],
  certificate: acm.Certificate,
  options: CustomResourceOptions,
) => {
  const zone = route53.getZoneOutput({ name: config.domain });

  const validationRecords = hostnames.map((hostname) => {
    const validationOption = getValidationOption(certificate, hostname);

    return new route53.Record(
      `${hostname}-certificate-validation`,
      {
        allowOverwrite: true,
        name: validationOption.name,
        records: [validationOption.value],
        ttl: 300,
        type: validationOption.type,
        zoneId: zone.zoneId,
      },
      options
    );
  });

  return validateCertificate(
    hostnames,
    certificate,
    validationRecords.map((record) => record.fqdn),
    options
  );
};

export const createRecords = (
  config: CdnConfig,
  hostnames: string[],
  certificate: acm.Certificate,
  distribution: cloudfront.Distribution,
  options: CustomResourceOptions,
) => {
  const zone = route53.getZoneOutput({ name: config.domain });

  for (const hostname of hostnames) {
    for (const type of ["A", "AAAA"]) {
      new route53.Record(
        `${hostname}-${type}`,
        {
          aliases: [
            {
              evaluateTargetHealth: false,
              name: distribution.domainName,
              zoneId: distribution.hostedZoneId,
            },
          ],
          name: hostname,
          type,
          zoneId: zone.zoneId,
        },
        options
      );
    }
  }

  return {};
};
