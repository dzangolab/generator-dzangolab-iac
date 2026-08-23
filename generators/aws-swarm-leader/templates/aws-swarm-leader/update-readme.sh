#!/usr/bin/env bash

# Usage
# ./update-readme.sh
#
# Regenerates two parts of README.md for the currently selected Pulumi
# stack:
#
# - "## Resources provisioned": generic, works for any project whose
#   README.md follows the STACKS_TEMPLATE / STACKS_RENDERED / STACK:<name>
#   convention below. Every {{outputKey}} placeholder found in the
#   extracted per-stack template is resolved against
#   `pulumi stack output --json` — no output names are hardcoded, so this
#   part of the script can be reused as-is by any generator that adopts the
#   same README convention. Only the currently selected stack's
#   sub-section is touched — other stacks' rendered sub-sections are left
#   untouched.
#
# - "## Backend" and "### Login to your backend": project-specific (not
#   generic) — describe which Pulumi backend and secrets provider are
#   configured, since that can't be known at generation time and isn't a
#   Pulumi stack output. Both apply to the whole project, so these blocks
#   are always fully regenerated (no per-stack splicing needed).
#
# Run after a successful `pulumi up`. Safe to re-run.

set -u

readme="README.md"
tmp_readme="README.md.tmp"
template_file="$(mktemp)"
block_file="$(mktemp)"
backend_block_file="$(mktemp)"
login_block_file="$(mktemp)"

cleanup() {
  rm -f "$template_file" "$block_file" "$backend_block_file" "$login_block_file" "$tmp_readme"
}
trap cleanup EXIT

npm install

if ! pulumi stack --show-name >/dev/null 2>&1; then
  pulumi stack select
fi

stack_name="$(pulumi stack --show-name 2>/dev/null)"

if [ -z "$stack_name" ]; then
  echo "update-readme.sh: no stack selected — README.md left untouched." >&2
  exit 1
fi

# --- Resources provisioned ------------------------------------------------

# Extract the per-stack template. It lives inside an HTML comment in
# README.md and is never itself rewritten by this script.
awk '
  /STACKS_TEMPLATE:BEGIN/ { inTemplate = 1; next }
  /STACKS_TEMPLATE:END/   { inTemplate = 0; next }
  inTemplate              { print }
' "$readme" > "$template_file"

if [ ! -s "$template_file" ]; then
  echo "update-readme.sh: could not find STACKS_TEMPLATE markers in README.md — README.md left untouched." >&2
  exit 1
fi

outputs_json="$(pulumi stack output --json 2>/dev/null)"
[ -z "$outputs_json" ] && outputs_json="{}"

{
  echo "<!-- STACK:${stack_name}:BEGIN -->"

  if [ "$(printf '%s' "$outputs_json" | tr -d '[:space:]')" = "{}" ]; then
    printf '### %s\n\n_No outputs yet for this stack — run `pulumi up`, then re-run `./update-readme.sh`._\n' "$stack_name"
  else
    node -e '
      const fs = require("fs");

      const templatePath = process.argv[1];
      const stackName = process.argv[2];
      const outputsJson = process.argv[3];

      let outputs = {};
      try {
        outputs = JSON.parse(outputsJson) || {};
      } catch {
        outputs = {};
      }

      let template = fs.readFileSync(templatePath, "utf8");

      const tokens = [...new Set(
        [...template.matchAll(/\{\{([a-zA-Z0-9_]+)\}\}/g)].map((m) => m[1])
      )];

      for (const token of tokens) {
        let value;

        if (token === "stackName") {
          value = stackName;
        } else if (Object.prototype.hasOwnProperty.call(outputs, token)) {
          const raw = outputs[token];
          value = typeof raw === "string" ? raw : JSON.stringify(raw);
        } else {
          value = "n/a";
        }

        // Literal (non-regex) replace, so values with `/`, `&`, etc. are safe.
        template = template.split(`{{${token}}}`).join(value);
      }

      process.stdout.write(template);
    ' "$template_file" "$stack_name" "$outputs_json"
  fi

  echo "<!-- STACK:${stack_name}:END -->"
} > "$block_file"

# Splice the new block into the STACKS_RENDERED region, right after its
# BEGIN marker — dropping any prior block for this same stack found
# elsewhere in the region, and dropping the "no stacks rendered yet"
# placeholder line. Every other stack's block passes through unchanged.
awk -v blockFile="$block_file" -v stackName="$stack_name" '
  BEGIN {
    beginMarker = "<!-- STACK:" stackName ":BEGIN -->"
    endMarker = "<!-- STACK:" stackName ":END -->"
  }
  /STACKS_RENDERED:BEGIN/ {
    print
    while ((getline line < blockFile) > 0) print line
    inRendered = 1
    next
  }
  /STACKS_RENDERED:END/ { inRendered = 0; print; next }
  inRendered && index($0, beginMarker) > 0 { skipping = 1; next }
  inRendered && skipping {
    if (index($0, endMarker) > 0) skipping = 0
    next
  }
  inRendered && /No stacks rendered yet\./ { next }
  { print }
' "$readme" > "$tmp_readme"

if [ -s "$tmp_readme" ]; then
  mv "$tmp_readme" "$readme"
else
  echo "update-readme.sh: rendering produced an empty file — README.md left untouched." >&2
  exit 1
fi

# --- Backend ---------------------------------------------------------------

# Where state lives: inspect `pulumi about --json`'s backend.url scheme.
# This is a CLI-login-level fact, not a stack output, so it's resolved
# separately from the generic {{outputKey}} mechanism above.
about_json="$(pulumi about --json 2>/dev/null)"

