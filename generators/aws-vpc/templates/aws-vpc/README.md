# AWS VPC

Provisions a AWS VPC.

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo


## Usage

* Cd into the `aws-vpc` folder.

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

## Resources provisioned (AWS)

### VPC


## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| availabilityZones | string[] | First 3 AZ in current region | Availability zones in which to create subnets |
| cidrBlock | string | 10.0.0.0/16 | The CIDR block for the VPC |
| enableDnsHostnames | boolean | false | A boolean flag to enable/disable DNS hostnames in the VPC |
| enableDnsSupport  | boolean | false | A boolean flag to enable/disable DNS support in the VPC |
| name | string | `stack` | The name  of the VPC |
| natGatewayStrategy | string \| `awsx.ec2.NatGatewayStrategy` | None | None, Single, OnePerAZ |
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resoruces when destroyed |
| subnetSpecs | `awsx.ec2.SubnetSpecs` | See stack config | A list of subnet specs that should be deployed to each AZ specified in availabilityZoneNames |
| subnetStrategy | string \| `awsx.ec2.SubnetAllocationStrategy` | "Auto" | The strategy to use when allocating subnets for the VPC |
| suffix | string | | Suffix for resources names to ensure unicity over time. We recommend to use datestamp `YYYYMMDD` | 
