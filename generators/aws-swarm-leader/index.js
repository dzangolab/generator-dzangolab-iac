import Generator from "yeoman-generator";

export default class AWSSwarmLeaderGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-swarm-leader",
      "aws-swarm-leader",
      { globOptions: { dot: true } }  
    );
  }
}
