import Generator from "yeoman-generator";

export default class DigitalOceanDatabaseClusterGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "do-database-cluster",
      "do-database-cluster",
      { globOptions: { dot: true } }  
    );
  }
}
