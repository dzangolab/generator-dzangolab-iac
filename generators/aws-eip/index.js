import Generator from "yeoman-generator";

export default class AWSEIPGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-eip",
      "aws-eip",
      { globOptions: { dot: true } }
    );
  }
}
