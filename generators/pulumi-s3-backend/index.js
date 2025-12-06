import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

export default class PulumiS3BackendGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "Pulumi S3 Backend";
    this.name = "pulumi-s3-backend";

    this.option("projectName", {
      type: String,
      default: this._getDefaultProjectName(),
      desc: "The name of this Pulumi project"
    });

    this.option("awsProfile", {
      type: String,
      desc: "AWS profile used to provision resources on AWS"
    });

    /*
    this.option("secretsProvider", {
      choices: [
        {
          name: "AWS KMS",
          value: "awskms",
          description: "AWS Key Management Service (KMS)"
        },
        {
          name: "Password",
          value: "password",
          description: "Password-based encryption"

        },
      ],
      default: "awskms",
      desc: "Which Pulumi backend encryption provider do you want to use?",
      type: Select,
    });
    */
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
        message: "What is the AWS profile used to provision the AWS resources?",
        name: "awsProfile",
        type: "input",
      },
      {
        message: "Which AWS region do you want to use?",
        name: "awsRegion",
        type: "input",
      },
      {
        choices: [
          {
            name: "AWS KMS",
            value: "awskms",
            description: "AWS Key Management Service (KMS)"
          },
          {
            name: "Password",
            value: "password",
            description: "Password-based encryption"

          },
        ],
        default: "awskms",
        message: "Which Pulumi backend encryption provider do you want to use??",
        name: "encryptionProvider",
        type: "select",
      }
    ]);
  };

  async writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);


    await this.fs.copyTplAsync(
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
      await this.fs.copyTplAsync(
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
