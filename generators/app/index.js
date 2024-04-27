import chalk from "chalk";
import Generator from "yeoman-generator";

import AnsibleDOGenerator from "../ansible-do/index.js";
import AnsibleAWSGenerator from "../ansible-aws/index.js";
import AWSCredentialsGenerator from "../aws-credentials/index.js";
import AWSDockerSwarmLeaderGenerator from "../aws-swarm-leader/index.js";
import AWSEBSGenerator from "../aws-ebs/index.js";
import AWSECRGenerator from "../aws-ecr/index.js";
import AWSEIPGenerator from "../aws-eip/index.js";
import AWSGithubIdentityProviderGenerator from "../aws-github-identity-provider/index.js";
import AWSInstanceProfileGenerator from "../aws-instance-profile/index.js";
import AWSResourcesGenerator from "../aws-resources/index.js";
import AWSRoute53Generator from "../aws-route53/index.js";
import AWSSecurityGroupGenerator from "../aws-security-group/index.js";
import AWSSSHKeypairsGenerator from "../aws-ssh-keypairs/index.js";
import AWSVPCGenerator from "../aws-vpc/index.js";
import CloudflareDNSGenerator from "../cloudflare-dns/index.js";
import DigitalOceanDatabaseClusterGenerator from "../do-database-cluster/index.js";
import DigitalOceanDockerSwarmLeaderGenerator from "../do-swarm-leader/index.js";
import DigitalOceanResourcesGenerator from "../do-resources/index.js";
import DigitalOceanSSHKeysGenerator from "../do-ssh-keys/index.js";
import SSHKeyFolderGenerator from "../ssh-key-folder/index.js";

export default class IaCGenerator extends Generator {
  async prompting() {
    this.props = await this.prompt([
      {
        default: this.config.get("infra") || this.appname,
        message: "What is the name of this infrastructure project?",
        name: "infra",
        store: true,
        type: "input",
      },
      {
        default: this.config.get("resources"),
        message: "What IaC code do you wish to generate?",
        name: "resources",
        type: "checkbox",
        choices: [
          {
            name: "Ansible for DigitalOcean swarm",
            value: "ansible-do"
          },
          {
            name: "Ansible for AWS swarm",
            value: "ansible-aws"
          },
          { type: "separator" },
          {
            name: "AWS credentials",
            value: "aws-credentials"
          },
          {
            name: "AWS Docker swarm leader",
            value: "aws-swarm-leader"
          },
          {
            name: "AWS EBS",
            value: "aws-ebs"
          },
          {
            name: "AWS EIP",
            value: "aws-eip"
          },
          {
            name: "AWS ECR",
            value: "aws-ecr"
          },
          {
            name: "AWS Github identity provider",
            value: "aws-github-idp"
          },
          {
            name: "AWS IAM instance profile",
            value: "aws-instance-profile"
          },
          {
            name: "AWS resources",
            value: "aws-resources"
          },
          {
            name: "AWS Route53",
            value: "aws-route53"
          },
          {
            name: "AWS security group",
            value: "aws-security-group"
          },
          {
            name: "AWS SSH key pairs",
            value: "aws-ssh-keypairs"
          },
          {
            name: "AWS VPC",
            value: "aws-vpc"
          },
          { type: "separator" },
          {
            name: "Cloudflare DNS",
            value: "cloudflare-dns"
          },
          { type: "separator" },
          {
            name: "DigitalOcean database cluster",
            value: "do-database-cluster"
          },
          {
            name: "DigitalOcean Docker swarm leader",
            value: "do-swarm-leader"
          },
          {
            name: "DigitalOcean resources",
            value: "do-resources"
          },
          {
            name: "DigitalOcean SSH keys",
            value: "do-ssh-keys"
          },
          { type: "separator" },
          {
            name: "SSH key folder",
            value: "ssh-key-folder"
          }
        ],
        required: true,
        store: true,
      },
    ]);

    this.config.set(this.props);

    this.config.save();
  };

  writing() {
    const generators = {
      "ansible-do": { Generator: AnsibleDOGenerator, path: "../ansible-do/index.js" },
      "ansible-aws": { Generator: AnsibleAWSGenerator, path: "../ansible-aws/index.js" },
      "aws-credentials": { Generator: AWSCredentialsGenerator, path: "../aws-credentials/index.js" },
      "aws-ebs": { Generator: AWSEBSGenerator, path: "../aws-ebs/index.js" },
      "aws-ecr": { Generator: AWSECRGenerator, path: "../aws-ecr/index.js" },
      "aws-eip": { Generator: AWSEIPGenerator, path: "../aws-eip/index.js" },
      "aws-github-idp": { Generator: AWSGithubIdentityProviderGenerator, path: "../aws-github-identity-provider/index.js" },
      "aws-instance-profile": { Generator: AWSInstanceProfileGenerator, path: "../aws-instance-profile/index.js" },
      "aws-resources": { Generator: AWSResourcesGenerator, path: "../aws-resources/index.js" },
      "aws-route53": { Generator: AWSRoute53Generator, path: "../aws-route53/index.js" },
      "aws-security-group": { Generator: AWSSecurityGroupGenerator, path: "../aws-security-group/index.js" },
      "aws-ssh-keypairs": { Generator: AWSSSHKeypairsGenerator, path: "../aws-ssh-keypairs/index.js" },
      "aws-swarm-leader": { Generator: AWSDockerSwarmLeaderGenerator, path: "../aws-swarm-leader/index.js" },
      "aws-vpc": { Generator: AWSVPCGenerator, path: "../aws-vpc/index.js" },
      "cloudflare-dns": { Generator: CloudflareDNSGenerator, path: "../cloudflare-dns/index.js" },
      "do-database-cluster": { Generator: DigitalOceanDatabaseClusterGenerator, path: "../do-database-cluster/index.js" },
      "do-ssh-keys": { Generator: DigitalOceanSSHKeysGenerator, path: "../do-ssh-keys/index.js" },
      "do-swarm-leader": { Generator: DigitalOceanDockerSwarmLeaderGenerator, path: "../do-swarm-leader/index.js" },
      "do-resources": { Generator: DigitalOceanResourcesGenerator, path: "../do-resources/index.js" },
      "ssh-key-folder": { Generator: SSHKeyFolderGenerator, path: "../ssh-key-folder/index.js" },
    };

    for (const resource of this.props.resources) {
      this.composeWith(
        generators[resource],
        {
          prefix: this.props.infra,
        }
      );
    }

  }
};
