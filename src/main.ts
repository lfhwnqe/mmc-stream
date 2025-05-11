import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 允许传递原始响应对象，这对于流式响应是必要的
    bodyParser: true,
  });
  
  // 配置CORS，允许跨域请求
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'https://*.maomaocong.site'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
  });
  
  // 添加全局前缀
  app.setGlobalPrefix('api');
  
  console.log(`应用启动在端口: ${process.env.PORT ?? 3000}`);
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
