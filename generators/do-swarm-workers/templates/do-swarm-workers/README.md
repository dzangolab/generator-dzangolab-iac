# DigitalOcean Docker swarm workers

This project provisions worker nodes in DigitalOcean for a Docker Swarm. The worker nodes are assigned to a manager node using the ansible-do generator by modifying the inventory file (hosts) and running the command make setup.swarm

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* A DigitalOcean account
* A DigitalOcean Personal Access Token
* An existing devops repo

## Usage

* Cd into the `do-swarm-workers` folder.

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

A DigitalOcean project to store resources in.

### DigitalOcean project

If `projectId` or `projectStack` are set in the stack config, the corresponding project will be associated with the droplet.

If `projectId` is defined, then it will be assumed to be the id of the project.

If `projectId` is not defined, then `projectStack` is examined.

`projectStack` is expected to be in the form of `[project][:id_output`]`, where:

* `project` is the name of the Pulumi project where the DigitalOcean project was provisioned. The default value is `<%= prefix %>-do-resources`.
* `id_output` is the name of the output that represents the DigitalOcean Project's id. The default value is `projectId`.

The organization and stack of the project are assumed to be identical to the droplet's organization and stack.

### Reserved IP address

If `reservedIpId` or `reservedIpStack` are set in the stack config, the corresponding reserved IP address will be associated with the droplet.

If `reservedIpId` is defined, then it will be assumed to be the id of the reserved IP.

If `reservedIpId` is not defined, then `reservedIpStack` is examined. 

`reservedIpStack` is expected to be in the form of `[project][:id_output`]`, where:

* `project` is the name of the Pulumi project where the reserved IP was provisioned. The default value is `<%= prefix %>--do-resources`.
* `id_output` is the name of the output that represents the reserved IP's id. The default value is `reservedIpId`.

The organization and stack of the reserved IP are assumed to be identical to the droplet's organization and stack.

### Block volume

If `blockVolumeId` or `blockVolumeStack` are set in the stack config, the volume will be attached to the droplet.

The block volume is mounted in the `/mnt/data` folder. 

If `blockVolumeId` is defined, then it will be assumed to be the id of the block volume. The name of the block volume will be read from the `blockVolumeName` stack config variable.

If `blockVolumeId` is not defined, and if `blockVolumeStack` is defined, then `blockVolumeStack` is examined. 

`blockVolumeStack` is expected to be in the form of `[project][:id_output, name_output`]`, where:

* `project` is the name of the Pulumi project where the volume was provisioned. The default value is `<%= prefix %>-do-resources`.
* `id_output` is the name of the output that represents the volume's id. The default value is `volumeId`.
* `name_output`: is the name of the output that represents the volume's name. The default value is `volumeName`.

The organization and stack of the volume are assumed to be identical to the droplet's organization and stack.

### VPC

If `vpcUuid` or `vpcStack` are set in the stack config, the droplet will be attached to the VPC.

If `vpcId` is defined, then it will be assumed to be the id of the VPC.

If `vpcId` is not defined, then `vpcStack` is examined. 

`vpcStack` is expected to be in the form of `[project][:id_output`]`, where:

* `project` is the name of the Pulumi project where the VPC was provisioned. The default value is `<%= prefix %>-do-resources`.
* `id_output` is the name of the output that represents the VPC's id. The default value is `vpcId`.

The organization and stack of the VPC are assumed to be identical to the droplet's organization and stack.

### Local command

The droplet's SSH key will be added to the user's `~/.ssh/knwn_hosts` file when created.

The entry wil be deleted from `~/.ssh/known_hosts` when the droplet is destroyed.

Note: this only works for the user running the `pulumi up` or `pulumi destroy` command. 

### User 

If `username` is defined in the stack config, a user account of that name will be created on the droplet.

The user will be added to the `sudo` group as well as to any other groups defined by the `userGroups` stack config variable. This variable's format is a comma-concatenated set of group names, eg `docker,wheel`.

The mechanism to add SSH keys to the user does not use the SSH keys registered in DigitalOcean. Rather, the public keys are expected to be stored in a folder (specified via the `pathToSshKeysFolder` stack config variable). The keys to add to the user are defined by the `publicKeyNames` stack config variable. This variable's value is expected to be an array of filenames with the `.pub` extension omitted. 

For example, if the SSHkeys folder contains the public key files `alice.pub` and `bob.pub`, then the `publicSShKeys` variable is an array containing any of the following values: `alice`, `bob`.

### Root user

If `username` is defined, then root's SSH access to the droplet will be disabled.

DigitalOcean SSH keys will be added to the root account. The names of the SSH keys to add are defined by the `sshKeyNames` stack config variable.

If none are defined, then root access will be password-based.

## Resource names

Resources are given a unique physical name by adding a suffix common to all names. This ensures that physical names are unique but also that they are related. It becomes easy to understand which resources werer created as part of the same batch. Because the suffix is used in the volume name, it must be lowercase and alphanumeric. We recommend using a datestamp in the form of `YYYYMMDD`. 

## Configuration settings

# DigitalOcean Project Settings

| Setting         | Type    | Default                          | Description                                     |
|------------------|---------|----------------------------------|-------------------------------------------------|
| `doResourcesProject`          | string  | `<%=prefix%>-do-resources`                   | do-resources project name |
| `image`          | string  | `docker-20.04`                   | Image used |
| `name`          | string  | `stack-name ` | DO project name                                |                     |
| `protect`       | string  | `"false"`                       | Protect resources from accidental deletion     |
| `publicKeyNames`| array   | `- KEY_NAME`                    | Public SSH key names                           |
| `region`        | string  | `sgp1`                          | DO region                                      |
| `retainOnDelete`| string  | `"false"`                       | Retain resources when destroyed               |
| `size`          | string  | `s-1vcpu-1gb`                   | Size of block volume to create                 |   
| `username`      | string  | `USERNAME`                      | User for resource access                       |

