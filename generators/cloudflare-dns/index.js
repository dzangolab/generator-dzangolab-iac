import Generator from "yeoman-generator";

export default class CloudflareDNSGenerator extends Generator {
  writing() {
    this.copyTemplate(
      "cloudflare-dns",
      "cloudflare-dns",
      { globOptions: { dot: true } }  
    );
  }
}
