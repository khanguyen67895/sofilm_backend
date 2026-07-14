import { Body, Controller, Delete, Get, Param, Post, UnauthorizedException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser, Public } from '@app/auth';
import type { JwtPayload } from '@app/auth';
import { AuthService } from './auth.service';
import { OtpService } from './otp.service';
import { SocialVerifierService } from './social-verifier.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { SocialLoginDto } from './dto/social-login.dto';
import { RequestOtpDto, VerifyOtpDto, RequestPhoneOtpDto, VerifyPhoneOtpDto } from './dto/otp.dto';
import { AuthProvider } from '../entities/user.entity';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly socialVerifier: SocialVerifierService,
  ) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Create a new local account' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login with email/password (optionally binding a device)' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('google')
  @ApiOperation({ summary: 'Login/register via Google ID token' })
  async google(@Body() dto: SocialLoginDto) {
    const profile = await this.socialVerifier.verify(AuthProvider.GOOGLE, dto.token);
    return this.authService.socialLogin(AuthProvider.GOOGLE, profile, dto.deviceId);
  }

  @Public()
  @Post('facebook')
  @ApiOperation({ summary: 'Login/register via Facebook access token' })
  async facebook(@Body() dto: SocialLoginDto) {
    const profile = await this.socialVerifier.verify(AuthProvider.FACEBOOK, dto.token);
    return this.authService.socialLogin(AuthProvider.FACEBOOK, profile, dto.deviceId);
  }

  @Public()
  @Post('apple')
  @ApiOperation({ summary: 'Login/register via Sign in with Apple identity token' })
  async apple(@Body() dto: SocialLoginDto) {
    const profile = await this.socialVerifier.verify(AuthProvider.APPLE, dto.token);
    return this.authService.socialLogin(AuthProvider.APPLE, profile, dto.deviceId);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Rotate an access/refresh token pair' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @ApiOperation({ summary: 'Revoke a refresh token' })
  logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @Public()
  @Post('otp/request')
  @ApiOperation({
    summary: 'Request a one-time password for email verification / passwordless flows',
  })
  requestOtp(@Body() dto: RequestOtpDto) {
    return this.otpService.generate(dto.email);
  }

  @Public()
  @Post('otp/verify')
  @ApiOperation({ summary: 'Verify a one-time password' })
  verifyOtp(@Body() dto: VerifyOtpDto) {
    return this.otpService.verify(dto.email, dto.code);
  }

  @Public()
  @Post('otp/phone/request')
  @ApiOperation({ summary: 'Send an OTP to a phone number for the passwordless login flow' })
  async requestPhoneOtp(@Body() dto: RequestPhoneOtpDto) {
    await this.otpService.generate(dto.phone);
    return { message: 'OTP sent' };
  }

  @Public()
  @Post('otp/phone/verify')
  @ApiOperation({
    summary: 'Verify a phone OTP and log in — auto-registers the account on first verify',
  })
  async verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto) {
    const valid = await this.otpService.verify(dto.phone, dto.code);
    if (!valid) throw new UnauthorizedException('Invalid or expired code');
    return this.authService.loginWithPhone(dto.phone, dto.deviceId);
  }

  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Return the identity encoded in the current access token' })
  me(@CurrentUser() user: JwtPayload) {
    return user;
  }

  @ApiBearerAuth()
  @Get('devices')
  @ApiOperation({ summary: "List the current user's logged-in devices" })
  listDevices(@CurrentUser('sub') userId: string) {
    return this.authService.listDevices(userId);
  }

  @ApiBearerAuth()
  @Delete('devices/:deviceId')
  @ApiOperation({ summary: 'Revoke a device session (and its refresh tokens)' })
  revokeDevice(@CurrentUser('sub') userId: string, @Param('deviceId') deviceId: string) {
    return this.authService.revokeDevice(userId, deviceId);
  }
}
