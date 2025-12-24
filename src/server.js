// server.js - Transparent Proxy v2.1.0
// 完全統合版 - 全モジュール組み込み

const express = require('express');
const compression = require('compression');
const path = require('path');

// 設定読み込み
const config = require('./src/config/default');

// モジュール読み込み
const proxyHandler = require('./src/proxy/handler');
const corsMiddleware = require('./src/middleware/cors');
const securityMiddleware = require('./src/middleware/security');
const loggerMiddleware = require('./src/middleware/logger');
const rateLimitMiddleware = require('./src/middleware/rateLimit');

// Express初期化
const app = express();

// ========== ミドルウェア設定 ==========

// 圧縮
if (config.performance.compression) {
    app.use(compression({ level: config.performance.compressionLevel }));
}

// リクエストボディパース
app.use(express.json({ limit: `${config.proxy.maxRequestSize}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${config.proxy.maxRequestSize}mb` }));

// ロギング
app.use(loggerMiddleware);

// セキュリティ
app.use(securityMiddleware);

// CORS
if (config.security.corsEnabled) {
    app.use(corsMiddleware);
}

// レート制限
if (config.rateLimit.enabled) {
    app.use('/proxy', rateLimitMiddleware);
}

// 静的ファイル
app.use(express.static(path.join(__dirname, 'public'), {
    maxAge: '1d',
    etag: true
}));

// ========== ルート設定 ==========

/**
 * ヘルスチェック
 */
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * 設定情報（公開用）
 */
app.get('/api/config', (req, res) => {
    res.json({
        version: '2.1.0',
        features: config.features,
        ui: config.ui,
        adblock: {
            enabled: config.adblock.enabled
        },
        captcha: {
            enabled: config.captcha.enabled
        },
        urlEncoding: {
            enabled: config.urlEncoding.enabled,
            type: config.urlEncoding.type
        }
    });
});

/**
 * プロキシエンドポイント
 * /proxy/:encodedUrl
 */
app.all('/proxy/:encodedUrl(*)', async (req, res) => {
    try {
        await proxyHandler(req, res, config);
    } catch (error) {
        console.error('❌ Proxy error:', error);
        
        res.status(500).json({
            error: 'プロキシエラーが発生しました',
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * 404ハンドラ
 */
app.use((req, res) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'リクエストされたリソースが見つかりません',
        path: req.path,
        timestamp: new Date().toISOString()
    });
});

/**
 * エラーハンドラ
 */
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: config.server.env === 'development' ? err.message : 'サーバーエラーが発生しました',
        timestamp: new Date().toISOString()
    });
});

// ========== サーバー起動 ==========

const PORT = config.server.port;
const HOST = config.server.host;

app.listen(PORT, HOST, () => {
    console.log('');
    console.log('🚀 ========================================');
    console.log('🚀 Transparent Proxy v2.1.0');
    console.log('🚀 ========================================');
    console.log('');
    console.log(`✅ Server: http://${HOST}:${PORT}`);
    console.log(`✅ Environment: ${config.server.env}`);
    console.log(`✅ Compression: ${config.performance.compression ? 'ON' : 'OFF'}`);
    console.log(`✅ Cache: ${config.cache.enabled ? 'ON' : 'OFF'}`);
    console.log(`✅ AdBlock: ${config.adblock.enabled ? 'ON' : 'OFF'}`);
    console.log(`✅ Rate Limit: ${config.rateLimit.enabled ? 'ON' : 'OFF'}`);
    console.log(`✅ CAPTCHA: ${config.captcha.enabled ? 'ON' : 'OFF'}`);
    console.log(`✅ URL Encoding: ${config.urlEncoding.enabled ? config.urlEncoding.type.toUpperCase() : 'OFF'}`);
    console.log('');
    console.log('📊 Endpoints:');
    console.log('   GET  /health           - ヘルスチェック');
    console.log('   GET  /api/config       - 設定情報');
    console.log('   ALL  /proxy/:url       - プロキシ');
    console.log('');
    console.log('🎯 Features:');
    console.log(`   ✓ Google Classroom偽装（タイトル: ${config.ui.title}）`);
    console.log('   ✓ about:blank完全対応');
    console.log('   ✓ HTML/CSS/JS完全書き換え');
    console.log('   ✓ 広告ブロック30+ドメイン');
    console.log('   ✓ マルチタブ対応');
    console.log('   ✓ 履歴・ブックマーク');
    console.log('   ✓ PWA対応');
    console.log('   ✓ Service Worker');
    console.log('');
    console.log('⚡ Ready!');
    console.log('');
});

// プロセス終了時のクリーンアップ
process.on('SIGTERM', () => {
    console.log('');
    console.log('👋 SIGTERM received. Shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('');
    console.log('👋 SIGINT received. Shutting down gracefully...');
    process.exit(0);
});

// 未処理の例外をキャッチ
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

module.exports = app;
