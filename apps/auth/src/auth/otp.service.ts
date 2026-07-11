import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '@app/redis';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
  ) {}

  private key(email: string): string {
    return `otp:${email}`;
  }

  async generate(email: string): Promise<string> {
    const length = this.config.get<number>('OTP_LENGTH') ?? 6;
    const ttl = this.config.get<number>('OTP_TTL_SECONDS') ?? 300;
    const code = Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
    await this.redis.set(this.key(email), code, ttl);
    // TODO: publish to notification-service (email/SMS channel) instead of logging.
    this.logger.log(`OTP for ${email}: ${code} (dev-only log — never do this in production)`);
    return code;
  }

  async verify(email: string, code: string): Promise<boolean> {
    const stored = await this.redis.get(this.key(email));
    if (!stored || stored !== code) return false;
    await this.redis.del(this.key(email));
    return true;
  }
}
