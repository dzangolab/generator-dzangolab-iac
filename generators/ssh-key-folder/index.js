import Generator from "yeoman-generator";

export default class SSHKeyFolderGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "ssh-keys",
      "ssh-keys",
      { globOptions: { dot: true } }  
    );
  }
}
