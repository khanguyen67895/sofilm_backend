import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '@app/auth';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';

@ApiTags('users')
@Controller('users')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Get (find-or-create) the current user profile' })
  me(@CurrentUser('sub') userId: string) {
    return this.profileService.findOrCreate(userId);
  }

  @ApiBearerAuth()
  @Patch('me')
  @ApiOperation({ summary: 'Update profile fields' })
  update(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto) {
    return this.profileService.update(userId, dto);
  }

  @ApiBearerAuth()
  @Patch('me/avatar')
  @ApiOperation({ summary: 'Update just the avatar URL' })
  updateAvatar(@CurrentUser('sub') userId: string, @Body() dto: UpdateAvatarDto) {
    return this.profileService.updateAvatar(userId, dto.avatarUrl);
  }

  @ApiBearerAuth()
  @Get('me/subscription')
  @ApiOperation({ summary: 'Current subscription tier + expiry' })
  getSubscription(@CurrentUser('sub') userId: string) {
    return this.profileService.getSubscription(userId);
  }

  @Public()
  @Patch('me/subscription')
  @ApiOperation({
    summary: "Sync a user's subscription tier — called by payment-service after a purchase",
  })
  updateSubscription(@Body() dto: UpdateSubscriptionDto) {
    // TODO: replace with a proper internal service-to-service auth mechanism (mTLS/shared secret) before production
    return this.profileService.updateSubscription(dto);
  }
}
