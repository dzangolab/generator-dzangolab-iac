import { remote } from "@pulumi/command";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const conn = {
    host: config.leaderIp,
    user: "ec2-user",
    agentSocketPath: process.env.SSH_AUTH_SOCK,
    proxy: config.bastionIp 
      ? {
      host: config.bastionIp as string,
      user: "ec2-user",
      agentSocketPath: process.env.SSH_AUTH_SOCK,
    } : {}
  };

  const getWorkerToken = new remote.Command(
    "get-worker-token", 
    {
      connection: conn,
      create: `sudo docker swarm join-token worker -q`,
    },
  );

  const workerToken = getWorkerToken.stdout;

  const getManagerToken = new remote.Command(
    "get-manager-token", 
    {
      connection: conn,
      create: `sudo docker swarm join-token manager -q`,
    },
  );

  const managerToken = getManagerToken.stdout;

  return {
    managerToken: secret(managerToken),
    name: config.name,
    workerToken: secret(workerToken),
  };
}
