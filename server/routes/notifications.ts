import { Router, Request, Response } from 'express';
import { db } from '../db/index';
import { notifications, notificationSettings, pushSubscriptions } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { requireAuth, AuthRequest } from '../middleware/auth';
import { generateId } from '../utils';

const router = Router();
router.use(requireAuth);

// --- SSE Client Registry ---
type SSEClient = { id: string; userId: string; res: Response };
let clients: SSEClient[] = [];

export function pushToUser(userId: string, event: 'notification' | 'ping', data: any) {
  const userClients = clients.filter(c => c.userId === userId);
  userClients.forEach(c => {
    c.res.write(`event: ${event}\n`);
    c.res.write(`data: ${JSON.stringify(data)}\n\n`);
  });
}

// --- List Notifications ---
router.get('/', async (req: AuthRequest, res: Response) => {
  const list = await db.select().from(notifications)
    .where(eq(notifications.userId, req.userId!))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  return res.json(list);
});

// --- Settings ---
router.get('/settings', async (req: AuthRequest, res: Response) => {
  let settings = (await db.select().from(notificationSettings).where(eq(notificationSettings.userId, req.userId!)).limit(1))[0];
  if (!settings) {
    await db.insert(notificationSettings).values({ id: generateId(), userId: req.userId! });
    settings = (await db.select().from(notificationSettings).where(eq(notificationSettings.userId, req.userId!)).limit(1))[0]!;
  }
  return res.json(settings);
});

router.patch('/settings', async (req: AuthRequest, res: Response) => {
  const updates = req.body;
  await db.update(notificationSettings).set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(notificationSettings.userId, req.userId!));
  
  const updated = (await db.select().from(notificationSettings).where(eq(notificationSettings.userId, req.userId!)).limit(1))[0];
  return res.json(updated);
});

// --- Mark Read/Dismiss/Acted ---
router.patch('/:id', async (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body; // 'read' | 'dismissed' | 'acted'
  
  await db.update(notifications).set({ status })
    .where(and(eq(notifications.id, id), eq(notifications.userId, req.userId!)));
  
  return res.json({ ok: true });
});

// --- Save Web Push Subscription ---
router.post('/push-subscribe', async (req: AuthRequest, res: Response) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  // Upsert pattern
  const existing = (await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint)).limit(1))[0];
  if (!existing) {
    await db.insert(pushSubscriptions).values({
      id: generateId(),
      userId: req.userId!,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh || '',
      auth: subscription.keys?.auth || '',
    });
  } else if (existing.userId !== req.userId!) {
    await db.update(pushSubscriptions).set({ userId: req.userId! }).where(eq(pushSubscriptions.endpoint, subscription.endpoint));
  }

  return res.json({ ok: true });
});

// --- SSE Real-time Stream Endpoint ---
router.get('/stream', (req: AuthRequest, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const clientId = generateId();
  const userId = req.userId!;
  
  clients.push({ id: clientId, userId, res });
  console.log(`[SSE] Client connected: ${clientId} for user ${userId}`);

  // Send initial ping
  res.write(`event: ping\ndata: {"message": "connected"}\n\n`);

  // Keep-alive ping every 30s
  const interval = setInterval(() => {
    res.write(`event: ping\ndata: {"time": "${new Date().toISOString()}"}\n\n`);
  }, 30000);

  req.on('close', () => {
    console.log(`[SSE] Client disconnected: ${clientId}`);
    clearInterval(interval);
    clients = clients.filter(c => c.id !== clientId);
  });
});

export { router as notificationsRouter };
