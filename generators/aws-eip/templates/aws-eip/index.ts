import { Eip } from "@pulumi/aws/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const eip = new Eip(
    `${config.name}`,
    {
      tags: {
        Name: `${config.name}`,
      }
    },
    options
  );

  return {
    eip: interpolate`${eip.publicIp}`,
    eipId: interpolate`${eip.id}`,
    ip: interpolate`${eip.publicIp}`
  };
}
