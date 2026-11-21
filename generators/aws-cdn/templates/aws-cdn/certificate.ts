import { acm } from "@pulumi/aws";
import type { CustomResourceOptions, Output } from "@pulumi/pulumi";

// CloudFront only accepts ACM certificates issued in us-east-1
export const CERTIFICATE_REGION = "us-east-1";

export const createCertificate = (
  hostnames: string[],
  options: CustomResourceOptions,
) => {
  return new acm.Certificate(
    `${hostnames[0]}-certificate`,
    {
      domainName: hostnames[0],
      region: CERTIFICATE_REGION,
      subjectAlternativeNames: hostnames.slice(1),
      validationMethod: "DNS",
    },
    options
  );
};

// The order of domainValidationOptions is not guaranteed to match the hostnames
export const getValidationOption = (
  certificate: acm.Certificate,
  hostname: string,
): Output<{ name: string; type: string; value: string }> => {
  return certificate.domainValidationOptions.apply((validationOptions) => {
    const validationOption = validationOptions.find(
      (validationOption) => validationOption.domainName === hostname
    )!;

    return {
      name: validationOption.resourceRecordName!,
      type: validationOption.resourceRecordType!,
      value: validationOption.resourceRecordValue!,
    };
  });
};

export const validateCertificate = (
  hostnames: string[],
  certificate: acm.Certificate,
  validationRecordFqdns: Output<string>[] | undefined,
  options: CustomResourceOptions,
) => {
  const validation = new acm.CertificateValidation(
    `${hostnames[0]}-certificate-validation`,
    {
      certificateArn: certificate.arn,
      region: CERTIFICATE_REGION,
      validationRecordFqdns,
    },
    options
  );

  return validation.certificateArn;
};
