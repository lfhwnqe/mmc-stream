import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class StreamService {
  /**
   * 模拟流式返回数据
   * @param response Express Response 对象
   * @param count 消息数量
   * @param delay 延迟时间(ms)
   * @param customMessage 自定义消息内容
   */
  async streamData(
    response: Response,
    count: number = 5,
    delay: number = 1000,
    customMessage?: string,
  ) {
    try {
      // 模拟生成多条消息
      for (let i = 0; i < count; i++) {
        await this.sleep(delay);
        const message = customMessage
          ? `[${new Date().toISOString()}] ${customMessage} #${i + 1}\n`
          : `[${new Date().toISOString()}] 流式消息 #${i + 1} - 来自 NestJS 服务\n`;

        response.write(message);
      }

      // 添加结束标记
      await this.sleep(delay);
      response.write('\n==流式响应结束==\n');
      response.end();
    } catch (error) {
      console.error('流式响应出错:', error);
      if (!response.headersSent) {
        response.status(500).json({ error: '流式处理过程中出错' });
      } else {
        response.write('\n处理过程中出错，流式响应中断\n');
        response.end();
      }
    }
  }

  /**
   * 工具函数：延迟执行
   */
  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
