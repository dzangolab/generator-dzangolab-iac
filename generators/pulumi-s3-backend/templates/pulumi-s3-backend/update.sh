#!/bin/bash

npm install
pulumi logout
pulumi login
pulumi stack select $1
if [ $? -eq 0 ]; then
    {% if aws_profile %}AWS_PROFILE={{ aws_profile }} {% endif %}pulumi up
fi
pulumi logout
