import { RoleAssignment } from "@pulumi/azure-native/authorization";
import { VirtualMachineScaleSet } from "@pulumi/azure-native/compute";
import { UserAssignedIdentity } from "@pulumi/azure-native/managedidentity";
import { AutoscaleSetting } from "@pulumi/azure-native/monitor";
import { interpolate, log, output } from "@pulumi/pulumi";

import { getConfig } from "./config";

// Built-in role "Key Vault Secrets User": read secret values, nothing else.
const KEY_VAULT_SECRETS_USER = "4633458b-17de-408a-b874-0445c86b69e6";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  if (config.minCount !== config.maxCount) {
    log.warn(
      "minCount and maxCount differ: swarm managers should not scale with load, and an even number of managers adds no fault tolerance",
    );
  }

  const adminUsername = "azureadmin";
  // Throwaway key with no corresponding private key: satisfies Azure's auth requirement but grants no access.
  const publicKeys = [{
    keyData: "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIEUJqcXppL6/3cpxsgQAUUZP5NPJgf6V94ODeRWiNR48 throwaway-no-login",
    path: `/home/${adminUsername}/.ssh/authorized_keys`,
  }];

  // A user-assigned identity exists, with its role, before the first VM boots;
  // a system-assigned one would only get its role after the VMs are already joining.
  const identity = new UserAssignedIdentity(
    `${config.name}-managers`,
    {
      location: config.location,
      resourceGroupName: config.resourceGroupName,
      resourceName: `${config.name}-managers`,
      tags: config.tags,
    },
    options,
  );

  // Scoped to the join token secret only.
  const roleAssignment = new RoleAssignment(
    `${config.name}-managers-join-token`,
    {
      principalId: identity.principalId,
      principalType: "ServicePrincipal",
      roleDefinitionId: interpolate`/subscriptions/${config.subscriptionId}/providers/Microsoft.Authorization/roleDefinitions/${KEY_VAULT_SECRETS_USER}`,
      scope: interpolate`${config.keyVaultId}/secrets/${config.managerTokenSecretName}`,
    },
    options,
  );

  const vmss = new VirtualMachineScaleSet(
    `${config.name}-managers`,
    {
      identity: {
        type: "UserAssigned",
        userAssignedIdentities: [identity.id],
      },
      location: config.location,
      overprovision: false,
      resourceGroupName: config.resourceGroupName,
      sku: {
        capacity: config.minCount,
        name: config.vmSize,
        tier: "Standard",
      },
      tags: config.tags,
      upgradePolicy: { mode: "Manual" },
      virtualMachineProfile: {
        networkProfile: {
          networkInterfaceConfigurations: [{
            ipConfigurations: [{
              loadBalancerBackendAddressPools: output(config.loadBalancerBackendPoolIds).apply(
                (ids) => ids.map((id) => ({ id })),
              ),
              name: "ipconfig-1",
              primary: true,
              subnet: { id: config.subnetId },
            }],
            name: `${config.name}-managers-nic`,
            networkSecurityGroup: { id: config.networkSecurityGroupId },
            primary: true,
          }],
        },
        osProfile: {
          adminUsername,
          computerNamePrefix: `${config.hostnamePrefix}-manager-`,
          customData: config.renderCustomData(identity.clientId),
          linuxConfiguration: {
            disablePasswordAuthentication: true,
            ssh: { publicKeys },
          },
        },
        scheduledEventsProfile: {
          terminateNotificationProfile: {
            enable: true,
            notBeforeTimeout: "PT5M",
          },
        },
        storageProfile: {
          imageReference: {
            offer: config.imageOffer,
            publisher: config.imagePublisher,
            sku: config.imageSku,
            version: config.imageVersion,
          },
          osDisk: {
            createOption: "FromImage",
            diskSizeGB: config.osDiskSizeGb,
            managedDisk: { storageAccountType: "Premium_LRS" },
          },
        },
      },
      vmScaleSetName: `${config.name}-managers`,
      zones: config.zones,
    },
    {
      ...options,
      dependsOn: [roleAssignment],
      // The autoscale setting owns the capacity once the scale set exists.
      ignoreChanges: ["sku.capacity"],
    },
  );

  new AutoscaleSetting(
    `${config.name}-managers-autoscale`,
    {
      autoscaleSettingName: `${config.name}-managers-autoscale`,
      enabled: true,
      location: config.location,
      profiles: [{
        capacity: {
          default: String(config.minCount),
          maximum: String(config.maxCount),
          minimum: String(config.minCount),
        },
        name: "managers",
        rules: [],
      }],
      resourceGroupName: config.resourceGroupName,
      tags: config.tags,
      targetResourceUri: vmss.id,
    },
    options,
  );

  return {
    identityClientId: identity.clientId,
    identityPrincipalId: identity.principalId,
    vmssId: vmss.id,
    vmssName: vmss.name,
  };
};
