import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSNFSServerGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS NFS server";
    this.name = "aws-nfs-server";

    this.option("availabilityZone", {
      default: "ap-southeast-1a",
      desc: "Available zone",
      type: String,
    });
    
    this.option("size", {
      type: String,
      default: "t4g.small",
      desc: "Size of the NFS server"
    });

    this.option("suffix", {
      type: String,
      default: "YYYYMMDD",
      desc: "Timestamp using as suffix"
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
          ...this.options,
          ...this.props,
        }
      );
    }
  };
}
