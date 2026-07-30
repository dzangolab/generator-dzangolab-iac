#!/usr/bin/env bash

# Usage
# ./output.sh

npm install
pulumi logout
pulumi login "file://$(pwd)/.local"
pulumi stack select <%= environment %>
if [ $? -eq 0 ]; then
  pulumi stack output
fi
pulumi logout
