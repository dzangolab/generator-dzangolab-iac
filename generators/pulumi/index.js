import Generator from "yeoman-generator";

import optionOrPrompt from "./optionOrPrompt.js";

class PulumiGenerator extends Generator {
  constructor(args, opts) {
    super(args, opts);

    this._optionOrPrompt = optionOrPrompt;

    this.options.versions = {
      digitalocean: "^4",
      dzangolab: "^0.33",
      pulumi: "^3",
      pulumi_aws: "^7",
      pulumi_awsx: "^3",
      pulumi_command: "^1",
      pulumi_cloudflare: "^6",
      pulumi_random: "^4",
      types_node: "^24",
    };
    
    this.option("createStackConfig", {
      type: Boolean,
      default: true,
      desc: "Whether to generate the stack config"
    });

    this.option("environment", {
      type: String,
      default: "staging",
      desc: "Environment (i.e. Pulumi stack)"
    });

    this.option("prefix", {
      type: String,
      required: false,
      default: undefined,
      desc: "String to prefix the default project name with"
    });

    this.option("projectName", {
      type: String,
      required: false,
      default: undefined,
      desc: "Pulumi project name"
    });

    this.option("usePrefixInFolderName", {
      type: Boolean,
      default: false,
      desc: "Whether to use the prefix in the project folder name"
    });
  };

  async prompting() {
    this.props = await this.optionOrPrompt([
      {
        default: this._getDefaultProjectName(),
        message: "Enter the name of the pulumi project",
        name: "projectName",
        type: "input",
      }
    ]);
  };

  async writing() {
    this.copyTemplate(
      "cloudflare-dns",
      this.props.projectNme || this.DEFAULT_PROJECT_NAME,
      { globOptions: { dot: true } },
      {
        projectName: this.props.projectName
      }
    );
  };

  _getDefaultProjectName() {
    return (!this.options.prefix || this.options.prefix == "") ? 
    `${this.name}`:
    `${this.options.prefix}-${this.name}` ;
  };

  _getFolderName() {
    const projectName = this.props.projectName;
    const prefixed = projectName.startsWith(this.options.prefix);

    if (!this.options.usePrefixInFolderName && prefixed) {
      return projectName.substr(this.options.prefix.length + 1);
    }

    return this.props.projectName;
  }
}

// inherits(PulumiGenerator, Generator);

// Object.setPrototypeOf(PulumiGenerator.prototype, Generator);

export default PulumiGenerator;
