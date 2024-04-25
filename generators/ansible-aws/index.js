import Generator from "yeoman-generator";

export default class AnsibleAWSGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "ansible",
      "ansible",
      { globOptions: { dot: true } }  
    );
  }
}
