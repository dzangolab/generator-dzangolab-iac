import Generator from "yeoman-generator";

export default class DigitalOceanResourcesGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "do-resources",
      "do-resources",
      { globOptions: { dot: true } }  
    );
  }
}
