import chalk from "chalk";
import Generator from "yeoman-generator";

import AnsibleGenerator from "../ansible/index.js";
import AWSCredentialsGenerator from "../aws-credentials/index.js";
import AWSECRGenerator from "../aws-ecr/index.js";
import AWSResourcesGenerator from "../aws-resources/index.js";
import CloudflareDNSGenerator from "../cloudflare-dns/index.js";
import DigitalOceanDatabaseClusterGenerator from "../do-database-cluster/index.js";
import DigitalOceanDockerSwarmLeaderGenerator from "../do-swarm-leader/index.js";
import DigitalOceanResourcesGenerator from "../do-resources/index.js";
import DigitalOceanSSHKeysGenerator from "../do-ssh-keys/index.js";
import SSHKeyFolderGenerator from "../ssh-key-folder/index.js";

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
          name: "AWS ECR",
          value: "aws-ecr"
        },
        {
          name: "AWS resources",
          value: "aws-resources"
        },
        {
          name: "AWS credentials",
          value: "aws-credentials"
        },
        {
          name: "Ansible",
          value: "ansible"
        },
        {
          name: "DigitalOcean Docker swarm leader",
          value: "do-swarm-leader"
        },
        {
          name: "Cloudflare DNS",
          value: "cloudflare-dns"
        },
        {
          name: "DigitalOcean Database cluster",
          value: "do-database-cluster"
        }
      ],
      required: true
    });
  };

  writing() {
    const generators = {
      "ansible": { Generator: AnsibleGenerator, path: "../ansible/index.js" },
      "aws-credentials": { Generator: AWSCredentialsGenerator, path: "../aws-credentials/index.js" },
      "aws-ecr": { Generator: AWSECRGenerator, path: "../aws-ecr/index.js" },
      "aws-resources": { Generator: AWSResourcesGenerator, path: "../aws-resources/index.js" },
      "cloudflare-dns": { Generator: CloudflareDNSGenerator, path: "../cloudflare-dns/index.js" },
      "do-database-cluster": { Generator: DigitalOceanDatabaseClusterGenerator, path: "../do-database-cluster/index.js" },
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
