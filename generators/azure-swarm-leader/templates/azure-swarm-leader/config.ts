import * as fs from "fs";
import * as path from "path";

import { getClientConfig } from "@pulumi/azure-native/authorization";
import { all, Config, getStack, output, secret, StackReference } from "@pulumi/pulumi";
import { Environment, FileSystemLoader } from "nunjucks";
import { parse } from "yaml";

import type { Input, Output } from "@pulumi/pulumi";

interface DataDiskConfig {
  fsType?: string;
  // Either the disk's resource ID, or a stack exporting `disks: { id }[]` (with the index in it)
  id?: string;
  index?: number;
  mountPath: string;
  stack?: string;
}

interface GroupConfig {
  name: string;
  ssh: boolean;
  sudo: boolean;
}

interface NfsMountConfig {
  mountPath: string;
  // Either the NFS source ("<host>:/<export>") or a stack exporting it as `mountPath`
  source?: string;
  stack?: string;
}

interface UserConfig {
  groups?: string;
  name: string;
}

export interface User {
  groups: string;
  name: string;
  sshKeys: string[];
}

function loadUserKeys(username: string, sshKeysDir: string): string[] {
  return fs
    .readdirSync(sshKeysDir)
    .filter(
      (f) =>
        f.endsWith(".pub") &&
        (f === `${username}.pub` ||
          f.startsWith(`${username}@`) ||
          f.startsWith(`${username}-`)),
    )
    .map((f) => fs.readFileSync(path.join(sshKeysDir, f), "utf-8").trim());
}

function parseUrl(url: string): { host: string; scheme: string } {
  const parsed = new URL(url);
  const defaultPort = parsed.protocol === "https:" ? "443" : "80";

  return {
    host: `${parsed.hostname}:${parsed.port || defaultPort}`,
    scheme: parsed.protocol.replace(":", ""),
  };
}

