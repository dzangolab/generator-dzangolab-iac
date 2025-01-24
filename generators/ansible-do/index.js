import Generator from "yeoman-generator";

export default class AnsibleDOGenerator extends Generator {
  writing() {
    this.option("domain", {
      type: String,
      default: "DOMAIN",
      desc: "domain name."
    });

    this.option("username", {
      type: String,
      default: "USERNAME",
      desc: "username used for ansible, ansible_user deploy_group deploy_user"
    });

    this.option("email", {
      type: String,
      default: "EMAIL",
      desc: "username used for ansible, ansible_user deploy_group deploy_user"
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
