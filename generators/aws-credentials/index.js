import Generator from "yeoman-generator";

export default class AWSCredentialsGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-credentials",
      "aws-credentials",
      { globOptions: { dot: true } }  
    );
  }
}
