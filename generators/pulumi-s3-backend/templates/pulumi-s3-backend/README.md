# Pulumi S3 backend

Provisions the AWS S3 bucket (and, optionally, a KMS key) that other Pulumi projects use as a self-managed backend.

## Using this backend in your Pulumi project

**This is the backend that every other Pulumi project should use** — don't use Pulumi Cloud or a project-local backend; log into this S3 backend instead. (The one exception is this project itself, which can't use it for its own state — see [below](#this-projects-own-state).)

1. Set `PULUMI_BACKEND_URL` (e.g. in your project's `.env`, or exported directly):

   ```bash
   export PULUMI_BACKEND_URL=<pulumiBackendUrl output>
   ```

2. Init a stack, using the `pulumiStackInitCommand` output for the secrets provider:

   ```bash
   pulumi stack init --secrets-provider='<pulumiEncryptionProviderKeyId output>' <project_name>.<stack_name>
   ```

Alternatively, to log into the backend without setting `PULUMI_BACKEND_URL`:

```bash
pulumi logout && pulumi login <pulumiBackendUrl output>
```

These values (bucket, key) only change if this project is ever re-provisioned against a new bucket/key — get them from this project's outputs (see [Outputs](#outputs)) rather than guessing.

## Outputs

| Output | Current value | Description |
|--------|----------------|-------------|
| `pulumiBackendUrl` | TBD | Set as `PULUMI_BACKEND_URL` in other projects to avoid logging in repeatedly. |
| `pulumiBackendLoginCommand` | TBD | Full `pulumi login` command for this backend. |
| `pulumiStackInitCommand` | TBD | Ready-to-use `pulumi stack init` command for other projects. |
| `pulumiEncryptionProviderKeyId` | TBD | Only present when `encryptionProvider` is `awskms`. |
| `pulumiEncryptionProviderKeyAlias` | TBD | Only present when `encryptionProvider` is `awskms`. |
| `bucketArn` | TBD | ARN of the S3 bucket. |
| `bucketId` | TBD | Id/name of the S3 bucket. |

To refresh these yourself: `./output.sh`, or manually `pulumi login "file://$(pwd)/.local" && pulumi stack select <%= environment %> && pulumi stack output`.

## This project's own state

This project provisions the backend that *other* projects store their state in — but it can't use that backend for itself (there's nothing to log into until this project has already run). So its own state is kept locally, in [.local/](.local) under this directory, via a `file://$(pwd)/.local` Pulumi backend. It isn't stored in the S3 bucket.

Unlike other projects' state, `.local/` **is committed to version control** — it's the only copy of this project's state, so it isn't gitignored.

This project's own secrets (anything set with `pulumi config set --secret`) are encrypted with a passphrase, not Pulumi Cloud or AWS KMS. Store that passphrase outside this project (e.g. in a secrets manager) — never commit it.

Copy `.env.example` to `.env` and set `PULUMI_CONFIG_PASSPHRASE` to that value:

```bash
cp .env.example .env
```

To work on this project's own stack:

```bash
pulumi login "file://$(pwd)/.local"
pulumi stack select <%= environment %>
```

(`$(pwd)` needs a real shell to expand — don't put it in `.env` itself; env-file loaders like direnv's `dotenv` parse it literally rather than evaluating it, which breaks the login.)

(Stacks here are named by creation date — `<%= environment %>` is the current one; check `.local/.pulumi/stacks/` if a newer one has since been created.)

## Requirements

* node >= 24
* [pulumi >= 3](https://www.pulumi.com/docs/install/)
* An AWS profile

## Environment variables

Set in `.env` (copied from `.env.example`):

| Name | Description |
|------|-------------|
| `AWS_PROFILE` | AWS profile with permission to read (and, for provisioning, create) the bucket/KMS resources. |
| `AWS_REGION` | AWS region the backend resources live in. |
| `PULUMI_CONFIG_PASSPHRASE` | Passphrase used to encrypt/decrypt this project's own stack secrets. See [above](#this-projects-own-state). |

## Provisioning (rare)

This only needs to happen once, or when the backend's config genuinely needs to change.

* Install dependencies: `npm install`
* Log into this project's own (local) backend and select/init the stack — see [above](#this-projects-own-state)
* Update the stack config (`Pulumi.<%= environment %>.yaml`) as needed — see [Configuration settings](#configuration-settings)
* `npm install && pulumi up` (after logging in/selecting the stack)

### Destroying resources

* Select the stack, set `protect` and `retainOnDelete` to `false` in its config (and `forceDestroy` to `true` if the bucket has objects in it)
* `pulumi destroy`

## Resources provisioned

| Resource | Class | Description |
|----------|-------|------------|
| Bucket   | `aws.s3.BucketV2` | The bucket used as the Pulumi backend |
| Versioning | `aws.s3.BucketVersioningV2` | |
| Public access block | `aws.s3.BucketPublicAccessBlock` | Bucket is private. |
| Encryption | `aws.s3.BucketServerSideEncryptionConfigurationV2` | |
| Bucket policy | `aws.s3.BucketPolicy` | Only created when `aws-account-arns` is non-empty |
| Key | `aws.kms.Key` | Used by the Pulumi secrets provider to encrypt secrets. Only created when `encryptionProvider` is `awskms`. |
| Alias | `aws.kms.Alias` | Key alias. Only created when `encryptionProvider` is `awskms`. |

## Configuration settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `aws-account-arns` | string[] | (empty) | AWS accounts/roles/users to grant bucket access to. See examples below. |
| `encryptionProvider` | string | `<%= encryptionProvider %>` | Secrets provider for stacks that use this backend. `passphrase` or `awskms`. |
| `forceDestroy` | boolean | `false` | Whether all objects are destroyed when the bucket is destroyed. |
| `keyDeletionWindow` | number | `7` | Deletion window (in days) for the KMS key. |
| `name` | string | | Name of the S3 bucket to provision. |
| `protect` | boolean | `true` | Protect resources from accidental deletion. |
| `retainOnDelete` | boolean | `true` | Retain resources when destroyed. |

### `aws-account-arns` examples

Grant access to a role:

```
<AccountID>:role/<RoleName>
```

Grant access to a user:

```
<AccountID>:user/<Username>
```

Grant access to an entire account:

```
<AccountID>:root
```
