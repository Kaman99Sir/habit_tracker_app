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
router.get('/', (req: AuthRequest, res: Response) => {
  const list = db.select().from(notifications)
    .where(eq(notifications.userId, req.userId!))
    .orderBy(desc(notifications.createdAt))
    .limit(50).all();
  return res.json(list);
});

// --- Settings ---
router.get('/settings', (req: AuthRequest, res: Response) => {
  let settings = db.select().from(notificationSettings).where(eq(notificationSettings.userId, req.userId!)).get();
  if (!settings) {
    db.insert(notificationSettings).values({ id: generateId(), userId: req.userId! }).run();
    settings = db.select().from(notificationSettings).where(eq(notificationSettings.userId, req.userId!)).get()!;
  }
  return res.json(settings);
});

router.patch('/settings', (req: AuthRequest, res: Response) => {
  const updates = req.body;
  db.update(notificationSettings).set({ ...updates, updatedAt: new Date().toISOString() })
    .where(eq(notificationSettings.userId, req.userId!)).run();
  
  const updated = db.select().from(notificationSettings).where(eq(notificationSettings.userId, req.userId!)).get();
  return res.json(updated);
});

// --- Mark Read/Dismiss/Acted ---
router.patch('/:id', (req: AuthRequest, res: Response) => {
  const id = req.params.id as string;
  const { status } = req.body; // 'read' | 'dismissed' | 'acted'
  
  db.update(notifications).set({ status })
    .where(and(eq(notifications.id, id), eq(notifications.userId, req.userId!))).run();
  
  return res.json({ ok: true });
});

// --- Save Web Push Subscription ---
router.post('/push-subscribe', (req: AuthRequest, res: Response) => {
  const subscription = req.body;
  if (!subscription || !subscription.endpoint) {
    return res.status(400).json({ error: 'Invalid subscription' });
  }

  // Upsert pattern
  const existing = db.select().from(pushSubscriptions).where(eq(pushSubscriptions.endpoint, subscription.endpoint)).get();
  if (!existing) {
    db.insert(pushSubscriptions).values({
      id: generateId(),
      userId: req.userId!,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys?.p256dh || '',
      auth: subscription.keys?.auth || '',
    }).run();
  } else if (existing.userId !== req.userId!) {
    db.update(pushSubscriptions).set({ userId: req.userId! }).where(eq(pushSubscriptions.endpoint, subscription.endpoint)).run();
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
