import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSwarmGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Aws swarm";
    this.name = "aws-swarm";
    this.resourcesList = [
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
    this.props = await this._optionOrPrompt([
      {
        default: "YYYYMMDD",
        message: "What is the suffix used for the project",
        name: "suffix",
        type: "input",
      },
    ]);
  };

  async writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define specific properties for each generator
    const generatorsProps = {
      // "ansible-aws": {
      //   environment: this.props.environment,
      // },
      "aws-ebs": {
        suffix: this.props.suffix
      },
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
      "aws-vpc": {
        suffix: this.props.suffix
      },
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
        this.templatePath("aws-swarm/README.md"),
        this.destinationPath("README.md"),
        {
        }
      );
    });
  }
}