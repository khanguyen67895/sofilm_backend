import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QueueModule, QUEUE_NAMES } from '@app/queue';
import { Notification } from '../entities/notification.entity';
import { EmailService } from '../channels/email.service';
import { PushService } from '../channels/push.service';
import { SmsService } from '../channels/sms.service';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { NotificationProcessor } from './notification.processor';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    QueueModule.registerQueues(QUEUE_NAMES.NOTIFICATION),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationProcessor, EmailService, PushService, SmsService],
})
export class NotificationModule {}
