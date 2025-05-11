/**
 * 这个文件用于在本地测试 NestJS 的流式响应功能
 */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bodyParser: true,
  });
  
  // 配置CORS，允许跨域请求
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  });
  
  // 添加全局前缀
  app.setGlobalPrefix('api');
  
  const port = 3001;
  await app.listen(port);
  console.log(`测试服务启动在 http://localhost:${port}`);
  console.log(`流式API可以通过 http://localhost:${port}/api/stream 访问`);
  console.log(`使用GET参数: ?count=5&delay=1000`);
  console.log(`或使用POST请求发送JSON: { "count": 5, "delay": 1000, "message": "自定义消息" }`);
}

bootstrap();
