// server.js - Transparent Proxy FINAL STABLE
// Render / Node 25 / 壊れた middleware 全対応

const express = require('express');
const compression = require('compression');
const path = require('path');

// ================================
// 設定
// ================================
const config = require('./config/default');

// ================================
// 絶対に落ちない middleware ローダー
// ================================
function safeMiddleware(mod, name) {
  // そのまま関数
  if (typeof mod === 'function') {
    console.log(`✅ ${name}: function`);
    return mod;
  }

  // よくある export パターン
  if (mod?.default && typeof mod.default === 'function') {
    console.log(`✅ ${name}: default function`);
    return mod.default;
  }

  if (mod?.middleware && typeof mod.middleware === 'function') {
    console.log(`✅ ${name}: middleware()`);
    return mod.middleware;
  }

  if (mod?.handler && typeof mod.handler === 'function') {
    console.log(`✅ ${name}: handler()`);
    return mod.handler;
  }

  // rateLimit みたいに既に middleware 化されてるやつ
  if (typeof mod === 'object') {
    for (const v of Object.values(mod)) {
      if (typeof v === 'function') {
        console.log(`⚠️ ${name}: picked first function`);
        return v;
      }
    }
  }

  // ❗ 最終防衛ライン：何もしない middleware
  console.warn(`⚠️ ${name}: INVALID → replaced with noop`);
  return (req, res, next) => next();
}

// ================================
// 読み込み
// ================================
const proxyHandler = require('./proxy/handler');

const corsMiddleware = safeMiddleware(
  require('./middleware/cors'),
  'cors'
);

const securityMiddleware = safeMiddleware(
  require('./middleware/security'),
  'security'
);

const loggerMiddleware = safeMiddleware(
  require('./middleware/logger'),
  'logger'
);

const rateLimitModule = require('./middleware/rateLimit');
const rateLimiter = safeMiddleware(
  rateLimitModule.defaultLimiter || rateLimitModule,
  'rateLimit'
);

// ================================
// Express
// ================================
const app = express();

// ================================
// middleware
// ================================
if (config.performance?.compression) {
  app.use(compression());
}

app.use(express.json({ limit: `${config.proxy.maxRequestSize || 10}mb` }));
app.use(express.urlencoded({ extended: true }));

app.use(loggerMiddleware);
app.use(securityMiddleware);

if (config.security?.corsEnabled) {
  app.use(corsMiddleware);
}

if (config.rateLimit?.enabled) {
  app.use('/proxy', rateLimiter);
}

// ================================
// static
// ================================
app.use(express.static(path.join(__dirname, 'public')));

// ================================
// routes
// ================================
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    version: 'FINAL'
  });
});

app.all('/proxy/:encodedUrl(*)', async (req, res) => {
  try {
    await proxyHandler(req, res, config);
  } catch (err) {
    console.error('❌ Proxy error:', err);
    res.status(500).json({ error: 'Proxy error', message: err.message });
  }
});

// ================================
// errors
// ================================
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// ================================
// start
// ================================
const PORT = process.env.PORT || config.server?.port || 3000;

app.listen(PORT, '0.0.0.0', () => {
  console.log('========================================');
  console.log('🚀 Transparent Proxy STARTED');
  console.log(`🌐 PORT: ${PORT}`);
  console.log('========================================');
});

module.exports = app;
