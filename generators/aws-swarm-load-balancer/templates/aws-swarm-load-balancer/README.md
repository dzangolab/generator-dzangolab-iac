# AWS Docker swarm tokens

Provision a pulumi project aws load balancer.  

## Requirements

* node >= 22
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile

## Usage

* Install dependencies 

```
npm install
```

* Set the AWS_PROFILE environment variable

```
export AWS_PROFILE=XXXXXX
```

* If using Pulumi cloud as your backend, set the default organization 

```bash
pulumi org set-default {your organization}
```

* Initialize and select the appropriate stack

```bash
pulumi stack init [staging|production]
```

* Update the stack config `Pulimi.[staging|production].yaml` with the appropriate values for your project.

* Run `pulumi up`

### To destroy resources:

```
pulumi destroy
```

## Resources provisioned

### Pulumi project containing worker and manager swarm tokens

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| eipStack | string | aws-lb-eip | Name of the stack of the eip if used. |
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
| user | string | ec2-user | User used to connect to the swarm leader |
| securityGroupsStack | string | aws-security-groups | Name of the stack defining the security groups |
| vpcStack | string | aws-vpc | Name of the stack defining the vpc |