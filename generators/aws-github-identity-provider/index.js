import Generator from "yeoman-generator";

export default class AWSGithubIdentityProviderGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "aws-github-identity-provider",
      "aws-github-identity-provider",
      { globOptions: { dot: true } }  
    );
  }
}
