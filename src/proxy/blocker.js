// ========================================
// Blocker - 広告ブロック & ブラックリスト
// ========================================

const { loadBlacklist } = require('../utils/blacklist');

// 広告ドメイン
const AD_DOMAINS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'facebook.net', 'analytics.google.com', 'google-analytics.com',
  'adservice.google.com', 'pagead2.googlesyndication.com',
  'ads.yahoo.com', 'advertising.com', 'advertising.amazon.com',
  'ad.doubleclick.net', 'static.ads-twitter.com', 'ads-api.twitter.com',
  'scorecardresearch.com', 'quantserve.com', 'outbrain.com', 'taboola.com',
  'moatads.com', 'adsrvr.org', 'adnxs.com', 'rubiconproject.com',
  'criteo.com', 'pubmatic.com', 'openx.net', 'contextweb.com',
  'adsystem.com', 'adtech.de', 'advertising.com', 'adzerk.net',
  'amazon-adsystem.com', 'buysellads.com', 'carbonads.com', 'chitika.com'
];

// マルウェア・フィッシングドメイン
const MALICIOUS_DOMAINS = [
  // 実際のマルウェアドメインは追加しない（セキュリティ上）
  // 例: 'known-phishing-site.com'
];

// ブラックリスト（管理者設定）
let customBlacklist = [];

/**
 * 初期化
 */
async function initialize() {
  try {
    customBlacklist = await loadBlacklist();
    console.log(`✅ Blacklist loaded: ${customBlacklist.length} entries`);
  } catch (error) {
    console.warn('⚠️ Failed to load blacklist:', error.message);
  }
}

/**
 * URLをブロックすべきかチェック
 */
function shouldBlock(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // 広告ドメインチェック
    if (isAdDomain(hostname)) {
      return 'advertisement';
    }
    
    // マルウェアチェック
    if (isMalicious(hostname)) {
      return 'malicious';
    }
    
    // カスタムブラックリスト
    if (isBlacklisted(hostname, urlObj.pathname)) {
      return 'blacklisted';
    }
    
    return null;
  } catch {
    return null;
  }
}

/**
 * 広告ドメイン判定
 */
function isAdDomain(hostname) {
  return AD_DOMAINS.some(ad => hostname.includes(ad));
}

/**
 * マルウェア判定
 */
function isMalicious(hostname) {
  return MALICIOUS_DOMAINS.some(mal => hostname.includes(mal));
}

/**
 * ブラックリスト判定
 */
function isBlacklisted(hostname, pathname) {
  return customBlacklist.some(entry => {
    if (entry.type === 'domain') {
      return hostname === entry.value || hostname.endsWith('.' + entry.value);
    }
    if (entry.type === 'pattern') {
      const regex = new RegExp(entry.value, 'i');
      return regex.test(hostname + pathname);
    }
    if (entry.type === 'exact') {
      return (hostname + pathname) === entry.value;
    }
    return false;
  });
}

/**
 * ブラックリスト追加
 */
function addToBlacklist(entry) {
  if (!entry.type || !entry.value) {
    throw new Error('Invalid blacklist entry');
  }
  
  customBlacklist.push({
    type: entry.type, // 'domain', 'pattern', 'exact'
    value: entry.value,
    reason: entry.reason || 'User defined',
    addedAt: Date.now()
  });
  
  console.log(`➕ Added to blacklist: ${entry.value}`);
}

/**
 * ブラックリスト削除
 */
function removeFromBlacklist(value) {
  const before = customBlacklist.length;
  customBlacklist = customBlacklist.filter(e => e.value !== value);
  const removed = before - customBlacklist.length;
  
  if (removed > 0) {
    console.log(`➖ Removed from blacklist: ${value}`);
  }
  
  return removed;
}

/**
 * ブラックリスト取得
 */
function getBlacklist() {
  return [...customBlacklist];
}

/**
 * 統計情報
 */
function getStats() {
  return {
    adDomains: AD_DOMAINS.length,
    maliciousDomains: MALICIOUS_DOMAINS.length,
    customBlacklist: customBlacklist.length,
    total: AD_DOMAINS.length + MALICIOUS_DOMAINS.length + customBlacklist.length
  };
}

// 初期化実行
initialize();

module.exports = {
  shouldBlock,
  addToBlacklist,
  removeFromBlacklist,
  getBlacklist,
  getStats
};
