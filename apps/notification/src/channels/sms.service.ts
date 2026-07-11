import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class SmsService {
  private readonly logger = new Logger(SmsService.name);

  async send(phoneNumber: string, message: string): Promise<void> {
    // TODO: use the Twilio SDK (TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM_NUMBER) here
    this.logger.log(`Would send SMS via Twilio to ${phoneNumber}: ${message}`);
  }
}
