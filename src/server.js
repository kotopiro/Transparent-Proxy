// server.js - Transparent Proxy v2.1.1
// Render完全対応・全middleware自動解決版

const express = require('express');
const compression = require('compression');
const path = require('path');

// ================================
// 設定
// ================================
const config = require('./config/default');

// ================================
// middleware 読み込み（安全ラッパー）
// ================================
function loadMiddleware(mod) {
  if (typeof mod === 'function') return mod;
  if (mod?.middleware && typeof mod.middleware === 'function') return mod.middleware;
  if (mod?.default && typeof mod.default === 'function') return mod.default;
  throw new Error('Invalid middleware export');
}

const proxyHandler = require('./proxy/handler');

const corsMiddleware = loadMiddleware(require('./middleware/cors'));
const securityMiddleware = loadMiddleware(require('./middleware/security'));
const loggerMiddleware = loadMiddleware(require('./middleware/logger'));

const { defaultLimiter } = require('./middleware/rateLimit');

// ================================
// Express 初期化
// ================================
const app = express();

// ================================
// 基本 middleware
// ================================
if (config.performance?.compression) {
  app.use(compression());
}

app.use(express.json({ limit: `${config.proxy.maxRequestSize}mb` }));
app.use(express.urlencoded({ extended: true }));

app.use(loggerMiddleware);
app.use(securityMiddleware);

if (config.security?.corsEnabled) {
  app.use(corsMiddleware);
}

if (config.rateLimit?.enabled) {
  app.use('/proxy', defaultLimiter);
}

// ================================
// 静的ファイル
// ================================
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1d'
  })
);

// ================================
// Routes
// ================================
app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: '2.1.1'
  });
});

app.all('/proxy/:encodedUrl(*)', async (req, res) => {
  try {
    await proxyHandler(req, res, config);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Proxy Error', message: e.message });
  }
});

// ================================
// Error handlers
// ================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ================================
// Start
// ================================
const PORT = config.server.port || process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log(`🚀 Transparent Proxy running on ${PORT}`);
});

module.exports = app;
