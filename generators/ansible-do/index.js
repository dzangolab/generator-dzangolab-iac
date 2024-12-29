import Generator from "yeoman-generator";

export default class AnsibleDOGenerator extends Generator {
  writing() {
    this.option("domain", {
      type: String,
      required: true,
      default: "DOMAIN",
      desc: "domain name."
    });

    this.option("deploy_group", {
      type: String,
      required: true,
      default: "USERNAME",
      desc: "deploy_group name."
    });

    this.option("deploy_user", {
      type: String,
      required: true,
      default: "USERNAME",
      desc: "deploy_user name."
    });

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
