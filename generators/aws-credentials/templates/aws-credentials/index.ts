import { AccessKey } from "@pulumi/aws/iam";
import { SecretVersion } from "@pulumi/aws/secretsmanager";
import {
  interpolate,
  jsonStringify,
  Output,
} from "@pulumi/pulumi";
import { RandomPassword } from "@pulumi/random";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const secretValue: { [key: string]: Output<string> } = {};

  const passwordLength = config.passwordLength || 24;

  for (const p of config.passwords) {
    const password = new RandomPassword(
      `${config.name}-${p}-password`,
      {
        keepers: {
          timestamp: config.timestamp,
        },
        length: passwordLength,
      },
      options
    );

    secretValue[`${p}-password`] = password.result;
  }

  const accessKey = new AccessKey(
    `${config.name}-${config.username}`,
    {
      user: config.username,
    },
    options
  );

  secretValue["aws-access-key-id"] = accessKey.id;
  secretValue["aws-secret-access-key"] = accessKey.secret;

  if (config.sesSmtpUser) {
    const sesSmtpAccessKey = new AccessKey(
      `${config.name}-ses`,
      {
        user: config.sesSmtpUser,
      },
      options
    );

    secretValue["ses-smtp-username"] = sesSmtpAccessKey.id;
    secretValue["ses-smtp-password"] = sesSmtpAccessKey.sesSmtpPasswordV4;
  }

  const version = new SecretVersion(
    config.name,
    {
      secretId: config.secretArn,
      secretString: jsonStringify(secretValue),
    },
    options
  );

  return {
    secretVersionArn: interpolate`${version.arn} `,
    secretVersionId: interpolate`${version.id} `,
    secretVersionVersionId: interpolate`${version.versionId} `,
  };
}
