import { aws } from "@dzangolab/pulumi";
import { interpolate, Output } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const buckets = config.buckets;
  const folders = config.folders;

  const outputs = {} as { [key: string]: Output<string> };

  for (const name in buckets) {
    const bucketName = buckets[name];

    const bucket = new aws.S3Bucket(
      bucketName,
      {
        folders: folders[name],
      },
      options
    );

    outputs[`${name}-bucket-arn`] = interpolate`${bucket.arn}`;
    outputs[`${name}-bucket-policy-arn`] = interpolate`${bucket.policyArn}`;
  }

  return outputs;
}
