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
        default: this._getDefaultProjectName(),
        message: "Enter the name of the pulumi project",
        name: "projectName",
        type: "input",
      },
    ]);
  }

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
