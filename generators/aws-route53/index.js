import Generator from "yeoman-generator";

export default class AWSRoute53Generator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-route53",
      "aws-route53",
      { globOptions: { dot: true } }
    );
  }
}
