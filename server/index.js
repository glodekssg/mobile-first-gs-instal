import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import './db/index.js';

import authRoutes from './routes/auth.js';
import coopRoutes from './routes/cooperatives.js';
import buildingsRoutes from './routes/buildings.js';
import apartmentsRoutes from './routes/apartments.js';
import chimneysRoutes from './routes/chimneys.js';
import visitsRoutes from './routes/visits.js';
import protocolsRoutes from './routes/protocols.js';
import offersRoutes from './routes/offers.js';
import nbaRoutes from './routes/nba.js';
import automationRoutes from './routes/automation.js';
import issuesRoutes from './routes/issues.js';
import calendarRoutes from './routes/calendar.js';
import prospectRoutes from './routes/prospect.js';
import leadsRoutes from './routes/leads.js';
import adminRoutes from './routes/admin.js';
import cmsRoutes from './routes/cms.js';
import magicRoutes from './routes/magic.js';

import { runAutomation } from './services/automation.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

app.use('/api/auth', authRoutes);
app.use('/api/cooperatives', coopRoutes);
app.use('/api/buildings', buildingsRoutes);
app.use('/api/apartments', apartmentsRoutes);
app.use('/api/chimneys', chimneysRoutes);
app.use('/api/visits', visitsRoutes);
app.use('/api/protocols', protocolsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/nba', nbaRoutes);
app.use('/api/automation', automationRoutes);
app.use('/api/issues', issuesRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/prospect', prospectRoutes);
app.use('/api/leads', leadsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cms', cmsRoutes);
app.use('/api/magic-links', magicRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// Cron — codziennie o 7:00 uruchamia automatyzację
cron.schedule('0 7 * * *', () => {
  console.log('[cron] running automation');
  runAutomation();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`[api] http://localhost:${PORT}`));
