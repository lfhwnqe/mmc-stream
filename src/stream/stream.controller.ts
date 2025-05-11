import { Controller, Get, Res, Query, Post, Body } from '@nestjs/common';
import { Response } from 'express';
import { StreamService } from './stream.service';

@Controller('stream')
export class StreamController {
  constructor(private readonly streamService: StreamService) {}

  @Get()
  async streamResponse(
    @Res() response: Response,
    @Query('count') count: number = 5,
    @Query('delay') delay: number = 1000,
  ) {
    response.setHeader('Content-Type', 'text/plain');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    
    // Start the stream
    response.write(`开始流式响应 - 将发送 ${count} 条消息，每条延迟 ${delay}ms\n`);
    
    // Process streaming response
    await this.streamService.streamData(response, count, delay);
  }

  @Post()
  async streamResponsePost(
    @Res() response: Response,
    @Body() body: { count?: number; delay?: number; message?: string },
  ) {
    const count = body.count || 5;
    const delay = body.delay || 1000;
    const message = body.message || 'Stream message';
    
    response.setHeader('Content-Type', 'text/plain');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    
    // Start the stream
    response.write(`开始流式响应 - 将发送 ${count} 条消息，每条延迟 ${delay}ms\n`);
    
    // Process streaming response
    await this.streamService.streamData(response, count, delay, message);
  }
}
