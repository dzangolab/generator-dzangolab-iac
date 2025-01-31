# DigitalOcean Docker nfs server

This project allows you to create and maintain shared network storage for your applications running on the DigitalOcean cloud. 

## Requirements

* node >= 22.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* A DigitalOcean account
* A DigitalOcean Personal Access Token
* An existing devops repo

## Usage

* Cd into the `do-nfs-server` folder.

* Install dependencies 

```
npm install
```

* Copy `.env.example` to `.env` and update your DigitalOcean Personal Access Token.

* Set the default organization 

```bash
pulumi org set-default {your organization}
```

* Initialize and select the appropriate stack

```bash
pulumi stack init [staging|production]
pulumi stack select [staging|production]
```

* Update the stack config `Pulimi.[staging|production].yaml` with the appropriate values for your project.

* Run `pulumi up`


### To destroy resources:

```
pulumi destroy
```

## Resources provisioned

### Project

A DigitalOcean project where a nfs server is installed.

### Volume

Block volume. The volume is associated to the project.

### VPC

A VPC to isolate resources in the project.

## Resource names

Resources are given a unique physical name by adding a suffix common to all names. This ensures that physical names are unique but also that they are related. It becomes easy to understand which resources werer created as part of the same batch. Because the suffix is used in the volume name,m it must be lowercase and alphanumeric. We recommend using a datestamp in the form of `YYYYMMDD`. 

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| dataVolumeSize | number | | Size of block volume to create |
| description | string | `{stack}` infrastructure | DO project description |
| environment | string | `{stack}` | DO project environment |
| ipRange | string | null | VPC custom IP range (eg `10.10.10.0/24`) |
| name | string | `{stack}` | DO project name | 
| nameSuffix | string |  |  `YYYYMMDD` |
| protect | boolean | false | Protect resources from accidental deletion |
| region | string | | DO region |
| retainOnDelete | boolean | false | Retain resources when destroyed |
