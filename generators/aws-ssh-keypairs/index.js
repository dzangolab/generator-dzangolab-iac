import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSSHKeypairsGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS SSH key pairs";
    this.name = "aws-ssh-keypairs";
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
      this.destinationPath(this._getFolderName()),
      this.props,
      null,
      { globOptions: { dot: true } },
    );
  };
  writing() {
    this.copyTemplate(
      "aws-ssh-keypairs",
      "aws-ssh-keypairs",
      { globOptions: { dot: true } }  
    );
  }
}
