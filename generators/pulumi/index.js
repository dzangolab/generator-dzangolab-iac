import Generator from "yeoman-generator";
import { inherits } from "util";

class PulumiGenerator extends Generator {
  DEFAULT_PROJECT_NAME;

  constructor(args, opts) {
    super(args, opts);

    this.option("prefix", {
      type: String,
      required: false,
      defaults: "",
      desc: "String to prefix the default project name with."
    });
  }

  async prompting() {
    this.props = await this.prompt([
      {
        default: this.DEFAULT_PROJECT_NAME,
        message: "Enter the name of the pulumi project",
        name: "projectName",
        type: "input",
      }
    ]);
  };

  writing() {
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
    return this.options.prefix ? 
      `${this.options.prefix}-${this.name}` : 
      `${this.name}`;
  };
}

// inherits(PulumiGenerator, Generator);

// Object.setPrototypeOf(PulumiGenerator.prototype, Generator);

export default PulumiGenerator;
