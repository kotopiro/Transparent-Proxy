// ========================================
// Cache Manager - インメモリキャッシュ
// ========================================

const crypto = require('crypto');

class CacheManager {
  constructor(options = {}) {
    this.cache = new Map();
    this.maxSize = options.maxSize || 100; // 最大100エントリ
    this.ttl = options.ttl || 3600000; // 1時間
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0
    };
    
    // 定期クリーンアップ
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // 1分ごと
  }
  
  /**
   * キャッシュから取得
   */
  async get(key) {
    const normalizedKey = this.normalizeKey(key);
    const entry = this.cache.get(normalizedKey);
    
    if (!entry) {
      this.stats.misses++;
      return null;
    }
    
    // 有効期限チェック
    if (Date.now() > entry.expiry) {
      this.cache.delete(normalizedKey);
      this.stats.misses++;
      return null;
    }
    
    this.stats.hits++;
    entry.lastAccess = Date.now();
    return entry.data;
  }
  
  /**
   * キャッシュに保存
   */
  async set(key, data, customTtl) {
    const normalizedKey = this.normalizeKey(key);
    const ttl = customTtl || this.ttl;
    
    // サイズ制限チェック
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }
    
    this.cache.set(normalizedKey, {
      data,
      expiry: Date.now() + ttl,
      lastAccess: Date.now(),
      size: this.estimateSize(data)
    });
    
    this.stats.sets++;
  }
  
  /**
   * キャッシュから削除
   */
  async delete(key) {
    const normalizedKey = this.normalizeKey(key);
    const deleted = this.cache.delete(normalizedKey);
    if (deleted) {
      this.stats.deletes++;
    }
    return deleted;
  }
  
  /**
   * キャッシュクリア
   */
  clear() {
    this.cache.clear();
    console.log('🗑️ Cache cleared');
  }
  
  /**
   * LRU（最近使われていないものを削除）
   */
  evictLRU() {
    let oldest = null;
    let oldestTime = Infinity;
    
    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccess < oldestTime) {
        oldestTime = entry.lastAccess;
        oldest = key;
      }
    }
    
    if (oldest) {
      this.cache.delete(oldest);
      console.log('📤 Evicted from cache:', oldest.substring(0, 50));
    }
  }
  
  /**
   * 期限切れエントリをクリーンアップ
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiry) {
        this.cache.delete(key);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`🧹 Cleaned up ${cleaned} expired cache entries`);
    }
  }
  
  /**
   * キーの正規化（ハッシュ化）
   */
  normalizeKey(key) {
    return crypto.createHash('md5').update(key).digest('hex');
  }
  
  /**
   * データサイズ推定
   */
  estimateSize(data) {
    if (Buffer.isBuffer(data)) {
      return data.length;
    }
    if (typeof data === 'string') {
      return Buffer.byteLength(data, 'utf8');
    }
    return JSON.stringify(data).length;
  }
  
  /**
   * 統計情報取得
   */
  getStats() {
    return {
      ...this.stats,
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0
    };
  }
  
  /**
   * クリーンアップ停止
   */
  destroy() {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// シングルトンインスタンス
const cacheManager = new CacheManager();

module.exports = {
  getFromCache: (key) => cacheManager.get(key),
  setToCache: (key, data, ttl) => cacheManager.set(key, data, ttl),
  deleteFromCache: (key) => cacheManager.delete(key),
  clearCache: () => cacheManager.clear(),
  getCacheStats: () => cacheManager.getStats()
};
