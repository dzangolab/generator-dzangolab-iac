import Generator from "yeoman-generator";

export default class AnsibleGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "ansible",
      "ansible",
      { globOptions: { dot: true } }  
    );
  }
}
