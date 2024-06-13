# `cloudflare-dns` generator

Provisions Cloudflare DNS records.

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* A Cloudflare account
* A Cloudflare API token with permissions to update DNS records for the appropriate domain

## Usage

* Cd into the `cloudflare-dns` folder.

* Install dependencies 

```
npm install
```

* Set the `CLOUDFLARE_API_TOKEN` environment variable

```
export CLOUDFLARE_API_TOKEN=<token>
```

* Set the default organization 

```bash
pulumi org set-default <your-pulumi-organization>
```

* Initialize and select the appropriate stack

```bash
pulumi stack init <staging|production>
```

* Update the stack config `Pulimi.[staging|production].yaml` with the appropriate values for your project.

* Run `pulumi up`

### To destroy resources:

```
pulumi destroy
```

Note: If you change the `domain`, DNS records in the old domain will NOT be detroyed.

## Resources provisioned

The following DNS records will be created in Cloudflare in the zone for the `domain` specified:

### `A` (host) record

If `createHostRecord` is true, then 1 `A` (host) record is created:

| Type | Name | Content | Proxied | Ttl |
|------|------|---------|---------|-----|
| A    | `<hostname>` | `<ip>` | `false`  | `<ttl>` |

Where `<hostname>` is either `<host>` or `<host>.<subdomain>`.

### `CNAME` (alias) records

For each of the entries in `aliases`, ` `CNAME` (alias) record is created:

| Type | Name | Content | Proxied | Ttl |
|------|------|---------|---------|-----|
| CNAME | `<alias>` | `<hostname>.<domain>` | `false`  | `<ttl>` |

Where `<hostname>` is either `<host>` or `<host>.<subdomain>`.

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| createHostRecord | boolean | false | Whether to provision a host (A) record |
| domain | string | | The domain (zone) for which to create DNS records |
| host   | string | | If provided, the name of the host (A) record |
| hostProject | string |  | If provided, the name of the pulumi project in which the host name is defined (the output is expected to be `name`). Ignored of `host` is set. |
| ip     | string | | If provided, the ip address for the host (A) record. Ignored if `createHostRecord` is false |
| ipProject | string |  | If provided, the name of the pulumi project  in which the ip address is provisioned. The project's output is expected to be `ip`. Ignored is `createHostRecord` is false or if `ip` is defined. |   
| protect | boolean | false | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | Retain resources when destroyed |
| subdomain | string | null | If provided, creates the DNS records in this subdomain of the domain. |
| ttl | number | 3600 | Time-to-live for DNS records |
