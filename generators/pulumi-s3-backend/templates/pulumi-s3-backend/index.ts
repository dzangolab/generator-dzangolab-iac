import { getCallerIdentity } from "@pulumi/aws";
import { Key } from "@pulumi/aws/kms";
import {
  Bucket,
  BucketPublicAccessBlock,
  BucketServerSideEncryptionConfigurationV2,
  BucketVersioningV2
} from "@pulumi/aws/s3";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const name = config.name;

  const bucket = new Bucket(
    name,
    {
      acl: "private",
      bucket: name,
      forceDestroy: config.forceDestroy,
    },
    options
  );

  new BucketServerSideEncryptionConfigurationV2(
    `${name}-encryption`,
    {
      bucket: bucket.id,
      rules: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: "AES256",
        },
      }]
    },
    options,
  );

  new BucketVersioningV2(
    `${name}-versioning`,
    {
      bucket: bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      }
    },
    options,
  );

  new BucketPublicAccessBlock(
    `${name}-public-access-block`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    options,
  );

  const awsAccountId = getCallerIdentity().accountId

  const secretsEncryptionKey = new Key(
    `${name}-secrets-encryption-key`,
    {
      description: "Key use to encrypt secrets",
      deletionWindowInDays: 10,
      policy: JSON.stringify(
        {
          Version: "2012-10-17",
          Statement: [
            // policy which gives the AWS account that owns the KMS key full access to the KMS key
            {
              Sid: "Enable IAM policies",
              Effect: "Allow",
              Action: "kms:*",
              Principal: {
                AWS: [`arn:aws:iam::${awsAccountId}:root`]
              },
              Resource: "*",
            },
          ],
        },
      ),
    },
    options,
  );

  return {
    bucketArn: interpolate`${bucket.arn}`,
    bucketId: interpolate`${bucket.id}`,
    pulumiBackendLoginCommand: interpolate`pulumi login s3://${bucket.id}`,
    pulumiBackendUrl: interpolate`s3://${bucket.id}`,
    pulumiSecretsProvider: interpolate`awskms:///${secretsEncryptionKey.keyId}`,
    pulumiStackInitCommand: interpolate`pulumi stack init --secrets-provider='awskms:///${secretsEncryptionKey.keyId}' <project_name>.<stack_name>`,
  };
};