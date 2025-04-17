import Generator from "yeoman-generator";

export default class AnsibleAWSGenerator extends Generator {
  async writing() {
    await this.fs.copyTplAsync(
      this.templatePath("ansible/stack"),
      this.destinationPath(`ansible/${this.options.environment}`),
      { globOptions: { dot: true } }  
    );
  }
}
