import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanDockerSwarmLeaderGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean swarm leader";
    this.name = "do-swarm-leader";

    this.option("managers_count", {
      type: String,
      required: true,
      default: 1,
      desc: "managers_count."
    });

    this.option("managers_environment", {
      type: String,
      required: true,
      default: "staging",
      desc: "managers_environment."
    });

    this.option("managers_size", {
      type: String,
      required: true,
      default: "s-1vcpu-1gb",
      desc: "managers_size."
    });

    this.option("managers_username", {
      type: String,
      required: true,
      default: "dzangolab",
      desc: "managers_username."
    });
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
        },
      );
    }
  };
}