export const getConfig = async () => {
  const stack = getStack();
  const stackConfig = new Config();
  const { subscriptionId } = await getClientConfig();

  // One StackReference per referenced stack: Pulumi refuses two resources with the same name.
  const stackReferences: Record<string, StackReference> = {};

  const stackReference = (name: string): StackReference => (stackReferences[name] ??= new StackReference(name));

  const stackOutput = <T>(stackKey: string, outputName: string): Output<T> =>
    stackReference(stackConfig.require(stackKey)).requireOutput(outputName) as Output<T>;

  // A value set in the stack config wins over the output of the stack it otherwise comes from.
  const stringOrStackOutput = (
    key: string,
    stackKey: string,
    outputName: string,
  ): Input<string> => stackConfig.get(key) ?? stackOutput<string>(stackKey, outputName);

  const name = stackConfig.get("name") || stack;
  const hostnamePrefix = stackConfig.get("hostnamePrefix") || name;

  const keyVaultId = stringOrStackOutput("keyVaultId", "keyVaultStack", "id");
  const keyVaultName = stringOrStackOutput("keyVaultName", "keyVaultStack", "name");
  // /subscriptions/<id>/resourceGroups/<name>/providers/Microsoft.KeyVault/vaults/<name>
  const keyVaultResourceGroupName = output(keyVaultId).apply((id) => id.split("/")[4]);
  const location = stringOrStackOutput("location", "vnetStack", "location");
  const networkSecurityGroupId = stringOrStackOutput(
    "networkSecurityGroupId",
    "vnetStack",
    "privateNetworkSecurityGroupId",
  );
  const resourceGroupName = stringOrStackOutput("resourceGroupName", "resourceGroupStack", "name");
  const subnetId: Input<string> =
    stackConfig.get("subnetId") ??
    stackOutput<string[]>("vnetStack", "privateSubnetIds").apply((ids) => ids[0]);

  const sshPort: Input<number> =
    stackConfig.getNumber("sshPort") ??
    (stackConfig.get("vnetStack") ? stackOutput<number>("vnetStack", "sshPort") : 22);

  const loadBalancerBackendPoolIds: Input<string[]> =
    stackConfig.getObject<string[]>("loadBalancerBackendPoolIds") ??
    (stackConfig.get("loadBalancerStack")
      ? all([
          stackOutput<string>("loadBalancerStack", "backendAddressPoolId"),
          stackOutput<string>("loadBalancerStack", "internalLbBackendAddressPoolId"),
        ])
      : []);

  const dataDisks = (stackConfig.getObject<DataDiskConfig[]>("dataDisks") ?? []).map((disk, lun) => {
    if (!disk.id && !disk.stack) {
      throw new Error(`dataDisks entry for "${disk.mountPath}": set either id or stack`);
    }

    const index = disk.index ?? 0;

    return {
      fsType: disk.fsType ?? "ext4",
      id: disk.id
        ? output(disk.id)
        : (stackReference(disk.stack!).requireOutput("disks") as Output<{ id: string }[]>).apply((disks) => {
            if (index >= disks.length) {
              throw new Error(`dataDisks entry for "${disk.mountPath}": ${disk.stack} has no disk #${index}`);
            }

            return disks[index].id;
          }),
      lun,
      mountPath: disk.mountPath,
    };
  });

  const nfsMounts = (stackConfig.getObject<NfsMountConfig[]>("nfsMounts") ?? []).map((mount) => {
    if (!mount.source && !mount.stack) {
      throw new Error(`nfsMounts entry for "${mount.mountPath}": set either source or stack`);
    }

    return {
      mountPath: mount.mountPath,
      source: mount.source
        ? output(mount.source)
        : stackReference(mount.stack!).requireOutput("mountPath") as Output<string>,
    };
  });

  const netbirdManagementUrl = stackConfig.get("netbirdManagementUrl");
  const netbird = netbirdManagementUrl
    ? (() => {
        const { host, scheme } = parseUrl(netbirdManagementUrl);

        return { adminHost: host, adminScheme: scheme, custom: true, managementHost: host, managementScheme: scheme };
      })()
    : {
        adminHost: "app.netbird.io:443",
        adminScheme: "https",
        custom: false,
        managementHost: "api.netbird.io:443",
        managementScheme: "https",
      };

  const groups: GroupConfig[] = stackConfig.getObject<GroupConfig[]>("groups") ?? [
    { name: "admins", ssh: true, sudo: true },
    { name: "data", ssh: false, sudo: false },
    { name: "sshusers", ssh: true, sudo: false },
  ];

  const sshKeysDir = path.resolve(__dirname, stackConfig.get("sshKeysDir") || "../../ssh-keys");
  const usersFile = path.resolve(__dirname, stackConfig.get("usersFile") || "../users.yml");
  const users: User[] = (parse(fs.readFileSync(usersFile, "utf-8")) as { users: UserConfig[] }).users
    .map((u) => ({
      groups: u.groups ?? "admins",
      name: u.name,
      sshKeys: loadUserKeys(u.name, sshKeysDir),
    }))
    .filter((u) => u.sshKeys.length > 0);

  const smtp = {
    from: stackConfig.require("smtpFrom"),
    host: stackConfig.require("smtpHost"),
    password: stackConfig.requireSecret("smtpPassword"),
    port: stackConfig.getNumber("smtpPort") ?? 465,
    // "tls": encrypted from the first byte (ports 465, 2465…);
    // "starttls": plain connection upgraded to TLS (ports 587, 2587…).
    tlsMode: stackConfig.get("smtpTlsMode", { allowedValues: ["starttls", "tls"] }) ?? "tls",
    user: stackConfig.require("smtpUser"),
  };

  const cloudInitTemplate = stackConfig.get("cloudInitTemplate") || "nunjucks/cloud-init.ubuntu.njk";
  const managerTokenSecretName = stackConfig.get("managerTokenSecretName") || "swarm-manager-token";
  const netbirdSetupKey = stackConfig.requireSecret("netbirdSetupKey");
  const workerTokenSecretName = stackConfig.get("workerTokenSecretName") || "swarm-worker-token";

  const renderCustomData = (identityClientId: Input<string>): Output<string> =>
    secret(
      all([
        identityClientId,
        keyVaultName,
        netbirdSetupKey,
        all(nfsMounts.map((m) => m.source)),
        smtp.password,
        sshPort,
      ]).apply(([clientId, kvName, setupKey, nfsSources, smtpPassword, port]) => {
        const env = new Environment([new FileSystemLoader(__dirname)], { autoescape: false });
        const rendered = env.render(cloudInitTemplate, {
          alertEmail: stackConfig.require("alertEmail"),
          dataDisks: dataDisks.map(({ fsType, lun, mountPath }) => ({ fsType, lun, mountPath })),
          defaultAddrPool: stackConfig.get("defaultAddrPool") || "192.168.0.0/16",
          dockerNetworks: stackConfig.getObject<string[]>("dockerNetworks") ?? ["private", "public"],
          groups,
          identityClientId: clientId,
          keyVaultName: kvName,
          netbird,
          netbirdSetupKey: setupKey,
          nfsMounts: nfsMounts.map((m, i) => ({ mountPath: m.mountPath, source: nfsSources[i] })),
          packages: stackConfig.getObject<string[]>("packages") ?? [],
          smtp: { ...smtp, password: smtpPassword },
          sshPort: port,
          swapFile: stackConfig.get("swapFile") ?? "/swapfile",
          swapSize: stackConfig.getNumber("swapSize") ?? 0,
          tokenSecretNames: { manager: managerTokenSecretName, worker: workerTokenSecretName },
          users,
        });

        return Buffer.from(rendered).toString("base64");
      }),
    );

  return {
    dataDisks,
    hostnamePrefix,
    imageOffer: stackConfig.get("imageOffer") || "ubuntu-26_04-lts",
    imagePublisher: stackConfig.get("imagePublisher") || "Canonical",
    imageSku: stackConfig.get("imageSku") || "server",
    imageVersion: stackConfig.get("imageVersion") || "latest",
    keyVaultName,
    keyVaultResourceGroupName,
    loadBalancerBackendPoolIds,
    location,
    managerTokenSecretName,
    name,
    networkSecurityGroupId,
    osDiskSizeGb: stackConfig.getNumber("osDiskSizeGb") ?? 30,
    protect: stackConfig.getBoolean("protect") ?? false,
    renderCustomData,
    resourceGroupName,
    retainOnDelete: stackConfig.getBoolean("retainOnDelete") ?? false,
    subnetId,
    subscriptionId,
    tags: stackConfig.getObject<{ [key: string]: string }>("tags"),
    vmSize: stackConfig.get("vmSize") || "Standard_D2as_v6",
    workerTokenSecretName,
    zone: stackConfig.get("zone"),
  };
};
