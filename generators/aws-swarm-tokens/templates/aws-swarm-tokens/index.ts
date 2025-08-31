import { remote } from "@pulumi/command";
import { secret } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {

  const config = await getConfig();

  if (config.useBastion && !config.bastionIp) {
    throw new Error("Bastion ip address is required but was not provided or found");
  }

  if (!config.managerIp) {
    throw new Error("Manager ip address is required but was not provided or found");
  }

  let conn: {
    host: string; 
    user: string;
    agentSocketPath?: string;
    proxy?: {
      host: string;
      user: string;
      agentSocketPath?: string;
    }
  } = {
    host: config.managerIp,
    user: config.user,
    agentSocketPath: process.env.SSH_AUTH_SOCK,
  };

  if (config.bastionIp) {
    conn["proxy"] = {
      host: config.bastionIp,
      user: config.user,
      agentSocketPath: process.env.SSH_AUTH_SOCK,
    };
  };

  const getWorkerToken = new remote.Command(
    "get-worker-token", 
    {
      connection: conn,
      create: `sudo docker swarm join-token worker -q`,
    },
  );

  const workerToken = secret(getWorkerToken.stdout);

  const getManagerToken = new remote.Command(
    "get-manager-token", 
    {
      connection: conn,
      create: `sudo docker swarm join-token manager -q`,
    },
  );

  const managerToken = secret(getManagerToken.stdout);

  return {
    managerToken,
    workerToken
  };
};
