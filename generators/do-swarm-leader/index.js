import Generator from "yeoman-generator";

export default class DigitalOceanDockerSwarmLeaderGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "do-swarm-leader",
      "do-swarm-leader",
      { globOptions: { dot: true } }  
    );
  }
}
