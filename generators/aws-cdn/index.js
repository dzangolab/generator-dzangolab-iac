import chalk from "chalk";

import PulumiGenerator from "../pulumi/index.js";

const DNS_PROVIDERS = ["cloudflare", "other", "route53"];

export default class AWSCDNGenerator extends PulumiGenerator {
  constructor(args, opts) {
    super(args, opts);

    this.displayName = "AWS CDN";
    this.name = "cdn";

    this.option("dnsProvider", {
      type: String,
      desc: "DNS provider for the domain: route53, cloudflare or other"
    });

    this.option("domain", {
      type: String,
      desc: "Domain to serve the CDN from (optional if dnsProvider is other)"
    });
  }

  async prompting() {
    this.props = await this._optionOrPrompt([
      {
        default: this._getDefaultProjectName(),
        message: "Enter the name of the pulumi project",
        name: "projectName",
        type: "input",
      },
      {
        choices: [
          {
            name: "AWS Route53",
            value: "route53"
          },
          {
            name: "Cloudflare",
            value: "cloudflare"
          },
          {
            name: "Other (DNS records to create are exported as stack outputs)",
            value: "other"
          }
        ],
        default: "route53",
        message: "Which DNS provider manages the domain?",
        name: "dnsProvider",
        type: "list",
      },
      {
        message: (answers) => this._getDNSProvider(answers) === "other"
          ? "Enter the domain (leave empty to only use the CloudFront domain)"
          : "Enter the domain",
        name: "domain",
        type: "input",
        validate: (input, answers) => this._getDNSProvider(answers) === "other" || input.trim() !== ""
          ? true
          : "A domain is required",
      }
    ]);

    if (!DNS_PROVIDERS.includes(this.props.dnsProvider)) {
      throw new Error(`Invalid dnsProvider "${this.props.dnsProvider}". Use one of: ${DNS_PROVIDERS.join(", ")}`);
    }

    this.props.domain = this.props.domain || "";
  };

  async writing() {
    const message = `Generating IaC code for ${this.displayName}`;
    this.log(`${chalk.green(message)}`);


    await this.fs.copyTplAsync(
      this.templatePath(`aws-${this.name}`),
      this.destinationPath(this._getFolderName()),
      {
        ...this.options,
        ...this.props,
      },
      {},
      { 
        globOptions: { 
          dot: true,
          ignore: ["**/Pulumi.stack.yaml", "**/dns/**"],
        }
      },
    );

    await this.fs.copyTplAsync(
      `${this.templatePath(`aws-${this.name}`)}/dns/${this.props.dnsProvider}.ts`,
      `${this.destinationPath(this._getFolderName())}/dns.ts`,
      {
        ...this.options,
        ...this.props,
      }
    );

    if (this.options.createStackConfig) {
      await this.fs.copyTplAsync(
        `${this.templatePath(`aws-${this.name}`)}/Pulumi.stack.yaml`,
        `${this.destinationPath(this._getFolderName())}/Pulumi.${this.options.environment}.yaml`,
        {
          ...this.options,
          ...this.props,
        }
      );
    }
  };

  _getDNSProvider(answers) {
    return answers.dnsProvider || this.options.dnsProvider;
  };
}
