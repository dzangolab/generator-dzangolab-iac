import {
  getPolicyDocument,
  InstanceProfile,
  ManagedPolicy,
  Role
} from "@pulumi/aws/iam";
import { interpolate } from "@pulumi/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };

  const assumeRolePolicy = getPolicyDocument({
    statements: [{
      effect: "Allow",
      principals: [{
        type: "Service",
        identifiers: ["ec2.amazonaws.com"],
      }],
      actions: ["sts:AssumeRole"],
    }],
  });

  const role = new Role(
    config.roleName,
    {
      path: "/",
      assumeRolePolicy: assumeRolePolicy.then(policy => policy.json),
      managedPolicyArns: config.managedPolicyArns
    },
    {
      protect: config.protect,
      retainOnDelete: config.retainOnDelete,
    },
  );

  const instanceProfile = new InstanceProfile(
    config.profileName,
    {
      role,
    },
    {
      protect: config.protect,
      retainOnDelete: config.retainOnDelete,
    },
  );

  return {
    arn: interpolate`${instanceProfile.arn}`,
    id: interpolate`${instanceProfile.id}`,
    name: interpolate`${instanceProfile.name}`,
    roleArn: interpolate`${role.arn}`,
  };
}
