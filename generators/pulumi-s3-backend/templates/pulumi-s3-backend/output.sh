#!/usr/env/bin bash

# Usage
# ./output {stack} 

npm install
pulumi logout
pulumi login
pulumi stack select $1
if [ $? -eq 0 ]; then
  pulumi stack output
fi
pulumi logout
