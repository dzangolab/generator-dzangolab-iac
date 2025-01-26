# <%= projectName %>

This project was generated using the **DigitalOcean Docker Swarm Generator**.

It is a combination of multiple projects:
- ansible-do
- aws-credentials
- aws-resources
- cloudfalre-dns
- do-resources
- do-swarm-leader

## Configuration
- **Name Suffix**: <%= nameSuffix %>
- **Region**: <%= region %>
- **Leader Node Size**: <%= leaderSize %>
- **Username**: <%= username %>
- **Domain**: <%= domain %>
- **Traefik ACME Email**: <%= email %>

## Requirements

### Dependencies
- **[Node.js ](https://nodejs.org/)**
- **[Pulumi](https://www.pulumi.com/)**
- **[Ansible](https://www.ansible.com/)**

### Credentials
- **DigitalOcean API Token**: Required to provision resources.
- **Cloudflare API Token**: Required if managing DNS through Cloudflare.
- **AWS Credentials**: Needed if using AWS resources.

###  Root folder

If you have direnv installed 

Create or edit the .env file, the Cloudflare token will need to have the permission to edit DNS Zone
```env
DIGITALOCEAN_TOKEN=dop_v1_XXXXXXXXXXXXX
CLOUDFLARE_API_TOKEN=<token>
PULUMI_CONFIG_PASSPHRASE=<passphrase>
AWS_PROFILE=<profile>
```

Or export your variable
```bash
export DIGITALOCEAN_TOKEN=dop_v1_XXXXXXXXXXXXX
export CLOUDFLARE_API_TOKEN=<token>
export PULUMI_CONFIG_PASSPHRASE=<passphrase>
export AWS_PROFILE=<profile>
```

## Usage
Using the prompt of the generator, most variables will have a value, but some still need to be modified manually

### ansible

#### hosts:
Update ansible_host with the IP_ADDRESS after using do-swarm-leader with the provisioned ip address

#### group_vars/all.yml:
```
aws_secrets_id: SECRET_ID
```
### aws-credentials

* Install dependencies 

```
npm install
```

* Apply the configuration (only works if aws-resources was also provisioned)
```
pulumi up
```

### aws-resources

* Install dependencies 

```
npm install
```

* Apply the configuration 
```
pulumi up
```

### cloudflare-dns

Update the `Pulumi.XXX.yaml` file by choosing wich setting you want to use.


* Install dependencies 

```
npm install
```

* Apply the configuration 
```
pulumi up
```

### do-resources

* Install dependencies 

```
npm install
```

* Apply the configuration 
```
pulumi up
```

### do-swarm-leader

Update the `pulumi.XXX.yaml` file by replacing variables with the appropriate values.

#### `Pulumi.XXX.yaml`

| Variable         | Explanation                                    | Example Value           |
|----------------------|-----------------------------------------------|-------------------------|
| `publicKeyNames`| Names of the public SSH keys to use for the Swarm leader. | `my-key1`, `my-key2`    |

* Install dependencies 

```
npm install
```

* Apply the configuration 
```
pulumi up
```


## Example Provisioning a Docker swarm (via Pulumi)

Connect into a pulumi backend

```
pulumi login (for pulumi cloud)
pulumi login --local (for local backend)
pulumi login s3://<bucket> (for aws bucket)
```


### 1. Deploy DigitalOcean resources

### 2. Deploy the Swarm leader

#### If everything worked you have deployed a new Project with a node

#### Don't forget to add the IP address in your ~/.ssh/config

### Verification

Once connected you can make sure that everything is working correctly

For example:

docker -v: make sure Docker is already installed

whoami: is connected to the correct user

groups: should show user sudo docker

docker ps: should work and show nothing is created yet

sudo apt-get: should have apt-get installed

### 3 Deploy Cloudflare DNS (if needed)

### Modify the File

Update the `Pulumi.XXX.yaml` file by replacing variables with the appropriate values.

#### `Pulumi.XXX.yaml`

| Variable          | Explanation                          | Example Value      |
|-----------------------|--------------------------------------|--------------------|
| `domain`   | The domain name. | `akilara.net`  |
| `hostProject` | As it is use DigitalOcean, keep the one with the suffix do-swarm-leader, remove the rest| `XXX-do-swarm-leader` |
| `ipProject` | As it is use DigitalOcean, keep the one with the suffix do-resources, remove the rest | `XXX-do-resourses` | 

### 4 Deploy aws-resources

### 5 Deploy aws-credentials

After deployment, modify the aws_secrets_id in ansible group_vars/all.yml (the secret-id should be something like "stack-123456")

## Setup (via Ansible)

### Deploy using the makefile

In the ansible directory

```bash
make install
make setup.swarm
make setup.docker
```

Note: if you have the error fatal: [leader]: FAILED! => {"changed": false, "msg": "Unable to find any of pip3 to use.  pip needs to be installed."}, wait a few minutes for it to be installed.

### 2. Traefik

- if a traefik password is declared explicitly, it is used
- otherwise, it tries to load the password from AWS secret

#### Important
Concerning the traefik password, it need to be saved in passbolt and shared in a group. (which likely should be defined or created beforehand).

### Deploy using the makefile

```
make setup.traefik
```

### 3. Portainer

#### Important
Concerning the Portainer password, it need to be saved in passbolt and shared individually.
```bash
make setup.portainer
```