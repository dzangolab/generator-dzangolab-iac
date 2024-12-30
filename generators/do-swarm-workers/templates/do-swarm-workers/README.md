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

### TODO

## Resource names

Resources are given a unique physical name by adding a suffix common to all names. This ensures that physical names are unique but also that they are related. It becomes easy to understand which resources werer created as part of the same batch. Because the suffix is used in the volume name, it must be lowercase and alphanumeric. We recommend using a datestamp in the form of `YYYYMMDD`. 

## Configuration settings

# DigitalOcean Project Settings

| Setting         | Type    | Default                          | Description                                     |
|------------------|---------|----------------------------------|-------------------------------------------------|
| `doResourcesProject`          | string  | `prefix-do-resources`                   | do-resources project name |
| `image`          | string  | `docker-20.04`                   | Image used |
| `name`          | string  | `stack-name ` | DO project name                                |                     |
| `protect`       | string  | `"false"`                       | Protect resources from accidental deletion     |
| `publicKeyNames`| array   | `- KEY_NAME`                    | Public SSH key names                           |
| `region`        | string  | `sgp1`                          | DO region                                      |
| `retainOnDelete`| string  | `"false"`                       | Retain resources when destroyed               |
| `size`          | string  | `s-1vcpu-1gb`                   | Size of block volume to create                 |   
| `username`      | string  | `USERNAME`                      | User for resource access                       |

