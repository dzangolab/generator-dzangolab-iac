import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSwarmLeaderGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS swarm leader";
    this.name = "swarm-leader";

    this.option("availabilityZone", {
      default: "ap-southeast-1a",
      desc: "Available zone",
      type: String,
    });

    this.option("ami", {
      default: "ami-0315d75b2c11ff409",
      message: "What ami is used for swarm-leader (default: Amazon Linux 2023 64-bit (ARM))",
      name: "ami",
      required: true,
      type: String,
    });

    this.option("size", {
      default: "t4g.small",
      desc: "Size of the swarm leader",
      required: true,
      type: String,
    });
  }

  async prompting() {
    this.props = await this._optionOrPrompt([
      {
        default: this._getDefaultProjectName(),
        message: "Enter the name of the pulumi project",
        name: "projectName",
        type: "input",
      },
      {
        message: "Availability Zone",
        name: "availabilityZone",
        required: true,
        type: "input",
      },
      {
        message: "What ami is used for swarm-leader",
        name: "ami",
        type: "input",
      },
      {
        default: "t4g.small",
        message: "Size of swarm leader",
        name: "size",
        type: "input",
      },
    ]);
  };

  async writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);


    await this.fs.copyTplAsync(
      this.templatePath(`aws-${this.name}`),
      this.destinationPath(this._getFolderName()),
      {
        ...this.options,
        ...this.props,
      },
      {},
      { 
        globOptions: { 
          dot: true,
          ignore: ["**/Pulumi.stack.yaml"],
        }
      },
    );

    if (this.options.createStackConfig) {
      this.fs.copyTplAsync(
        `${this.templatePath(`aws-${this.name}`)}/Pulumi.stack.yaml`,
        `${this.destinationPath(this._getFolderName())}/Pulumi.${this.options.environment}.yaml`,
        {
          ...this.options,
          ...this.props,
        }
      );
    }
  };
}
