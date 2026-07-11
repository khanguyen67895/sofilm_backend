import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Settings } from '../entities/settings.entity';
import { NotificationSetting } from '../entities/notification-setting.entity';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';

@Module({
  imports: [TypeOrmModule.forFeature([Settings, NotificationSetting])],
  controllers: [SettingsController],
  providers: [SettingsService],
})
export class SettingsModule {}
