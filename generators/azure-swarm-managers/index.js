import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AzureDockerSwarmManagersGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Azure Docker swarm managers";
    this.name = "swarm-managers";

    this.option("alertEmail", {
      type: String,
      desc: "Email address that receives the nodes' alerts"
    });

    this.option("hostnamePrefix", {
      type: String,
      desc: "Prefix of the nodes' hostnames (<prefix>-manager-001, …)"
    });

    this.option("vmSize", {
      type: String,
      desc: "Azure VM size of the managers"
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
        message: "Enter the email address that receives the nodes' alerts",
        name: "alertEmail",
        required: true,
        type: "input",
      },
      {
        default: this.options.prefix,
        message: "Enter the prefix of the nodes' hostnames",
        name: "hostnamePrefix",
        type: "input",
      },
      {
        default: "Standard_D2as_v6",
        message: "Enter the Azure VM size of the managers",
        name: "vmSize",
        type: "input",
      },
    ]);
  }

  async writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    await this.fs.copyTplAsync(
      this.templatePath(`azure-${this.name}`),
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
      await this.fs.copyTplAsync(
        `${this.templatePath(`azure-${this.name}`)}/Pulumi.stack.yaml`,
        `${this.destinationPath(this._getFolderName())}/Pulumi.${this.options.environment}.yaml`,
        {
          ...this.options,
          ...this.props,
        }
      );
    }
  };
}
