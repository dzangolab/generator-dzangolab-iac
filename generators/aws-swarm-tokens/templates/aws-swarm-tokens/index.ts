import { remote } from "@pulumi/command";
import { secret } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {

  const config = await getConfig();

  if (!config.leaderIp) {
    throw new Error("leaderIp is required but was not provided or found");
  }

  const conn = {
    host: config.leaderIp,
    user: "ec2-user",
    agentSocketPath: process.env.SSH_AUTH_SOCK,
    ...(config.bastionIp && {
      proxy: {
        host: config.bastionIp,
        user: "ec2-user",
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
    workerToken: secret(workerToken)
  };
};
