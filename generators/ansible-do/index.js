import Generator from "yeoman-generator";

export default class AnsibleDOGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this.option("email", {
      type: String,
      desc: "LetsEncrypt email"
    });

    this.option("domain", {
      type: String,
      desc: "Root domain of web services and apps"
    });

    this.option("useNfs", {
      type: Boolean,
      default: false,
      desc: "Whether or not to use a NFS server for docker volumes"
    });
    
    this.option("username", {
      type: String,
      desc: "Name of user account on droplet"
    });
  };

  async prompting() {
    this.props = await this.prompt([
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
        ...this.props,
        ...this.options,
      },
      { globOptions: { dot: true } }  
    );
  }
}
