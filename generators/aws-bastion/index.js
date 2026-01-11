import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSBastionGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS bastion";
    this.name = "bastion";

    this.option("availabilityZone", {
      desc: "Availability zone",
      type: String,
    });

    this.option("ami", {
      message: "What ami is used for bastion",
      name: "ami",
      required: true,
      type: String,
    });

    this.option("instanceType", {
      desc: "Instance type",
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
        default: "ami-0f2e87ad022f8a65f",
        message: "What ami is used for bastion",
        name: "ami",
        type: "input",
      },
      {
        default: "ap-southeast-1c",
        message: "Availability Zone",
        name: "availabilityZone",
        required: true,
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
