# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A [Yeoman](https://yeoman.io) generator (`generator-dzangolab-iac`, published as `@dzangolab/generator-dzangolab-iac`) that scaffolds infrastructure-as-code projects: mostly **Pulumi TypeScript projects** for AWS and DigitalOcean (VPC, S3, EC2/Droplets, Docker Swarm, Route53, Cloudflare DNS, …), plus Ansible playbook trees for the Swarm hosts.

The repo contains no application code — everything is either a generator (`generators/*/index.js`) or an EJS template of the code that gets emitted (`generators/*/templates/**`).

## Commands

```bash
npm install          # or: just install
npm run lint         # biome lint .        (just lint)
npm run lint:fix     # biome lint --write . (just lint-fix)
npm test             # jest (runs `pretest` = biome lint first)
npx jest __tests__/app.js -t "creates files"   # single test / single case
```

`just typecheck` and `just sort-package` invoke `npm typecheck` / `npm sort-package` (missing `run`, and there is no `typecheck` script) — they don't work. Use `just install`, `just lint`, `just lint-fix`, `just outdated`.

**The test suite is currently broken and unrepresentative**: `__tests__/app.js` uses CommonJS `require()` in an ESM package (`"type": "module"`) and asserts on a `dummyfile.txt` that no generator produces. Don't take a failing `npm test` as a signal about your change; if you touch tests, they need to be rewritten as ESM using `yeoman-test` helpers.

### Running the generator against a scratch directory

```bash
npm link && npm install -g yo
mkdir -p /tmp/iac-scratch && cd /tmp/iac-scratch && yo dzangolab-iac
```

Sub-generators can be run directly, bypassing the app prompts:

```bash
yo dzangolab-iac:aws-vpc --environment staging --prefix acme --projectName acme-vpc
```

## Architecture

### Composition chain

`generators/app/index.js` is the entry point. It prompts for `infra`, `usePrefixInFolderName`, `environment`, `createStackConfig`, and a `project` choice, persists the answers via `this.config.save()` (a `.yo-rc.json` in the destination), derives `prefix` by slugifying `infra`, then `composeWith`s exactly one sub-generator.

The app generator hardcodes the catalogue in **three** places that must stay in sync: the import list, the `choices` array in `prompting()`, and the `generators` map in `writing()`. The choice `value` is the map key, not necessarily the directory name (e.g. `aws-github-idp` → `generators/aws-github-identity-provider`).

### `PulumiGenerator` base class

`generators/pulumi/index.js` is the base class nearly every generator extends. It provides:

- Shared options: `createStackConfig`, `environment`, `prefix`, `projectName`, `usePrefixInFolderName`.
- `this.options.versions` — the **single source of truth for dependency version ranges** (`pulumi`, `pulumi_aws`, `pulumi_awsx`, `dzangolab`, `types_node`, …) injected into every generated `package.json` template. Bump versions here, not in individual templates.
- `_getDefaultProjectName()` → `<prefix>-<this.name>`.
- `_getFolderName()` → strips the prefix from the project name unless `usePrefixInFolderName` is set.
- `this._optionOrPrompt` (from `generators/pulumi/optionOrPrompt.js`) — the composability mechanism: a prompt whose name matches an already-supplied option is skipped and the option value used instead (with string `"true"`/`"false"` normalised to booleans). Use `_optionOrPrompt` rather than `this.prompt` in sub-generators, otherwise composed runs will re-prompt the user.

`PulumiGenerator`'s own `prompting()`/`writing()` are placeholders; subclasses always override both.

### Leaf generator shape

Each leaf generator sets `displayName` and `name` in its constructor, prompts through `_optionOrPrompt`, then in `writing()`:

1. `fs.copyTplAsync(templatePath(<dir>), destinationPath(this._getFolderName()), {...this.options, ...this.props}, {}, { globOptions: { dot: true, ignore: ["**/Pulumi.stack.yaml"] } })`
2. If `options.createStackConfig`, renders `Pulumi.stack.yaml` separately to `Pulumi.<environment>.yaml`.

The EJS context is `{...this.options, ...this.props}`, so templates can reference `projectName`, `prefix`, `environment`, and `versions.*`.

**Template directory naming is inconsistent** — check before assuming. AWS generators mostly set `this.name = "vpc"` and call `templatePath(\`aws-${this.name}\`)`; DigitalOcean generators set `this.name = "do-droplet"` and call `templatePath(this.name)`. `ansible-aws`/`ansible-do` share a `templates/ansible/stack` tree written to `ansible/<environment>/`. `generators/ssh-key-folder` extends `Generator` directly rather than `PulumiGenerator`.

### Composite generators

`aws-swarm`, `do-swarm`, and friends are meta-generators: they hold a `resourcesList` of sibling generator names and a `generatorsProps` map of per-generator option overrides, then `composeWith` each with `{...resourceProps, ...this.options, projectName: resource}`. This is how a whole Swarm environment (VPC, EBS, EIP, security groups, instance profile, Route53, leader, Ansible) is emitted in one run.

### Generated-project conventions

Each emitted Pulumi project is a self-contained folder: `Pulumi.yaml`, `Pulumi.<env>.yaml`, `package.json`, `tsconfig.json`, `index.ts`, `config.ts`, `.env.example`, `.gitignore`, `README.md`. Cross-project wiring is by **stack name convention** — stack configs point at siblings via `<prefix>-<resource>` (e.g. `<%= prefix %>-resources`, `<%= prefix %>-ssh-keypairs`) and the generated `config.ts` resolves them with Pulumi `StackReference`. When adding a generator that depends on another project's outputs, follow the same `<prefix>-<name>` naming.

## Adding a new generator

1. Create `generators/<name>/index.js` extending `PulumiGenerator` and `generators/<name>/templates/<dir>/…`.
2. Register it in `generators/app/index.js`: import, `choices` entry, and `generators` map entry.
3. If it belongs in a bundle, add it to that composite's `resourcesList` and `generatorsProps`.
4. Take dependency versions from `this.options.versions`, never hardcode them in a template `package.json`.

## Conventions

- ESM only. `.js` files use `import`/`export`; the one CommonJS file is `ship.config.cjs`.
- **Biome for linting only** — `formatter` is disabled in `biome.json`, and `templates/`, `__tests__`, and `ship.config.cjs` are excluded from linting. Formatting is governed by `.editorconfig` (2-space indent, final newline). Existing generator files have loose/inconsistent spacing; match the file you're editing rather than reformatting.
- Commit messages must be [conventional commits](https://www.conventionalcommits.org) — enforced by commitlint via the husky `commit-msg` hook. The `pre-commit` hook runs `npm run lint`.
- Releases are driven by [Ship.js](https://github.com/algolia/shipjs): `just release` (`shipjs prepare`) opens a release PR; merging a `releases/v*` branch triggers `shipjs trigger` in CI to publish. Don't hand-edit `CHANGELOG.md` or the `version` in `package.json`.
- Dependencies are kept current by Renovate.
