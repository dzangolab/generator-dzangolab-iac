---
type: Pulumi Project
title: AWS Docker swarm leader
description: Provisions an AWS EC2 instance as a docker swarm leader and initializes the Docker swarm.
tags: [pulumi, aws, ec2, docker, swarm]
generated: { by: generator-dzangolab-iac/<%= generatorVersion %>, at: <%= new Date().toISOString() %> }
---

# AWS Docker swarm leader

Provisions an AWS EC2 instance as a docker swarm leader and initializes the Docker swarm.

## Resources provisioned

<!--
  update-readme.sh renders the section below from this template — one block
  per Pulumi stack that has been documented so far. To change what's shown
  per stack, edit this template (not the generated content below it), then
  re-run ./update-readme.sh.

  STACKS_TEMPLATE:BEGIN
### {{stackName}}

**EC2 instance** (`aws.ec2.Instance`) — includes attributes this project references but doesn't itself provision (VPC, subnet, security groups, IAM instance profile, keypair), since they still define the running instance.

| Attribute | Value |
|---|---|
| Name | `{{name}}` |
| Instance ID | `{{id}}` |
| ARN | `{{arn}}` |
| Instance type | `{{instanceType}}` |
| AMI | `{{ami}}` |
| Availability zone | `{{availabilityZone}}` |
| VPC | `{{vpcId}}` |
| Subnet | `{{subnetId}}` |
| Security groups | `{{securityGroupIds}}` |
| IAM instance profile | `{{iamInstanceProfile}}` |
| Keypair | `{{keypair}}` |
| Private IP | `{{privateIp}}` |
| Public IP (via EIP) | `{{publicIp}}` |
| Auto-assign public IP | `{{associatePublicIpAddress}}` |
| Detailed monitoring | `{{monitoring}}` |
| API termination protection | `{{disableApiTermination}}` |
| Root volume | `{{rootVolume}}` |
| Tags | `{{tags}}` |

* **Elastic IP association** (`aws.ec2.EipAssociation`) — associates EIP `{{eipId}}` with the instance.
* **EBS volume attachment** (`aws.ec2.VolumeAttachment`) — {{volumeAttachment}}
* **SSH known_hosts helper** (`command.local.Command`) — {{knownHostsHelper}}
  STACKS_TEMPLATE:END
-->

<!-- STACKS_RENDERED:BEGIN -->
_No stacks rendered yet. Select a stack (`pulumi stack select <stack>`) and run `./update-readme.sh` after `pulumi up`._
<!-- STACKS_RENDERED:END -->

## Backend

All stacks in this project share the following backend.

<!-- BACKEND:BEGIN -->
_Not yet determined. Run `./update-readme.sh` with a stack selected to fill this in._
<!-- BACKEND:END -->

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo

## Usage

All command must be run from the project's root folder.

* Install dependencies 

```
npm install
```

* Set the AWS_PROFILE environment variable

```
export AWS_PROFILE=XXXXXX
```

### Login to your backend

<!-- LOGIN:BEGIN -->
_Not yet determined. Run `./update-readme.sh` with a stack selected to fill this in._
<!-- LOGIN:END -->

* Initialize and select the appropriate stack

```bash
pulumi stack init {stack}
```

* Update the stack config `Pulumi.{stack}.yaml` with the appropriate values for your project.

* Run `pulumi up`

* Run `./update-readme.sh` to fill in the [Resources provisioned](#resources-provisioned), [Backend](#backend), and [Login to your backend](#login-to-your-backend) sections above with this stack's real values.

### To destroy resources:

```
pulumi destroy
```

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
