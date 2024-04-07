# AWS resources

Provisions resources in AWS for the Docker swarms.

Note: This project does NOT provision the Docker swarm itself. The Docker swarm is provisioned separately in the [swarm-droplets](../droplets/README.md) project. 

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo


## Usage

* Cd into the `aws-resources` folder.

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
pulumi stack init [staging|production]
```

* Update the stack config `Pulimi.[staging|production].yaml` with the appropriate values for your project.

* Run `pulumi up`

### To destroy resources:

```
pulumi destroy
```

## Resources provisioned (AWS)

### Secret

Secret is created empty. It is expected to be filled with a `SecretVersion` by the [`swarm-credentials`](../credentials/README.md) project.

### IAM user

This user is expected to be used for pulling the app's Docker images from AWS ECR, and to save files to the AWS S3 bucket created in this project.

### SES SMTP user

This user is used for sending emails via AWS SES. Its credentials (`AccessKey`) will be generated and stored in the secret by the [`swarm-credentials`](../credentials/README.md) project.

The SES Smtp User is only generated if the `useSesSmtp` setting is set to `true` in the config.

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resoruces when destroyed |
| secretRecoveryWindowInDays | number | 7 | AWS secret recovery window in days |
| useSesSmtp | boolean | false | Whether a SES Smtp user should be created |
| username | string | `{stack}` | Name of IAM user to create | 
