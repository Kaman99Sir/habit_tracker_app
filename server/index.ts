import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { runMigrations } from './db/index';
import { authRouter } from './routes/auth';
import { habitsRouter } from './routes/habits';
import { notificationsRouter } from './routes/notifications';
import { startScheduler } from './scheduler/index';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Init DB
runMigrations().catch(err => {
  console.error('Failed to run database migrations:', err);
  process.exit(1);
});

// Routes
app.use('/api/auth', authRouter);
app.use('/api/habits', habitsRouter);
app.use('/api/notifications', notificationsRouter);

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  
  // Notice we step out of server/ back to root dist/
  const clientDist = path.resolve(__dirname, '../dist');
  app.use(express.static(clientDist));

  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Habitual backend running on http://localhost:${PORT}`);
  startScheduler();
});
