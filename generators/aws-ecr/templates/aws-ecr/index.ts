import { Repository } from "@pulumi/awsx/ecr";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const images = config.images;

  const repos = [];

  for (let i = 0; i < images.length; i++) {
    const name = images[i];

    repos.push(new Repository(
      name,
      {
        name: name
      },
      options
    ));
  }

  return {
    repos: repos.map(repo => repo.url),
  };
}
