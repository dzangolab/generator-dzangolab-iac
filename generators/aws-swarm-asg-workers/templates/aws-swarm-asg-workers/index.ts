import {
  SecurityGroup,
} from "@pulumi/aws/ec2";
import { output } from "@pulumi/pulumi";

import { getConfig } from "./config";
import { autoscaling, ec2 } from "@pulumi/aws";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  // Desired worker count
  const count = config.count;

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

    const launchTemplate = new ec2.LaunchTemplate(`${config.name}-lt`, {
        namePrefix: `${config.name}-`,
        imageId: config.ami,
        instanceType: config.instanceType,
        keyName: config.keypair,
        iamInstanceProfile: { name: config.iamInstanceProfile },
        monitoring: { enabled: config.monitoring },
        disableApiTermination: config.disableApiTermination,
        vpcSecurityGroupIds: [securityGroup.id],
        
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
                Name: `${config.name}-worker`,
                "swarm-node-type": "worker",
                ...config.tags,
            },
        }],
    }, options);

    // Auto Scaling Group
    const asg = new autoscaling.Group(`${config.name}-asg`, {
        name: config.name,
        launchTemplate: {
            id: launchTemplate.id,
            version: "$Latest",
        },
        vpcZoneIdentifiers: [config.subnetId],
        minSize: config.minSize || 1,
        maxSize: config.maxSize || 2,
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
    }, options);

    new autoscaling.Policy(`${config.name}-cpu-scaling`, {
        autoscalingGroupName: asg.name,
        policyType: "TargetTrackingScaling",
        targetTrackingConfiguration: {
            predefinedMetricSpecification: {
                predefinedMetricType: "ASGAverageCPUUtilization",
            },
            targetValue: 70.0,
        },
    }, options);

    return {
        asgName: asg.name,
        asgArn: asg.arn,
        launchTemplateId: launchTemplate.id,
        securityGroupId: securityGroup.id,
    };
};