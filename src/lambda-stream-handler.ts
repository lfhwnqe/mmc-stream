import {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
} from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as express from 'express';

// 导入 AWS Lambda 函数
const awslambda = require('aws-lambda');

// 扩展 aws-lambda 类型以包含 streamifyResponse
declare module 'aws-lambda' {
  export function streamifyResponse<T>(
    handler: (
      event: APIGatewayProxyEvent,
      context: Context,
      responseStream: HttpResponseStream,
    ) => Promise<T>,
  ): (
    event: APIGatewayProxyEvent,
    context: Context,
  ) => Promise<APIGatewayProxyResult>;

  export interface HttpResponseStream {
    setContentType: (contentType: string) => void;
    write: (data: Uint8Array | string) => boolean;
    end: () => void;
  }
}

// 使用 Express 创建服务器实例
const expressApp = express();
let nestApp: any;

// 初始化 NestJS 应用程序
async function bootstrapServer() {
  const adapter = new ExpressAdapter(expressApp);
  nestApp = await NestFactory.create(AppModule, adapter, {
    bodyParser: true,
  });

  // 配置 CORS
  nestApp.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://*.maomaocong.site',
    ],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  });

  nestApp.setGlobalPrefix('api');
  await nestApp.init();
  return nestApp;
}

// 确保服务器只初始化一次
let serverInitialized = false;
async function ensureServer() {
  if (!serverInitialized) {
    await bootstrapServer();
    serverInitialized = true;
  }
  return nestApp;
}

// Lambda 处理函数
export async function handler(
  event: APIGatewayProxyEvent,
  context: Context,
): Promise<APIGatewayProxyResult> {
  // 检查是否为流式请求
  const path = event.path || '';
  const isStreamRequest =
    path.includes('/api/stream') ||
    event.queryStringParameters?.stream === 'true';

  if (isStreamRequest) {
    return awslambda.streamifyResponse(
      streamHandler.bind(null, event, context),
    );
  }

  // 对于非流式请求，使用 NestJS 应用处理
  await ensureServer();

  // 创建 Express 请求和响应对象
  const req = createRequest(event);
  const res = createResponse(context);

  // 处理请求
  await new Promise<void>((resolve) => {
    expressApp(req, res);
    res.on('finish', () => resolve());
  });

  return {
    statusCode: res.statusCode,
    headers: res.getHeaders(),
    body: res.body,
  };
}

// 流式响应处理程序
async function streamHandler(
  event: APIGatewayProxyEvent,
  context: Context,
  responseStream: awslambda.HttpResponseStream,
): Promise<void> {
  // 设置响应头
  responseStream.setContentType('text/plain');
  responseStream.write('流式响应开始...(Lambda Handler)\n');

  // 解析请求参数
  const queryParams = event.queryStringParameters || {};
  const count = parseInt(queryParams.count || '5', 10);
  const delay = parseInt(queryParams.delay || '1000', 10);

  // 输出请求信息
  responseStream.write(`请求路径: ${event.path}\n`);
  responseStream.write(`参数: 消息数=${count}, 延迟=${delay}ms\n\n`);

  // 模拟流式响应
  for (let i = 0; i < count; i++) {
    await sleep(delay);
    const message = `[${new Date().toISOString()}] 流式消息 #${i + 1} - 来自 Lambda 处理器\n`;
    responseStream.write(message);
  }

  // 添加结束标记
  await sleep(delay);
  responseStream.write('\n==流式响应结束==\n');

  // 关闭流
  responseStream.end();
}

// 工具函数
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 创建 Express 请求对象
function createRequest(event: APIGatewayProxyEvent): any {
  const req: any = {
    method: event.httpMethod,
    url: event.path,
    headers: event.headers,
    body: event.body ? JSON.parse(event.body) : {},
    query: event.queryStringParameters || {},
  };
  return req;
}

// 创建 Express 响应对象
function createResponse(context: Context): any {
  const res: any = {
    statusCode: 200,
    headers: {},
    body: '',
    getHeaders: function () {
      return this.headers;
    },
    setHeader: function (key: string, value: string) {
      this.headers[key] = value;
    },
    end: function (chunk: any) {
      if (chunk) this.body = chunk;
      this.emit('finish');
    },
    write: function (chunk: any) {
      this.body += chunk;
    },
    on: function (event: string, callback: () => void) {
      this.events = this.events || {};
      this.events[event] = callback;
    },
    emit: function (event: string) {
      if (this.events && this.events[event]) {
        this.events[event]();
      }
    },
  };
  return res;
}
