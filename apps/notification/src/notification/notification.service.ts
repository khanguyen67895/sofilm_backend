import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { InjectQueue, Queue, QUEUE_NAMES, NOTIFICATION_JOBS } from '@app/queue';
import { PaginationQueryDto, paginate, PaginatedResult } from '@app/common';
import { Notification, NotificationType } from '../entities/notification.entity';
import { SendNotificationDto } from './dto/send-notification.dto';

const JOB_BY_TYPE: Record<Exclude<NotificationType, NotificationType.IN_APP>, string> = {
  [NotificationType.EMAIL]: NOTIFICATION_JOBS.SEND_EMAIL,
  [NotificationType.PUSH]: NOTIFICATION_JOBS.SEND_PUSH,
  [NotificationType.SMS]: NOTIFICATION_JOBS.SEND_SMS,
};

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification) private readonly notifications: Repository<Notification>,
    @InjectQueue(QUEUE_NAMES.NOTIFICATION) private readonly queue: Queue,
  ) {}

  async send(dto: SendNotificationDto): Promise<Notification> {
    if (dto.type === NotificationType.IN_APP) {
      const notification = this.notifications.create({
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        body: dto.body,
        sentAt: new Date(),
      });
      return this.notifications.save(notification);
    }

    const notification = this.notifications.create({
      userId: dto.userId,
      type: dto.type,
      title: dto.title,
      body: dto.body,
      sentAt: null,
    });
    await this.notifications.save(notification);

    const jobName = JOB_BY_TYPE[dto.type];
    await this.queue.add(jobName, {
      userId: dto.userId,
      title: dto.title,
      body: dto.body,
      to: dto.to,
      notificationId: notification.id,
    });

    return notification;
  }

  /** New-movie/new-short announcements (see broadcast()) have no userId, so
   * every user's list is their own personal notifications plus every broadcast. */
  async findForUser(
    userId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<Notification>> {
    const [items, total] = await this.notifications.findAndCount({
      where: [{ userId }, { userId: IsNull() }],
      order: { createdAt: 'DESC' },
      skip: query.skip,
      take: query.limit,
    });
    return paginate(items, total, query.page, query.limit);
  }

  /** IN_APP, not tied to a single recipient — used for "new content published"
   * announcements. Called internally by other services (see notification.controller.ts). */
  async broadcast(
    title: string,
    body: string,
    metadata?: Record<string, unknown>,
  ): Promise<Notification> {
    const notification = this.notifications.create({
      type: NotificationType.IN_APP,
      title,
      body,
      metadata,
      sentAt: new Date(),
    });
    return this.notifications.save(notification);
  }

  async markRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notifications.findOne({ where: { id } });
    if (!notification) throw new NotFoundException(`Notification "${id}" not found`);
    if (notification.userId !== userId)
      throw new ForbiddenException('This notification does not belong to you');

    notification.isRead = true;
    return this.notifications.save(notification);
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const result = await this.notifications.update({ userId, isRead: false }, { isRead: true });
    return { updated: result.affected ?? 0 };
  }
}
