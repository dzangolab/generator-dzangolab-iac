import { 
  LoadBalancer,
  Listener,
  TargetGroup,
  LoadBalancerArgs
} from "@pulumi/aws/lb";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";
import { debug } from "console";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const lbArgs: LoadBalancerArgs = {
    name: `${config.name}`,
    internal: false,
    loadBalancerType: "network",
    enableDeletionProtection: false,
    tags: {
      Name: `${config.name}`,
      "swarm-component": `manager-load-balancer`,
      ...config.tags,
    },
  };

  // If you have an EIP and a subnet, use subnetMappings
  if (config.publicSubnetIds != undefined && config.eipId != undefined) {
    lbArgs.subnetMappings = [
      {
        subnetId: config.publicSubnetIds[0],
        allocationId: config.eipId,
      },
      {
        subnetId: config.publicSubnetIds[1],
      },
      {
        subnetId: config.publicSubnetIds[2],
      },
    ];
  }
  else {
    lbArgs.subnets = config.publicSubnetIds;
  }

  const lb = new LoadBalancer(`${config.name}`, lbArgs, options);

  // 2. Create the Target Group for Swarm API
  const targetGroup = new TargetGroup(
    `${config.name}`,
    {
      name: `${config.name}-swarm`,
      port: 443,
      protocol: "TCP",
      vpcId: config.vpcId, // You'll need to add vpcId to your config
      targetType: "instance",
      
      // Health check configuration
      healthCheck: {
        enabled: true,
        path: "/ping",
        protocol: "HTTP",
        port: "80",
        healthyThreshold: 3,
        unhealthyThreshold: 3,
        interval: 30,
      },
      
      tags: {
        Name: `${config.name}-swarm-tg`,
        "swarm-component": `manager-target-group`,
        ...config.tags,
      },
    },
    options
  );

  if (!config.useHttps){
    const listener = new Listener(
      `${config.name}-listener`,
      {
        loadBalancerArn: lb.arn,
        port: 443,
        protocol: "TCP",
        defaultActions: [{
          type: "forward",
          targetGroupArn: targetGroup.arn,
        }],
      },
      options
    );
  }

  return {
    lbDnsName: interpolate`${lb.dnsName}`,
    lbArn: interpolate`${lb.arn}`,
    targetGroupArn: interpolate`${targetGroup.arn}`,
  };
}
