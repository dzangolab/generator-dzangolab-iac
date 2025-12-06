import { getCallerIdentity, iam } from "@pulumi/aws";
import { Alias, Key } from "@pulumi/aws/kms";
import {
  Bucket,
  BucketPolicy,
  BucketPublicAccessBlock,
  BucketServerSideEncryptionConfiguration,
  BucketVersioning
} from "@pulumi/aws/s3";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const outputs: { [key: string]: any } = {};

  const name = config.name;

  const bucket = new Bucket(
    name,
    {
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

  new BucketVersioning(
    name,
    {
      bucket: bucket.id,
      versioningConfiguration: {
        status: "Suspended",
      }
    },
    options,
  );

  new BucketServerSideEncryptionConfiguration(
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
  const accountArns = config.awsAccountArns.filter((arn: string) => arn !== null && arn !== undefined);

  if (accountArns.length > 0) {
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

  outputs["bucketArn"] = interpolate`${bucket.arn}`;
  outputs["bucketId"] = interpolate`${bucket.id}`;
  outputs["pulumiBackendLoginCommand"] = interpolate`pulumi logout && pulumi login s3://${bucket.id}`;
  outputs["pulumiBackendUrl"] = interpolate`s3://${bucket.id}`;

  const encryptionProvider = config.encryptionProvider;

  switch (encryptionProvider) {
    case "passphrase":
      outputs["pulumiStackInitCommand"] = "pulumi stack init --secrets-provider=passphrase <project_name>.<stack_name>";
      break;

    case "awskms":
      const awsAccountId = (await getCallerIdentity()).accountId

      const encryptionKey = new Key(
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
          targetKeyId: encryptionKey.keyId,
        },
        options,
      );

      outputs["pulumiEncryptionProviderKeyId"] = interpolate`awskms:///${encryptionKey.keyId}`;
      outputs["pulumiEncryptionProviderKeyAlias"] = interpolate`awskms:///${alias.name}`;
      outputs["pulumiStackInitCommand"] = interpolate`pulumi stack init --secrets-provider='awskms:///${encryptionKey.keyId}' <project_name>.<stack_name>`;

      break;
  }

  return outputs;
};
