# AWS ECR Repositories

Provisions one or more AWAS S3 buckets.

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

### S3Bucket 

One instance of `dzangolab:aws:S3Bucket` per bucket. See https://github.com/dzangolab/pulumi/blob/main/docs/aws/s3-bucket.md.

### AWS S3 buckets

1 AWS S3 bucket for each item under the `buckets` stack config setting.

### AWS S3 objects

For each bucket, 1 AWS S3 object (folder)  for each item under the bucket name's entry under the `folders` stack config setting. If no such setting is present, no folders will be created.

### AWS IAM bucket access policy

For each bucket, an IAM policy granting read/write access to the bucket.

## Configuration settings

| Setting | Type | Default | Required | Description |
|---------|------|---------|-------------|
| buckets | Object | | Yes | A list of buckets to create, keyed by a name. The name serves as a key to reference the bucket in the project's outputs. |
| folders | Object | | No  |A list of folders for each bucket. The buckets are referenced by the same key used in the `buckets` settig |
| protect | boolean | false | No | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | No | Retain resources when destroyed |

### Example

```yaml
aws-s3:buckets:
    postgres: postgres-backups
    redis: redis-backups
aws-s3:folders:
  postgres:
    - 2023
    - 2023
  redis:
    - 2023
    - 2024
```

## Outputs

For each bucket, where `{name}` refers to the key for the bucket in the stack config's `buckets` setting:

| Output | Description |
|--------|-------------|
| `{name}-bucket-arn` | the arn of the bucket  |
| `{name}-bucket-policy-arn` | the arn of the IAM read/write policy associated with the bucket |  

In the example above, the outputs would be:

* `postgres-bucket-arn`
* `postgres-bucket-;olicy-arn`
* `redis-bucket-arn`
* `redis-bucket-policy-arn`