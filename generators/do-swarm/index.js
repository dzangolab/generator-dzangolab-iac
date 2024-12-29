import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanDockerSwarmGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean swarm";
    this.name = "do-swarm";
    this.resourcesList = [
      "do-resources",
      "do-swarm-leader",
      "cloudflare-dns",
      "ansible-do"
    ];
  }

  async prompting() {
    this.props = await this.prompt([
      {
        default: this.DEFAULT_PROJECT_NAME,
        message: "Enter the name of the do-resources nameSuffix",
        name: "nameSuffix",
        type: "input",
      },
      {
        default: "sgp1",
        message: "Enter the name of the do-resrouces and do-swarm-leader region",
        name: "region",
        type: "input",
      },
      {
        default: "staging",
        message: "Enter the name of the do-resources environment",
        name: "resources-environment",
        type: "input",
      },
      {
        default: "staging",
        message: "Enter the name of the managers environment",
        name: "managers-environment",
        type: "input",
      },
      {
        default: "s-1vcpu-1gb",
        message: "Enter the size of the managers node volume",
        name: "managers-size",
        type: "input",
      },
      {
        default: "1",
        message: "Enter the number of managers",
        name: "managers-count",
        type: "input",
      },
      {
        default: "dzangolab",
        message: "Enter the username of the user managers",
        name: "managers-username",
        type: "input",
      },
      {
        default: "",
        message: "Enter the domain name",
        name: "domain",
        type: "input",
      },
      {
        default: "dzangolab",
        message: "Enter the deploy_group",
        name: "deploy_group",
        type: "input",
      },
      {
        default: "dzangolab",
        message: "Enter the deploy_user",
        name: "deploy_user",
        type: "input",
      },
      {
        default: "dzangolab",
        message: "Enter the ansible_user",
        name: "ansible_user",
        type: "input",
      },
    ]);
  };

  writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define the generators
    const generators = {
      "do-resources": "../do-resources/index.js",
      "do-swarm-leader": "../do-swarm-leader/index.js",
      "cloudflare-dns": "../cloudflare-dns/index.js",
      "ansible-do": "../ansible-do/index.js"
    };

    // Compose with each resource generator
    for (const resource of this.resourcesList) {
      const generatorPath = generators[resource];
      if (generatorPath) {
        this.composeWith(generatorPath, {
          ...this.props,
          ...this.options,
        });
      } else {
        this.log(chalk.red(`No generator found for resource: ${resource}`));
      }
    }
  }
}
