// ========================================
// Logger Middleware - リクエストロギング
// ========================================

const { getClientIP } = require('./security');

/**
 * ロギングミドルウェア
 */
function loggerMiddleware(req, res, next) {
  const startTime = Date.now();
  const ip = getClientIP(req);
  
  // レスポンス完了時にログ出力
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const log = formatLog(req, res, ip, duration);
    
    // ステータスコードに応じた色分け
    if (res.statusCode >= 500) {
      console.error(log);
    } else if (res.statusCode >= 400) {
      console.warn(log);
    } else {
      console.log(log);
    }
  });
  
  next();
}

/**
 * ログフォーマット
 */
function formatLog(req, res, ip, duration) {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.originalUrl || req.url;
  const status = res.statusCode;
  const userAgent = req.headers['user-agent'] || '-';
  
  // 色コード
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    green: '\x1b[32m',
    cyan: '\x1b[36m',
    gray: '\x1b[90m'
  };
  
  let statusColor;
  if (status >= 500) statusColor = colors.red;
  else if (status >= 400) statusColor = colors.yellow;
  else if (status >= 300) statusColor = colors.cyan;
  else statusColor = colors.green;
  
  return [
    `${colors.gray}[${timestamp}]${colors.reset}`,
    `${colors.bright}${method}${colors.reset}`,
    url,
    `${statusColor}${status}${colors.reset}`,
    `${duration}ms`,
    `${colors.gray}${ip}${colors.reset}`
  ].join(' ');
}

/**
 * エラーログ
 */
function logError(error, req) {
  console.error('❌ Error:', {
    message: error.message,
    stack: error.stack,
    method: req.method,
    url: req.url,
    ip: getClientIP(req),
    timestamp: new Date().toISOString()
  });
}

/**
 * アクセスログ統計
 */
class AccessStats {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successRequests: 0,
      errorRequests: 0,
      byMethod: {},
      byStatus: {},
      avgResponseTime: 0,
      totalResponseTime: 0
    };
  }
  
  record(req, res, duration) {
    this.stats.totalRequests++;
    
    if (res.statusCode >= 200 && res.statusCode < 400) {
      this.stats.successRequests++;
    } else if (res.statusCode >= 400) {
      this.stats.errorRequests++;
    }
    
    // メソッド別
    this.stats.byMethod[req.method] = (this.stats.byMethod[req.method] || 0) + 1;
    
    // ステータス別
    this.stats.byStatus[res.statusCode] = (this.stats.byStatus[res.statusCode] || 0) + 1;
    
    // 平均レスポンス時間
    this.stats.totalResponseTime += duration;
    this.stats.avgResponseTime = Math.round(
      this.stats.totalResponseTime / this.stats.totalRequests
    );
  }
  
  get() {
    return { ...this.stats };
  }
  
  reset() {
    this.stats = {
      totalRequests: 0,
      successRequests: 0,
      errorRequests: 0,
      byMethod: {},
      byStatus: {},
      avgResponseTime: 0,
      totalResponseTime: 0
    };
  }
}

const accessStats = new AccessStats();

/**
 * 統計記録ミドルウェア
 */
function statsMiddleware(req, res, next) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    accessStats.record(req, res, duration);
  });
  
  next();
}

/**
 * 統計情報取得
 */
function getStats() {
  return accessStats.get();
}

module.exports = {
  loggerMiddleware,
  logError,
  statsMiddleware,
  getStats
};
