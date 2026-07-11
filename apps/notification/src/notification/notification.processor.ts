import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  Job,
  QUEUE_NAMES,
  NOTIFICATION_JOBS,
} from '@app/queue';
import { Notification, NotificationType } from '../entities/notification.entity';
import { EmailService } from '../channels/email.service';
import { PushService } from '../channels/push.service';
import { SmsService } from '../channels/sms.service';

export interface NotificationJobData {
  userId: string;
  title: string;
  body: string;
  to: string;
  notificationId?: string;
}

@Processor(QUEUE_NAMES.NOTIFICATION)
@Injectable()
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly pushService: PushService,
    private readonly smsService: SmsService,
  ) {
    super();
  }

  async process(job: Job<NotificationJobData>): Promise<void> {
    const { userId, title, body, to, notificationId } = job.data;

    switch (job.name) {
      case NOTIFICATION_JOBS.SEND_EMAIL:
        await this.emailService.send(to, title, body);
        await this.recordSent(notificationId, userId, NotificationType.EMAIL, title, body);
        break;
      case NOTIFICATION_JOBS.SEND_PUSH:
        await this.pushService.send(to, title, body);
        await this.recordSent(notificationId, userId, NotificationType.PUSH, title, body);
        break;
      case NOTIFICATION_JOBS.SEND_SMS:
        await this.smsService.send(to, body);
        await this.recordSent(notificationId, userId, NotificationType.SMS, title, body);
        break;
      default:
        this.logger.warn(`Unknown notification job name: ${job.name}`);
    }
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<NotificationJobData> | undefined, error: Error) {
    this.logger.error(`Job ${job?.id} (${job?.name}) failed: ${error.message}`, error.stack);
  }

  private async recordSent(
    notificationId: string | undefined,
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
  ): Promise<void> {
    if (notificationId) {
      await this.notifications.update({ id: notificationId }, { sentAt: new Date() });
      return;
    }

    const notification = this.notifications.create({
      userId,
      type,
      title,
      body,
      sentAt: new Date(),
    });
    await this.notifications.save(notification);
  }
}
