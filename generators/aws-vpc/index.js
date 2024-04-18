import Generator from "yeoman-generator";

export default class AWSVPCGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-vpc",
      "aws-vpc",
      { globOptions: { dot: true } }  
    );
  }
}
