import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class AWSSwarmGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Aws swarm";
    this.name = "swarm";
    this.resourcesList = [
      "ansible-aws",
      "aws-bastion",
      "aws-credentials",
      "aws-ebs",
      "aws-eip",
      "aws-instance-profile",
      "aws-resources",
      "aws-security-groups",
      "aws-swarm-leader",
      "aws-swarm-managers",
      "aws-swarm-tokens",
      "aws-vpc",
    ];
  }

  async prompting() {
    this.props = await this._optionOrPrompt([
      {
        default: "ap-southeast-1a",
        message: "Availability Zone for ebs and swarm-leader",
        name: "availabilityZones",
        type: "input",
      },
      {
        default: "ami-0315d75b2c11ff409",
        message: "What ami is used for swarm-leader (default: Amazon Linux 2023 64-bit (ARM))",
        name: "ami",
        required: true,
        type: "input",
      },
      {
        default: "t4g.small",
        message: "What is the size used for the swarm leader",
        name: "size_leader",
        type: "input",
      },
      {
        message: "Enter domain",
        name: "domain",
        type: "input",
      },
      {
        default: false,
        message: "Will you use a NFS server for volumes",
        name: "useNfs",
        store: true,
        type: "confirm",
      },
    ]);
  };

  async writing() {
    if (this.props.useNfs) {
      this.resourcesList.push("aws-nfs-server");
    }
    
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);

    // Define generator configurations with multiple instances
    const generatorConfigs = [
      // Single instance generators from original resourcesList
      {
        name: "ansible-aws",
        props: { domain: this.props.domain }
      },
      {
        name: "aws-bastion",
        props: {}
      },
      {
        name: "aws-credentials", 
        props: {}
      },
      {
        name: "aws-ebs",
        props: { availabilityZones: this.props.availabilityZones }
      },
      {
        name: "aws-resources",
        props: {}
      },
      {
        name: "aws-security-group",
        props: {}
      },
      {
        name: "aws-swarm-leader",
        props: {
          ami: this.props.ami,
          availabilityZone: this.props.availabilityZones,
          size: this.props.size_leader,
          useNfs: this.props.useNfs,
        }
      },
      {
        name: "aws-swarm-managers",
        props: {}
      },
      {
        name: "aws-vpc",
        props: {}
      },
      // Multiple instance generators
      {
        name: "aws-instance-profile",
        instances: [
          { 
            projectName: "manager-instance-profile",
            props: { name: "manager-instance-profile" }
          },
          { 
            projectName: "nfs-instance-profile", 
            props: { name: "nfs-instance-profile" }
          }
        ]
      },
      {
        name: "aws-eip",
        instances: [
          { 
            projectName: "manager-eip",
            props: { name: "manager-eip" }
          },
          {
            projectName: "nfs-eip",
            props: { name: "nfs-eip" }
          }
        ]
      },
      // Conditional NFS server
      ...(this.props.useNfs ? [{
        name: "aws-nfs-server",
        props: {}
      }] : [])
    ];

    // Compose with generators
    generatorConfigs.forEach(config => {
      const generatorPath = `../${config.name}/index.js`;
      
      if (config.instances) {
        // Multiple instances
        config.instances.forEach(instance => {
          this.composeWith(generatorPath, {
            ...instance.props,
            ...this.options,
            projectName: instance.projectName,
          });
        });
      } else {
        // Single instance
        this.composeWith(generatorPath, {
          ...config.props,
          ...this.options,
          projectName: config.name,
        });
      }
    });

    this.fs.copyTpl(
      this.templatePath(`aws-${this.name}/README.md`),
      this.destinationPath("README.md"),
      {}
    );
  }
}