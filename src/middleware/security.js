// ========================================
// Security Middleware - セキュリティヘッダー
// ========================================

/**
 * セキュリティヘッダー設定
 */
function securityMiddleware(req, res, next) {
  // XSS保護
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Clickjacking保護（プロキシなので無効化）
  // res.setHeader('X-Frame-Options', 'DENY');
  
  // MIME type sniffing保護
  res.setHeader('X-Download-Options', 'noopen');
  
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'no-referrer');
  
  // Permissions Policy（旧Feature Policy）
  res.setHeader('Permissions-Policy', 
    'geolocation=(), microphone=(), camera=(), payment=()'
  );
  
  // 情報漏洩防止
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Powered-By', 'Transparent-Proxy');
  
  next();
}

/**
 * IPアドレス取得（プロキシ経由も考慮）
 */
function getClientIP(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         req.connection.socket?.remoteAddress ||
         'unknown';
}

/**
 * User-Agent検証
 */
function validateUserAgent(req) {
  const ua = req.headers['user-agent'];
  
  if (!ua) {
    return { valid: false, reason: 'No User-Agent' };
  }
  
  // ボット検出（簡易）
  const botPatterns = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i
  ];
  
  for (const pattern of botPatterns) {
    if (pattern.test(ua)) {
      return { valid: false, reason: 'Bot detected', bot: true };
    }
  }
  
  return { valid: true };
}

/**
 * リクエストサイズ制限
 */
function requestSizeLimit(maxSize = 10 * 1024 * 1024) { // 10MB
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'], 10);
    
    if (contentLength && contentLength > maxSize) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: `Request size exceeds ${maxSize} bytes`
      });
    }
    
    next();
  };
}

/**
 * DNS/IPリーク防止ヘッダー
 */
function antiLeakHeaders(req, res, next) {
  // DNS prefetchを無効化
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  
  next();
}

module.exports = {
  securityMiddleware,
  getClientIP,
  validateUserAgent,
  requestSizeLimit,
  antiLeakHeaders
};
