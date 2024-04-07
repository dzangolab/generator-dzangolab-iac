import { Repository } from "@pulumi/awsx/ecr";
import { config } from "dotenv";

config({ path: "../.env" });

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const images = config.images;

  const repos = [];

  for (let i = 0; i < images.length; i++) {
    const name = images[i];

    repos.push(new Repository(
      name,
      {
        name: name
      },
      {
        protect: config.protect,
        retainOnDelete: config.retainOnDelete,
      }
    ));
  }

  return {
    repos: repos.map(repo => repo.url),
  };
}
