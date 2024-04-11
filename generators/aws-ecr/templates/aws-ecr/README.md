# AWS ECR Repositories

Provisions AWS ECR repositories.

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo

## Usage

* Cd into the `aws-ecr` folder.

* Install dependencies 

```
npm install
```

* Set the AWS_PROFILE environment variable

```
export AWS_PROFILE=XXXXXX
```

* Set the default organization 

```bash
pulumi org set-default {your organization}
```

* Initialize and select the appropriate stack

```bash
pulumi stack init global
```

* Update the stack config `Pulimi.global.yaml` with the appropriate values for your project.

* Run `pulumi up`

### To destroy resources:

```
pulumi destroy
```

### Importing

Unfortunately, existing ECR repositories cannot be imported into this IaC.

## Resources provisioned

### AWS ECR Repositories

1 AWS ECR repository is provisioned for each value of the `images` stack config setting.

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| images  | string[] | | The names of the repositories to be provisioned |
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
