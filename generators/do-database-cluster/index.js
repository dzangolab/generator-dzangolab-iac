import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanDatabaseClusterGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean database cluster";
    this.name = "do-database-cluster";
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
    const message = `Generating IaC code for ${this.displayName}`;
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
