import { HttpService } from '@nestjs/axios';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AuthProvider } from '../entities/user.entity';

export interface SocialProfile {
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
}

interface GoogleTokenInfo {
  aud: string;
}

interface GoogleUserInfo {
  sub: string;
  email?: string;
  name?: string;
  picture?: string;
}

interface FacebookDebugTokenResponse {
  data: { app_id: string; is_valid: boolean };
}

interface FacebookProfile {
  id: string;
  name: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

/**
 * Verifies a provider-issued OAuth *access token* (both the Google Identity
 * Services token client and the Facebook JS SDK's FB.login() hand the
 * frontend an access token, not an id_token) and extracts the identity from
 * it. Both providers follow the same shape: first confirm the token was
 * actually minted for THIS app — a valid-but-foreign token (issued to some
 * unrelated Google/Facebook app the caller happens to hold) must not be
 * accepted — then fetch the profile. Apple isn't implemented yet (Sign in
 * with Apple uses a signed id_token instead, a different verification
 * shape — needs `apple-signin-auth`).
 */
@Injectable()
export class SocialVerifierService {
  private readonly logger = new Logger(SocialVerifierService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  async verify(provider: AuthProvider, token: string): Promise<SocialProfile> {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return this.verifyGoogle(token);
      case AuthProvider.FACEBOOK:
        return this.verifyFacebook(token);
      case AuthProvider.APPLE:
        throw new UnauthorizedException('Apple login is not supported yet');
      default:
        throw new UnauthorizedException('Unsupported provider');
    }
  }

  private async verifyGoogle(token: string): Promise<SocialProfile> {
    const clientId = this.config.get<string>('social.google.clientId');

    try {
      const { data: tokenInfo } = await firstValueFrom(
        this.http.get<GoogleTokenInfo>('https://oauth2.googleapis.com/tokeninfo', {
          params: { access_token: token },
        }),
      );
      if (clientId && tokenInfo.aud !== clientId) {
        throw new Error('token was not issued for this app');
      }

      const { data: profile } = await firstValueFrom(
        this.http.get<GoogleUserInfo>('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      );
      if (!profile.email) throw new Error('Google profile has no email');

      return {
        providerId: profile.sub,
        email: profile.email,
        name: profile.name?.trim() || profile.email.split('@')[0],
        avatar: profile.picture,
      };
    } catch (err) {
      this.logger.warn(`Google token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid Google token');
    }
  }

  private async verifyFacebook(token: string): Promise<SocialProfile> {
    const appId = this.config.get<string>('social.facebook.appId');
    const appSecret = this.config.get<string>('social.facebook.appSecret');

    try {
      if (appId && appSecret) {
        const { data: debug } = await firstValueFrom(
          this.http.get<FacebookDebugTokenResponse>('https://graph.facebook.com/debug_token', {
            params: { input_token: token, access_token: `${appId}|${appSecret}` },
          }),
        );
        if (!debug.data.is_valid || debug.data.app_id !== appId) {
          throw new Error('token invalid or was not issued for this app');
        }
      }

      const { data: profile } = await firstValueFrom(
        this.http.get<FacebookProfile>('https://graph.facebook.com/me', {
          params: { fields: 'id,name,email,picture', access_token: token },
        }),
      );
      if (!profile.email) {
        throw new Error('Facebook account has no email permission granted');
      }

      return {
        providerId: profile.id,
        email: profile.email,
        name: profile.name,
        avatar: profile.picture?.data?.url,
      };
    } catch (err) {
      this.logger.warn(`Facebook token verification failed: ${(err as Error).message}`);
      throw new UnauthorizedException('Invalid Facebook token');
    }
  }
}
