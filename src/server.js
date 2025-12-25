// src/server.js - Transparent Proxy v2.1.0
// Render完全対応版 - 絶対に動く

const express = require('express');
const compression = require('compression');
const path = require('path');
const fs = require('fs');

// ================================
// パス解決（重要！）
// ================================
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');
const SRC_DIR = __dirname;

console.log('📁 Directories:');
console.log('  ROOT:', ROOT_DIR);
console.log('  PUBLIC:', PUBLIC_DIR);
console.log('  SRC:', SRC_DIR);

// public/index.html 存在確認
if (fs.existsSync(path.join(PUBLIC_DIR, 'index.html'))) {
  console.log('✅ index.html found');
} else {
  console.error('❌ index.html NOT FOUND at:', PUBLIC_DIR);
}

// ================================
// 設定読み込み（安全版）
// ================================
let config;
try {
  config = require(path.join(SRC_DIR, 'config', 'default.js'));
  console.log('✅ Config loaded');
} catch (err) {
  console.warn('⚠️ Config not found, using defaults');
  config = {
    server: { port: 3000 },
    proxy: { timeout: 30000, maxRequestSize: 10 },
    performance: { compression: true },
    security: { corsEnabled: true },
    rateLimit: { enabled: false }
  };
}

// ================================
// Middleware 安全読み込み
// ================================
function safeLoad(modulePath, fallback) {
  try {
    const mod = require(modulePath);
    
    // 関数をそのまま返す
    if (typeof mod === 'function') {
      console.log(`✅ Loaded: ${path.basename(modulePath)}`);
      return mod;
    }
    
    // export default
    if (mod?.default && typeof mod.default === 'function') {
      console.log(`✅ Loaded: ${path.basename(modulePath)} (default)`);
      return mod.default;
    }
    
    // middleware プロパティ
    if (mod?.middleware && typeof mod.middleware === 'function') {
      console.log(`✅ Loaded: ${path.basename(modulePath)} (middleware)`);
      return mod.middleware;
    }
    
    // handler プロパティ
    if (mod?.handler && typeof mod.handler === 'function') {
      console.log(`✅ Loaded: ${path.basename(modulePath)} (handler)`);
      return mod.handler;
    }
    
    // オブジェクトから関数を探す
    if (typeof mod === 'object') {
      const funcs = Object.values(mod).filter(v => typeof v === 'function');
      if (funcs.length > 0) {
        console.log(`✅ Loaded: ${path.basename(modulePath)} (found function)`);
        return funcs[0];
      }
    }
    
    console.warn(`⚠️ ${path.basename(modulePath)}: using fallback`);
    return fallback;
  } catch (err) {
    console.warn(`⚠️ ${path.basename(modulePath)}: ERROR, using fallback`);
    return fallback;
  }
}

// ================================
// Middleware 読み込み
// ================================
const noopMiddleware = (req, res, next) => next();

const proxyHandler = safeLoad(
  path.join(SRC_DIR, 'proxy', 'handler.js'),
  async (req, res) => {
    res.status(500).json({ error: 'Proxy handler not loaded' });
  }
);

const corsMiddleware = safeLoad(
  path.join(SRC_DIR, 'middleware', 'cors.js'),
  (req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  }
);

const securityMiddleware = safeLoad(
  path.join(SRC_DIR, 'middleware', 'security.js'),
  (req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
  }
);

const loggerMiddleware = safeLoad(
  path.join(SRC_DIR, 'middleware', 'logger.js'),
  (req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  }
);

const rateLimitMiddleware = safeLoad(
  path.join(SRC_DIR, 'middleware', 'rateLimit.js'),
  noopMiddleware
);

// ================================
// Express初期化
// ================================
const app = express();

// ================================
// 基本Middleware
// ================================
if (config.performance?.compression) {
  app.use(compression({ level: 6 }));
  console.log('✅ Compression enabled');
}

app.use(express.json({ limit: `${config.proxy?.maxRequestSize || 10}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.proxy?.maxRequestSize || 10}mb` }));

// ログ
app.use(loggerMiddleware);

// セキュリティ
app.use(securityMiddleware);

// CORS
if (config.security?.corsEnabled !== false) {
  app.use(corsMiddleware);
  console.log('✅ CORS enabled');
}

// レート制限
if (config.rateLimit?.enabled) {
  app.use('/proxy', rateLimitMiddleware);
  console.log('✅ Rate limit enabled');
}

// ================================
// 静的ファイル（重要！）
// ================================
app.use(express.static(PUBLIC_DIR, {
  maxAge: '1d',
  etag: true,
  index: 'index.html'
}));

console.log('✅ Static files from:', PUBLIC_DIR);

// ================================
// API Routes
// ================================

// ヘルスチェック
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'production',
    publicDir: PUBLIC_DIR
  });
});

// 設定情報
app.get('/api/config', (req, res) => {
  res.json({
    version: '2.1.0',
    features: config.features || {},
    ui: config.ui || {},
    adblock: { enabled: config.adblock?.enabled || false },
    captcha: { enabled: config.captcha?.enabled || false }
  });
});

// ================================
// プロキシエンドポイント
// ================================
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

// ================================
// 404ハンドラ
// ================================
app.use((req, res) => {
  // API以外は index.html を返す（SPA対応）
  if (req.path.startsWith('/api') || req.path.startsWith('/proxy')) {
    return res.status(404).json({
      error: 'Not Found',
      path: req.path,
      timestamp: new Date().toISOString()
    });
  }
  
  // フロントエンドルーティング用
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ================================
// エラーハンドラ
// ================================
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'サーバーエラー',
    timestamp: new Date().toISOString()
  });
});

// ================================
// サーバー起動
// ================================
const PORT = process.env.PORT || config.server?.port || 3000;
const HOST = process.env.HOST || '0.0.0.0';

app.listen(PORT, HOST, () => {
  console.log('');
  console.log('🚀 ==========================================');
  console.log('🚀 Transparent Proxy v2.1.0 STARTED');
  console.log('🚀 ==========================================');
  console.log('');
  console.log(`✅ Server: http://${HOST}:${PORT}`);
  console.log(`✅ Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`✅ Public Directory: ${PUBLIC_DIR}`);
  console.log('');
  console.log('📊 Endpoints:');
  console.log('   GET  /                 - Frontend UI');
  console.log('   GET  /health           - Health Check');
  console.log('   GET  /api/config       - Configuration');
  console.log('   ALL  /proxy/:url       - Proxy');
  console.log('');
  console.log('⚡ Ready!');
  console.log('');
});

// プロセス終了処理
process.on('SIGTERM', () => {
  console.log('👋 SIGTERM received. Shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('👋 SIGINT received. Shutting down...');
  process.exit(0);
});

module.exports = app;
