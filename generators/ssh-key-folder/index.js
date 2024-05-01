import chalk from "chalk";

import Generator from "yeoman-generator";

export default class SSHKeyFolderGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "SSH keys";
    this.name = "ssh-keys";
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
}
