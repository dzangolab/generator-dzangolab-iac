import {
  AssetArchive,
  StringAsset
} from "@pulumi/asset"
import{
  EventRule,
  EventTarget
} from "@pulumi/aws/cloudwatch";
import { 
  Role,
  assumeRolePolicyForPrincipal,
  RolePolicyAttachment,
  ManagedPolicy
} from "@pulumi/aws/iam";
import { 
  Function,
  Permission
} from "@pulumi/aws/lambda";

import { getConfig } from "./config";

export = async () => {
  const config = await getConfig();

  const options = {
    protect: config.protect,
    retainOnDelete: config.retainOnDelete,
  };
    
  // --- Config ---
  const targetGroupArn = config.targetGroupArn;
  const slackWebhookUrl = config.slackWebhookUrl;

  const lambdaRole = Role("targetHealthLambdaRole", {
    assumeRolePolicy: assumeRolePolicyForPrincipal({
      Service: "lambda.amazonaws.com",
    }),
  });

  new RolePolicyAttachment("lambdaBasicExecution", {
    role: lambdaRole.name,
    policyArn: ManagedPolicy.AWSLambdaBasicExecutionRole,
  });

  const lambdaFunc = new Function("targetHealthNotifier", {
    runtime: "nodejs20.x",
    role: lambdaRole.arn,
    handler: "index.handler",
    timeout: 10,
    code: new AssetArchive({
      "index.js": new StringAsset(`
        const https = require("https");
        const { URL } = require("url");

        exports.handler = async (event) => {
          console.log("Event:", JSON.stringify(event, null, 2));

          const detail = event.detail || {};
          const targetId = detail.target?.id || "unknown";
          const state = detail.targetHealth?.state || "unknown";
          const tgArn = detail.targetGroupArn;

          const message = {
            text: \`🔔 *Target Group Health Change*\n• Target: \${targetId}\n• State: \${state}\n• TargetGroup: \${tgArn}\`,
          };

          const webhookUrl = process.env.SLACK_WEBHOOK_URL;
          const url = new URL(webhookUrl);

          await new Promise((resolve, reject) => {
            const req = https.request({
              hostname: url.hostname,
              path: url.pathname,
              method: "POST",
              headers: { "Content-Type": "application/json" },
            }, (res) => {
              res.on("data", () => {});
              res.on("end", resolve);
            });
            req.on("error", reject);
            req.write(JSON.stringify(message));
            req.end();
          });

          return { statusCode: 200 };
        };
      `),
    }),
    environment: {
      variables: {
        SLACK_WEBHOOK_URL: slackWebhookUrl,
      },
    },
  });

  // --- EventBridge Rule ---
  const rule = new EventRule("targetHealthRule", {
    eventPattern: {
      source: ["aws.elasticloadbalancing"],
      "detail-type": ["Elastic Load Balancer Target Health State Change"],
      detail: {
        targetGroupArn: [targetGroupArn],
      },
    },
  });

  // --- Lambda Permission + Target ---
  new Permission("allowEventBridgeInvoke", {
    action: "lambda:InvokeFunction",
    function: lambdaFunc.name,
    principal: "events.amazonaws.com",
    sourceArn: rule.arn,
  });

  new EventTarget("targetHealthEventTarget", {
    rule: rule.name,
    arn: lambdaFunc.arn,
  });

  return {
    lambdaName: lambdaFunc.name,
    eventRuleName: rule.name
  }
}