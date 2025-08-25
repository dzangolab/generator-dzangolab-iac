import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  return {
    managerToken: config.managerToken,
    workerToken: config.workerToken
  };
};
