import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushService {
  private readonly logger = new Logger(PushService.name);

  async send(pushToken: string, title: string, body: string): Promise<void> {
    const fcmServerKey = process.env.FCM_SERVER_KEY;
    // TODO: call the real FCM HTTP v1 API here
    this.logger.log(`Would send FCM push to ${pushToken}: ${title} - ${body}`);
    void fcmServerKey;
  }
}
