import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class DigitalOceanNFSServerGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "DigitalOcean NFS server";
    this.name = "do-nfs-server";

    this.option("environment", {
      default: "staging",
      desc: "Droplet environment",
      type: String,
    });

    this.option("image", {
      default: "ubuntu-24-10-x64",
      desc: "Droplet image",
      type: String,
    });

    this.option("projectName", {
      default: this._getDefaultProjectName(),
      desc: "Pulumi project name",
      type: String,
    });

    this.option("region", {
      default: "sgp1",
      desc: "DigitalOcean region",
      type: String,
    });

    this.option("size", {
      default: "s-2vcpu-2gb",
      desc: "Droplet size",
      type: String,
    });

    this.option("username", {
      desc: "Name of user account to create on droplet",
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
      },
      {
        default: "sgp1",
        message: "In what DigitalOcean region should the resources be provisioned?",
        name: "region",
        type: "input",
      },
      {
        default: "ubuntu-24-10-x64",
        message: "Enter the name of the nfs server image",
        name: "nfs_server_image",
        type: "input",
      },
      {
        default: "s-2vcpu-2gb",
        message: "Enter the size of the nfs server",
        name: "nfs_server_size",
        type: "input",
      },
    ]);
  };

  async writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);


    await this.fs.copyTplAsync(
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
          ...this.options,
          ...this.props,
        },
      );
    }
  };
}
