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
      "do-swarm-leader",
      "do-swarm-workers",
    ];
  }

  async prompting() {
    this.props = await this._optionOrPrompt([
      {
        default: "sgp1",
        message: "In what DigitalOcean region should the resources be provisioned?",
        name: "region",
        type: "input",
      },
      {
        default: "docker-20-04",
        message: "Enter the name of nodes image",
        name: "image",
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
        message: "Size of worker nodes",
        name: "worker_size",
        type: "input",
      },
      {
        default: "1",
        message: "How many workers nodes do you want to provision",
        name: "worker_count",
        type: "input",
      },
      {
        default: false,
        message: "Will you use a NFS server for volumes",
        name: "useNfs",
        store: true,
        type: "confirm",
      },
      {
        message: "Name of the user account to create on the droplets",
        name: "username",
        type: "input",
      },
      {
        message: "Enter the domain name for cloudflare-dns and ansible",
        name: "domain",
        type: "input",
      },
    ]);
  };

  async writing() {
    if (this.props.useNfs) {
      this.resourcesList.push("do-nfs-server");
    }
    
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define specific properties for each generator
    const generatorsProps = {
      "ansible-do": {
        domain: this.props.domain,
        useNfs: this.props.useNfs,
        username: this.props.username,
      },
      "aws-resources": {
        ...this.options,
        ...this.props,
      },
      "aws-credentials": {
        timestamp: this.props.environment,
      },
      "cloudflare-dns": {
        domain: this.props.domain,
        projectName: `cloudflare-dns-${this.props.domain}`,
      },
      "do-resources": {
        region: this.props.region,
      },
      "do-nfs-server": {
        image: this.props.nfs_server_image,
        region: this.props.region,
        size: this.props.nfs_server_size,
        username: this.props.username,
      },
      "do-swarm-leader": {
        image: this.props.image,
        region: this.props.region,
        size: this.props.manager_size,
        useNfs: this.props.useNfs,
        username: this.props.username,
      },
      "do-swarm-workers": {
        count: this.props.worker_count,
        image: this.props.image,
        region: this.props.region,
        size: this.props.worker_size,
        username: this.props.username,
      },
    };

    // Compose with each resource generator
    this.resourcesList.forEach(resource => {
      const generatorPath = `../${resource}/index.js`;
      const resourceProps = generatorsProps[resource] || {};

      this.composeWith(generatorPath, {
        ...this.options,
        ...resourceProps,
        projectName: resource,
      });
    });

    this.fs.copyTpl(
      this.templatePath("do-swarm/README.md"),
      this.destinationPath("README.md"),
      {
        region: this.props.region,
        leaderSize: this.props.leader_size,
        username: this.props.username,
        domain: this.props.domain,
        email: this.props.email,
      }
    );
  }
}
