import Generator from "yeoman-generator";

export default class AWSInstanceProfileGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-instance-profile",
      "aws-instance-profile",
      { globOptions: { dot: true } }
    );
  }
}
