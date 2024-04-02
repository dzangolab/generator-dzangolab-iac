import chalk from "chalk";
import Generator from "yeoman-generator";

import DigitalOceanResourcesGenerator from "../do-resources/index.js"

export default class IaCGenerator extends Generator {
  async prompting() {
    this.props = await this.prompt({
      message: "What IaC code do you wish to generate?",
			name: "action",
			type: "list",
      choices: [
        {
          name: "DigitalOcean resources",
          value: "do-resources"
        },
        {
          name: "DigitalOcean swarm leader",
          value: "do-swarm-leader"
        },
        {
          name: "AWS resources",
          value: "aws-resources"
        },
        {
          name: "Credentials",
          value: "credentials"
        }
      ],
      required: true
    });
  };

  writing() {
    const generators = {
      "do-resources": { Generator: DigitalOceanResourcesGenerator, path: '../do-resources/index.js' },
    };

    if (generators[this.props.action]) {
      this.composeWith(generators[this.props.action]);
    } else {
      this.log(`${chalk.green(JSON.stringify(this.props.action))}`);
    }
  }
};
