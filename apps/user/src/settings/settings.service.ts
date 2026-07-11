import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '../entities/settings.entity';
import { NotificationSetting } from '../entities/notification-setting.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings) private readonly settings: Repository<Settings>,
    @InjectRepository(NotificationSetting)
    private readonly notificationSettings: Repository<NotificationSetting>,
  ) {}

  async findOrCreate(userId: string): Promise<Settings> {
    let settings = await this.settings.findOne({ where: { userId } });
    if (!settings) {
      settings = await this.settings.save(this.settings.create({ userId }));
    }
    return settings;
  }

  async update(userId: string, dto: UpdateSettingsDto): Promise<Settings> {
    const settings = await this.findOrCreate(userId);
    Object.assign(settings, dto);
    return this.settings.save(settings);
  }

  async findOrCreateNotificationSettings(userId: string): Promise<NotificationSetting> {
    let notificationSettings = await this.notificationSettings.findOne({ where: { userId } });
    if (!notificationSettings) {
      notificationSettings = await this.notificationSettings.save(
        this.notificationSettings.create({ userId }),
      );
    }
    return notificationSettings;
  }

  async updateNotificationSettings(
    userId: string,
    dto: UpdateNotificationSettingsDto,
  ): Promise<NotificationSetting> {
    const notificationSettings = await this.findOrCreateNotificationSettings(userId);
    Object.assign(notificationSettings, dto);
    return this.notificationSettings.save(notificationSettings);
  }
}
