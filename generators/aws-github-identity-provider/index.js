import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSGithubIdentityProviderGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS Github identity provider";
    this.name = "aws-github-identity-provider";
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


    this.fs.copyTplAsync(
      this.templatePath(this.name),
      this.destinationPath(this._getFolderName()),
      {
        ...this.props,
        ...this.options,
      },
      {},
      { 
        globOptions: { 
          dot: true,
          ignore: "**/Pulumi.stack.yaml",
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
