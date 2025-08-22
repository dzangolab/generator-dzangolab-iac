import { 
  Group,
  Policy 
} from "@pulumi/aws/autoscaling";
import {
  LaunchTemplate,
} from "@pulumi/aws/ec2";
import { output } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const asgResources = [];
  const azLetters = ['A', 'B', 'C'];

  for (let i = 0; i < config.publicSubnetIds.length; i++) {

    const azRegion = `${azLetters[i]}`
    const azConfig = config.azConfigurations[i];

    if (azConfig.maxSize == 0){
      continue;
    }

    const launchTemplate = new LaunchTemplate(
      `${config.name}-${azRegion}`,
      {
        namePrefix: `${config.name}-${azRegion}`,
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
            volumeSize: 8,
            volumeType: "gp3",
            deleteOnTermination: "true",
            encrypted: "true",
          },
        }],
        
        userData: output(config.userData).apply(u => Buffer.from(u).toString("base64")),
        
        metadataOptions: {
          httpEndpoint: "enabled",
          httpTokens: "optional",
          httpPutResponseHopLimit: 2,
        },
        
        tagSpecifications: [{
          resourceType: "instance",
          tags: {
            Name: `${config.name}-${azRegion}`,
            "swarm-node-type": "worker",
            ...config.tags,
          },
        }],
      },
      options
    );
    
    // Auto Scaling Group
    const asg = new Group(
      `${config.name}-${azRegion}-asg`,
      {
        name: `${config.name}-${azRegion}`,
        launchTemplate: {
            id: launchTemplate.id,
            version: "$Latest",
        },
        vpcZoneIdentifiers: [config.publicSubnetIds[i]],
        minSize: azConfig.minSize || 1,
        maxSize: azConfig.maxSize || 2,
        desiredCapacity: config.desiredCapacity || 2,
        
        // Health check configuration
        healthCheckType: "EC2",
        healthCheckGracePeriod: 300,
        
        // Instance maintenance
        instanceRefresh: {
          strategy: "Rolling",
          preferences: {
            minHealthyPercentage: 90,
            instanceWarmup: "300",
          },
        },
        
        // Termination policies
        terminationPolicies: ["OldestInstance"],
        defaultCooldown: 300,
        
        tags: [
          {
            key: "Name",
            value: `${config.name}-${azRegion}`,
            propagateAtLaunch: true,
          },
          {
            key: "swarm-node-type",
            value: "worker",
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

    new Policy(
      `${config.name}-${azRegion}-cpu-scaling`,
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

    asgResources.push({
      asgName: asg.name,
      asgArn: asg.arn,
      launchTemplateId: launchTemplate.id,
      azRegion: `${azRegion}`,
    });
  }
  
  return {
    asgs: asgResources,
  };
};