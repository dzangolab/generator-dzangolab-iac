# Swarm credentials

Provisions passwords and credentials to be used by various services or users in the Docker swarm.

These resources are provisioned independently so that they may be renewed easily.

## Requirements

* node >= 22.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile

## Usage

* Cd into the `aws-credentials` folder.

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

## Rotating passwords

This project provides a crude way to rotate passwords.

To rotate the passwords, change the `timestamp` stack config setting and run `pulumi up`.

The `timestamp` can be any string as long as it's different from the previous value, but using a timestamp provides the additional information about when the paswords were created or last rotated.

This project currently does not support rotating AWS access keys.

## Resources provisioned

### SecretVersion

A `SecretVersion` holding the current version of the secret value.

### Secret value

The AWS Secret value is a stringified JSON object with the following key/values:

| Secret key                   | Comments |
|------------------------------|----------|
| `database-password`          | Password for database user          | 
| `database-root-password`     | Password for database root user     | 
| `traefik-dashboard-password` | Password for `admin` user to access traefik dasboard |
| `access-key-id`              | Access key id for AWS user   |  
| `secret-access-key`          | Secret access key id for AWS user   |  
| `ses-smtp-username`          | Access key id for SES SMTP user     |
| `ses-smtp-password`          | Secret access key for SES SMTP user |


## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `aws-resources-project` | string | `aws-resources` | Name of project defining aws resources | 
| passwordLength | number | 24 | Length of passwords |
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resoruces when destroyed |
| secretRecoveryWindowInDays | number | 7 | AWS secret recovery window in days |
| timestamp | string | | Suffix used to uniquely identify secret version and allow rotation |
