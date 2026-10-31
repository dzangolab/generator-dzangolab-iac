import { cloudfront, iam, s3 } from "@pulumi/aws";
import { all, interpolate } from "@pulumi/pulumi";

import { createCertificate } from "./certificate";
import { getConfig } from "./config";
import { createRecords, getCertificateArn } from "./dns";

// AWS managed cache policy "Managed-CachingOptimized"
const CACHING_OPTIMIZED_POLICY_ID = "658327ea-f89d-4fab-a63d-7e88639e58f6";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const bucket = new s3.Bucket(
    config.bucket,
    {
      bucket: config.bucket,
    },
    options
  );

  new s3.BucketOwnershipControls(
    `${config.bucket}-ownership-controls`,
    {
      bucket: bucket.id,
      rule: {
        objectOwnership: "BucketOwnerEnforced",
      },
    },
    options
  );

  const publicAccessBlock = new s3.BucketPublicAccessBlock(
    `${config.bucket}-public-access-block`,
    {
      blockPublicAcls: true,
      blockPublicPolicy: true,
      bucket: bucket.id,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    options
  );

  new s3.BucketServerSideEncryptionConfiguration(
    `${config.bucket}-encryption`,
    {
      bucket: bucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
        },
      ],
    },
    options
  );

  const originAccessControl = new cloudfront.OriginAccessControl(
    `${config.bucket}-oac`,
    {
      description: `Origin access control for ${config.bucket}`,
      originAccessControlOriginType: "s3",
      signingBehavior: "always",
      signingProtocol: "sigv4",
    },
    options
  );

  const hostnames = config.domain
    ? config.aliases.map((alias) => getHostname(alias, config.domain!))
    : [];

  const certificate = hostnames.length > 0
    ? createCertificate(hostnames, options)
    : undefined;

  const certificateArn = certificate
    ? getCertificateArn(config, hostnames, certificate, options)
    : undefined;

  // CloudFront only serves custom hostnames covered by a validated certificate
  const aliases = certificateArn ? hostnames : [];

  const originId = `${config.bucket}-origin`;

  const distribution = new cloudfront.Distribution(
    `${config.bucket}-distribution`,
    {
      aliases,
      comment: `CDN for ${config.bucket}`,
      defaultCacheBehavior: {
        allowedMethods: ["GET", "HEAD", "OPTIONS"],
        cachedMethods: ["GET", "HEAD"],
        cachePolicyId: CACHING_OPTIMIZED_POLICY_ID,
        compress: true,
        targetOriginId: originId,
        viewerProtocolPolicy: "redirect-to-https",
      },
      defaultRootObject: config.defaultRootObject,
      enabled: true,
      httpVersion: "http2and3",
      isIpv6Enabled: true,
      origins: [
        {
          domainName: bucket.bucketRegionalDomainName,
          originAccessControlId: originAccessControl.id,
          originId,
        },
      ],
      priceClass: config.priceClass,
      restrictions: {
        geoRestriction: {
          restrictionType: "none",
        },
      },
      viewerCertificate: certificateArn
        ? {
          acmCertificateArn: certificateArn,
          minimumProtocolVersion: "TLSv1.2_2021",
          sslSupportMethod: "sni-only",
        }
        : {
          cloudfrontDefaultCertificate: true,
        },
    },
    options
  );

  // Only CloudFront (this distribution) may read from the bucket
  new s3.BucketPolicy(
    `${config.bucket}-policy`,
    {
      bucket: bucket.id,
      policy: all([bucket.arn, distribution.arn]).apply(([bucketArn, distributionArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Sid: "AllowCloudFrontServicePrincipalReadOnly",
              Effect: "Allow",
              Principal: {
                Service: "cloudfront.amazonaws.com",
              },
              Action: "s3:GetObject",
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: {
                  "AWS:SourceArn": distributionArn,
                },
              },
            },
          ],
        })
      ),
    },
    {
      ...options,
      dependsOn: [publicAccessBlock],
    }
  );

  // Policy to attach to users or roles that publish content to the CDN
  const publishPolicy = new iam.Policy(
    `${config.bucket}-publish-policy`,
    {
      description: `Publish content to the ${config.bucket} CDN`,
      policy: all([bucket.arn, distribution.arn]).apply(([bucketArn, distributionArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: ["s3:ListBucket"],
              Resource: bucketArn,
            },
            {
              Effect: "Allow",
              Action: ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
              Resource: `${bucketArn}/*`,
            },
            {
              Effect: "Allow",
              Action: ["cloudfront:CreateInvalidation"],
              Resource: distributionArn,
            },
          ],
        })
      ),
    },
    options
  );

  const dnsOutputs = certificate
    ? createRecords(config, hostnames, certificate, distribution, options)
    : {};

  return {
    "bucket-arn": bucket.arn,
    "bucket-name": bucket.bucket,
    "distribution-arn": distribution.arn,
    "distribution-domain-name": distribution.domainName,
    "distribution-id": distribution.id,
    "publish-policy-arn": publishPolicy.arn,
    urls: aliases.length > 0
      ? aliases.map((hostname) => `https://${hostname}`)
      : [interpolate`https://${distribution.domainName}`],
    ...dnsOutputs,
  };
}

function getHostname(alias: string, domain: string) {
  return alias === "@" || alias === "" ? domain : `${alias}.${domain}`;
}
