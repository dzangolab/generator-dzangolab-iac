import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSRoute53Generator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS Route53";
    this.name = "aws-route53";

    this.option("domain", {
      type: String,
      desc: "Name of the domain"
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
        message: "Enter domain",
        name: "domain",
        required: true,
        type: "input",
      }
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
