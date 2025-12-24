// server.js - Transparent Proxy v2.1.0
// 完全統合版 - Render対応修正版

const express = require('express');
const compression = require('compression');
const path = require('path');

// ===== 設定読み込み（★修正済み）=====
const config = require('./config/default');

// ===== モジュール読み込み（★修正済み）=====
const proxyHandler = require('./proxy/handler');
const corsMiddleware = require('./middleware/cors');
const securityMiddleware = require('./middleware/security');
const loggerMiddleware = require('./middleware/logger');
const rateLimitMiddleware = require('./middleware/rateLimit');

// Express初期化
const app = express();

// ========== ミドルウェア設定 ==========

// 圧縮
if (config.performance?.compression) {
  app.use(compression({ level: config.performance.compressionLevel || 6 }));
}

// ボディパース
app.use(express.json({ limit: `${config.proxy?.maxRequestSize || 10}mb` }));
app.use(express.urlencoded({
  extended: true,
  limit: `${config.proxy?.maxRequestSize || 10}mb`
}));

// ロギング
app.use(loggerMiddleware);

// セキュリティ
app.use(securityMiddleware);

// CORS
if (config.security?.corsEnabled) {
  app.use(corsMiddleware);
}

// レート制限
if (config.rateLimit?.enabled) {
  app.use('/proxy', rateLimitMiddleware);
}

// 静的ファイル
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
  })
);

// ========== ルート ==========

// ヘルスチェック（Renderがポート検出できるよう / も用意）
app.get('/', (req, res) => {
  res.send('Transparent Proxy running ✅');
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 公開設定
app.get('/api/config', (req, res) => {
  res.json({
    version: '2.1.0',
    features: config.features,
    ui: config.ui,
    adblock: { enabled: config.adblock?.enabled },
    captcha: { enabled: config.captcha?.enabled },
    urlEncoding: {
      enabled: config.urlEncoding?.enabled,
      type: config.urlEncoding?.type
    }
  });
});

// プロキシ
app.all('/proxy/:encodedUrl(*)', async (req, res) => {
  try {
    await proxyHandler(req, res, config);
  } catch (error) {
    console.error('❌ Proxy error:', error);
    res.status(500).json({
      error: 'Proxy Error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// エラーハンドラ
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message:
      config.server?.env === 'development'
        ? err.message
        : 'Server error occurred',
    timestamp: new Date().toISOString()
  });
});

// ========== サーバー起動（★Render対応）=========

// ★最重要：Renderは process.env.PORT 必須
const PORT = process.env.PORT || config.server?.port || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log('🚀 Transparent Proxy v2.1.0');
  console.log('🚀 ========================================');
  console.log(`✅ Listening on ${HOST}:${PORT}`);
  console.log(`✅ Environment: ${config.server?.env || 'unknown'}`);
  console.log('⚡ Ready!');
  console.log('');
});

// ========== プロセス管理 ==========

process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down...');
  process.exit(0);
});

process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

module.exports = app;
