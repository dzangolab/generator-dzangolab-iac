import { getCallerIdentity, iam } from "@pulumi/aws";
import { Alias, Key } from "@pulumi/aws/kms";
import {
  BucketV2,
  BucketPolicy,
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

  const bucket = new BucketV2(
    name,
    {
      bucket: name,
      forceDestroy: config.forceDestroy,
    },
    options,
  );

  new BucketPublicAccessBlock(
    name,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    options,
  );

  new BucketVersioningV2(
    name,
    {
      bucket: bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      }
    },
    options,
  );

  new BucketServerSideEncryptionConfigurationV2(
    name,
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

  // Filter out null values and ensure a clean array
  const accountArns = config.awsAccountArns.filter((arn) => arn !== null && arn !== undefined);

  if (accountArns.length > 0){
    // Create a bucket policy allowing access from multiple accounts
    const policy = iam.getPolicyDocumentOutput({
      statements: [
        {
          principals: [
            {
              type: "AWS",
              identifiers: accountArns,
            },
          ],
          actions: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket",
          ],
          resources: [
            bucket.arn,
            interpolate`${bucket.arn}/*`,
          ],
        },
      ],
    });

    // Apply the policy to the bucket
    new BucketPolicy(
      name,
      {
        bucket: bucket.id,
        policy: policy.json,
      }
    );
  }

  const awsAccountId = (await getCallerIdentity()).accountId

  const secretsEncryptionKey = new Key(
    name,
    {
      description: "Key use to encrypt secrets",
      deletionWindowInDays: config.keyDeletionWindow,
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

  const alias = new Alias(
    name,
    {
      name: `alias/${name}`,
      targetKeyId: secretsEncryptionKey.keyId,
    },
    options,
  );

  return {
    bucketArn: interpolate`${bucket.arn}`,
    bucketId: interpolate`${bucket.id}`,
    pulumiBackendLoginCommand: interpolate`pulumi login s3://${bucket.id}`,
    pulumiBackendUrl: interpolate`s3://${bucket.id}`,
    pulumiSecretsProviderKeyId: interpolate`awskms:///${secretsEncryptionKey.keyId}`,
    pulumiSecretsProviderKeyAlias: interpolate`awskms:///${alias.name}`,
    pulumiStackInitCommand: interpolate`pulumi stack init --secrets-provider='awskms:///${secretsEncryptionKey.keyId}' <project_name>.<stack_name>`,
  };
};
