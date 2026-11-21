import { RoleAssignment } from "@pulumi/azure-native/authorization";
import { VirtualMachine } from "@pulumi/azure-native/compute";
import { Secret } from "@pulumi/azure-native/keyvault";
import { UserAssignedIdentity } from "@pulumi/azure-native/managedidentity";
import { NetworkInterface } from "@pulumi/azure-native/network";
import { interpolate, output } from "@pulumi/pulumi";

import { getConfig } from "./config";

// Built-in role "Key Vault Secrets Officer": read and write secret values.
const KEY_VAULT_SECRETS_OFFICER = "b86a8fe4-44ce-4948-aee5-eccb2c155cd7";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const adminUsername = "azureadmin";
  // Throwaway key with no corresponding private key: satisfies Azure's auth requirement but grants no access.
  const publicKeys = [{
    keyData: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEUJqcXppL6/3cpxsgQAUUZP5NPJgf6V94ODeRWiNR48 throwaway-no-login",
    path: `/home/${adminUsername}/.ssh/authorized_keys`,
  }];

  // A user-assigned identity exists, with its roles, before the VM boots; a
  // system-assigned one only gets its roles once cloud-init is already running.
  const identity = new UserAssignedIdentity(
    `${config.name}-leader`,
    {
      location: config.location,
      resourceGroupName: config.resourceGroupName,
      resourceName: `${config.name}-leader`,
      tags: config.tags,
    },
    options,
  );

  // The join token secrets exist before the VM, so that its role can be scoped to
  // them; cloud-init writes the real tokens as new versions. They outlive this
  // stack: the managers and workers still join with them once the leader is gone.
  const tokenSecrets = [config.managerTokenSecretName, config.workerTokenSecretName].map((secretName) => {
    const tokenSecret = new Secret(
      `${config.name}-${secretName}`,
      {
        properties: { value: "pending" },
        resourceGroupName: config.keyVaultResourceGroupName,
        secretName,
        tags: config.tags,
        vaultName: config.keyVaultName,
      },
      { ...options, ignoreChanges: ["properties.value"], retainOnDelete: true },
    );

    return new RoleAssignment(
      `${config.name}-leader-${secretName}`,
      {
        principalId: identity.principalId,
        principalType: "ServicePrincipal",
        roleDefinitionId: interpolate`/subscriptions/${config.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${KEY_VAULT_SECRETS_OFFICER}`,
        scope: tokenSecret.id,
      },
      options,
    );
  });

  const nic = new NetworkInterface(
    `${config.name}-leader-nic`,
    {
      ipConfigurations: [{
        loadBalancerBackendAddressPools: output(config.loadBalancerBackendPoolIds).apply(
          (ids) => ids.map((id) => ({ id })),
        ),
        name: "ipconfig-1",
        primary: true,
        privateIPAllocationMethod: "Dynamic",
        subnet: { id: config.subnetId },
      }],
      location: config.location,
      networkInterfaceName: `${config.name}-leader-nic`,
      networkSecurityGroup: { id: config.networkSecurityGroupId },
      resourceGroupName: config.resourceGroupName,
      tags: config.tags,
    },
    options,
  );

  const vm = new VirtualMachine(
    `${config.name}-leader`,
    {
      // No storageUri: Azure keeps the boot log and screenshot in a managed storage account.
      diagnosticsProfile: { bootDiagnostics: { enabled: true } },
      hardwareProfile: { vmSize: config.vmSize },
      identity: {
        type: "UserAssigned",
        userAssignedIdentities: [identity.id],
      },
      location: config.location,
      networkProfile: {
        networkInterfaces: [{ id: nic.id, primary: true }],
      },
      osProfile: {
        adminUsername,
        computerName: `${config.hostnamePrefix}-leader`,
        customData: config.renderCustomData(identity.clientId),
        linuxConfiguration: {
          disablePasswordAuthentication: true,
          ssh: { publicKeys },
        },
      },
      resourceGroupName: config.resourceGroupName,
      storageProfile: {
        dataDisks: config.dataDisks.map((disk) => ({
          createOption: "Attach",
          lun: disk.lun,
          managedDisk: { id: disk.id },
        })),
        imageReference: {
          offer: config.imageOffer,
          publisher: config.imagePublisher,
          sku: config.imageSku,
          version: config.imageVersion,
        },
        osDisk: {
          createOption: "FromImage",
          deleteOption: "Delete",
          diskSizeGB: config.osDiskSizeGb,
          managedDisk: { storageAccountType: "Premium_LRS" },
        },
      },
      tags: config.tags,
      vmName: `${config.name}-leader`,
      zones: config.zone ? [config.zone] : undefined,
    },
    {
      ...options,
      dependsOn: tokenSecrets,
      // Azure rejects changes to customData on an existing VM, and cloud-init only reads it at the first boot.
      ignoreChanges: ["osProfile.customData"],
    },
  );

  return {
    identityClientId: identity.clientId,
    identityPrincipalId: identity.principalId,
    managerTokenSecretName: config.managerTokenSecretName,
    privateIp: nic.ipConfigurations.apply((ips) => ips?.[0]?.privateIPAddress),
    vmId: vm.id,
    vmName: vm.name,
    workerTokenSecretName: config.workerTokenSecretName,
  };
};
