import { ManagedPolicy } from "@pulumi/aws/iam";
import { aws } from "@dzangolab/pulumi";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const identityProvider = new aws.GithubIdentityProvider(
    "github",
    {},
    {
      protect: config.protect,
      retainOnDelete: config.retainOnDelete,
    }
  );

  const role = new aws.GithubActionsRole(
    "github",
    {
      githubIdentityProviderArn: identityProvider.arn,
      githubRepos: config.repos,
      policyArns: config.policies,
    },
    {
      protect: config.protect,
      retainOnDelete: config.retainOnDelete,
    }
  );

  return {
    githubActionsRoleArn: role.arn,
    githubIdentityProviderArn: identityProvider.arn,
  };
}
