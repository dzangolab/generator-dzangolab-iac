import { Volume } from "@pulumi/aws/ebs";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const availabilityZone = config.availabilityZone;
  const size = config.size;

  const volume = new Volume(
    `${config.name}-${availabilityZone}`,
    {
      availabilityZone,
      size,
      tags: {
        Name: `${config.name}-${availabilityZone}`,
        ...config.tags
      }
    },
    options
  );

  return {
    arn: interpolate`${volume.arn}`,
    id: interpolate`${volume.id}`,
  };
}
