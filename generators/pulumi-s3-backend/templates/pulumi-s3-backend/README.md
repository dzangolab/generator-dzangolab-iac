# Pulumi S3 backend

Provisions an AWS S3 bucket as a pulumi self-managed backend.

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo

## Usage

* Install dependencies 

```
npm install
```

* Set the AWS_PROFILE environment variable

```
export AWS_PROFILE=XXXXXX
```


* Login to the local filesystem as the backend

```
pulumi login --local
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

### `aws.s3.Bucket` 

One instance of `aws.s3.Bucket`.

## Configuration settings

| Setting | Type | Default | Required | Description |
|---------|------|---------|-------------|
| forceDestroy | Boolean | `false` | No | Indicates whether all objects should be destroyed when the bucket is destroyed. See `aws.s3.Bucket` `forceDestroy` |
| name | String | `{organization}-pulumi-state` | No | The name of the S3 bucket to provision.  |
| protect | boolean | false | No | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | No | Retain resources when destroyed |


## Outputs


| Output | Description |
|--------|-------------|
| `bucketArn` | The arn of the bucket  |
| `bucketId` | The id o the bucket |
| `pulumiBackendLoginCommand` | The comamnd to login into the backend |
| `pulumiBackendUrl` | The url of the S3 pulumi backend |
| `pulumiSecretsProvider` | The arn of the pulumi secrets provider used to encrypt secrets }
| `pulumiStackInitCommand` |  The command to initialize a stack |

