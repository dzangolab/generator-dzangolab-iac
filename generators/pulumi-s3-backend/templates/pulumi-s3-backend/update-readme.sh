#!/usr/bin/env bash

# Usage
# ./update-readme.sh
#
# Fills in the {{outputName}} placeholders throughout README.md with this
# stack's real `pulumi stack output` values. Run after `pulumi up`; safe to
# re-run any time.

npm install
pulumi logout
pulumi login "file://$(pwd)/.local"
pulumi stack select <%= environment %>

if [ $? -eq 0 ]; then
  get_output() {
    pulumi stack output "$1" 2>/dev/null || echo "n/a"
  }

  awk \
    -v pulumiBackendUrl="$(get_output pulumiBackendUrl)" \
    -v pulumiBackendLoginCommand="$(get_output pulumiBackendLoginCommand)" \
    -v pulumiStackInitCommand="$(get_output pulumiStackInitCommand)" \
    -v pulumiEncryptionProviderKeyId="$(get_output pulumiEncryptionProviderKeyId)" \
    -v pulumiEncryptionProviderKeyAlias="$(get_output pulumiEncryptionProviderKeyAlias)" \
    -v bucketArn="$(get_output bucketArn)" \
    -v bucketId="$(get_output bucketId)" \
    '
    # Literal (non-regex) substring replace, so values with `/`, `&`, etc. are safe.
    function replace(str, old, new,    result, idx) {
      result = ""
      while ((idx = index(str, old)) > 0) {
        result = result substr(str, 1, idx - 1) new
        str = substr(str, idx + length(old))
      }
      return result str
    }

    {
      line = $0
      line = replace(line, "{{pulumiBackendUrl}}", pulumiBackendUrl)
      line = replace(line, "{{pulumiBackendLoginCommand}}", pulumiBackendLoginCommand)
      line = replace(line, "{{pulumiStackInitCommand}}", pulumiStackInitCommand)
      line = replace(line, "{{pulumiEncryptionProviderKeyId}}", pulumiEncryptionProviderKeyId)
      line = replace(line, "{{pulumiEncryptionProviderKeyAlias}}", pulumiEncryptionProviderKeyAlias)
      line = replace(line, "{{bucketArn}}", bucketArn)
      line = replace(line, "{{bucketId}}", bucketId)
      print line
    }
    ' README.md > README.md.tmp && mv README.md.tmp README.md
fi

pulumi logout
