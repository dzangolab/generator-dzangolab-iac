import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSwarmGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Aws swarm";
    this.name = "swarm";
    this.resourcesList = [
      // "ansible-aws",
      "aws-ebs",
      "aws-eip",
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
        default: "ap-southeast-1a",
        message: "Availability Zone for ebs and swarm-leader",
        name: "availabilityZones",
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
        availabilityZones: this.props.availabilityZones,
      },
      "aws-eip": {},
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
