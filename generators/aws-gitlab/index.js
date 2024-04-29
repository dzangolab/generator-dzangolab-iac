import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSwarmLeaderGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS Gitlab CE server";
    this.name = "aws-gitlab";
  }

  async prompting() {
    this.props = await this.prompt([
      {
        default: this._getDefaultProjectName(),
        message: "Enter the name of the pulumi project",
        name: "projectName",
        type: "input",
      }
    ]);
  };

  writing() {
    const message = `Generating IaC code for ${resource}`;
    this.log(`${chalk.green(message)}`);

    this.fs.copyTpl(
      this.templatePath(this.name),
      this.destinationPath(this.props.projectName),
      this.props,
      null,
      { globOptions: { dot: true } },
    );
  };
}