backend_url="$(printf '%s' "$about_json" | node -e '
  let data = "";
  process.stdin.on("data", (chunk) => { data += chunk; });
  process.stdin.on("end", () => {
    try {
      const about = JSON.parse(data);
      process.stdout.write((about.backend && about.backend.url) || "");
    } catch {
      process.stdout.write("");
    }
  });
' 2>/dev/null)"

case "$backend_url" in
  file://*)
    backend_description="This project's state is stored **locally** at \`${backend_url}\` — intended for local development/testing only, not shared with the team or suitable for staging/production use."
    ;;
  s3://*|gs://*|azblob://*)
    backend_description="This project's state is stored in a self-managed backend at \`${backend_url}\`."
    ;;
  https://*)
    backend_description="This project's state is stored in **Pulumi Cloud** (\`${backend_url}\`)."
    ;;
  *)
    backend_description="Could not determine the current Pulumi backend — run \`pulumi about\` and make sure you're logged in (\`pulumi login\`) with a stack selected."
    ;;
esac

# Secrets provider: stored per-stack in Pulumi.<stack>.yaml's
# `secretsprovider:` field, not exposed via `pulumi stack output` — read it
# directly off disk rather than assuming a specific backend's conventions.
secrets_provider_raw="$(awk -F': ' '/^secretsprovider:/ { print $2; exit }' "Pulumi.${stack_name}.yaml" 2>/dev/null | tr -d '"'"'"'\r')"

case "$secrets_provider_raw" in
  awskms://*)
    key_ref="${secrets_provider_raw#awskms://}"
    key_ref="${key_ref%%\?*}"
    key_arn="$(aws kms describe-key --key-id "$key_ref" --query 'KeyMetadata.Arn' --output text 2>/dev/null)"

    if [ -n "$key_arn" ] && [ "$key_arn" != "None" ]; then
      secrets_description="Secrets are encrypted using the AWS KMS key \`${key_arn}\`."
    else
      secrets_description="Secrets are encrypted using AWS KMS (key \`${key_ref}\`) — could not resolve its ARN; check AWS_PROFILE / IAM permissions for \`kms:DescribeKey\`."
    fi
    ;;
  passphrase)
    secrets_description="Secrets are encrypted using a passphrase (\`PULUMI_CONFIG_PASSPHRASE\`) — not centrally managed; make sure it's shared with the team securely."
    ;;
  ""|default)
    secrets_description="Secrets are encrypted using the backend's default managed secrets provider."
    ;;
  *)
    secrets_description="Secrets are encrypted using \`${secrets_provider_raw}\`."
    ;;
esac

{
  echo "<!-- BACKEND:BEGIN -->"
  echo "$backend_description"
  echo ""
  echo "$secrets_description"
  echo "<!-- BACKEND:END -->"
} > "$backend_block_file"

# Always fully replace the BACKEND region — there's only one backend for
# the whole project, so (unlike STACKS_RENDERED) there's nothing else in
# this region to preserve between runs.
awk -v blockFile="$backend_block_file" '
  /BACKEND:BEGIN/ {
    while ((getline line < blockFile) > 0) print line
    inBackend = 1
    next
  }
  /BACKEND:END/ { inBackend = 0; next }
  inBackend { next }
  { print }
' "$readme" > "$tmp_readme"

if [ -s "$tmp_readme" ]; then
  mv "$tmp_readme" "$readme"
else
  echo "update-readme.sh: rendering produced an empty file — README.md left untouched." >&2
  exit 1
fi

# --- Login to your backend --------------------------------------------------

# Same backend_url as above, plus the default org for the Pulumi Cloud case
# (also from `pulumi about --json`, already fetched into $about_json).
backend_org="$(printf '%s' "$about_json" | node -e '
  let data = "";
  process.stdin.on("data", (chunk) => { data += chunk; });
  process.stdin.on("end", () => {
    try {
      const about = JSON.parse(data);
      const orgs = (about.backend && about.backend.organizations) || [];
      process.stdout.write(orgs[0] || "");
    } catch {
      process.stdout.write("");
    }
  });
' 2>/dev/null)"

case "$backend_url" in
  file://*)
    login_instructions="\`\`\`bash
pulumi login --local
\`\`\`"
    ;;
  https://*)
    if [ -n "$backend_org" ]; then
      login_instructions="\`\`\`bash
pulumi login
pulumi org set-default ${backend_org}
\`\`\`"
    else
      login_instructions="\`\`\`bash
pulumi login
pulumi org set-default {your organization}
\`\`\`"
    fi
    ;;
  s3://*|gs://*|azblob://*)
    login_instructions="\`\`\`bash
export PULUMI_BACKEND_URL=${backend_url}
\`\`\`"
    ;;
  *)
    login_instructions="_Could not determine the current backend — run \`pulumi about\` and make sure you're logged in._"
    ;;
esac

{
  echo "<!-- LOGIN:BEGIN -->"
  echo "$login_instructions"
  echo "<!-- LOGIN:END -->"
} > "$login_block_file"

# Always fully replace the LOGIN region, same reasoning as BACKEND above.
awk -v blockFile="$login_block_file" '
  /LOGIN:BEGIN/ {
    while ((getline line < blockFile) > 0) print line
    inLogin = 1
    next
  }
  /LOGIN:END/ { inLogin = 0; next }
  inLogin { next }
  { print }
' "$readme" > "$tmp_readme"

if [ -s "$tmp_readme" ]; then
  mv "$tmp_readme" "$readme"
else
  echo "update-readme.sh: rendering produced an empty file — README.md left untouched." >&2
  exit 1
fi
