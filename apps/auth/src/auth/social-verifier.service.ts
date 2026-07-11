import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthProvider } from '../entities/user.entity';

export interface SocialProfile {
  providerId: string;
  email: string;
  name: string;
  avatar?: string;
}

/**
 * Verifies a provider-issued token and extracts the identity from it.
 *
 * STUB: real integrations belong here — `google-auth-library` for Google,
 * a Facebook Graph API `/me` call for Facebook, and `apple-signin-auth` for
 * Apple. Wire the real SDKs behind these same method signatures; nothing
 * else in AuthService needs to change.
 */
@Injectable()
export class SocialVerifierService {
  async verify(provider: AuthProvider, token: string): Promise<SocialProfile> {
    switch (provider) {
      case AuthProvider.GOOGLE:
        return this.verifyGoogle(token);
      case AuthProvider.FACEBOOK:
        return this.verifyFacebook(token);
      case AuthProvider.APPLE:
        return this.verifyApple(token);
      default:
        throw new UnauthorizedException('Unsupported provider');
    }
  }

  private async verifyGoogle(token: string): Promise<SocialProfile> {
    // TODO: const ticket = await googleClient.verifyIdToken({ idToken: token, audience: ... });
    return this.decodeStubToken(token, AuthProvider.GOOGLE);
  }

  private async verifyFacebook(token: string): Promise<SocialProfile> {
    // TODO: const { data } = await httpService.get(`https://graph.facebook.com/me?access_token=${token}`);
    return this.decodeStubToken(token, AuthProvider.FACEBOOK);
  }

  private async verifyApple(token: string): Promise<SocialProfile> {
    // TODO: const claims = await appleSignin.verifyIdToken(token, { clientId: ... });
    return this.decodeStubToken(token, AuthProvider.APPLE);
  }

  /** Dev-only stand-in: expects `token` to be a JSON string like {"email","name"}. */
  private decodeStubToken(token: string, provider: AuthProvider): SocialProfile {
    try {
      const parsed = JSON.parse(token);
      if (!parsed.email) throw new Error('missing email');
      return {
        providerId: parsed.sub ?? parsed.email,
        email: parsed.email,
        name: parsed.name ?? parsed.email.split('@')[0],
        avatar: parsed.avatar,
      };
    } catch {
      throw new UnauthorizedException(`Invalid ${provider} token`);
    }
  }
}
