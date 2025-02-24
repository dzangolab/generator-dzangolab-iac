import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanDockerSwarmGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean swarm";
    this.name = "do-swarm";
    this.resourcesList = [
      "ansible-do",
      "aws-credentials",
      "aws-resources",
      "cloudflare-dns",
      "do-resources",
      "do-nfs-server",
      "do-swarm-leader",
      "do-swarm-workers",
    ];
  }

  async prompting() {
    this.props = await this.prompt([
      {
        default: "sgp1",
        message: "In what region should the resources be provisioned?",
        name: "region",
        type: "input",
      },
      {
        default: "docker-20-04",
        message: "Enter the name of the leader image",
        name: "manager_image",
        type: "input",
      },
      {
        default: "s-2vcpu-2gb",
        message: "Enter the size of the leader node",
        name: "manager_size",
        type: "input",
      },
      {
        default: "s-2vcpu-2gb",
        message: "Enter the sizes of workers nodes",
        name: "workers_size",
        type: "input",
      },
      {
        default: "1",
        message: "Enter the number of workers nodes",
        name: "workers_count",
        type: "input",
      },
      {
        default: "ubuntu-24-10-x64",
        message: "Enter the name of the nfs server image",
        name: "nfs_server_image",
        type: "input",
      },
      {
        default: "s-2vcpu-2gb",
        message: "Enter the size of the nfs server",
        name: "nfs_server_size",
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
      "ansible-do": {
        email: this.props.email,
        environment: this.props.environment,
        domain: this.props.domain,
        username: this.props.username,
      },
      "aws-resources": {
        ...this.options,
        ...this.props,
        projectName: `aws-resources`,
      },
      "aws-credentials": {
        environment: this.props.environment,
        timestamp: this.props.environment,
        projectName: `aws-credentials`,
      },
      "cloudflare-dns": {
        domain: this.props.domain,
        environment: this.props.environment,
        projectName: `cloudflare-dns`,
      },
      "do-resources": {
        environment: this.props.environment,
        nameSuffix: this.props.nameSuffix,
        region: this.props.region,
        projectName: `do-resources`,
      },
      "do-nfs-server": {
        environment: this.props.environment,
        image: this.props.nfs_server_image,
        region: this.props.region,
        size: this.props.nfs_server_size,
        username: this.props.username,
        projectName: `do-nfs-server`,
      },
      "do-swarm-leader": {
        environment: this.props.environment,
        image: this.props.manager_image,
        region: this.props.region,
        size: this.props.manager_size,
        username: this.props.username,
        projectName: `do-swarm-leader`,
      },
      "do-swarm-workers": {
        count: this.props.workers_count,
        environment: this.props.environment,
        region: this.props.region,
        size: this.props.workers_size,
        username: this.props.username,
        projectName: `do-swarm-workers`,
      },
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
