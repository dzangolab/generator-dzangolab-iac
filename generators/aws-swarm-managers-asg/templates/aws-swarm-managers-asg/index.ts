import { 
  Group,
  Policy 
} from "@pulumi/aws/autoscaling";
import { 
  LoadBalancer,
  Listener,
  TargetGroup
} from "@pulumi/aws/lb";
import {
  LaunchTemplate,
} from "@pulumi/aws/ec2";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  // 1. Create the Network Load Balancer first
  const nlb = new LoadBalancer(
    `${config.name}-nlb`,
    {
      name: `${config.name}-nlb`,
      internal: false, // Set to true if this should be internal-only
      loadBalancerType: "network",
      subnets: config.publicSubnetIds,
      enableDeletionProtection: false,
      tags: {
        Name: `${config.name}-nlb`,
        "swarm-component": `manager-load-balancer`,
        ...config.tags,
      },
    },
    options
  );

  // 2. Create the Target Group for Swarm API
  const targetGroup = new TargetGroup(
    `${config.name}-tg`,
    {
      name: `${config.name}-swarm-tg`,
      port: 2377,
      protocol: "TCP",
      vpcId: config.vpcId, // You'll need to add vpcId to your config
      targetType: "instance",
      
      // Health check configuration
      healthCheck: {
        enabled: true,
        protocol: "TCP",
        port: "2377",
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

  // 3. Create Listener for the NLB
  const listener = new Listener(
    `${config.name}-listener`,
    {
      loadBalancerArn: nlb.arn,
      port: 2377,
      protocol: "TCP",
      defaultActions: [{
        type: "forward",
        targetGroupArn: targetGroup.arn,
      }],
    },
    options
  );

  // 4. Create Launch Template (modified to include NLB DNS in userData)
  const launchTemplate = new LaunchTemplate(
    config.name,
    {
      imageId: config.ami,
      instanceType: config.instanceType,
      keyName: config.keypair,
      iamInstanceProfile: { name: config.iamInstanceProfile },
      monitoring: { enabled: config.monitoring },
      disableApiTermination: config.disableApiTermination,
      vpcSecurityGroupIds: [config.securityGroupId],

      // Minimal block device configuration
      blockDeviceMappings: [{
        deviceName: "/dev/xvda",
        ebs: {
          volumeSize: config.rootBlockDevice.volumeSize,
          volumeType: "gp3",
          deleteOnTermination: "true",
          encrypted: "true",
        },
      }],
        
      // Modify userData to include NLB DNS name
      userData: config.userData,
        
      metadataOptions: {
        httpEndpoint: "enabled",
        httpTokens: "required",
        httpPutResponseHopLimit: 2,
      },
      
      tagSpecifications: [{
        resourceType: "instance",
        tags: {
          Name: config.name,
          "swarm-node-type": "manager",
          ...config.tags,
        },
      }],
    },
    options
  );
    
  // 5. Auto Scaling Group with Target Group attachment
  const asg = new Group(
    config.name,
    {
      desiredCapacity: config.minSize,
      launchTemplate: {
          id: launchTemplate.id,
          version: "$Latest",
      },
      maxSize: config.maxSize,
      minSize: config.minSize,
      vpcZoneIdentifiers: config.publicSubnetIds,
      
      // Attach the NLB Target Group to the ASG
      targetGroupArns: [targetGroup.arn],
      
      // Health check configuration
      healthCheckType: "EC2",
      healthCheckGracePeriod: 300,
        
      // Instance maintenance
      instanceRefresh: {
        strategy: "Rolling",
        preferences: {
          minHealthyPercentage: 90,
          instanceWarmup: 300, 
        },
      },
      
      // Termination policies
      terminationPolicies: ["OldestInstance"],
      defaultCooldown: 300,
      
      tags: [
        {
          key: "Name",
          value: config.name,
          propagateAtLaunch: true,
        },
        {
          key: "swarm-node-type",
          value: "manager",
          propagateAtLaunch: true,
        },
        {
          key: "NLB_DNS",
          value: nlb.dnsName, // Pass NLB DNS as a tag for instance discovery
          propagateAtLaunch: true,
        },
        ...Object.entries(config.tags || {}).map(([key, value]) => ({
          key,
          value,
          propagateAtLaunch: true,
        })),
      ],
    },
    options
  );

  const policy = new Policy(
    config.name,
    {
      autoscalingGroupName: asg.name,
      policyType: "TargetTrackingScaling",
      targetTrackingConfiguration: {
        predefinedMetricSpecification: {
          predefinedMetricType: "ASGAverageCPUUtilization",
        },
        targetValue: 70.0,
      },
    },
    options
  );

  return {
    asgName: interpolate`${asg.name}`,
    asgArn: interpolate`${asg.arn}`,
    launchTemplateId: interpolate`${launchTemplate.id}`,
    policyId: interpolate`${policy.id}`,
    nlbDnsName: interpolate`${nlb.dnsName}`,
    nlbArn: interpolate`${nlb.arn}`,
    targetGroupArn: interpolate`${targetGroup.arn}`,
  };
};