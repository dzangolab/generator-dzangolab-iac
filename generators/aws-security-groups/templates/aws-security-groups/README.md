# AWS Security groups

Provisions one or more AWS pre-defined security groups.

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

* If using the Pulumi cloud as your backend, sset the default organization 

```bash
pulumi org set-default {your organization}
```

* Initialize and select the appropriate stack

```bash
pulumi stack init <stack>
```

* Update the stack config `Pulimi.<stack>.yaml` with the appropriate values for your project.

* Run `pulumi up`

### To destroy resources:

```
pulumi destroy
```

## Resources provisioned

### AWS Security groups

| Name             | Port range | Protocol | Secure | 
|------------------|------------|----------|--------|
| `dns`            | 53         | TCP/UDP  | Always |
| `nfs`            | 2049       | TCP/UDP  | As per `secure` option |
|                  | ALL        | ICMP     | As per `secure` option |
| `ssh`            | 22         | TCP      | Never  |
| `ssh-bastion`    | 22         | TCP      | Always |
| `swarm-managers` | 2377       | TCP      | Always |
|                  | 4789       | UDP      | Always |
|                  | 7946       | TCP/UDP  | Always |
| `swarm-workers ` | 4789       | UDP      | Always |
|                  | 7946       | TCP/UDP  | Always |
| `web`            | 80         | TCP      | Never  |  
|                  | 443        | TCP      | Never  | 

## Configuration settings

| Setting | Type    | Default | Description |
|---------|---------|---------|-------------|
| cidrBlock | string | | CIDR block to use in security group ingress rules. Required if `vpcId` is present. | 
| name    | string  | `stack` | The name of the security group |
| protect | boolean | false   | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
| secure  | boolean | true | If true, ingress in some security groups is restricted to the VPC's cidrBlock. |
| securityGroups | string[] | `web` | A list of security groups to create. Items must be from the supported list: `dns`, `nfs`, `ssh`, `swarm-managers`, `swarm-workers`, `web`. |
| vpcStack | string | `aws-vpc` | The name of the project that provisions the AWS VPC to which this security group will belong. Ignored if `vpcId` is defined |
| vpcId   | string |          | The id of the AWS VPC top which this security group belongs. Optional, but takes precedence over `vpcStack` if present. | 
