#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { StreamStack } from '../lib/stream-stack';

const app = new cdk.App();

// 获取环境变量或使用默认值
const stage = process.env.STAGE || 'dev';

// 创建 StreamStack
new StreamStack(app, 'MmcStreamStack', {
  stage,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  description: `MMC Stream service for ${stage} environment`,
});
