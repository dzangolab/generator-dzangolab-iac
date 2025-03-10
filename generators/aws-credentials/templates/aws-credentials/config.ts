import {
  Config,
  getOrganization,
  getStack,
  StackReference,
  StackReferenceOutputDetails
} from "@pulumi/pulumi";

// See https://www.pulumi.com/registry/packages/random/api-docs/randompassword/#inputs
type Constraints = {
  length?: number,
  lower?: boolean,
  minLower?: number,
  minNumeric?: number,
  minSpecial?: number,
  minUpper?: number,
  numeric?: boolean,
  overrideSpecial?: string,
  upper?: boolean,
}

type Passwords = { [key: string]: Constraints };

export const getConfig = async () => {
  const organization = getOrganization();
  const stack = getStack();
  const stackConfig = new Config();
  const awsResourcesProject = stackConfig.get("awsResourcesProject") || "aws-resources";
  const doDatabaseClusterProject = stackConfig.get("doDatabaseClusterProject");

  const resourcesStack = new StackReference(
    `${organization}/${awsResourcesProject}/${stack}`,
  );

  const secretArnOutput = await resourcesStack.getOutputDetails("secretArn");
  const secretArn = getValue<string>(secretArnOutput);

  let sesSmtpUser: string | undefined = undefined;

  try {
    const sesSmtpUsernameOutput = await resourcesStack.getOutputDetails("sesSmtpUsername");

    sesSmtpUser = getValue<string>(sesSmtpUsernameOutput);
  } catch (e) {
    // Do nothing
  }

  const usernameOutput = await resourcesStack.getOutputDetails("username");
  const username = getValue<string>(usernameOutput);

  let config: { [key: string]: any } = {
    name: stackConfig.get("name") || stack,
    passwordLength: stackConfig.getNumber("passwordLength"),
    passwords: stackConfig.requireObject<Passwords>("passwords"),
    protect: stackConfig.getBoolean("protect"),
    retainOnDelete: stackConfig.getBoolean("retainOnDelete"),
    secretArn,
    sesSmtpUser,
    timestamp: stackConfig.require("timestamp"),
    username
  };

  if (doDatabaseClusterProject) {
    const databaseStack = new StackReference(
      `${organization}/${doDatabaseClusterProject}/${stack}`,
    );

    const rootPasswordOutput = await databaseStack.getOutputDetails("rootPassword");
    config.rootPassword = getValue<string>(rootPasswordOutput);

    const databaseUsernameOutput = await databaseStack.getOutputDetails("userName");
    config.databaseUsername = getValue<string>(databaseUsernameOutput);

    const databasePasswordOutput = await databaseStack.getOutputDetails("userPassword");
    config.databasePassword = getValue<string>(databasePasswordOutput);
  }

  return config;
};

function getValue<T>(input: StackReferenceOutputDetails, defaultValue?: T): T {
  if (input && input.value) {
    return <T>input.value!;
  }

  if (input && input.secretValue) {
    return <T>input.secretValue!;
  }

  if (!defaultValue) {
    throw new Error("A value is required");
  }

  return defaultValue;
}
