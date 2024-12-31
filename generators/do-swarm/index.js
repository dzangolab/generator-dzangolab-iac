import chalk from "chalk";

import Generator from "yeoman-generator";

export default class DigitalOceanDockerSwarmGenerator extends Generator {
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
        default: "s-2vcpu-2gb",
        message: "Enter the size for the managers node",
        name: "leader_size",
        type: "input",
      },
      {
        default: "USERNAME",
        message: "Enter the username of the user for the swarm-leader and the ansible deploy_user/group and ansible_user",
        name: "username",
        type: "input",
      },
      {
        default: "DOMAIN",
        message: "Enter the domain name for cloudflare-dns and ansible",
        name: "domain",
        type: "input",
      },
    ]);
  };

  writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define specific properties for each generator
    const generatorsProps = {
      "do-resources": {
        environment: this.props.environment,
        nameSuffix: this.props.nameSuffix,
        region: this.props.region,
      },
      "do-swarm-leader": {
        environment: this.props.environment,
        region: this.props.region,
        size: this.props.leader_size,
        username: this.props.username,
      },
      "cloudflare-dns": {
        domain: this.props.domain,
        environment: this.props.environment,
      },
      "ansible-do": {
        environment: this.props.environment,
        domain: this.props.domain,
        username: this.props.username,
      }
    };

    // Compose with each resource generator
    this.resourcesList.forEach(resource => {
      const generatorPath = `../${resource}/index.js`;
      const resourceProps = generatorsProps[resource] || {};

      this.composeWith(generatorPath, {
        ...resourceProps,
        ...this.options,
      });
    });
  }
}
