import chalk from "chalk";

import Generator from "yeoman-generator";

export default class AWSSwarmGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Aws swarm";
    this.name = "aws-swarm";
    this.resourcesList = [
        "aws-credentials",
        "aws-ebs",
        "aws-eip",
        "aws-instance-profile",
        "aws-resources",
        "aws-security-group",
        "aws-ssh-keypairs",
        "aws-swarm-leader",
        "aws-vpc",
    ];
  }

  async prompting() {
    this.props = await this.prompt([
    ]);
  };

  writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define specific properties for each generator
    const generatorsProps = {
      "aws-credentials": {
        environment: this.props.environment,
      },
      "aws-ebs": {
        environment: this.props.environment,
      },
      "aws-eip": {
        environment: this.props.environment,
      },
      "aws-instance-profile": {
        environment: this.props.environment,
      },
      "aws-resources": {
        environment: this.props.environment,
      },
      "aws-security-group": {
        environment: this.props.environment,
      },
      "aws-ssh-keypairs": {
        environment: this.props.environment,
      },
      "aws-swarm-leader": {
        environment: this.props.environment,
      },
      "aws-vpc": {
        environment: this.props.environment,
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
  }
}