# AWS CDN

Provisions a private AWS S3 bucket served through an AWS CloudFront distribution, optionally on a custom domain.

<% if (dnsProvider === "route53") { -%>
DNS records for the custom domain are created in AWS Route53.
<% } else if (dnsProvider === "cloudflare") { -%>
DNS records for the custom domain are created in Cloudflare.
<% } else { -%>
The domain's DNS is managed outside of this project: the DNS records to create are exported as stack outputs (see [Custom domain with an external DNS provider](#custom-domain-with-an-external-dns-provider)).
<% } -%>

## Requirements

* node >= 20.0.0
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS account
* An AWS profile
* An existing devops repo
<% if (dnsProvider === "route53") { -%>
* If using a custom domain: a Route53 hosted zone for the domain
<% } else if (dnsProvider === "cloudflare") { -%>
* A Cloudflare zone for the domain
* A Cloudflare API token with permissions to edit DNS records in that zone
<% } -%>

## Usage

* Cd into the project folder.

* Install dependencies 

```
npm install
```

* Set the AWS_PROFILE environment variable

```
export AWS_PROFILE=XXXXXX
```
<% if (dnsProvider === "cloudflare") { -%>

* Set the CLOUDFLARE_API_TOKEN environment variable

```
export CLOUDFLARE_API_TOKEN=<token>
```
<% } -%>

* Set the default organization 

```bash
pulumi org set-default {your organization}
```

* Initialize and select the appropriate stack

```bash
pulumi stack init <%= environment %>
```

* Update the stack config `Pulumi.<%= environment %>.yaml` with the appropriate values for your project.

* Run `pulumi up`

<% if (dnsProvider === "other") { -%>
### Custom domain with an external DNS provider

If `domain` is set, the custom hostnames are attached to the distribution in two steps, because the certificate must be validated before CloudFront accepts it:

1. Run `pulumi up`. This requests the certificate and exports the records to create in your DNS provider. The distribution is only reachable on its CloudFront domain at this point.

    ```bash
    pulumi stack output certificate-validation-records
    pulumi stack output dns-records
    ```

2. Create the `certificate-validation-records` in your DNS provider, then wait for the certificate to be issued (`pulumi refresh` updates the `certificate-status` output; it should read `ISSUED`).

3. Set `certificateValidated` to `true` in the stack config and run `pulumi up` again. This attaches the certificate and the custom hostnames to the distribution.

4. Create the `dns-records` in your DNS provider. A `CNAME` cannot be used at the zone apex: for the apex (`@` alias), use your DNS provider's `ALIAS`, `ANAME` or CNAME flattening feature.

Keep the validation records in place: ACM uses them to renew the certificate automatically.

<% } -%>
### Publishing content

Upload files to the bucket, then invalidate the CloudFront cache:

```bash
aws s3 sync ./dist s3://$(pulumi stack output bucket-name) --delete
aws cloudfront create-invalidation --distribution-id $(pulumi stack output distribution-id) --paths "/*"
```

Attach the `publish-policy-arn` IAM policy to the users or roles (e.g. CI) that publish content.

### To destroy resources:

```
pulumi destroy
```

Note that the bucket must be empty before it can be destroyed.

## Resources provisioned

### AWS S3 bucket

A private S3 bucket (all public access blocked, ACLs disabled, AES256 server-side encryption by default).

### AWS S3 bucket policy

A bucket policy that only allows the CloudFront distribution to read objects from the bucket.

### AWS CloudFront origin access control

An origin access control (OAC) used by CloudFront to sign its requests to the bucket.

### AWS CloudFront distribution

A distribution with the bucket as its origin, redirecting HTTP to HTTPS, with compression enabled and using the AWS managed `CachingOptimized` cache policy.

### AWS ACM certificate

If `domain` is set, a DNS-validated certificate (in `us-east-1`, as required by CloudFront) covering all the hostnames derived from `aliases`.
<% if (dnsProvider === "route53") { -%>

### AWS Route53 records

If `domain` is set:

* the certificate's DNS validation records
* an `A` and an `AAAA` alias record pointing to the distribution for each hostname derived from `aliases`
<% } else if (dnsProvider === "cloudflare") { -%>

### Cloudflare DNS records

If `domain` is set, in the domain's Cloudflare zone:

* the certificate's DNS validation records
* a `CNAME` record pointing to the distribution for each hostname derived from `aliases` (flattened by Cloudflare at the zone apex)

All records are DNS only (not proxied): proxying through Cloudflare would put a second CDN in front of CloudFront.
<% } -%>

### AWS IAM publish policy

An IAM policy granting read/write access to the bucket objects, and permission to create invalidations on the distribution.

## Configuration settings

| Setting | Type | Default | Required | Description |
|---------|------|---------|----------|-------------|
| aliases | string[] | | No | Hostnames, relative to `domain`, to serve the CDN from. Use `@` for the domain apex. Ignored if `domain` is not set. |
| bucket | string | | Yes | Name of the S3 bucket |
<% if (dnsProvider === "other") { -%>
| certificateValidated | boolean | false | No | Set to `true` once the certificate has been issued, to attach it and the custom hostnames to the distribution |
<% } -%>
| defaultRootObject | string | | No | Object returned when the root URL is requested, e.g. `index.html` |
<% if (dnsProvider === "route53") { -%>
| domain | string | | No | Domain, with a Route53 hosted zone. If not set, the CDN is only available on its CloudFront domain |
<% } else if (dnsProvider === "cloudflare") { -%>
| domain | string | | No | Domain, with a Cloudflare zone. If not set, the CDN is only available on its CloudFront domain |
<% } else { -%>
| domain | string | | No | Domain. If not set, the CDN is only available on its CloudFront domain |
<% } -%>
| priceClass | string | PriceClass_100 | No | CloudFront price class: `PriceClass_100`, `PriceClass_200` or `PriceClass_All` |
| protect | boolean | false | No | Protect resources from accidental deletion |
| retainOnDelete | boolean | false | No | Retain resources when destroyed |

### Example

```yaml
config:
  <%= projectName %>:aliases:
    - cdn
    - assets
  <%= projectName %>:bucket: acme-production-cdn
  <%= projectName %>:domain: example.com
  <%= projectName %>:priceClass: PriceClass_100
```

This serves the content of the `acme-production-cdn` bucket on `https://cdn.example.com` and `https://assets.example.com`.

## Outputs

| Output | Description |
|--------|-------------|
| `bucket-arn` | The arn of the bucket |
| `bucket-name` | The name of the bucket |
<% if (dnsProvider === "other") { -%>
| `certificate-status` | The status of the certificate (only if `domain` is set) |
| `certificate-validation-records` | The DNS records to create to validate the certificate (only if `domain` is set) |
<% } -%>
| `distribution-arn` | The arn of the CloudFront distribution |
| `distribution-domain-name` | The CloudFront domain of the distribution |
| `distribution-id` | The id of the CloudFront distribution |
<% if (dnsProvider === "other") { -%>
| `dns-records` | The DNS records to create to serve the CDN on the custom hostnames (only if `domain` is set) |
<% } -%>
| `publish-policy-arn` | The arn of the IAM policy for publishing content |
| `urls` | The urls the CDN is served on |
