# AWS Security group

Provisions an AWS EBS volume.

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

## Resources provisioned

### AWS EBS volumes

One AWS EBS volume is generated for eaceh availability zone specified in the stack config.

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| availabilityZones | string[] | | AZs in which to create a volume |
| name    | string  | | Name to give to each volume |
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
| sizes    | number or number[] | 5 | Size of volume(s). If an array, indicates the sizes of the volumes in the respective AZ. If a number, the size of all volumes. | 
