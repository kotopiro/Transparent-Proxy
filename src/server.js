// server.js - Transparent Proxy v2.1.0
// Render対応・完全安定版

const express = require('express');
const compression = require('compression');
const path = require('path');

// ================================
// 設定読み込み（※ server.js は src/ 配下）
// ================================
const config = require('./config/default');

// ================================
// ミドルウェア読み込み
// ================================
const proxyHandler = require('./proxy/handler');
const corsMiddleware = require('./middleware/cors');
const securityMiddleware = require('./middleware/security');
const loggerMiddleware = require('./middleware/logger');

// ★ 重要：middleware関数を直接取り出す
const { defaultLimiter } = require('./middleware/rateLimit');

// ================================
// Express 初期化
// ================================
const app = express();

// ================================
// ミドルウェア設定
// ================================

// 圧縮
if (config.performance?.compression) {
  app.use(compression({ level: config.performance.compressionLevel || 6 }));
}

// Body parser
app.use(express.json({ limit: `${config.proxy.maxRequestSize}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.proxy.maxRequestSize}mb` }));

// ログ
app.use(loggerMiddleware);

// セキュリティ
app.use(securityMiddleware);

// CORS
if (config.security?.corsEnabled) {
  app.use(corsMiddleware);
}

// レート制限（★ middleware関数なのでOK）
if (config.rateLimit?.enabled) {
  app.use('/proxy', defaultLimiter);
}

// 静的ファイル
app.use(
  express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
  })
);

// ================================
// ルート
// ================================

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.1.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
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

// プロキシ本体
app.all('/proxy/:encodedUrl(*)', async (req, res) => {
  try {
    await proxyHandler(req, res, config);
  } catch (err) {
    console.error('❌ Proxy Error:', err);
    res.status(500).json({
      error: 'Proxy Error',
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ================================
// エラーハンドリング
// ================================

// 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

// 500
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message:
      config.server.env === 'development'
        ? err.message
        : 'サーバーエラーが発生しました',
    timestamp: new Date().toISOString()
  });
});

// ================================
// サーバー起動
// ================================
const PORT = config.server.port || 3000;
const HOST = config.server.host || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('🚀 ================================');
  console.log('🚀 Transparent Proxy v2.1.0');
  console.log('🚀 ================================');
  console.log(`✅ Server   : http://${HOST}:${PORT}`);
  console.log(`✅ Env      : ${config.server.env}`);
  console.log(`✅ RateLimit: ${config.rateLimit?.enabled ? 'ON' : 'OFF'}`);
  console.log('⚡ Ready!');
  console.log('');
});

// ================================
// プロセス安全終了
// ================================
process.on('SIGINT', () => {
  console.log('\n👋 SIGINT received. Shutdown.');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n👋 SIGTERM received. Shutdown.');
  process.exit(0);
});

process.on('uncaughtException', err => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', reason => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

module.exports = app;
