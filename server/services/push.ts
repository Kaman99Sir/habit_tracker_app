import webpush from 'web-push';
import { db } from '../db/index';
import { pushSubscriptions, NotificationSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

// Generated via: npx web-push generate-vapid-keys
// In a real app, these should be securely stored in .env
// We'll use mocked keys for development
const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY || 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDykcxXkheCP1xyZnZ_z3E0Z_x7h25lSxwH_G7C_aKIE';
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || 'vG_D8kP_yI8x-I2W_Tz-A_A_D0bA_hU_A0f-O_K_Pz8';

webpush.setVapidDetails(
  'mailto:support@habitual.app',
  VAPID_PUBLIC,
  VAPID_PRIVATE
);

export async function sendWebPush(userId: string, title: string, body: string, settings: NotificationSettings) {
  if (!settings.enablePush) return;

  const subs = db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId)).all();
  if (subs.length === 0) return;

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icon-192x192.png',
    badge: '/badge.png',
  });

  const promises = subs.map(sub => {
    const pushSubscription = {
      endpoint: sub.endpoint,
      keys: {
        p256dh: sub.p256dh,
        auth: sub.auth,
      }
    };

    return webpush.sendNotification(pushSubscription, payload).catch(err => {
      if (err.statusCode === 404 || err.statusCode === 410) {
        // Subscription has expired or is no longer valid
        console.log('[PUSH] Subscription expired, deleting', sub.endpoint);
        db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, sub.endpoint)).run();
      } else {
        console.error('[PUSH] Failed to send push', err);
      }
    });
  });

  await Promise.all(promises);
}
