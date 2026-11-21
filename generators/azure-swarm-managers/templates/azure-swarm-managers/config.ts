import * as fs from "fs";
import * as path from "path";

import { getClientConfig } from "@pulumi/azure-native/authorization";
import { all, Config, getStack, output, secret, StackReference } from "@pulumi/pulumi";
import { Environment, FileSystemLoader } from "nunjucks";
import { parse } from "yaml";

import type { Input, Output } from "@pulumi/pulumi";

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

  const stackOutput = <T>(stackKey: string, outputName: string): Output<T> => {
    const name = stackConfig.require(stackKey);
    stackReferences[name] ??= new StackReference(name);

    return stackReferences[name].requireOutput(outputName) as Output<T>;
  };

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

  // Addresses tried in order to join the swarm. By default, the internal load
  // balancer: it forwards port 2377 to any healthy manager, which is the leader
  // VM for the first managers and the other managers for a replacement.
  const joinAddresses: Input<string[]> =
    stackConfig.getObject<string[]>("joinAddresses") ??
    stackOutput<string>("loadBalancerStack", "internalLbPrivateIp").apply((ip) => [ip]);

  const loadBalancerBackendPoolIds: Input<string[]> =
    stackConfig.getObject<string[]>("loadBalancerBackendPoolIds") ??
    (stackConfig.get("loadBalancerStack")
      ? all([
          stackOutput<string>("loadBalancerStack", "backendAddressPoolId"),
          stackOutput<string>("loadBalancerStack", "internalLbBackendAddressPoolId"),
        ])
      : []);

  const nfsMounts = (stackConfig.getObject<NfsMountConfig[]>("nfsMounts") ?? []).map((mount) => {
    if (!mount.source && !mount.stack) {
      throw new Error(`nfsMounts entry for "${mount.mountPath}": set either source or stack`);
    }

    return {
      mountPath: mount.mountPath,
      source: mount.source
        ? output(mount.source)
        : new StackReference(mount.stack!).requireOutput("mountPath") as Output<string>,
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

  const renderCustomData = (identityClientId: Input<string>): Output<string> =>
    secret(
      all([
        identityClientId,
        joinAddresses,
        keyVaultName,
        netbirdSetupKey,
        all(nfsMounts.map((m) => m.source)),
        smtp.password,
        sshPort,
      ]).apply(([clientId, addresses, kvName, setupKey, nfsSources, smtpPassword, port]) => {
        const env = new Environment([new FileSystemLoader(__dirname)], { autoescape: false });
        const rendered = env.render(cloudInitTemplate, {
          alertEmail: stackConfig.require("alertEmail"),
          groups,
          hostnamePrefix,
          identityClientId: clientId,
          joinAddresses: addresses,
          keyVaultName: kvName,
          managerTokenSecretName,
          netbird,
          netbirdSetupKey: setupKey,
          nfsMounts: nfsMounts.map((m, i) => ({ mountPath: m.mountPath, source: nfsSources[i] })),
          packages: stackConfig.getObject<string[]>("packages") ?? [],
          smtp: { ...smtp, password: smtpPassword },
          sshPort: port,
          swapFile: stackConfig.get("swapFile") ?? "/swapfile",
          swapSize: stackConfig.getNumber("swapSize") ?? 0,
          users,
        });

        return Buffer.from(rendered).toString("base64");
      }),
    );

  const minCount = stackConfig.getNumber("minCount") ?? 3;

  return {
    hostnamePrefix,
    imageOffer: stackConfig.get("imageOffer") || "ubuntu-26_04-lts",
    imagePublisher: stackConfig.get("imagePublisher") || "Canonical",
    imageSku: stackConfig.get("imageSku") || "server",
    imageVersion: stackConfig.get("imageVersion") || "latest",
    keyVaultId,
    loadBalancerBackendPoolIds,
    location,
    managerTokenSecretName,
    maxCount: stackConfig.getNumber("maxCount") ?? minCount,
    minCount,
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
    zones: stackConfig.getObject<string[]>("zones"),
  };
};
