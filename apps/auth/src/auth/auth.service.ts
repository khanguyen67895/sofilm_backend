import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from '@app/auth';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';
import { User, AuthProvider } from '../entities/user.entity';
import { Role } from '../entities/role.entity';
import { Device, DevicePlatform } from '../entities/device.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { SocialProfile } from './social-verifier.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface DeviceInfo {
  deviceId?: string;
  deviceName?: string;
  platform?: DevicePlatform;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Role) private readonly roles: Repository<Role>,
    @InjectRepository(Device) private readonly devices: Repository<Device>,
    @InjectRepository(RefreshToken) private readonly refreshTokens: Repository<RefreshToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.users.findOne({
      where: [{ email: dto.email }, { username: dto.username }, { phone: dto.phone }],
    });
    if (existing) {
      if (existing.email === dto.email) throw new ConflictException('Email already registered');
      if (existing.username === dto.username) throw new ConflictException('Username already taken');
      throw new ConflictException('Phone number already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const defaultRole = await this.getOrCreateRole('USER');

    const user = await this.users.save(
      this.users.create({
        email: dto.email,
        username: dto.username,
        phone: dto.phone,
        name: dto.name?.trim() || dto.username,
        passwordHash,
        provider: AuthProvider.LOCAL,
        roles: [defaultRole],
      }),
    );

    return this.issueSession(user);
  }

  async login(dto: LoginDto) {
    const user = await this.users.findOne({
      where: [{ email: dto.email }, { username: dto.email }],
      select: ['id', 'email', 'username', 'name', 'passwordHash', 'isActive'],
      relations: ['roles'],
    });
    if (!user?.passwordHash || !user.isActive)
      throw new UnauthorizedException('Invalid credentials');

    const matches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!matches) throw new UnauthorizedException('Invalid credentials');

    return this.issueSession(user, {
      deviceId: dto.deviceId,
      deviceName: dto.deviceName,
      platform: dto.platform,
    });
  }

  /** Called after OtpService.verify() succeeds — auto-registers on first login, matching the "phone + OTP only, no separate signup screen" flow. */
  async loginWithPhone(phone: string, deviceId?: string) {
    let user = await this.users.findOne({ where: { phone }, relations: ['roles'] });

    if (!user) {
      const defaultRole = await this.getOrCreateRole('USER');
      user = await this.users.save(
        this.users.create({
          phone,
          name: phone,
          provider: AuthProvider.LOCAL,
          roles: [defaultRole],
        }),
      );
    }

    return this.issueSession(user, { deviceId });
  }

  async socialLogin(provider: AuthProvider, profile: SocialProfile, deviceId?: string) {
    let user = await this.users.findOne({
      where: { email: profile.email },
      relations: ['roles'],
    });

    if (!user) {
      const defaultRole = await this.getOrCreateRole('USER');
      user = await this.users.save(
        this.users.create({
          email: profile.email,
          name: profile.name,
          avatar: profile.avatar,
          provider,
          providerId: profile.providerId,
          isEmailVerified: true,
          roles: [defaultRole],
        }),
      );
    }

    return this.issueSession(user, { deviceId });
  }

  async refresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    const tokenHash = this.hashToken(refreshToken);

    const stored = await this.refreshTokens.findOne({
      where: { tokenHash },
      relations: ['user', 'device'],
    });
    if (!stored || stored.revoked || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired or revoked');
    }

    stored.revoked = true;
    await this.refreshTokens.save(stored);

    const user = await this.users.findOne({ where: { id: payload.sub }, relations: ['roles'] });
    if (!user) throw new UnauthorizedException('User no longer exists');

    return this.issueSession(user, undefined, stored.device);
  }

  async logout(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.refreshTokens.update({ tokenHash }, { revoked: true });
  }

  async listDevices(userId: string) {
    return this.devices.find({ where: { user: { id: userId } } });
  }

  async revokeDevice(userId: string, deviceId: string) {
    const device = await this.devices.findOne({ where: { id: deviceId, user: { id: userId } } });
    if (!device) return;
    await this.refreshTokens.update({ device: { id: device.id } }, { revoked: true });
    await this.devices.remove(device);
  }

  // ── internals ──────────────────────────────────────────────────────────

  private async issueSession(
    user: User,
    deviceInfo?: DeviceInfo,
    existingDevice?: Device,
  ): Promise<{ user: Omit<Partial<User>, 'roles'> & { roles: string[] } } & TokenPair> {
    const roles = user.roles?.map((r) => r.name) ?? ['USER'];
    const payload: JwtPayload = { sub: user.id, email: user.email, roles };

    const device = existingDevice ?? (await this.upsertDevice(user, deviceInfo));

    const accessToken = await this.jwt.signAsync(payload);
    const refreshToken = await this.jwt.signAsync(
      { ...payload, deviceId: device?.deviceId },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
      },
    );

    await this.refreshTokens.save(
      this.refreshTokens.create({
        user,
        device: device ?? undefined,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: this.addDuration(this.config.get<string>('jwt.refreshExpiresIn') ?? '30d'),
      }),
    );

    const { passwordHash: _passwordHash, ...safeUser } = user;
    return { user: { ...safeUser, roles }, accessToken, refreshToken };
  }

  private async upsertDevice(user: User, info?: DeviceInfo): Promise<Device | undefined> {
    if (!info?.deviceId) return undefined;

    let device = await this.devices.findOne({
      where: { user: { id: user.id }, deviceId: info.deviceId },
    });

    if (!device) {
      device = this.devices.create({
        user,
        deviceId: info.deviceId,
        deviceName: info.deviceName,
        platform: info.platform ?? DevicePlatform.WEB,
      });
    }
    device.lastActiveAt = new Date();
    return this.devices.save(device);
  }

  private async getOrCreateRole(name: string): Promise<Role> {
    let role = await this.roles.findOne({ where: { name } });
    if (!role) role = await this.roles.save(this.roles.create({ name, permissions: [] }));
    return role;
  }

  private async verifyRefreshToken(token: string): Promise<JwtPayload> {
    try {
      return await this.jwt.verifyAsync<JwtPayload>(token, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private addDuration(duration: string): Date {
    const match = /^(\d+)([smhd])$/.exec(duration);
    const now = new Date();
    if (!match) return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    const value = parseInt(match[1], 10);
    const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[match[2]] ?? 86_400_000;
    return new Date(now.getTime() + value * unitMs);
  }
}
