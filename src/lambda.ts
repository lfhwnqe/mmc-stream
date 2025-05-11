import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

// 扩展 aws-lambda 类型以包含 streamifyResponse
declare module 'aws-lambda' {
  export function streamifyResponse<T>(
    handler: (event: APIGatewayProxyEvent, context: Context, responseStream: HttpResponseStream) => Promise<T>
  ): (event: APIGatewayProxyEvent, context: Context) => Promise<APIGatewayProxyResult>;
  
  export interface HttpResponseStream {
    setContentType: (contentType: string) => void;
    write: (data: Uint8Array | string) => boolean;
    end: () => void;
  }
}

// 导入 AWS Lambda 函数
const awslambda = require('aws-lambda');

export async function handler(event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> {
  // 检查是否请求流式响应
  const isStreamRequest = event.queryStringParameters?.stream === 'true';
  
  if (isStreamRequest) {
    return awslambda.streamifyResponse(
      streamHandler.bind(null, event, context)
    );
  }

  // 非流式请求的默认处理
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*', // CORS支持
      'Access-Control-Allow-Credentials': true,
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    },
    body: JSON.stringify({
      message: '这是标准响应。添加 ?stream=true 查询参数来测试流式响应',
      timestamp: new Date().toISOString(),
    }),
  };
}

// 流式响应处理程序
async function streamHandler(
  event: APIGatewayProxyEvent,
  context: Context,
  responseStream: awslambda.HttpResponseStream
): Promise<void> {
  const encoder = new TextEncoder();
  
  // 设置响应头
  responseStream.setContentType('text/plain');
  responseStream.write(encoder.encode('流式响应开始...\n'));
  
  // 模拟流式响应
  const messages = [
    '这是第一条消息',
    '这是第二条消息',
    '这是第三条消息',
    '这是一个来自新 mmc-stream 服务的消息',
    '流式响应正在进行...',
    '即将结束'  
  ];
  
  // 按顺序发送所有消息
  for (const message of messages) {
    await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    responseStream.write(encoder.encode(`${message}\n`));
  }
  
  // 添加请求信息
  await new Promise(resolve => setTimeout(resolve, 500));
  responseStream.write(encoder.encode('\n请求信息:\n'));
  responseStream.write(encoder.encode(`路径: ${event.path}\n`));
  responseStream.write(encoder.encode(`HTTP方法: ${event.httpMethod}\n`));
  responseStream.write(encoder.encode(`查询参数: ${JSON.stringify(event.queryStringParameters)}\n`));
  
  // 添加时间戳
  await new Promise(resolve => setTimeout(resolve, 500));
  responseStream.write(encoder.encode(`\n完成时间: ${new Date().toISOString()}\n`));
  
  // 关闭流
  responseStream.end();
}
