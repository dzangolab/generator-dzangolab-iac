import { 
  LoadBalancer,
  Listener,
  TargetGroup
} from "@pulumi/aws/lb";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

    const lb = new LoadBalancer(
    `${config.name}`,
    {
      name: `${config.name}`,
      internal: false, // Set to true if this should be internal-only
      loadBalancerType: "application",
      subnets: config.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `${config.name}`,
        "swarm-component": `manager-load-balancer`,
        ...config.tags,
      },
    },
    options
  );

  // 2. Create the Target Group for Swarm API
  const targetGroup = new TargetGroup(
    `${config.name}`,
    {
      name: `${config.name}-swarm`,
      port: 443,
      protocol: "HTTP",
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

  if (!config.useCertificate){
    const listener = new Listener(
      `${config.name}-listener`,
      {
        loadBalancerArn: lb.arn,
        port: 433,
        protocol: "HTTP",
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
