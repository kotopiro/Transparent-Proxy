// src/server.js - 最終完全修正版
// RateLimiter問題 + 全エラー完全対応

const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();

// ========== 設定 ==========
const ROOT_DIR = path.join(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT_DIR, 'public');

console.log('📁 ROOT:', ROOT_DIR);
console.log('📁 PUBLIC:', PUBLIC_DIR);

// index.html確認
const fs = require('fs');
if (fs.existsSync(path.join(PUBLIC_DIR, 'index.html'))) {
    console.log('✅ index.html found');
} else {
    console.error('❌ index.html NOT FOUND');
}

// ========== Middleware ==========
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS（シンプル版）
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', '*');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }
    next();
});

// ログ
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} ${res.statusCode} ${duration}ms ${req.ip}`);
    });
    next();
});

// セキュリティヘッダー
app.use((req, res, next) => {
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Frame-Options', 'SAMEORIGIN');
    res.header('X-XSS-Protection', '1; mode=block');
    next();
});

// 静的ファイル
app.use(express.static(PUBLIC_DIR, {
    maxAge: '1d',
    etag: true,
    index: 'index.html'
}));

console.log('✅ Static files from:', PUBLIC_DIR);

// ========== ヘルスチェック ==========
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        version: '2.1.0',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        env: process.env.NODE_ENV || 'production'
    });
});

// ========== API設定 ==========
app.get('/api/config', (req, res) => {
    res.json({
        version: '2.1.0',
        features: {
            serviceWorker: true,
            pwa: true,
            aboutBlank: true,
            particles: true
        },
        adblock: { enabled: true }
    });
});

// ========== プロキシ（完全埋め込み版） ==========
app.all('/proxy/:encodedUrl(*)', async (req, res) => {
    console.log('🌐 Proxy request:', req.params.encodedUrl);
    
    try {
        // Base64デコード
        const encodedUrl = req.params.encodedUrl;
        let targetUrl;
        
        try {
            targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
        } catch (decodeError) {
            console.error('❌ Base64 decode error:', decodeError.message);
            return res.status(400).json({
                error: 'Invalid URL Encoding',
                message: 'Base64デコードに失敗しました'
            });
        }
        
        console.log('📍 Target:', targetUrl);
        
        // URL検証
        if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
            return res.status(400).json({
                error: 'Invalid URL',
                message: 'URLはhttp://またはhttps://で始まる必要があります',
                provided: targetUrl
            });
        }
        
        // プロキシリクエスト実行
        console.log('⏳ Fetching...');
        
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': req.headers.accept || 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
                'Accept-Encoding': 'gzip, deflate, br',
                'DNT': '1',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            redirect: 'follow',
            timeout: 30000
        });
        
        console.log('✅ Response:', response.status, response.statusText);
        
        // Content-Type取得
        const contentType = response.headers.get('content-type') || 'text/html';
        console.log('📄 Content-Type:', contentType);
        
        // レスポンスヘッダー設定
        res.status(response.status);
        res.setHeader('Content-Type', contentType);
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', '*');
        
        // Cache-Control（プロキシでは短めに）
        res.setHeader('Cache-Control', 'public, max-age=300');
        
        // HTMLの場合は書き換え
        if (contentType.includes('text/html')) {
            let html = await response.text();
            
            // <base>タグ注入
            const baseUrl = new URL(targetUrl).origin;
            const baseTag = `<base href="${baseUrl}/">`;
            
            if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>${baseTag}`);
            } else if (html.includes('<html>')) {
                html = html.replace('<html>', `<html><head>${baseTag}</head>`);
            } else {
                html = `<!DOCTYPE html><html><head>${baseTag}</head><body>${html}</body></html>`;
            }
            
            // CSP削除
            html = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
            html = html.replace(/<meta[^>]*http-equiv=["']X-Frame-Options["'][^>]*>/gi, '');
            
            console.log('📝 HTML書き換え完了');
            return res.send(html);
        }
        
        // HTML以外はそのまま
        const buffer = await response.buffer();
        console.log('📦 Binary data:', buffer.length, 'bytes');
        res.send(buffer);
        
    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        console.error('Stack:', error.stack);
        
        // エラー詳細
        const errorInfo = {
            error: 'Proxy Error',
            message: error.message,
            timestamp: new Date().toISOString()
        };
        
        // タイムアウト
        if (error.type === 'request-timeout' || error.code === 'ETIMEDOUT') {
            errorInfo.error = 'Timeout';
            errorInfo.message = 'リクエストがタイムアウトしました';
            return res.status(504).json(errorInfo);
        }
        
        // 接続エラー
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            errorInfo.error = 'Connection Error';
            errorInfo.message = 'ターゲットサーバーに接続できません';
            return res.status(502).json(errorInfo);
        }
        
        // その他
        res.status(500).json(errorInfo);
    }
});

// ========== 404ハンドラ ==========
app.use((req, res, next) => {
    // API/プロキシ以外は index.html（SPA）
    if (req.path.startsWith('/api') || req.path.startsWith('/proxy')) {
        return res.status(404).json({
            error: 'Not Found',
            path: req.path,
            timestamp: new Date().toISOString()
        });
    }
    
    // フロントエンドルーティング
    res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// ========== エラーハンドラ ==========
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err.message);
    console.error('Stack:', err.stack);
    
    res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'サーバーエラーが発生しました',
        timestamp: new Date().toISOString()
    });
});

// ========== サーバー起動 ==========
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.listen(PORT, HOST, () => {
    console.log('');
    console.log('🚀 ==========================================');
    console.log('🚀 Transparent Proxy v2.1.0 FINAL');
    console.log('🚀 ==========================================');
    console.log('');
    console.log(`✅ Server: http://${HOST}:${PORT}`);
    console.log(`✅ Public: ${PUBLIC_DIR}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'production'}`);
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

// 未処理のエラー
process.on('uncaughtException', (err) => {
    console.error('❌ Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection:', reason);
    process.exit(1);
});

module.exports = app;
