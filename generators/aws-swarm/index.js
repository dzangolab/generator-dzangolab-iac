import chalk from "chalk";

import Generator from "yeoman-generator";

export default class AWSSwarmGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Aws swarm";
    this.name = "aws-swarm";
    this.resourcesList = [
        "aws-credentials",
        "aws-resources",
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
      "aws-resources": {
        environment: this.props.environment,
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