import Generator from "yeoman-generator";

export default class AWSResourcesGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-resources",
      "aws-resources",
      { globOptions: { dot: true } }  
    );
  }
}
