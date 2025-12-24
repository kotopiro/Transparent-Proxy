// src/utils/url.js
// URL処理ユーティリティ

const { URL } = require('url');

/**
 * URLを正規化
 */
function normalizeUrl(urlString) {
    try {
        // プロトコルがない場合はhttpsを追加
        if (!urlString.match(/^https?:\/\//i)) {
            urlString = 'https://' + urlString;
        }

        const url = new URL(urlString);
        
        // 正規化
        return url.toString();
    } catch (error) {
        throw new Error(`Invalid URL: ${urlString}`);
    }
}

/**
 * 相対URLを絶対URLに変換
 */
function resolveUrl(baseUrl, relativeUrl) {
    try {
        if (!relativeUrl) return baseUrl;
        
        // すでに絶対URLの場合
        if (relativeUrl.match(/^https?:\/\//i)) {
            return relativeUrl;
        }
        
        // プロトコル相対URL（//example.com）
        if (relativeUrl.startsWith('//')) {
            const baseProtocol = new URL(baseUrl).protocol;
            return `${baseProtocol}${relativeUrl}`;
        }
        
        // 絶対パス（/path）
        if (relativeUrl.startsWith('/')) {
            const baseUrlObj = new URL(baseUrl);
            return `${baseUrlObj.origin}${relativeUrl}`;
        }
        
        // 相対パス（path/to/file）
        const baseUrlObj = new URL(baseUrl);
        const basePath = baseUrlObj.pathname.substring(0, baseUrlObj.pathname.lastIndexOf('/') + 1);
        return `${baseUrlObj.origin}${basePath}${relativeUrl}`;
    } catch (error) {
        return relativeUrl;
    }
}

/**
 * URLからドメインを抽出
 */
function extractDomain(urlString) {
    try {
        const url = new URL(urlString);
        return url.hostname;
    } catch (error) {
        return null;
    }
}

/**
 * URLがブラックリストに含まれるかチェック
 */
function isBlacklisted(urlString, blacklist) {
    try {
        const url = new URL(urlString);
        const hostname = url.hostname.toLowerCase();
        
        return blacklist.some(pattern => {
            // ワイルドカード対応
            if (pattern.includes('*')) {
                const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
                return regex.test(hostname);
            }
            
            // 完全一致またはサブドメイン一致
            return hostname === pattern || hostname.endsWith('.' + pattern);
        });
    } catch (error) {
        return false;
    }
}

/**
 * URLからファイル拡張子を取得
 */
function getFileExtension(urlString) {
    try {
        const url = new URL(urlString);
        const pathname = url.pathname;
        const lastDot = pathname.lastIndexOf('.');
        
        if (lastDot === -1) return null;
        
        const extension = pathname.substring(lastDot + 1).toLowerCase();
        return extension.split('?')[0]; // クエリパラメータを除去
    } catch (error) {
        return null;
    }
}

/**
 * URLがメディアファイルかチェック
 */
function isMediaUrl(urlString) {
    const mediaExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'mp4', 'webm', 'mp3', 'wav', 'ogg'];
    const extension = getFileExtension(urlString);
    return extension && mediaExtensions.includes(extension);
}

/**
 * URLエンコード（安全な文字を保持）
 */
function safeEncodeUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.toString();
    } catch (error) {
        return encodeURIComponent(urlString);
    }
}

/**
 * クエリパラメータを取得
 */
function getQueryParams(urlString) {
    try {
        const url = new URL(urlString);
        const params = {};
        
        for (const [key, value] of url.searchParams) {
            params[key] = value;
        }
        
        return params;
    } catch (error) {
        return {};
    }
}

/**
 * URLにクエリパラメータを追加
 */
function addQueryParams(urlString, params) {
    try {
        const url = new URL(urlString);
        
        for (const [key, value] of Object.entries(params)) {
            url.searchParams.set(key, value);
        }
        
        return url.toString();
    } catch (error) {
        return urlString;
    }
}

/**
 * URLから機密情報を削除（ログ用）
 */
function sanitizeUrlForLog(urlString) {
    try {
        const url = new URL(urlString);
        
        // パスワード、トークンなどを含むパラメータを除去
        const sensitiveParams = ['password', 'token', 'key', 'secret', 'api_key', 'access_token', 'auth'];
        
        for (const param of sensitiveParams) {
            if (url.searchParams.has(param)) {
                url.searchParams.set(param, '[REDACTED]');
            }
        }
        
        // 認証情報を除去
        url.username = '';
        url.password = '';
        
        return url.toString();
    } catch (error) {
        return '[INVALID_URL]';
    }
}

/**
 * 2つのURLが同じオリジンかチェック
 */
function isSameOrigin(url1, url2) {
    try {
        const origin1 = new URL(url1).origin;
        const origin2 = new URL(url2).origin;
        return origin1 === origin2;
    } catch (error) {
        return false;
    }
}

module.exports = {
    normalizeUrl,
    resolveUrl,
    extractDomain,
    isBlacklisted,
    getFileExtension,
    isMediaUrl,
    safeEncodeUrl,
    getQueryParams,
    addQueryParams,
    sanitizeUrlForLog,
    isSameOrigin
};
