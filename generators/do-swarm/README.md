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
- **AWS Credentials**: Needed if using AWS resources (optional).

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
