#!/usr/bin/env bash

# Usage
# ./output.sh

npm install
pulumi logout
pulumi login "file://$(pwd)/.local"

if ! pulumi stack --show-name >/dev/null 2>&1; then
  pulumi stack select
fi

if [ $? -eq 0 ]; then
  pulumi stack output
fi
pulumi logout
