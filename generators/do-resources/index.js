import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanResourcesGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean resources";
    this.name = "do-resources";

    this.option("nameSuffix", {
      type: String,
      default: this.DEFAULT_PROJECT_NAME,
      desc: "nameSuffix."
    });

    this.option("region", {
      type: String,
      default: "sgp1",
      desc: "DigitalOcean region"
    });

    this.option("environment", {
      default: "staging",
      desc: "Droplet environment",
      type: String,
    });

    this.option("projectName", {
      default: this._getDefaultProjectName(),
      desc: "Pulumi project name",
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
