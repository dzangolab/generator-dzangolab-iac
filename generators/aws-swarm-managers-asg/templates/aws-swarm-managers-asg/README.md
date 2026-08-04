# AWS Docker swarm managers ASG

Provisions an AWS auto-scaling group for managers in a Docker swarm.

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

### AWS EC2 LaunchTemplate

### AWS Auto-scaling Group

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
