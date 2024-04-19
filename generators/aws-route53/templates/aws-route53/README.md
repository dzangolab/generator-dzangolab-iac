# AWS Route 553

Provisions DNS records in AWS Route 53.

This project will provision:

* 1 A record
* 1 CNAME record per alias (pointing to the host of the A record)

A wildcard CNAME record is supported.

Example:

```
A 3600 staging-20240418 x.y.z.a
CNAME 3600 * staging-20240418.mydomain.com
```

## Use cases

### Base use case

IN the base use case, both host and ip address for A record are configured manually in the stack config:

* `host`: name of host for A record
* `ip`: IP address for A record

### Combination with other projects

Often, the host and IP address will be provisioned by other Pulumi projects. Rather than having to set these attributes manually in the stack config, they can be read from the output of these other projects. 

If in DigitalOcean, a `reservedIp` might be provisioned through a `do-resources` project.

If in AWS, a `eip` might be provisioned through a `aws-eip` Pulumi project.

Both output a `ip` attribute containing the IP address.

The `config.ts` file contains sample code to obtain the `host` and `ip` address from other projects. Update `config.ts` as required.

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo

## Usage

* Cd into the `aws-route53` folder.

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

### Type A record

One A-type record is provisioned pointing to `ip` address with name `host`.

### Type CNAME records

One CNAME-type record is provisioned for each `alias` configure in the stack config.

If a `subdomain` is configured, the CNAME record name will be int he form of  `alias.subdomain`.

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| aliases | string[] | | Names of CNAME records to be provisioned. Use `*`  for wildcard CNAME alias |
| host    | string   | | Host for A record. Use `@` for apex domain |
| ip      | string   | | Ip address of A record | 
| protect | boolean  | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
| subdomain      | string  |       | Subdomain if any |
| ttl            | number  | 3600  | Time to live to set on DNS records |
