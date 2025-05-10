import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSwarmLeaderGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS swarm leader";
    this.name = "swarm-leader";

    this.option("availabilityZone", {
      default: "ap-southeast-1a",
      desc: "Availability zone",
      type: String,
    });

    this.option("ami", {
      default: "ami-0315d75b2c11ff409",
      message: "What ami is used for swarm-leader (default: Amazon Linux 2023 64-bit (ARM))",
      name: "ami",
      required: true,
      type: String,
    });

    this.option("instanceType", {
      default: "t4g.small",
      desc: "Instance type",
      required: true,
      type: String,
    });

    this.option("useNfs", {
      type: Boolean,
      default: false,
      desc: "Whether or not a NFS server is used for volumes"
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
        default: "ami-0315d75b2c11ff409",
        message: "What ami is used for swarm-leader",
        name: "ami",
        type: "input",
      },
      {
        default: "t4g.small",
        message: "Instance type",
        name: "instanceType",
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
      await this.fs.copyTplAsync(
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
