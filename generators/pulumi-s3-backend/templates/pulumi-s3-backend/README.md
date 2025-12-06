# Pulumi S3 backend

Provisions an AWS S3 bucket as a Pulumi self-managed backend.

Once provisioned, there should be no need to update this resource.

## Usage

To use this backend for other Pulumi projects:

### Set `PULUMI_BACKEND_URL` environment variable

```bash
export PULUMI_BACKEND_URL=`pulumiBackendUrl`
```

If using `direnv`, update the root folder's `.env` file:

```
# .env
PULUMI_BACKEND_URL=`pulumiBackendUrl`
```

### Use the `pulumiStackInitCommand` to initialize a stack

```bash
pulumi stack init --secrets-provider='awskms:///44ea4490-bda5-48cc-9113-614169407c10' [<project_name>.]<stack_name>
```

## Outputs

### bucketArn 

`arn:aws:s3:::hijoli-pulumi-state-a14c122`

The ARN of the AWS S3 bucket used as the Pulumi backend.

### bucketId

`hijoli-pulumi-state-a14c122`

The id/name of the AWS S3 bucket.

### pulumiBackendLoginCommand

`pulumi logout && pulumi login s3://hijoli-pulumi-state-a14c122`

Use this command to log into the Pulumi Backend.

Alternatively, use the `PULUMI_BACKEND_URL` environment variable (see below).

### pulumiBackendUrl

`s3://hijoli-pulumi-state-a14c122`

The url of the Pulumi backend.

Set this as the value of the `PULUMI_BACKEND_URL` environment variable to avoid having to log into the Pulumi backend constantly.

### pulumiEncryptionProviderAlias

`awskms:///alias/hijoli-pulumi-state`

The alias of the pulumi secrets provider used to encrypt secrets.

### pulumiEncryptionProviderId

`awskms:///44ea4490-bda5-48cc-9113-614169407c10`

The id of the pulumi secrets provider used to encrypt secrets.

### pulumiStackInitCommand

`pulumi stack init --secrets-provider='awskms:///44ea4490-bda5-48cc-9113-614169407c10' <project_name>.<stack_name>`

Use this command to initialize a stack.

## Backend

The backend for this project is in the Pulumi cloud.

|--------------|------------------------|
| Url          | https://app.pulumi.com |
| Account      | `hijoli`               |
| Organization | `hijoli`               |


## Backend

The backend for this project is expected to be the Pulumi cloud.

## Requirements

* node >= 24
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS profile 

## Environment variables

The following environment variables must be set:

| Name | Description |
|------|-------------|
| `AWS_PROFILE` | An AWS profile that has permission to create an S3 buclket and associated IAM policies. |
| `PULUMI_ACCESS_TOKEN` | A Pulumi API access token | 

## Usage (bash scripts)

### update.sh

```bash
./update {stack}
```

Updates the stack.

### output.sh

```bash
./output {stack}
```

Lists the stack's outputs.

## Usage (manual)

### Install dependencies 

```
npm install
```

### Login to the Pulumi cloud as the backend

If logged in to another backend

```bash
pulumi logout
```

Log into the Pulumi cloud

```bash
pulumi login
```

### Set the default organization 

```bash
pulumi org set-default {your organization}
```

### Provisioning resources

* Initialize and select the appropriate stack

```bash
pulumi stack init {stack}
```

Or select the appropriate stack if it already exists

```bash
pulumi stack select {stack}
```

* Update the stack config `Pulumi.{stack}.yaml` with the appropriate values for your project.

* Run `pulumi up`

### Using the backend in another Pulumi project

To use the backend in another Pulumni project you must login into the backend.

The login command to use can be copied from the output of this Pulumi project. 

* Select the appropriate stack

```bash
pulumi stack select {stack}
```

* Check the stack's output

```bash
pulumi stack output
```

Copy the `pulumiBackendLoginCommand` output value. It should be in the form of:

`pulumi login s3://{stack}-pulumi-state`

Alternatively, you can view the command in the Pulumi cloud.

* Go to your other Pulumi project.
* Run the Pulumi login command

### Destroying resources

* Select the appropriate stack

```bash
pulumi stack select {stack}
```

* Update the stack config

Update the `protect` and `retainOnDelete` stack config settings to `false`.

If the bucket contains entries, either empty the bucket or update the `forceDestroy` stack config setting to `true`.

* Destroy the resources

```
pulumi destroy
```


## Resources provisioned

| Resource | Class | Description |
|----------|-------|------------|
| Bucket   | `aws.s3.BucketV2` | The bucket used as the Pulumi backend |
| Versioning | `aws.s3.BucketVersioningV2` | |
| Public access block | `aws.s3.BucketPublicAccessBlock` | Bucket is private. |
| Encryption | `aws.s3.BucketServerSideEncryptionConfigurationV2` | |
| Bucket policy | `aws.s2.BucketPolicy` |  |
| Key | `aws.kms.Key` | Key used by the Pulumi secrets provider to encrypt secrets |
| Alias | `aws.kms.Alias` | Key alias |

## Configuration settings


| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `aws-account-arns` | string |  | AWS accounts to be granted access to the backend for different roles. The format should be <Account ID>:role/<Role Name> for roles <Account ID>:user/<Username> for users. |
| `forceDestroy` | Boolean | `false` | Indicates whether all objects should be destroyed when the bucket is destroyed. See `aws.s3.Bucket` `forceDestroy` |
| `keyDeletionWindow` | number | 7 | Deletion widow (in days) for AWS Key |
| `name` | String |  | The name of the S3 bucket to provision.  |
| `protect` | boolean | false | Protect resources from accidental deletion |
| `retainOnDelete` | boolean | false | Retain resources when destroyed |
| `secretsProvider` | string | "passphrase"  | Type of secrets provider for encrypting secrets in the backend. Acceptable values are `passphrase` or `kms`.  |

### aws-account-arns example

#### Granting access to a role of an account

```
<AccountID>:role/<FederatedUser>
```

For example:

123456789:role/AWSReservedSSO_Devops-AdministratorAccess_ABC123/

#### Granting access to a user of an account

```
<AccountID>:user/<Username>
```

For example:

123456789:user/bob@example.com

#### Granting access to an account

```
<AccountID>:root
```

For example:

123456789:root

## Outputs


| Output | Description |
|--------|-------------|
| `bucketArn` | The arn of the bucket  |
| `bucketId` | The id o the bucket |
| `pulumiBackendLoginCommand` | The comamnd to login into the backend |
| `pulumiBackendUrl` | The url of the S3 pulumi backend |
| `pulumiSecretsProviderId` | The id of the pulumi secrets provider used to encrypt secrets }
| `pulumiSecretsProviderAlias` | The alias of the pulumi secrets provider used to encrypt secrets }
| `pulumiStackInitCommand` |  The command to initialize a stack |
