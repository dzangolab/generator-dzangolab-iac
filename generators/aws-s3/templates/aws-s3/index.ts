import { aws } from "@dzangolab/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const bucketNames = config.buckets;

  const buckets = {} as { [key: string]: string };

  for (let i = 0; i < bucketNames.length; i++) {
    const name = bucketNames[i];

    const bucket = new aws.S3Bucket(
      name,
      {
        name: name
      },
      options
    );

    buckets[name] = bucket.arn;
  }

  return buckets;
}
