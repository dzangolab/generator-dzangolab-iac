import {
  DatabaseCluster,
  DatabaseDb,
  DatabaseFirewall,
  DatabaseUser
} from "@pulumi/digitalocean";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const cluster = new DatabaseCluster(
    config.name,
    {
      engine: config.engine,
      nodeCount: config.nodeCount,
      privateNetworkUuid: config.vpcUuid,
      projectId: config.projectId,
      region: config.region,
      size: config.size,
      version: config.version
    },
    options
  );

  const database = new DatabaseDb(
    config.database,
    {
      clusterId: cluster.id,
      name: config.database,
    },
    options
  );

  const databaseUser = new DatabaseUser(
    config.databaseUsername,
    {
      clusterId: cluster.id
    },
    options
  );

  const firewall = new DatabaseFirewall(
    config.name,
    {
      clusterId: cluster.id,
      rules: [
        {
          type: "ip_addr",
          value: config.vpcIpRange
        }
      ]
    },
    options
  );

  return {
    host: cluster.host,
    clusterId: cluster.id,
    port: cluster.port,
    rootPassword: cluster.password,
    rootUser: cluster.user,
    userId: databaseUser.id,
    userName: databaseUser.name,
    userPassword: databaseUser.password
  }
}
