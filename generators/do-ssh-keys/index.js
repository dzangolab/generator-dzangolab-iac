import Generator from "yeoman-generator";

export default class DigitalOceanSSHKeysGenerator extends Generator {
  writing() {

    this.copyTemplate(
      "do-ssh-keys",
      "do-ssh-keys",
      { globOptions: { dot: true } }  
    );
  }
}
