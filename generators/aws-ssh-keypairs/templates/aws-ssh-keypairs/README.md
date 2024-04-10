# AWS SSH Keypairs

Provisions AWS SSH keypairs. A keypair is required in order to provision EC2 instances.

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo
* A folder containing public SSH keys. 

### SSH keys folder

This folder contains all the public SSH keys (`*.pub` files) that are relevant for this project. The folder can be provisioned using the `ssh-key-folder` generator. Copy all required public keys into this folder. The names of these files (excluding the `.pub` extension) are used as the key names in the `keyNames` stack config setting.


## Usage

* Cd into the `aws-ssh-keypair` folder.

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

## Resources provisioned

### AWS SSH Keypair

1 AWS key pair is provisioned for each value of the `keyNames` stack config setting.

The `keyNames` setting refers to the name of the public key file (without the `.pub` extension) in the `keyFolder` fdirectory. 

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| keyFolder | string | `../ssh-keys` | The path to the folder contaning the public keys |
| keyNames | string[] | | The names of the SSH key pairs to provision. |
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
