import PulumiGenerator from "../pulumi/index.js";

export default class AnsibleDOGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.option("email", {
      type: String,
      default: "",
      desc: "LetsEncrypt email"
    });

    this.option("domain", {
      type: String,
      default: "DOMAIN",
      desc: "Root domain of web services and apps"
    });

    this.option("useNfs", {
      type: Boolean,
      default: false,
      desc: "Whether or not to use a NFS server for docker volumes"
    });
    
    this.option("username", {
      type: String,
      default: "USERNAME",
      desc: "Name of user account on droplet"
    });
  };

  async prompting() {
    this.props = await this._optionOrPrompt([
      {
        message: "LetsEncrypt email address",
        name: "email",
        type: "input",
      },
      {
        message: "Root domain of web services and apps",
        name: "domain",
        type: "input",
      },
      {
        message: "Use an NFS server for docker volumes:",
        name: "useNfs",
        type: "input",
      },
      {
        message: "Name of user account on droplet:",
        name: "username",
        type: "input",
      }
    ]);
  };

  writing() {
      this.fs.copyTplAsync(
      this.templatePath("ansible/stack"),
      this.destinationPath(`ansible/${this.options.environment}`),
      {
        ...this.options,
        ...this.props,
      },
      { globOptions: { dot: true } }  
    );
  }
}
