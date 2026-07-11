import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@app/auth';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { UpdateNotificationSettingsDto } from './dto/update-notification-settings.dto';

@ApiTags('settings')
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @ApiBearerAuth()
  @Get()
  @ApiOperation({ summary: 'Get (find-or-create) app settings' })
  get(@CurrentUser('sub') userId: string) {
    return this.settingsService.findOrCreate(userId);
  }

  @ApiBearerAuth()
  @Patch()
  @ApiOperation({ summary: 'Update theme/language/autoplay' })
  update(@CurrentUser('sub') userId: string, @Body() dto: UpdateSettingsDto) {
    return this.settingsService.update(userId, dto);
  }

  @ApiBearerAuth()
  @Get('notifications')
  @ApiOperation({ summary: 'Get (find-or-create) notification channel settings' })
  getNotifications(@CurrentUser('sub') userId: string) {
    return this.settingsService.findOrCreateNotificationSettings(userId);
  }

  @ApiBearerAuth()
  @Patch('notifications')
  @ApiOperation({ summary: 'Update notification channel toggles' })
  updateNotifications(
    @CurrentUser('sub') userId: string,
    @Body() dto: UpdateNotificationSettingsDto,
  ) {
    return this.settingsService.updateNotificationSettings(userId, dto);
  }
}
