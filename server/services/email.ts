import nodemailer from 'nodemailer';
import { NotificationSettings, User } from '../db/schema';
import { db } from '../db/index';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';

// Setup transport. In dev, we can use ethereal or mock it.
// To use real email, set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'test',
    pass: process.env.SMTP_PASS || 'test',
  },
});

export async function sendEmailNotification(userId: string, subject: string, message: string, settings: NotificationSettings) {
  if (!settings.enableEmail) return;

  const user = (await db.select().from(users).where(eq(users.id, userId)).limit(1))[0];
  if (!user) return;

  try {
    const info = await transport.sendMail({
      from: '"Habitual" <hello@habitual.app>',
      to: user.email,
      subject,
      text: message,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #1DB87E;">Habitual</h2>
          <p style="font-size: 16px; color: #333;">Hi ${user.name},</p>
          <p style="font-size: 16px; color: #333;">${message}</p>
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
            <p>You received this because you have email notifications enabled in Habitual.</p>
          </div>
        </div>
      `,
    });
    console.log(`[EMAIL] Sent to ${user.email} (Message ID: ${info.messageId})`);
    
    if (process.env.SMTP_HOST === undefined) {
      console.log(`[EMAIL DEV] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
  } catch (err) {
    if (process.env.SMTP_USER === 'test') {
      console.log(`[EMAIL MOCK] Would have sent email to ${user.email}: ${subject}`);
    } else {
      console.error('[EMAIL ERROR]', err);
    }
  }
}
