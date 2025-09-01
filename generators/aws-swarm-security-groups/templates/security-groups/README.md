# AWS Security groups

Provisions an AWS Security groups for a Docker swarm

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo

## Usage

* Cd into the `aws-swarm-security-groups` folder.

* Install dependencies 

```
npm install
```

* Set the AWS_PROFILE environment variable

```
export AWS_PROFILE=XXXXXX
```

* If using Pulumi cloud, set the default organization 

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

### AWS Security groups

The following security groups are provisioned:

| Nodes | Provisioned when | Outputs |
|-------|------------------|---------|
| Swarm managers nodes | Always | `managersSecurityGroupArn`, `managersSecurityGroupId` |
| Sarm worker nodes    | `useWorkers == true` | `workersSecurityGroupArn`, `workersSecurityGroupId` |
| Bastion | `useBastion == true` | `bastionSecurityGroupArn`, `bastionSecurityGroupId` |
| NFS server | `useNFS == true` | `nfsSecurityGroupArn`, `nfsSecurityGroupId` |

## Configuration settings

| Setting | Type    | Default | Description |
|---------|---------|---------|-------------|
| cidrBlock | string (CIDR format)  |  | The VPC's CIDR block. Required if `vpcId` is supplied. |
| name    | string  | `stack` | The name of the security group |
| protect | boolean | false   | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
| usebastion | Boolean | false | True if a bastion is used |
| useNFS | Boolean | false | True if a NFS server is used |
| useWorkers | Boolean | false | True if worker nodes are used |
| vpcId   | string |          | The id of the AWS VPC top which this security group belongs. Takes precedence over `vpcStack`. | 
| vpcStack   | string |          | The full name  of the Pulumi stack provisioning the VPC associated with the security groups. Required if `vpcId` is not supplied. | 
