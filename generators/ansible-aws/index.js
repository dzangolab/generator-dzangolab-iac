import PulumiGenerator from "../pulumi/index.js";

export default class AnsibleAWSGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);
  
    this.option("domain", {
      type: String,
      desc: "Name of the domain"
    });
  }

  async prompting() {
    this.props = await this._optionOrPrompt([
      {
        message: "Enter domain",
        name: "domain",
        required: true,
        type: "input",
      },
    ]);
  };

  async writing() {
    await this.fs.copyTplAsync(
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
