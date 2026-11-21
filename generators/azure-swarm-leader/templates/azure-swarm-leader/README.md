# Azure Docker swarm leader

Provisions an Azure VM of Ubuntu that initializes a Docker swarm, and stores the swarm's join tokens in a Key Vault. The managers (`azure-swarm-managers`) and workers then join with these tokens; once the managers have joined, the leader is removed.

## Requirements

* node >= 22
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An Azure subscription, and the Azure CLI logged in (`az login`)
* A Key Vault using Azure RBAC, with no secret named like the join token secrets yet (`swarm-manager-token` and `swarm-worker-token` by default)
* Optionally, a load balancer stack: the leader joins its public backend pool, and the pool of its internal load balancer, through which the first managers join the swarm.
* A users file (`../users.yml` by default) and a folder of public keys named `<user>.pub`, `<user>@….pub` or `<user>-….pub` (`../../ssh-keys` by default)

## Usage

* Install dependencies

```bash
npm install
```

* Copy `.env.example` to `.env` and set the backend and subscription.

* Initialize and select the appropriate stack

```bash
pulumi stack init <stack name>
```

* Update the stack config `Pulumi.<stack>.yaml`, then set the secrets:

```bash
pulumi config set --secret netbirdSetupKey <setup key>
pulumi config set --secret smtpPassword <password>
```

* Run `pulumi up`

## Resources provisioned

* A user-assigned managed identity.
* The manager and worker join token secrets in the Key Vault, holding `pending` until the VM writes the tokens. They are kept when the stack is destroyed, since the managers and workers still need them.
* A "Key Vault Secrets Officer" role for the identity on each of these two secrets, and nothing else in the vault. The identity, its roles and the secrets exist before the VM, so that the VM can write the tokens at its first boot.
* A network interface in the private subnet, with the private network security group, in the load balancer backend pools.
* The VM, with boot diagnostics and the data disks attached.

## First boot

cloud-init, on the first boot only:

1. writes `/etc/ssh/sshd_config.d/10-hardening.conf` and restarts sshd;
1. formats the empty data disks, mounts them and the NFS shares (NFSv4.1);
1. connects to Netbird;
1. stops and masks `ModemManager`, `rpcbind` (socket and service) and `udisks2`, which the VM never uses, then installs Docker;
1. initializes the swarm, advertising the VM's private address, and creates the overlay networks (`dockerNetworks`);
1. writes the manager and worker join tokens to the Key Vault with the managed identity, retrying for up to 10 minutes while the roles propagate.

Changes to the cloud-init template only reach a new VM: Azure rejects a change of custom data on an existing VM, and cloud-init does not run again.

## Removing the leader

Once the managers have joined, the leader only weighs on the raft quorum: remove it.

1. From a manager, drain the leader, so that its tasks move to other nodes: `docker node update --availability drain <leader>`.
1. Demote it: `docker node demote <leader>`. A manager takes over the raft leadership.
1. On the leader, leave the swarm: `docker swarm leave`.
1. From a manager, remove its node: `docker node rm <leader>`.
1. Destroy the stack. With `protect` on, set it to `false` and run `pulumi up` first. The join token secrets stay in the Key Vault.

The managers stack does not reference this one, and the internal load balancer stops sending joins to the leader as soon as it no longer listens on 2377.

## Configuration settings

Values marked "or from" can be set directly, or come from the output of the stack named in the second key.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| alertEmail | string | (required) | Receives the VM's alerts |
| cloudInitTemplate | string | `nunjucks/cloud-init.ubuntu.njk` | cloud-init template |
| dataDisks | `{ fsType?, id?, index?, mountPath, stack? }[]` | `[]` | Managed disks to attach and mount, in LUN order; `id` is the disk's resource ID, or `stack` exports `disks: { id }[]` and `index` (default `0`) picks one; `fsType` defaults to `ext4` |
| defaultAddrPool | string | `192.168.0.0/16` | Address pool of the overlay networks |
| dockerNetworks | string[] | `private`, `public` | Attachable overlay networks to create |
| groups | `{ name, ssh, sudo }[]` | `admins` (ssh, sudo), `data`, `sshusers` (ssh) | Unix groups; `ssh` groups may log in, `sudo` groups get passwordless sudo |
| hostnamePrefix | string | `name` | The hostname is `<hostnamePrefix>-leader` |
| imageOffer | string | `ubuntu-26_04-lts` | VM image offer |
| imagePublisher | string | `Canonical` | VM image publisher |
| imageSku | string | `server` | VM image SKU |
| imageVersion | string | `latest` | VM image version |
| keyVaultId, keyVaultName | string | or from `keyVaultStack` (`id`, `name`) | Key Vault receiving the join tokens |
| loadBalancerBackendPoolIds | string[] | or from `loadBalancerStack` (`backendAddressPoolId`, `internalLbBackendAddressPoolId`); none without it | Load balancer backend pools the VM joins |
| location | string | or from `vnetStack` (`location`) | Azure region |
| managerTokenSecretName | string | `swarm-manager-token` | Key Vault secret receiving the manager join token |
| name | string | stack name | Prefix of the Azure resource names |
| netbirdManagementUrl | string | Netbird cloud | URL of a self-hosted Netbird management server |
| netbirdSetupKey | secret | (required) | Netbird setup key |
| networkSecurityGroupId | string | or from `vnetStack` (`privateNetworkSecurityGroupId`) | Network security group of the NIC |
| nfsMounts | `{ mountPath, source?, stack? }[]` | `[]` | NFS shares to mount; `stack` exports the source as `mountPath` |
| osDiskSizeGb | number | `30` | OS disk size in GiB |
| packages | string[] | `[]` | Extra apt packages |
| protect | boolean | `false` | Protect resources from accidental deletion |
| resourceGroupName | string | or from `resourceGroupStack` (`name`) | Resource group |
| retainOnDelete | boolean | `false` | Retain resources when destroyed (the join token secrets always are) |
| smtpFrom | string | (required) | Sender of the alerts |
| smtpHost | string | (required) | SMTP relay |
| smtpPassword | secret | (required) | SMTP password |
| smtpPort | number | `465` | SMTP port; must match `smtpTlsMode` |
| smtpTlsMode | `tls` \| `starttls` | `tls` | `tls`: encrypted from the start (ports 465, 2465…); `starttls`: plain connection upgraded to TLS (ports 587, 2587…) |
| smtpUser | string | (required) | SMTP user |
| sshKeysDir | string | `../../ssh-keys` | Folder of the users' public keys |
| sshPort | number | or from `vnetStack` (`sshPort`); `22` without it | sshd port |
| subnetId | string | or from `vnetStack` (first of `privateSubnetIds`) | Subnet of the VM |
| swapFile | string | `/swapfile` | Swap file path |
| swapSize | number | `0` (no swap) | Swap size in bytes |
| tags | object | none | Azure tags |
| usersFile | string | `../users.yml` | Users file (`users: [{ name, groups? }]`) |
| vmSize | string | `Standard_D2as_v6` | Azure VM size |
| workerTokenSecretName | string | `swarm-worker-token` | Key Vault secret receiving the worker join token |
| zone | string | none | Availability zone of the VM (immutable) |

## Outputs

| Output | Description |
|--------|-------------|
| identityClientId | Client ID of the VM's managed identity |
| identityPrincipalId | Principal ID of the VM's managed identity |
| managerTokenSecretName | Key Vault secret holding the manager join token |
| privateIp | Private IP address of the VM |
| vmId | Resource ID of the VM |
| vmName | Name of the VM |
| workerTokenSecretName | Key Vault secret holding the worker join token |
