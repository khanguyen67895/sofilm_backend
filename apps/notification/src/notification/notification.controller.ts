import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Roles } from '@app/auth';
import { PaginationQueryDto } from '@app/common';
import { NotificationService } from './notification.service';
import { SendNotificationDto } from './dto/send-notification.dto';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // TODO: in a real system this would be called service-to-service with internal auth,
  // not a user-facing admin role. Treated as an admin/internal endpoint for now.
  @Roles('ADMIN')
  @Post('send')
  @ApiOperation({ summary: 'Trigger a notification (email/push/sms/in-app) for a user' })
  send(@Body() dto: SendNotificationDto) {
    return this.notificationService.send(dto);
  }

  @Get()
  @ApiOperation({ summary: "List the current user's notifications (newest first)" })
  findMine(@CurrentUser('sub') userId: string, @Query() query: PaginationQueryDto) {
    return this.notificationService.findForUser(userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a single notification as read' })
  markRead(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.notificationService.markRead(id, userId);
  }

  @Patch('read-all')
  @ApiOperation({ summary: "Mark all of the current user's unread notifications as read" })
  markAllRead(@CurrentUser('sub') userId: string) {
    return this.notificationService.markAllRead(userId);
  }
}
