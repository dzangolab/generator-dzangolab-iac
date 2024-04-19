import {
  Project,
  ProjectResources,
  ReservedIp,
  Volume,
  Vpc
} from "@pulumi/digitalocean";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const outputs: { [key: string]: any } = {};

  const project = new Project(
    config.name,
    {
      description: config.description,
      environment: config.environment,
      name: config.name,
      purpose: "Web Application",
    },
    options
  );

  outputs["projectId"] = interpolate`${project.id}`;

  const vpc = new Vpc(
    config.name,
    {
      ipRange: config.ipRange,
      name: config.name,
      region: config.region,
    },
    options
  );

  outputs["vpcId"] = interpolate`${vpc.id}`;
  outputs["vpcIpRange"] = interpolate`${vpc.ipRange}`;

  const reservedIp = new ReservedIp(
    config.name,
    {
      region: config.region,
    },
    options
  );

  outputs["reservedIpId"] = interpolate`${reservedIp.id}`;
  outputs["ip"] = interpolate`${reservedIp.id}`;

  if (config.dataVolumeSize) {
    const volume = new Volume(
      config.name,
      {
        description: `Block-storage volume for ${config.name}`,
        initialFilesystemType: "ext4",
        name:config.name,
        region: config.region,
        size: config.dataVolumeSize,
      },
      options
    );

    new ProjectResources(
      config.name,
      {
        project: project.id,
        resources: [volume.volumeUrn],
      },
      options
    );

    outputs["volumeId"] = interpolate`${volume.id}`;
    outputs["volumeName"] = interpolate`${volume.name}`;
  }

  return outputs;
}
