# Azure Docker swarm managers

Provisions an Azure VM scale set of Ubuntu nodes that join an existing Docker swarm as managers.

## Requirements

* node >= 22
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An Azure subscription, and the Azure CLI logged in (`az login`)
* An existing swarm, whose manager join token is stored in a Key Vault secret (`swarm-manager-token` by default)
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

* A user-assigned managed identity, allowed to read the join token secret ("Key Vault Secrets User" on that secret only). It is created, with its role, before the scale set, so that the first nodes can read the token.
* A VM scale set (Uniform orchestration, manual upgrade policy) of manager nodes.
* An autoscale setting holding the scale set's capacity between `minCount` and `maxCount`. It has no rules: Azure only replaces lost instances.

## How a node joins

cloud-init, on the first boot only:

1. sets the hostname to `<hostnamePrefix>-manager-<instance index + 1>`;
1. writes `/etc/ssh/sshd_config.d/10-hardening.conf` and restarts sshd;
1. mounts the NFS shares, connects to Netbird, installs Docker;
1. reads the join token from the Key Vault with the managed identity, retrying while the role propagates;
1. joins the swarm through the first reachable address in `joinAddresses`.

Changes to the cloud-init template only reach new instances: the scale set has a manual upgrade policy and cloud-init does not run again. Reimage the instances one at a time to roll a change out.

## Lifecycle

* `swarm-leave.service` watches Azure Scheduled Events. When the instance is about to be terminated, it demotes the node, leaves the swarm and acknowledges the event.
* `swarm-node-prune.timer` removes, every 10 minutes, the nodes found down at two consecutive runs; down managers are demoted first.

## Quorum

Raft tolerates the loss of `(managers - 1) / 2` managers, so the total number of managers, including those outside this scale set (e.g. the swarm leader), should be odd. With one leader VM, keep `minCount` and `maxCount` even (2 or 4). Do not scale managers on load.

## Configuration settings

Values marked "or from" can be set directly, or come from the output of the stack named in the second key.

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| alertEmail | string | (required) | Receives the nodes' alerts |
| cloudInitTemplate | string | `nunjucks/cloud-init.ubuntu.njk` | cloud-init template |
| groups | `{ name, ssh, sudo }[]` | `admins` (ssh, sudo), `data`, `sshusers` (ssh) | Unix groups; `ssh` groups may log in, `sudo` groups get passwordless sudo |
| hostnamePrefix | string | `name` | Prefix of the hostnames and computer names |
| imageOffer | string | `ubuntu-26_04-lts` | VM image offer |
| imagePublisher | string | `Canonical` | VM image publisher |
| imageSku | string | `server` | VM image SKU |
| imageVersion | string | `latest` | VM image version |
| joinAddresses | string[] | or from `leaderStack` (`privateIp`) and `loadBalancerStack` (`internalLbPrivateIp`) | Manager addresses to join through, tried in order |
| keyVaultId, keyVaultName | string | or from `keyVaultStack` (`id`, `name`) | Key Vault holding the join token |
| loadBalancerBackendPoolIds | string[] | or from `loadBalancerStack` (`backendAddressPoolId`, `internalLbBackendAddressPoolId`); none without it | Load balancer backend pools the nodes join |
| location | string | or from `vnetStack` (`location`) | Azure region |
| managerTokenSecretName | string | `swarm-manager-token` | Key Vault secret holding the manager join token |
| maxCount | number | `minCount` | Maximum number of nodes |
| minCount | number | `2` | Minimum (and initial) number of nodes |
| name | string | stack name | Prefix of the Azure resource names |
| netbirdManagementUrl | string | Netbird cloud | URL of a self-hosted Netbird management server |
| netbirdSetupKey | secret | (required) | Netbird setup key |
| networkSecurityGroupId | string | or from `vnetStack` (`privateNetworkSecurityGroupId`) | Network security group of the NICs |
| nfsMounts | `{ mountPath, source?, stack? }[]` | `[]` | NFS shares to mount; `stack` exports the source as `mountPath` |
| osDiskSizeGb | number | `30` | OS disk size in GiB |
| packages | string[] | `[]` | Extra apt packages |
| protect | boolean | `false` | Protect resources from accidental deletion |
| resourceGroupName | string | or from `resourceGroupStack` (`name`) | Resource group |
| retainOnDelete | boolean | `false` | Retain resources when destroyed |
| smtpFrom | string | (required) | Sender of the alerts |
| smtpHost | string | (required) | SMTP relay |
| smtpPassword | secret | (required) | SMTP password |
| smtpPort | number | `465` | SMTP port; must match `smtpTlsMode` |
| smtpTlsMode | `tls` \| `starttls` | `tls` | `tls`: encrypted from the start (ports 465, 2465…); `starttls`: plain connection upgraded to TLS (ports 587, 2587…) |
| smtpUser | string | (required) | SMTP user |
| sshKeysDir | string | `../../ssh-keys` | Folder of the users' public keys |
| sshPort | number | or from `vnetStack` (`sshPort`); `22` without it | sshd port |
| subnetId | string | or from `vnetStack` (first of `privateSubnetIds`) | Subnet of the nodes |
| swapFile | string | `/swapfile` | Swap file path |
| swapSize | number | `0` (no swap) | Swap size in bytes |
| tags | object | none | Azure tags |
| usersFile | string | `../users.yml` | Users file (`users: [{ name, groups? }]`) |
| vmSize | string | `Standard_D2as_v6` | Azure VM size |
| zones | string[] | none | Availability zones to spread the nodes over (immutable) |

## Outputs

| Output | Description |
|--------|-------------|
| identityClientId | Client ID of the nodes' managed identity |
| identityPrincipalId | Principal ID of the nodes' managed identity |
| vmssId | Resource ID of the scale set |
| vmssName | Name of the scale set |
