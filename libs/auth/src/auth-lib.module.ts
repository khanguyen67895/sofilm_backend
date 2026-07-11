import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from './guards/roles.guard';

/**
 * Shared JWT *verification* building blocks — used by the gateway and every
 * downstream service to authenticate requests. Token *issuance* (login,
 * refresh, bcrypt password hashing) lives in apps/auth, not here.
 */
@Global()
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('jwt.accessSecret'),
        signOptions: { expiresIn: config.get<string>('jwt.accessExpiresIn') },
      }),
    }),
  ],
  providers: [JwtStrategy, RolesGuard],
  exports: [JwtModule, PassportModule, RolesGuard],
})
export class AuthLibModule {}
