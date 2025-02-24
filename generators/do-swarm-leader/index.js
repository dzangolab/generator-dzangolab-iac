import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanDockerSwarmLeaderGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean swarm leader";
    this.name = "do-swarm-leader";

    this.option("environment", {
      type: String,
      default: "staging",
      desc: "environment."
    });

    this.option("image", {
      type: String,
      default: "docker-20-04",
      desc: "region."
    });

    this.option("region", {
      type: String,
      default: "sgp1",
      desc: "region."
    });

    this.option("size", {
      type: String,
      default: "s-2vcpu-2gb",
      desc: "size."
    });

    this.option("username", {
      type: String,
      default: "",
      desc: "username."
    });

    this.option("sshKeys", {
      type: String,
      default: "- KEY_NAME",
      desc: "sshKeys."
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
