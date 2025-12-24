// src/utils/validator.js
// バリデーションユーティリティ

/**
 * URLが有効かチェック
 */
function isValidUrl(urlString) {
    try {
        const url = new URL(urlString);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (error) {
        return false;
    }
}

/**
 * Base64文字列が有効かチェック
 */
function isValidBase64(str) {
    if (!str || typeof str !== 'string') return false;
    
    // Base64の正規表現パターン
    const base64Pattern = /^[A-Za-z0-9+/]*={0,2}$/;
    
    if (!base64Pattern.test(str)) return false;
    
    try {
        // デコードしてみる
        const decoded = Buffer.from(str, 'base64').toString('utf8');
        // 再エンコードして元の文字列と一致するか確認
        const reencoded = Buffer.from(decoded, 'utf8').toString('base64');
        return str === reencoded;
    } catch (error) {
        return false;
    }
}

/**
 * ドメインが有効かチェック
 */
function isValidDomain(domain) {
    if (!domain || typeof domain !== 'string') return false;
    
    // ドメインの正規表現パターン
    const domainPattern = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i;
    
    return domainPattern.test(domain);
}

/**
 * IPアドレスが有効かチェック
 */
function isValidIP(ip) {
    if (!ip || typeof ip !== 'string') return false;
    
    // IPv4
    const ipv4Pattern = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    
    // IPv6（簡易版）
    const ipv6Pattern = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    return ipv4Pattern.test(ip) || ipv6Pattern.test(ip);
}

/**
 * ポート番号が有効かチェック
 */
function isValidPort(port) {
    const portNum = parseInt(port, 10);
    return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
}

/**
 * Content-Typeがテキストかチェック
 */
function isTextContentType(contentType) {
    if (!contentType) return false;
    
    const textTypes = [
        'text/',
        'application/json',
        'application/javascript',
        'application/xml',
        'application/xhtml+xml',
        'application/x-javascript'
    ];
    
    return textTypes.some(type => contentType.toLowerCase().includes(type));
}

/**
 * Content-TypeがHTMLかチェック
 */
function isHtmlContentType(contentType) {
    if (!contentType) return false;
    
    return contentType.toLowerCase().includes('text/html');
}

/**
 * Content-TypeがCSSかチェック
 */
function isCssContentType(contentType) {
    if (!contentType) return false;
    
    return contentType.toLowerCase().includes('text/css');
}

/**
 * Content-TypeがJavaScriptかチェック
 */
function isJsContentType(contentType) {
    if (!contentType) return false;
    
    const jsTypes = [
        'application/javascript',
        'application/x-javascript',
        'text/javascript'
    ];
    
    return jsTypes.some(type => contentType.toLowerCase().includes(type));
}

/**
 * HTTPメソッドが有効かチェック
 */
function isValidHttpMethod(method) {
    const validMethods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    return validMethods.includes(method.toUpperCase());
}

/**
 * User-Agentが有効かチェック
 */
function isValidUserAgent(userAgent) {
    if (!userAgent || typeof userAgent !== 'string') return false;
    
    // 最小長チェック
    if (userAgent.length < 10) return false;
    
    // 一般的なブラウザ識別子を含むかチェック
    const browserIdentifiers = ['Mozilla', 'Chrome', 'Safari', 'Firefox', 'Edge', 'Opera'];
    return browserIdentifiers.some(id => userAgent.includes(id));
}

/**
 * リクエストサイズが制限内かチェック
 */
function isWithinSizeLimit(size, limitMB = 10) {
    const limitBytes = limitMB * 1024 * 1024;
    return size <= limitBytes;
}

/**
 * エンコーディングが有効かチェック
 */
function isValidEncoding(encoding) {
    const validEncodings = ['utf-8', 'utf8', 'ascii', 'binary', 'base64', 'hex', 'latin1'];
    return validEncodings.includes(encoding.toLowerCase());
}

/**
 * ファイル名が安全かチェック（パストラバーサル対策）
 */
function isSafeFilename(filename) {
    if (!filename || typeof filename !== 'string') return false;
    
    // 危険な文字を含まないかチェック
    const dangerousPatterns = [
        /\.\./,  // パストラバーサル
        /[<>:"|?*]/,  // 特殊文字
        /^[\s.]|[\s.]$/,  // 先頭・末尾の空白やドット
    ];
    
    return !dangerousPatterns.some(pattern => pattern.test(filename));
}

/**
 * XSS攻撃の可能性をチェック
 */
function containsXss(input) {
    if (!input || typeof input !== 'string') return false;
    
    const xssPatterns = [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,  // onclick, onerror など
        /<iframe/gi,
        /eval\(/gi,
        /expression\(/gi
    ];
    
    return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * SQLインジェクションの可能性をチェック
 */
function containsSqlInjection(input) {
    if (!input || typeof input !== 'string') return false;
    
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/gi,
        /(--|;|\/\*|\*\/)/g,
        /(\bOR\b|\bAND\b)[\s]*[\d'"]/gi
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * レート制限用：リクエスト数が制限内かチェック
 */
function isWithinRateLimit(requests, limit, windowMs, now = Date.now()) {
    // 古いリクエストを除外
    const recentRequests = requests.filter(timestamp => now - timestamp < windowMs);
    return recentRequests.length < limit;
}

module.exports = {
    isValidUrl,
    isValidBase64,
    isValidDomain,
    isValidIP,
    isValidPort,
    isTextContentType,
    isHtmlContentType,
    isCssContentType,
    isJsContentType,
    isValidHttpMethod,
    isValidUserAgent,
    isWithinSizeLimit,
    isValidEncoding,
    isSafeFilename,
    containsXss,
    containsSqlInjection,
    isWithinRateLimit
};
