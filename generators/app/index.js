import chalk from "chalk";
import Generator from "yeoman-generator";

import AWSECRGenerator from "../aws-ecr/index.js";
// import AWSResourcesGenerator from "../aws-resources/index.js"
import DigitalOceanSSHKeysGenerator from "../do-ssh-keys/index.js"
import DigitalOceanDockerSwarmLeaderGenerator from "../do-swarm-leader/index.js"
import DigitalOceanResourcesGenerator from "../do-resources/index.js"
import SSHKeyFolderGenerator from "../ssh-key-folder/index.js"

export default class IaCGenerator extends Generator {
  async prompting() {
    this.props = await this.prompt({
      message: "What IaC code do you wish to generate?",
			name: "action",
			type: "list",
      choices: [
        {
          name: "SSH key folder",
          value: "ssh-key-folder"
        },
        {
          name: "DigitalOcean SSH keys",
          value: "do-ssh-keys"
        },
        {
          name: "DigitalOcean resources",
          value: "do-resources"
        },
        {
          name: "DigitalOcean Docker swarm leader",
          value: "do-swarm-leader"
        },
        {
          name: "AWS ECR",
          value: "aws-ecr"
        },
          // },
        // {
        //   name: "AWS resources",
        //   value: "aws-resources"
        // },
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
      "aws-ecr": { Generator: AWSECRGenerator, path: "../aws-ecr/index.js" },
      // "aws-resources": { Generator: AWSResourcesGenerator, path: "../aws-resources/index.js" },
      "do-ssh-keys": { Generator: DigitalOceanSSHKeysGenerator, path: "../do-ssh-keys/index.js" },
      "do-swarm-leader": { Generator: DigitalOceanDockerSwarmLeaderGenerator, path: "../do-swarm-leader/index.js" },
      "do-resources": { Generator: DigitalOceanResourcesGenerator, path: "../do-resources/index.js" },
      "ssh-key-folder": { Generator: SSHKeyFolderGenerator, path: "../ssh-key-folder/index.js" },
    };

    if (generators[this.props.action]) {
      this.composeWith(generators[this.props.action]);
    } else {
      this.log(`${chalk.green(JSON.stringify(this.props.action))}`);
    }
  }
};
