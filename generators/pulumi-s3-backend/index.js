import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class PulumiS3BAckendGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Pulumi S3 Backend";
    this.name = "pulumi-s3-backend";

    this.option("projectName", {
      type: String,
      default: this._getDefaultProjectName(),
      desc: "environment."
    });

    this.option("awsProfile", {
      type: String,
      desc: "Name of AWS profile used to provision resources on AWS."
    });
  }

  async prompting() {
    this.props = await this.prompt([
      {
        default: this._getDefaultProjectName(),
        message: "Enter the name of the pulumi project",
        name: "projectName",
        type: "input",
      },
      {
        message: "What is the AWS profile used to create the AWS resources?",
        name: "awsProfile",
        type: "input",
      }
    ]);
  };

  writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);


    this.fs.copyTplAsync(
      this.templatePath(this.name),
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
        `${this.templatePath(this.name)}/Pulumi.stack.yaml`,
        `${this.destinationPath(this._getFolderName())}/Pulumi.${this.options.environment}.yaml`,
        {
          ...this.props,
          ...this.options,
        }
      );
    }
  };
}
