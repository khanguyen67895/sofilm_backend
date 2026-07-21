import { registerAs } from '@nestjs/config';

export default registerAs('social', () => ({
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  facebook: {
    appId: process.env.FACEBOOK_CLIENT_ID,
    appSecret: process.env.FACEBOOK_CLIENT_SECRET,
  },
}));
