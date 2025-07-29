import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSDockerSwarmAsgWorkersGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS swarm asg workers";
    this.name = "swarm-workers";

    this.option("minSize", {
      type: String,
      default: "1",
      desc: "Minimum number of worker nodes to always be provisioned"
    });

    this.option("maxSize", {
      type: String,
      default: "2",
      desc: "Maximum number of worker nodes that might be provisioned"
    });

    this.option("desiredCapacity", {
      type: String,
      default: "2",
      desc: "The target number of nodes the autoscaler aims to maintain based on workload"
    });

    this.option("keyName", {
      type: String,
      desc: "Enter the name of the public key to use"
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
        message: "Enter the name of the public key to use",
        required: true,
        name: "keyName",
        type: "input",
      },
      {
        message: "Enter the availabilityZone",
        name: "availabilityZone",
        type: "input",
      },
      {
        message: "Enter the minimum number of worker nodes to always be provisioned",
        name: "minSize",
        type: "input",
      },
      {
        message: "Enter the maximum number of worker nodes that might be provisioned",
        name: "maxSize",
        type: "input",
      },
      {
        message: "The target number of nodes the autoscaler aims to maintain based on workload",
        name: "desiredCapacity",
        type: "input",
      }
    ]);
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
