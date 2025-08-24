import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSDockerSwarmWorkersASGGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS swarm workers ASG";
    this.name = "swarm-workers-asg";

    this.option("instanceType", {
      type: String,
      desc: "InstanceType of workers"
    });

    this.option("keyName", {
      type: String,
      desc: "Name of the public key to use"
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
        default: "t4g-medium",
        message: "Enter the workers instanceType",
        name: "instanceType",
        type: "input",
      },
      {
        message: "Select regions to provision (use space to select multiple)",
        name: "zones",
        type: "checkbox",
        choices: [
          { name: 'Zone A', value: 'A' },
          { name: 'Zone B', value: 'B' },
          { name: 'Zone C', value: 'C' }
        ],
        validate: (input) => {
          return input.length > 0 || 'You must select at least one zone';
        }
      },
    ]);

    let selectedZones = this.props.zones;

    if (selectedZones.some(z => z.includes('Zone'))) {
      selectedZones = selectedZones.map(z => {
        if (z === 'Zone A') return 'A';
        if (z === 'Zone B') return 'B';
        if (z === 'Zone C') return 'C';
        return z;
      });
    }

    const allZones = ['A', 'B', 'C'];
    // Prompt for each selected zone
    for (const zone of allZones) {
      if (!selectedZones.includes(zone)) {
        this.props[`minSize${zone}`] = 0;
        this.props[`maxSize${zone}`] = 0;
      }
      else {
        const zoneProps = await this._optionOrPrompt([
          {
            message: `Enter the minimum number of worker nodes for zone ${zone}`,
            name: `minSize${zone}`,
            type: "number",
            default: 1,
            validate: (input) => input >= 0 || 'Must be a positive number'
          },
          {
            message: `Enter the maximum number of worker nodes for zone ${zone}`,
            name: `maxSize${zone}`,
            type: "number",
            default: 2,
            validate: (input) => input >= 0 || 'Must be a positive number'
          },
        ]);

        this.props = { ...this.props, ...zoneProps };
      }
    }
  }

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
