// src/config/default.js
// デフォルト設定

module.exports = {
    // サーバー設定
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || '0.0.0.0',
        env: process.env.NODE_ENV || 'production',
        trustProxy: true
    },

    // プロキシ設定
    proxy: {
        // タイムアウト（ミリ秒）
        timeout: 30000,
        
        // 最大リダイレクト回数
        maxRedirects: 5,
        
        // リクエストサイズ制限（MB）
        maxRequestSize: 10,
        
        // User-Agent（デフォルト）
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        
        // Referer送信
        sendReferer: false,
        
        // Cookie転送
        forwardCookies: true
    },

    // キャッシュ設定
    cache: {
        // キャッシュ有効化
        enabled: true,
        
        // TTL（秒）
        ttl: 3600,
        
        // 最大キャッシュサイズ（MB）
        maxSize: 100,
        
        // キャッシュ対象のContent-Type
        allowedContentTypes: [
            'text/html',
            'text/css',
            'application/javascript',
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp'
        ]
    },

    // セキュリティ設定
    security: {
        // HTTPS強制
        forceHttps: true,
        
        // XSSフィルター
        enableXssFilter: true,
        
        // SQLインジェクション検出
        enableSqlFilter: true,
        
        // CORS許可
        corsEnabled: true,
        
        // 許可するオリジン（* = すべて）
        allowedOrigins: '*',
        
        // セキュリティヘッダー
        headers: {
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'SAMEORIGIN',
            'X-XSS-Protection': '1; mode=block',
            'Referrer-Policy': 'no-referrer'
        }
    },

    // レート制限
    rateLimit: {
        // 有効化
        enabled: true,
        
        // ウィンドウ時間（ミリ秒）
        windowMs: 60000, // 1分
        
        // 最大リクエスト数
        maxRequests: 100,
        
        // エラーメッセージ
        message: 'リクエストが多すぎます。しばらく待ってから再試行してください。'
    },

    // 広告ブロック
    adblock: {
        // 有効化
        enabled: true,
        
        // ブロックするドメイン
        blockedDomains: [
            'doubleclick.net',
            'googlesyndication.com',
            'adservice.google.com',
            'googleadservices.com',
            'google-analytics.com',
            'facebook.com/tr',
            'connect.facebook.net',
            'ads-twitter.com',
            'analytics.twitter.com',
            'ads.yahoo.com',
            'adtech.de',
            'advertising.com',
            'criteo.com',
            'outbrain.com',
            'taboola.com',
            'yieldmo.com',
            'moatads.com',
            'scorecardresearch.com',
            'zedo.com',
            'serving-sys.com'
        ]
    },

    // ブラックリスト
    blacklist: {
        // 有効化
        enabled: false,
        
        // ブロックするドメイン（管理者が設定）
        domains: [],
        
        // エラーメッセージ
        message: 'このサイトはブロックされています。'
    },

    // CAPTCHA設定（v2.1.0）
    captcha: {
        // 自動突破有効化
        enabled: false,
        
        // サポートするCAPTCHAタイプ
        types: ['recaptcha', 'hcaptcha'],
        
        // タイムアウト（ミリ秒）
        timeout: 30000
    },

    // URL難読化（v2.1.0）
    urlEncoding: {
        // 有効化
        enabled: true,
        
        // エンコーディングタイプ（base64, xor）
        type: 'base64',
        
        // XOR暗号化キー
        xorKey: 'transparent-proxy-key-2024'
    },

    // ログ設定
    logging: {
        // ログレベル（error, warn, info, debug）
        level: process.env.LOG_LEVEL || 'info',
        
        // コンソールログ
        console: true,
        
        // ファイルログ
        file: false,
        
        // ログファイルパス
        filePath: './logs/proxy.log',
        
        // URL sanitization（機密情報の除去）
        sanitizeUrls: true
    },

    // パフォーマンス
    performance: {
        // 圧縮有効化
        compression: true,
        
        // 圧縮レベル（0-9）
        compressionLevel: 6,
        
        // Keep-Alive
        keepAlive: true,
        
        // Keep-Aliveタイムアウト（ミリ秒）
        keepAliveTimeout: 5000
    },

    // 機能フラグ
    features: {
        // Service Worker
        serviceWorker: true,
        
        // PWA
        pwa: true,
        
        // 履歴
        history: true,
        
        // ブックマーク
        bookmarks: true,
        
        // about:blank表示
        aboutBlank: true,
        
        // パーティクル背景
        particles: true
    },

    // UI設定
    ui: {
        // デフォルトテーマ
        defaultTheme: 'dark',
        
        // タイトル（Google Classroom偽装）
        title: 'HOME',
        
        // 最大タブ数
        maxTabs: 20,
        
        // 履歴の最大保存数
        maxHistory: 100,
        
        // ブックマークの最大保存数
        maxBookmarks: 50
    }
};
