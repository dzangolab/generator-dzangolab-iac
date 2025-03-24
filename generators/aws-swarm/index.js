import chalk from "chalk";

import Generator from "yeoman-generator";

export default class AWSSwarmGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Aws swarm";
    this.name = "aws-swarm";
    this.resourcesList = [
        // "ansible-aws",
        // "aws-ebs",
        // "aws-eip",
        // "ansible-aws",
        // "aws-ebs",
        // "aws-eip",
        // aws-nfs-server
        // "aws-resources",
        // "aws-route53",
        // "aws-security-group",
        // "aws-swarm-leader",
        "aws-vpc",
    ];
  }

  async prompting() {
    this.props = await this.prompt([
      {
        default: "YYYYMMDD",
        message: "What is the suffix used for the project",
        name: "suffix",
        type: "input",
      },
    ]);
  };

  writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define specific properties for each generator
    const generatorsProps = {
      // "ansible-aws": {
      //   environment: this.props.environment,
      // },
      // "aws-ebs": {
      //   environment: this.props.environment,
      // },
      // "aws-eip": {
      //   environment: this.props.environment,
      // },
      // "aws-nfs-server": {
      //   environment: this.props.environment,
      // },
      // "aws-resources": {
      //   environment: this.props.environment,
      // },
      // "aws-route53": {
      //   environment: this.props.environment,
      // },
      // "aws-security-group": {
      //   environment: this.props.environment,
      // },
      // "aws-swarm-leader": {
      //   environment: this.props.environment,
      // },
      // "aws-vpc": {
      //   environment: this.props.environment,
      // },
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