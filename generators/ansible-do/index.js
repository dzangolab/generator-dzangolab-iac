import Generator from "yeoman-generator";

export default class AnsibleDOGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "ansible",
      "ansible",
      { globOptions: { dot: true } }  
    );
  }
}
