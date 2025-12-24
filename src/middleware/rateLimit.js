// ========================================
// Rate Limiter - レート制限
// ========================================

const { getClientIP } = require('./security');

/**
 * レート制限マネージャー
 */
class RateLimiter {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1分
    this.maxRequests = options.maxRequests || 100; // 100リクエスト/分
    this.message = options.message || 'Too many requests, please try again later.';
    this.statusCode = options.statusCode || 429;
    this.skipSuccessfulRequests = options.skipSuccessfulRequests || false;
    this.skipFailedRequests = options.skipFailedRequests || false;
    
    // IPごとのリクエスト記録
    this.requests = new Map();
    
    // 定期クリーンアップ
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, this.windowMs);
  }
  
  /**
   * ミドルウェア関数
   */
  middleware() {
    return (req, res, next) => {
      const ip = getClientIP(req);
      const now = Date.now();
      
      // IP情報取得または初期化
      if (!this.requests.has(ip)) {
        this.requests.set(ip, []);
      }
      
      const ipRequests = this.requests.get(ip);
      
      // 期限切れリクエストを削除
      const validRequests = ipRequests.filter(
        timestamp => now - timestamp < this.windowMs
      );
      
      // リクエスト数チェック
      if (validRequests.length >= this.maxRequests) {
        const oldestRequest = Math.min(...validRequests);
        const resetTime = oldestRequest + this.windowMs;
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        
        res.setHeader('Retry-After', retryAfter);
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', new Date(resetTime).toISOString());
        
        return res.status(this.statusCode).json({
          error: 'Too Many Requests',
          message: this.message,
          retryAfter: retryAfter
        });
      }
      
      // レスポンス完了時に記録
      res.on('finish', () => {
        const shouldSkip = 
          (this.skipSuccessfulRequests && res.statusCode < 400) ||
          (this.skipFailedRequests && res.statusCode >= 400);
        
        if (!shouldSkip) {
          validRequests.push(now);
          this.requests.set(ip, validRequests);
        }
      });
      
      // ヘッダー設定
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, this.maxRequests - validRequests.length));
      
      next();
    };
  }
  
  /**
   * 期限切れエントリをクリーンアップ
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [ip, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter(t => now - t < this.windowMs);
      
      if (valid.length === 0) {
        this.requests.delete(ip);
        cleaned++;
      } else {
        this.requests.set(ip, valid);
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} rate limit entries`);
    }
  }
  
  /**
   * 統計情報
   */
  getStats() {
    return {
      trackedIPs: this.requests.size,
      windowMs: this.windowMs,
      maxRequests: this.maxRequests,
      totalRequests: Array.from(this.requests.values())
        .reduce((sum, arr) => sum + arr.length, 0)
    };
  }
  
  /**
   * リセット
   */
  reset(ip = null) {
    if (ip) {
      this.requests.delete(ip);
      console.log(`🔄 Reset rate limit for IP: ${ip}`);
    } else {
      this.requests.clear();
      console.log('🔄 Reset all rate limits');
    }
  }
  
  /**
   * クリーンアップ停止
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

/**
 * プリセット設定
 */
const PRESETS = {
  // 非常に厳しい制限
  strict: {
    windowMs: 60000,    // 1分
    maxRequests: 10     // 10リクエスト/分
  },
  
  // 標準的な制限
  standard: {
    windowMs: 60000,    // 1分
    maxRequests: 100    // 100リクエスト/分
  },
  
  // 緩い制限
  relaxed: {
    windowMs: 60000,    // 1分
    maxRequests: 500    // 500リクエスト/分
  },
  
  // プロキシ専用（より緩い）
  proxy: {
    windowMs: 60000,    // 1分
    maxRequests: 300,   // 300リクエスト/分
    skipSuccessfulRequests: true // 成功リクエストはカウントしない
  }
};

/**
 * 複数のリミッター（エンドポイントごと）
 */
class MultiRateLimiter {
  constructor() {
    this.limiters = new Map();
  }
  
  /**
   * エンドポイント用のリミッター追加
   */
  addLimiter(path, options) {
    const limiter = new RateLimiter(options);
    this.limiters.set(path, limiter);
    return limiter;
  }
  
  /**
   * ミドルウェア
   */
  middleware(path) {
    const limiter = this.limiters.get(path);
    
    if (!limiter) {
      throw new Error(`No rate limiter found for path: ${path}`);
    }
    
    return limiter.middleware();
  }
  
  /**
   * 統計情報
   */
  getStats() {
    const stats = {};
    
    for (const [path, limiter] of this.limiters.entries()) {
      stats[path] = limiter.getStats();
    }
    
    return stats;
  }
  
  /**
   * すべてリセット
   */
  resetAll() {
    for (const limiter of this.limiters.values()) {
      limiter.reset();
    }
  }
  
  /**
   * すべて破棄
   */
  destroyAll() {
    for (const limiter of this.limiters.values()) {
      limiter.destroy();
    }
    this.limiters.clear();
  }
}

/**
 * デフォルトのレート制限（プロキシ用）
 */
const defaultLimiter = new RateLimiter(PRESETS.proxy);

/**
 * API用の厳しいレート制限
 */
const apiLimiter = new RateLimiter(PRESETS.strict);

module.exports = {
  RateLimiter,
  MultiRateLimiter,
  PRESETS,
  defaultLimiter: defaultLimiter.middleware(),
  apiLimiter: apiLimiter.middleware()
};
