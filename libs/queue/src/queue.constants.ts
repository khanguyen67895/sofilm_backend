export const QUEUE_NAMES = {
  VIDEO_TRANSCODE: 'video-transcode',
  NOTIFICATION: 'notification',
} as const;

export const VIDEO_TRANSCODE_JOBS = {
  PROCESS: 'process-video',
} as const;

export const NOTIFICATION_JOBS = {
  SEND_EMAIL: 'send-email',
  SEND_PUSH: 'send-push',
  SEND_SMS: 'send-sms',
} as const;
