import { 
  Group,
  Policy 
} from "@pulumi/aws/autoscaling";
import {
  SecurityGroup,
  LaunchTemplate,
} from "@pulumi/aws/ec2";
import { interpolate, output } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const securityGroup = new SecurityGroup(
    `${config.name}`,
    {
      description: "Allow TLS inbound traffic",
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
      ],
      ingress: [
        {
          description: "SSH",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "DNS (TCP)",
          fromPort: 53,
          toPort: 53,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "DNS (UDP)",
          fromPort: 53,
          toPort: 53,
          protocol: "udp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "HTTP from anywhere",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "HTTPS from anywhere",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          ipv6CidrBlocks: ["::/0"],
        },
        {
          description: "DNS (TCP)",
          fromPort: 2377,
          toPort: 2377,
          protocol: "tcp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "Swarm node discovery (TCP)",
          fromPort: 7946,
          toPort: 7946,
          protocol: "tcp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "Swarm node discovery (UDP)",
          fromPort: 7946,
          toPort: 7946,
          protocol: "udp",
          cidrBlocks: [config.cidrBlock],
        },
        {
          description: "Overlay network traffic (UDP 4789)",
          fromPort: 4789,
          toPort: 4789,
          protocol: "udp",
          cidrBlocks: [config.cidrBlock],
        },
      ],
      name: `${config.name}`,
      tags: {
        Name: `${config.name}`,
      },
      vpcId: config.vpcId,
    },
    options
  );
  
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
        
      userData: config.userData;
        
      metadataOptions: {
        httpEndpoint: "enabled",
        httpTokens: "required",
        httpPutResponseHopLimit: 2,
      },
      
      tagSpecifications: [{
        resourceType: "instance",
        tags: {
          Name: config.name,
          "swarm-node-type": "worker",
          ...config.tags,
        },
      }],
    },
    options
  );
    
  // Auto Scaling Group
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
          value: config.name,
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
