import { remote } from "@pulumi/command";
import { secret } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {

  const config = await getConfig();

  if (!config.managerIp) {
    throw new Error("managerIp is required but was not provided or found");
  }

  const conn = {
    host: config.managerIp,
    user: config.user,
    agentSocketPath: process.env.SSH_AUTH_SOCK,
    ...(config.bastionIp && {
      proxy: {
        host: config.bastionIp,
        user: config.user,
        agentSocketPath: process.env.SSH_AUTH_SOCK,
      },
    }),
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
