# AWS NFS Server

Provisions a NFS server on AWS.

## Requirements

* node >= 22.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* A DigitalOcean account
* A DigitalOcean Personal Access Token
* An existing devops repo

## Usage

All commands must be run from inside the Pulumi project folder.

* Install dependencies 

```
npm install
```

* Copy `.env.example` to `.env` and update the environment variables.

* Log into or configure your AWS profile

* If using the Pulumi cloud as backend, set the default organization 

```bash
pulumi org set-default {your organization}
```

* Initialize and select the appropriate stack

```bash
pulumi stack init {stack}
pulumi stack select {stack}
```

* Update the stack config `Pulimi.{stack}.yaml` with the appropriate values for your project.

* Run `pulumi up`

### To destroy resources:

```
pulumi destroy
```

## Resources provisioned

### NFS Server

An AWS EC2 instance acting as an NFS server.


### Local command

The instance's SSH key will be added to the user's `~/.ssh/knwn_hosts` file when created.

The entry wil be deleted from `~/.ssh/known_hosts` when the instsance is destroyed.

Note: this only works for the user running the `pulumi up` or `pulumi destroy` command. 


## Configuration settings


| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| ami     | string | | AMI image to use for the instance |
| availabilityZone | string | | AZ in which to launch the instance |
| disableApiTermination | boolean | false | Disable instance API termination |
| iamInstanceProfile | string | | Id of IAM instance profile associated with the instance |
| iamInstanceProfileStack | string | Fully-qualified name of Puluni project provisioning the instance profile to use with the instance |
| instanceType | string | | Instance type |
| keyname | string | | Name of SSH key used to launch instance |
| keypair | string | | Name of SSH keypair used to launch instance |
| keypairsStack | string | | Fully-qualified name of Puluni project provisioning the SSH keypair to use with the instance |
| monitoring | boolean | false | Enable instance monitoring |
| name | string | | Resource name |
| protect | boolean | false | Protect resource against accidental destruction |
| retainOnDelete | boolean | false| Retain resource when stack is destroyed |
| rootBlockDeviceSize | number | 20 | Size in Gb of root block device |
| securityGroupId | string | | Id of security group id to add to the instance |
| securityGroupStack | string | | Fully-qualified name of Pulumi project provisioning the security group to associate with the instance |
| subnetId | string | | Id of subnet in which to provision the instance |
| tags | string[] | | Tags to set on the instance. Includes `Name` tag |
| volumeId | string | | Id of EBS block volume to add to the instance |
| volumeStack | string | | Fully-qualified name of Pulumni project provisioning the EBS block volume to use |