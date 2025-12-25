// src/proxy/handler.js
// プロキシハンドラ - 完全動作版

const fetch = require('node-fetch');

/**
 * プロキシハンドラ
 */
async function proxyHandler(req, res, config) {
    console.log('🌐 Proxy request:', req.params.encodedUrl);
    
    // Base64デコード
    let targetUrl;
    try {
        const encodedUrl = req.params.encodedUrl;
        targetUrl = Buffer.from(encodedUrl, 'base64').toString('utf8');
        console.log('📍 Target URL:', targetUrl);
    } catch (error) {
        console.error('❌ Base64 decode error:', error);
        return res.status(400).json({
            error: 'Invalid URL encoding',
            message: 'Base64デコードに失敗しました'
        });
    }

    // URL検証
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        return res.status(400).json({
            error: 'Invalid URL',
            message: 'URLはhttp://またはhttps://で始まる必要があります'
        });
    }

    try {
        // リクエストヘッダー準備
        const headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': req.headers.accept || '*/*',
            'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br'
        };

        // プロキシリクエスト実行
        console.log('⏳ Fetching:', targetUrl);
        const response = await fetch(targetUrl, {
            method: req.method,
            headers: headers,
            redirect: 'follow',
            timeout: 30000
        });

        console.log('✅ Response:', response.status, response.statusText);

        // レスポンスヘッダー処理
        const responseHeaders = {};
        
        // Content-Type
        const contentType = response.headers.get('content-type');
        if (contentType) {
            responseHeaders['Content-Type'] = contentType;
        }

        // CORS
        responseHeaders['Access-Control-Allow-Origin'] = '*';
        responseHeaders['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        responseHeaders['Access-Control-Allow-Headers'] = '*';

        // iframe表示を妨げるヘッダーを削除
        // X-Frame-Options, CSP などは送らない

        // レスポンス送信
        res.status(response.status);
        Object.entries(responseHeaders).forEach(([key, value]) => {
            res.setHeader(key, value);
        });

        // HTMLの場合は書き換え
        if (contentType && contentType.includes('text/html')) {
            let html = await response.text();
            
            // <base>タグ注入
            const baseUrl = new URL(targetUrl).origin;
            const baseTag = `<base href="${baseUrl}/">`;
            
            if (html.includes('<head>')) {
                html = html.replace('<head>', `<head>${baseTag}`);
            } else if (html.includes('<html>')) {
                html = html.replace('<html>', `<html><head>${baseTag}</head>`);
            } else {
                html = `<head>${baseTag}</head>${html}`;
            }

            // CSP削除
            html = html.replace(/<meta[^>]*http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '');
            
            console.log('📝 HTML rewritten');
            return res.send(html);
        }

        // HTMLでない場合はそのまま送信
        const buffer = await response.buffer();
        res.send(buffer);
        
    } catch (error) {
        console.error('❌ Proxy error:', error.message);
        
        // タイムアウトエラー
        if (error.type === 'request-timeout') {
            return res.status(504).json({
                error: 'Timeout',
                message: 'リクエストがタイムアウトしました'
            });
        }

        // ネットワークエラー
        if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
            return res.status(502).json({
                error: 'Connection Error',
                message: 'ターゲットサーバーに接続できません'
            });
        }

        // その他のエラー
        return res.status(500).json({
            error: 'Proxy Error',
            message: error.message,
            url: targetUrl
        });
    }
}

module.exports = proxyHandler;
