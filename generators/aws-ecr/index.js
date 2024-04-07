import Generator from "yeoman-generator";

export default class AWSECRGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-ecr",
      "aws-ecr",
      { globOptions: { dot: true } }  
    );
  }
}
