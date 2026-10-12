import 'dotenv/config';
import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { createAdminCmsRouter } from './server/routes/adminCms';
import { createPublicCmsRouter } from './server/routes/publicCms';
import { createGoogleOAuthRouter } from './server/routes/googleOAuth';
import { createSeoPublicRouter, injectSeo, redirectMiddleware } from './server/routes/seoPublic';
import { loadSnapshot } from './server/cms/store';
import { pruneAnalytics } from './server/cms/analyticsStore';
import { closeDb } from './server/db/client';
import { checkAiRateLimit, recordAiUsage } from './server/aiLimits';
import { PEXEN_SYSTEM_INSTRUCTION } from './server/aiPrompt';
import { apiErrorHandler } from './server/http';

const __dirname = path.dirname(fileURLToPath(import.meta.url));



async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  await loadSnapshot();

  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    if (req.path.startsWith('/administrator') || req.path.startsWith('/api/admin')) {
      res.setHeader('X-Frame-Options', 'DENY');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });
  app.use('/api/admin/media/upload', express.json({ limit: '22mb' }));
  app.use(express.json({ limit: '1mb' }));
  app.use(redirectMiddleware);

  app.use('/uploads', express.static(path.resolve(__dirname, 'public/uploads'), { maxAge: '30d', immutable: true }));
  app.use(express.static(path.resolve(__dirname, 'public'), { index: false }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = apiKey
    ? new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  })
    : null;

  app.use('/api/public', createPublicCmsRouter());
  app.use('/api/admin/google', createGoogleOAuthRouter());
  app.use('/api/admin', createAdminCmsRouter());
  app.use(createSeoPublicRouter());

  // AI Chat endpoint trained strictly on PEXEN
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const snap = await loadSnapshot();
      if (!snap.ai.enabled) {
        return res.status(503).json({ error: 'Assistant IA désactivé' });
      }
      if (!ai || !apiKey) {
        return res.status(503).json({ error: 'Clé GEMINI_API_KEY non configurée' });
      }
      const { prompt, history } = req.body;
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Prompt manquant' });
      }
      if (prompt.length > 2000) {
        return res.status(400).json({ error: 'Message trop long (2000 caractères max)' });
      }
      const turns: { role?: string; parts?: { text?: string }[] }[] = Array.isArray(history) ? history.slice(-40) : [];
      const userTurns = turns.filter((h) => h.role === 'user').length;
      if (userTurns >= snap.ai.maxMessagesPerSession) {
        return res.status(429).json({ error: 'Limite de messages atteinte pour cette conversation. Contactez-nous directement.' });
      }
      const limit = checkAiRateLimit(req.ip || 'unknown', snap.ai, turns.length === 0);
      if (!limit.ok) {
        return res.status(429).json({ error: limit.reason });
      }

      const contents = turns.map((item) => ({
        role: item.role === 'user' ? 'user' : 'model',
        parts: [{ text: String(item.parts?.[0]?.text || '').slice(0, 4000) }],
      }));
      contents.push({ role: 'user', parts: [{ text: prompt }] });

      const response = await ai.models.generateContent({
        model: snap.ai.model || 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction: snap.ai.systemInstructionOverride?.trim() || PEXEN_SYSTEM_INSTRUCTION,
          temperature: snap.ai.temperature ?? 0.3,
        },
      });
      recordAiUsage(response.usageMetadata?.totalTokenCount ?? Math.ceil((prompt.length + (response.text?.length || 0)) / 4));

      return res.json({ reply: response.text });
    } catch (error: any) {
      console.error('Erreur Gemini API:', error);
      return res.status(500).json({ error: 'L\'assistant est momentanément indisponible.' });
    }
  });

  app.use('/api', (_req, res) => res.status(404).json({ error: 'Route API inconnue' }));
  app.use('/api', apiErrorHandler);

  const isAdminPath = (p: string) => p === '/administrator' || p.startsWith('/administrator/');

  if (process.env.NODE_ENV === 'production') {
    const distDir = path.resolve(__dirname, 'dist');
    const indexHtml = await fs.readFile(path.join(distDir, 'index.html'), 'utf-8');
    app.use('/assets', express.static(path.join(distDir, 'assets'), { maxAge: '1y', immutable: true }));
    app.use(express.static(distDir, { index: false }));
    app.get('*', async (req, res) => {
      if (isAdminPath(req.path)) {
        res.setHeader('Cache-Control', 'no-store');
        return res.sendFile(path.join(distDir, 'administrator.html'));
      }
      res.setHeader('Cache-Control', 'no-cache');
      res.type('html').send(await injectSeo(indexHtml, req.path));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
    });
    app.use(vite.middlewares);
    app.get('*', async (req, res, next) => {
      try {
        const admin = isAdminPath(req.path);
        const raw = await fs.readFile(path.resolve(__dirname, admin ? 'administrator.html' : 'index.html'), 'utf-8');
        const html = await vite.transformIndexHtml(req.originalUrl, raw);
        res.status(200).type('html').send(admin ? html : await injectSeo(html, req.path));
      } catch (e) {
        next(e);
      }
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`Serveur PEXEN démarré sur http://0.0.0.0:${PORT}`);
  });

  const prune = () =>
    pruneAnalytics()
      .then((n) => n && console.log(`[analytics] ${n} événements purgés (rétention dépassée)`))
      .catch((e) => console.error('[analytics] purge impossible', e));
  void prune();
  const pruneTimer = setInterval(prune, 24 * 3600 * 1000);
  pruneTimer.unref();

  const shutdown = (signal: string) => {
    console.log(`[server] ${signal} reçu, arrêt en cours`);
    clearInterval(pruneTimer);
    server.close(() => {
      closeDb().finally(() => process.exit(0));
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.once('SIGINT', () => shutdown('SIGINT'));
  process.once('SIGTERM', () => shutdown('SIGTERM'));
}

startServer().catch((e) => {
  console.error('[server] démarrage impossible', e);
  process.exit(1);
});
