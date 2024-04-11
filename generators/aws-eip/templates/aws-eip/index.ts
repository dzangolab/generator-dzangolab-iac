import { Eip } from "@pulumi/aws/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const eip = new Eip(
    config.name,
    {
      tags: {
        Name: config.name,
      }
    },
    {
      protect: config.protect,
      retainOnDelete: config.retainOnDelete,
    },
  );

  return {
    eip: interpolate`${eip.publicIp}`,
    eipId: interpolate`${eip.id}`
  };
}
