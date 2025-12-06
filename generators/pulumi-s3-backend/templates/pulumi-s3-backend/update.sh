#!/usr/env/bin bash

# Usage
# ./update {stack}
 
npm install
pulumi logout
pulumi login
pulumi stack select $1
if [ $? -eq 0 ]; then
  pulumi up
fi
pulumi logout
