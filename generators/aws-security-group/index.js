import Generator from "yeoman-generator";

export default class AWSSecurityGroupGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-security-group",
      "aws-security-group",
      { globOptions: { dot: true } }
    );
  }
}
