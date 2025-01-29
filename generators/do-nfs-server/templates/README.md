# DigitalOcean NFS server

Provisions an NFS server in DigitalOcean.

## Requirements

* node >= 16.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* A DigitalOcean account
* A DigitalOcean Personal Access Token
* An existing devops repo

All commands must be run from the `do-nfs-server` folder.

## Usage

* Install dependencies 

```bash
npm install
```

* Copy `.env.example` to `.env` and update your DigitalOcean Personal Access Token.

* If using the Pulumi cloud backend, set the default organization 

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

### Droplet

A DigitalOcean droplet to act as an NFS server.

### ProjectResources

If a DigitalOcean project id is supplied, a ProjectResources will be provisioned, associationg the droplet with the relevant project.

### LocalCommand

Adds the droplet's SSH key to the user's `known_hosts` after the droplet is provisioned. 

When the droplet is destriyed, the droplet's SSHkey is removed from the user's `known_hosts`. 

Note that this works for the user running the `pulumi up` or `pulumi destroy` command. 


## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| dataVolumeSize | number | | Size of block volume to create |
| doBlockVolumeStacks | string[] | [] | Strings identifying the stack where this droplet's volumes are provisioned |
| doProjectStack | string | String identifying the stack where this droplet DO project is provisioned |
| doVpcStack | string | | String identifying the stack where this droplet' VPC is provisioned |
| name | string | `{stack}` | DO project name | 
| nameSuffix | string |  |  `YYYYMMDD` |
| projectId | string | | Id of DO project to which this droplet is attached |
| protect | boolean | false | Protect resources from accidental deletion |
| region | string | | DO region |
| retainOnDelete | boolean | false | Retain resources when destroyed |
| size | string | 
| username | string | | Name of user to create on the droplet |

### Associating the droplet with a DigitalOcean project

The provisioned droplet can be attached to a (DigitalOcean) project. The project can be referenced in 2 ways: 

* by specifyin a project id in the stack config
* by specifying a pulumni stack where the project was provisioned

#### Project id

The Droplet can be attached to a DigitalOcean project by providing a non-null `projectId` variable in the stack config. 

If a non-null `projectId` variable is set in the stack config, then it will be used as the DigitalOcean project's id.

#### Project stack

If the DO project was provisioned via Pulumi stack, then this stack can be identified via a `doProjectStack` variable in the stack config.

This variable should be in this format:
 `{project}[/{stack]][:{output}]` 
 
where:

* `project` is the name of the pulumi project where the DO project was provisioned
* `stack` is the stack for which the DO project was povisioned. This is optional, and if not provided, the stack will default to the same stack as the current project.
* `output` is the name of the output representing the project id. This is optonal, and if not provided will default to the string `projectId`.

### Associating the droplet with a VPC

The droplet can be associated with a specific VPC in 2 ways:

* by specifying a vpcUuid in the sstack config
* by specifying a Pulumi stack where the VPC was provisioned

#### VPC UUID

The Droplet can be attached to a DigitalOcean VPC by specifying a non-null `vpcUuid` variable in the stack config. 

If a non-null `vpcUuid` variable is set in the stack config, then it will be used as the DigitalOcean VPC's uuid.

#### VPC stack

If the VPC was provisioned via Pulumi, then you can specify its stack. We assume that the organization for the VPC stack is the same as this droplet's organization.

The stack is specified in the stack config via a non-null `doVpcStack` variable in the following format:

`{project}[/{stack}][:{output}]`

where:

* `project` is the name of the Pulumi project where the VPC was provisioned
* `stack` is the stack where the VPC was provisioned. This is optional, and if not provioded, will default to the current stack.
* `output` is the name of the output representing the VPC's UUID. This is optional, and if not provided, will default to the string `vpcUuid`.

### Block volumes
