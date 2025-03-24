# Pulumi S3 backend

Provisions an AWS S3 bucket as a Pulumi self-managed backend.

Note: The state for this project is expected to be stored on the Pulumi cloud.

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS profile

## Usage (bash scripts)

<% if (!awsProfile) { %>Export the AWS_PROFILE environment variable

```bash
export AWS_PROFILE=AWS_PROFILE
```
<% } %>

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

### Update environment variables

Copy `.env.example` to `env` and update the file as appropriate.

```bash
cp .env.example .env
```

The `AWS_PROFILE` env variable should remain set to `pulumi`.

Update runtime environment variables.

```bash
direnv allow
```

### Install dependencies 

```
npm install
```

* Set the AWS_PROFILE environment variable

```
export AWS_PROFILE=XXXXXX
```


### Login to the Pulumi cloud as the backend

If logged in to another backend

```bash
pulumi logout
```

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

* Update the stack config `Pulimi.{stack}.yaml` with the appropriate values for your project.

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

| Setting | Type | Default | Required | Description |
|---------|------|---------|-------------|----------|
| aws-account-arns | string |  | No | AWS accounts to be granted access to the backend for different roles. The format should be <Account ID>:role/<Role Name> for roles <Account ID>:user/<Username> for users. |
| forceDestroy | Boolean | `false` | No | Indicates whether all objects should be destroyed when the bucket is destroyed. See `aws.s3.Bucket` `forceDestroy` |
| keyDeletionWindow | number | 7 | No | Deletion widow (in days) for AWS Key |
| name | String |  | No | The name of the S3 bucket to provision.  |
| protect | boolean | false | No | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | No | Retain resources when destroyed |

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

123456789:user/anthony@dzangolab.com

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
