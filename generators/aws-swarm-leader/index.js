import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSwarmLeaderGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS swarm leader";
    this.name = "swarm-leader";

    this.option("availabilityZone", {
      desc: "Availability zone",
      type: String,
    });

    this.option("ami", {
      message: "What ami is used for swarm-leader (default: Amazon Linux 2023 64-bit (ARM))",
      name: "ami",
      required: true,
      type: String,
    });

    this.option("instanceType", {
      desc: "Instance type",
      required: true,
      type: String,
    });

    this.option("networks", {
      desc: "Docker networks",
      required: false,
      type: (networksAsString) => {
        return networksAsString.split(",").map(network => network.trim())
      },
    });

    this.option("useBastion", {
      type: Boolean,
      desc: "Are you using a bastion to access the swarm leader"
    });

    this.option("useNFS", {
      type: Boolean,
      desc: "Are you using an NFS server for volume data"
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
        default: "ami-0315d75b2c11ff409",
        message: "What ami is used for swarm-leader",
        name: "ami",
        type: "input",
      },
      {
        default: "ap-southeast-1c",
        message: "Availability Zone",
        name: "availabilityZone",
        required: true,
        type: "input",
      },
      {
        default: false,
        message: "Use a bastion",
        name: "useBastion",
        type: "confirm",
      },
      {
        default: false,
        message: "Use an NFS server",
        name: "useNFS",
        type: "confirm",
      },
      {
        default: "t4g.small",
        message: "Instance type",
        name: "instanceType",
        type: "input",
      },
      {
        default: "private,public",
        message: "Docker networks to create",
        name: "networks",
        type: String,
      },
    ]);

    this.props.networks = this.props.networks
      .split(",")
      .map(network => network.trim());
  };

  async writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    await this.fs.copyTplAsync(
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
      await this.fs.copyTplAsync(
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
