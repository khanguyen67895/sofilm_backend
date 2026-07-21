import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Permission } from '../entities/permission.entity';
import { Device } from '../entities/device.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OtpService } from './otp.service';
import { SocialVerifierService } from './social-verifier.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Role, Permission, Device, RefreshToken]),
    HttpModule.register({ timeout: 8000 }),
  ],
  controllers: [AuthController],
  providers: [AuthService, OtpService, SocialVerifierService],
})
export class AuthModule {}
