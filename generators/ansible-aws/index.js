import Generator from "yeoman-generator";

export default class AnsibleAWSGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);
  
    this.option("domain", {
      type: String,
      default: "MYDOMAIN.COM",
      desc: "Name of the domain"
    });
  }

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
