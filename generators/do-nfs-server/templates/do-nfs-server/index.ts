import { digitalocean } from "@dzangolab/pulumi";
import { Firewall } from "@pulumi/digitalocean";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const droplet = new digitalocean.Droplet(
    config.name,
    {
      image: config.image,
      packages: config.packages,
      projectId: config.projectId,
      region: config.region,
      reservedIpId: config.reservedIpId,
      size: config.size,
      sshKeyNames: config.sshKeyNames,
      userDataTemplate: config.userDataTemplate,
      users: config.users,
      volumeIds: config.volumeIds,
      volumes: config.volumes,
      vpcUuid: config.vpcId,
    },
    options
  );
  
  const dropletId = droplet.id.apply(id => {
    return parseInt(id);
  });

  const firewall = new Firewall(
    config.name,
    {
      dropletIds: [dropletId],
      inboundRules: [
        {
          protocol: "tcp",
          portRange: "22",
          sourceAddresses: [
            "0.0.0.0/0",
            "::/0",
          ],
        },
        {
          protocol: "tcp",
          portRange: "2049",
          sourceAddresses: [
            config.vpcIpRange
          ],
        },
        {
          protocol: "icmp",
          sourceAddresses: [
              "0.0.0.0/0",
              "::/0",
          ],
        },
      ],
      outboundRules: [
        {
          protocol: "tcp",
          portRange: "53",
          destinationAddresses: [
              "0.0.0.0/0",
              "::/0",
          ],
        },
        {
          protocol: "udp",
          portRange: "53",
          destinationAddresses: [
              "0.0.0.0/0",
              "::/0",
          ],
        },
        {
          protocol: "icmp",
          destinationAddresses: [
              "0.0.0.0/0",
              "::/0",
          ],
        },
      ]
    },
    options
  );

  return {
    firewallId: interpolate(firewall.id),
    firewallName: interpolate(firewall.name),
    firewallStatus: interpolate(firewall.status),
    id: interpolate`${droplet.id}`,
    ipv4Address: interpolate`${droplet.ipv4Address}`,
    ipv4AddressPrivate: interpolate`${droplet.ipv4AddressPrivate}`,
    name: interpolate`${droplet.name}`
  };
};
