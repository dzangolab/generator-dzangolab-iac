import { aws } from "@dzangolab/pulumi";
import { interpolate } from "@pulumi/pulumi";
import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const outputs: { [key: string]: any } = {};

  const user = new aws.User(
    config.name,
    {
      accessKey: false,
      consoleAccess: false,
      policies: config.policies,
    },
    options
  );

  outputs["userArn"] = interpolate`${user.arn}`;
  outputs["username"] = interpolate`${user.name}`;

  if (config.useSesSmtp) {
    const sesSmtpUser = new aws.User(
      `{config.username}-ses`,
      {
        accessKey: false,
        sesSmtpUser: true,
      },
      options
    );

    outputs["sesSmtpUserArn"] = interpolate`${sesSmtpUser.arn}`;
    outputs["sesSmtpUsername"] = interpolate`${sesSmtpUser.name}`;
  }

  const secret = new aws.Secret(
    config.name,
    {
      recoveryWindowInDays: config.secretRecoveryWindowInDays,
    },
    options
  );

  outputs["secretArn"] = interpolate`${secret.arn}`;

  return outputs;
}
