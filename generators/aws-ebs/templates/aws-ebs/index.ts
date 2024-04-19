import { Volume } from "@pulumi/aws/ebs";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const availabilityZones = config.availabilityZones as string[];
  const count = availabilityZones.length;
  const sizes = config.sizes as number[];
  const volumes: Volume[] = [];

  for (let i = 0; i < count; i++) {
    const availabilityZone = availabilityZones[i];

    const volume = new Volume(
      `${config.name}-${config.suffix}-${availabilityZone}`,
      {
        availabilityZone,
        size: sizes[i],
        tags: {
          Name: `${config.name}-${config.suffix}-${availabilityZone}`,
          ...config.tags
        }
      },
      options
    );

    volumes.push(volume);
  }

  return {
    arns: volumes.map(volume => interpolate`${volume.arn}`),
    ids: volumes.map(volume => interpolate`${volume.id}`),
  };
}
