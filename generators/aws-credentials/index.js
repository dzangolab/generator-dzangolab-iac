import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

class AWSCredentialsGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS credentials";
    this.name = "aws-credentials";

    this.option("environment", {
      default: "staging",
      desc: "Pulumi stack",
      type: String,
    });
    
    this.option("projectName", {
      default: this._getDefaultProjectName(),
      desc: "Pulumi project name",
      type: String,
    });

    this.option("timestamp", {
      type: String,
      desc: "Timestamp for passworkd 'keeper' property"
    });
  }

  async prompting() {
    this.props = await this._optionOrPrompt([
      {
        default: this._getDefaultProjectName(),
        message: "Pulumi project name",
        name: "projectName",
        type: "input",
      },
      {
        message: "Timestamp for password 'keeper' property",
        name: "timestamp",
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

export default AWSCredentialsGenerator;
