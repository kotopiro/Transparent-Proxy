// ========================================
// CORS Middleware - CORS設定
// ========================================

/**
 * CORS設定
 */
function corsMiddleware(req, res, next) {
  // すべてのオリジンを許可
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  // 許可するメソッド
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  
  // 許可するヘッダー
  res.setHeader('Access-Control-Allow-Headers', 
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Range, Cookie'
  );
  
  // 認証情報を含むリクエストを許可
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // プリフライトリクエストのキャッシュ時間
  res.setHeader('Access-Control-Max-Age', '86400'); // 24時間
  
  // 公開するヘッダー
  res.setHeader('Access-Control-Expose-Headers', 
    'Content-Length, Content-Range, X-Proxy-Time, X-Cache'
  );
  
  // OPTIONSリクエストは即座に200を返す
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
}

module.exports = corsMiddleware;
