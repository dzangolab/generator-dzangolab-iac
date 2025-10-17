# AWS Docker swarm leader

Provisions an AWS EC2 instance as a docker swarm leader and initializes the Docker swarm.

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

* If using the Pulumi cloud as a backend, set the default organization 

```bash
pulumi org set-default {your organization}
```

* Initialize and select the appropriate stack

```bash
pulumi stack init {stack}
```

* Update the stack config `Pulimi.{stack}.yaml` with the appropriate values for your project.

* Run `pulumi up`

### To destroy resources:

```
pulumi destroy
```

## Resources provisioned

### AWS EC2 instance

An AWS EC2 instance is launched.

The 

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
