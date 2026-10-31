import { acm, cloudfront } from "@pulumi/aws";
import { all, type CustomResourceOptions } from "@pulumi/pulumi";

import { getValidationOption, validateCertificate } from "./certificate";
import type { CdnConfig } from "./config";

// DNS is managed outside of this project: the required DNS records are exported as
// stack outputs, and the certificate is only attached to the distribution once
// `certificateValidated` is set to true in the stack config.
export const getCertificateArn = (
  config: CdnConfig,
  hostnames: string[],
  certificate: acm.Certificate,
  options: CustomResourceOptions,
) => {
  if (!config.certificateValidated) {
    return undefined;
  }

  return validateCertificate(hostnames, certificate, undefined, options);
};

export const createRecords = (
  config: CdnConfig,
  hostnames: string[],
  certificate: acm.Certificate,
  distribution: cloudfront.Distribution,
  options: CustomResourceOptions,
) => {
  return {
    "certificate-status": certificate.status,
    "certificate-validation-records": all(
      hostnames.map((hostname) => getValidationOption(certificate, hostname))
    ),
    "dns-records": hostnames.map((hostname) => ({
      name: hostname,
      type: hostname === config.domain ? "ALIAS" : "CNAME",
      value: distribution.domainName,
    })),
  };
};
