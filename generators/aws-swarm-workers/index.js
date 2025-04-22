import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSDockerSwarmWorkersGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS swarm workers";
    this.name = "swarm-workers";

    this.option("count", {
      type: String,
      default: "2",
      desc: "Number of worker nodes to provision"
    });

    this.option("keyName", {
      type: String,
      desc: "Name of user account to create on droplet"
    });

    this.option("availabilityZone", {
      type: String,
      desc: "Which zone will be selected (default will be choosed automatically)"
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
        message: "Enter the name of the keyName",
        required: true,
        name: "keyName",
        type: "input",
      },
      {
        message: "Enter the availabilityZone",
        name: "availabilityZone",
        type: "input",
      }
    ]);
  };

  writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);


    this.fs.copyTplAsync(
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
      this.fs.copyTplAsync(
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
