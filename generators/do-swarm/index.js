import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanDockerSwarmGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean swarm";
    this.name = "do-swarm";
    this.resourcesList = [
      "aws-credentials",
      "aws-resources",
      "do-resources",
      "do-nfs-server",
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
        message: "In what region should the resources be provisioned?",
        name: "region",
        type: "input",
      },
      {
        default: "s-2vcpu-2gb",
        message: "Enter the size of the leader node",
        name: "leader_size",
        type: "input",
      },
      {
        message: "Enter the username for the user of the swarm-leader and ansible",
        name: "username",
        type: "input",
      },
      {
        message: "Enter the domain name for cloudflare-dns and ansible",
        name: "domain",
        type: "input",
      },
      {
        message: "Enter the traefik ACME email for ansible",
        name: "email",
        type: "input",
      },
    ]);
  };

  writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define specific properties for each generator
    const generatorsProps = {
      "aws-resources": {
        ...this.options,
        ...this.props,
        projectName: `${this.options.prefix}-aws-resources`,
      },
      "aws-credentials": {
        environment: this.props.environment,
        timestamp: this.props.nameSuffix,
      },
      "do-resources": {
        environment: this.props.environment,
        nameSuffix: this.props.nameSuffix,
        region: this.props.region,
      },
      "do-nfs-server": {
        environment: this.props.environment,
        region: this.props.region,
        username: this.props.username,
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
        email: this.props.email,
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

    this.fs.copyTpl(
      this.templatePath("do-swarm/README.md"),
      this.destinationPath("README.md"),
      {
        projectName: this.props.nameSuffix || "Project",
        nameSuffix: this.props.nameSuffix,
        region: this.props.region,
        leaderSize: this.props.leader_size,
        username: this.props.username,
        domain: this.props.domain,
        email: this.props.email,
      }
    );
  }
}
