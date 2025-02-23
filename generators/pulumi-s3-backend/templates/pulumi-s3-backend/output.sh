#!/bin/bash

npm install
pulumi logout
pulumi login
pulumi stack select $1
if [ $? -eq 0 ]; then
    <% if (awsProfile) { %>AWS_PROFILE=<%= awsProfile %> <% } %>pulumi stack output
fi
pulumi logout
