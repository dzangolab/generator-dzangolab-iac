import Generator from "yeoman-generator";

export default class AWSEBSGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-ebs",
      "aws-ebs",
      { globOptions: { dot: true } }
    );
  }
}
