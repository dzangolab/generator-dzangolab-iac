import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanNFSServerGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean NFS server";
    this.name = "do-nfs-server";

    this.option("environment", {
      type: String,
      default: "staging",
      desc: "Droplet environment"
    });

    this.option("image", {
      type: String,
      default: "ubuntu-24-10-x64",
      desc: "Droplet image"
    });

    this.option("region", {
      type: String,
      default: "sgp1",
      desc: "DigitalOcean region"
    });

    this.option("size", {
      type: String,
      default: "s-2vcpu-2gb",
      desc: "Droplet size"
    });

    this.option("username", {
      type: String,
      desc: "Name of user account to create on droplet"
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
