import { Environment, FileSystemLoader } from "nunjucks";

function render(
  template: string,
  context: { [key: string]: any },
): string {
  const env = new Environment([
    new FileSystemLoader(),
  ]);

  return env.render(template, context);
}

export default render;
