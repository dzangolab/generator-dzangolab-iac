import { 
  Group,
  Policy 
} from "@pulumi/aws/autoscaling";
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
  };
};