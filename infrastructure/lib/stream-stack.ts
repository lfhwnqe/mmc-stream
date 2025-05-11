import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

interface StreamStackProps extends cdk.StackProps {
  stage: string; // 环境标识：dev, test, prod
  env?: { account: string; region: string }; // AWS 环境配置
  description?: string; // 堆栈描述
}

export class StreamStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: StreamStackProps) {
    super(scope, id, props);
    const stageName = props.stage;

    // 创建 Lambda 执行角色
    const lambdaRole = new iam.Role(this, 'StreamLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole',
        ),
      ],
    });

    // 为 Lambda 添加网络访问权限
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ec2:CreateNetworkInterface',
          'ec2:DescribeNetworkInterfaces',
          'ec2:DeleteNetworkInterface',
        ],
        resources: ['*'],
      }),
    );

    // 创建 Lambda Layer 用于依赖
    // const dependenciesLayer = new lambda.LayerVersion(
    //   this,
    //   'DependenciesLayer',
    //   {
    //     code: lambda.Code.fromAsset(
    //       path.join(__dirname, '../../stream-lambda-layer.zip'),
    //     ),
    //     compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
    //     compatibleArchitectures: [lambda.Architecture.ARM_64],
    //     description: 'Layer containing dependencies for the Stream Service',
    //   },
    // );

    // 创建 NestJS 流式响应 Lambda 函数
    const streamHandler = new lambda.Function(this, 'StreamHandler', {
      runtime: lambda.Runtime.NODEJS_22_X,
      architecture: lambda.Architecture.ARM_64,
      handler: 'lambda-stream-handler.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../dist')),
      role: lambdaRole,
      // layers: [dependenciesLayer], // 使用依赖 Layer
      environment: {
        NODE_ENV: props.stage,
      },
      timeout: cdk.Duration.minutes(2),
      memorySize: 1024,
      logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK,
      // 确保Lambda函数可以访问互联网
      vpc: undefined, // 不放入VPC，这样能直接访问互联网
    });

    // 添加函数 URL，支持流式响应
    const streamFunctionUrl = streamHandler.addFunctionUrl({
      authType: lambda.FunctionUrlAuthType.NONE,
      invokeMode: lambda.InvokeMode.RESPONSE_STREAM,
    });

    // 创建 API Gateway 日志角色
    new iam.Role(this, 'ApiGatewayLoggingRole', {
      assumedBy: new iam.ServicePrincipal('apigateway.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonAPIGatewayPushToCloudWatchLogs',
        ),
      ],
    });

    new cdk.CfnOutput(this, 'StreamFunctionUrl', {
      value: streamFunctionUrl.url,
      description: 'NestJS 流式响应函数 URL',
    });
  }
}
