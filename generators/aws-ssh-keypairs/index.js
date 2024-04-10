import Generator from "yeoman-generator";

export default class AWSSSHKeypairsGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-ssh-keypairs",
      "aws-ssh-keypairs",
      { globOptions: { dot: true } }  
    );
  }
}
