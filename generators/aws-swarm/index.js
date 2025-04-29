import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSwarmGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Aws swarm";
    this.name = "swarm";
    this.resourcesList = [
      "ansible-aws",
      "aws-ebs",
      "aws-eip",
      "aws-instance-profile",
      "aws-resources",
      "aws-route53",
      "aws-security-group",
      "aws-swarm-leader",
      "aws-vpc",
    ];
  }

  async prompting() {
    this.props = await this._optionOrPrompt([
      {
        default: "ap-southeast-1a",
        message: "Availability Zone for ebs and swarm-leader",
        name: "availabilityZones",
        type: "input",
      },
      {
        default: "ami-0315d75b2c11ff409",
        message: "What ami is used for swarm-leader (default: Amazon Linux 2023 64-bit (ARM))",
        name: "ami",
        required: true,
        type: "input",
      },
      {
        default: "t4g.small",
        message: "What is the size used for the swarm leader",
        name: "size_leader",
        type: "input",
      },
      {
        message: "Enter domain",
        name: "domain",
        type: "input",
      },
      {
        default: false,
        message: "Will you use a NFS server for volumes",
        name: "useNfs",
        store: true,
        type: "confirm",
      },
    ]);
  };

  async writing() {
    if (this.props.useNfs) {
      this.resourcesList.push("aws-nfs-server");
    }
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define specific properties for each generator
    const generatorsProps = {
      "ansible-aws": {
        domain: this.props.domain,
      },
      "aws-ebs": {
        availabilityZones: this.props.availabilityZones,
      },
      "aws-eip": {},
      "aws-instance-profile": {},
      "aws-nfs-server": {},
      "aws-resources": {},
      "aws-route53": {
        domain: this.props.domain,
      },
      "aws-security-group": {},
      "aws-swarm-leader": {
        ami: this.props.ami,
        availabilityZone: this.props.availabilityZones,
        size: this.props.size_leader,
        useNfs: this.props.useNfs,
      },
      "aws-vpc": {},
    };

    // Compose with each resource generator
    this.resourcesList.forEach(resource => {
      const generatorPath = `../${resource}/index.js`;
      const resourceProps = generatorsProps[resource] || {};

      this.composeWith(generatorPath, {
        ...resourceProps,
        ...this.options,
        projectName: resource,
      });

      this.fs.copyTpl(
        this.templatePath(`aws-${this.name}/README.md`),
        this.destinationPath("README.md"),
        {
        }
      );
    });
  }
}
