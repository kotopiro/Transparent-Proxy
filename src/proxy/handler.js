// ========================================
// Proxy Handler - プロキシリクエスト処理
// ========================================

const fetch = require('node-fetch');
const { rewriteHTML, rewriteCSS } = require('./rewriter');
const { shouldBlock } = require('./blocker');
const { getFromCache, setToCache } = require('./cache');
const { solveCaptcha } = require('./captcha');
const { decodeUrl } = require('../utils/crypto');

// タイムアウト設定
const FETCH_TIMEOUT = 30000; // 30秒

// User-Agent
const USER_AGENTS = {
  chrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  firefox: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  safari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
};

/**
 * プロキシリクエストを処理
 */
async function handleProxyRequest(req, res) {
  const startTime = Date.now();
  
  try {
    // URLデコード（Base64 or XOR）
    const targetUrl = decodeUrl(req.params.encodedUrl);
    
    if (!targetUrl) {
      return res.status(400).json({ error: 'Invalid URL encoding' });
    }
    
    // URL検証
    if (!isValidUrl(targetUrl)) {
      return res.status(400).json({ error: 'Invalid URL' });
    }
    
    // ブロックチェック
    const blockReason = shouldBlock(targetUrl);
    if (blockReason) {
      console.log(`🚫 Blocked: ${targetUrl} (${blockReason})`);
      return res.status(403).json({ 
        error: 'Blocked', 
        reason: blockReason,
        message: 'このサイトへのアクセスはブロックされています'
      });
    }
    
    console.log(`🌐 Proxying: ${targetUrl}`);
    
    // キャッシュチェック
    const cached = await getFromCache(targetUrl);
    if (cached) {
      console.log('📦 Cache hit');
      res.set(cached.headers);
      res.set('X-Cache', 'HIT');
      return res.send(cached.body);
    }
    
    // リクエスト実行
    const response = await fetchWithRetry(targetUrl, req);
    
    if (!response) {
      throw new Error('Fetch failed after retries');
    }
    
    // CAPTCHA検出と解決
    const contentType = response.headers.get('content-type') || '';
    if (isCaptchaPage(response, contentType)) {
      console.log('🤖 CAPTCHA detected, attempting to solve...');
      const solved = await solveCaptcha(targetUrl, response);
      if (solved) {
        // 再リクエスト
        return handleProxyRequest(req, res);
      }
    }
    
    // レスポンス処理
    const result = await processResponse(response, targetUrl);
    
    // キャッシュ保存
    if (response.status === 200 && result.cacheable) {
      await setToCache(targetUrl, {
        headers: result.headers,
        body: result.body
      });
    }
    
    // レスポンス送信
    res.set(result.headers);
    res.set('X-Proxy-Time', `${Date.now() - startTime}ms`);
    res.set('X-Cache', 'MISS');
    res.send(result.body);
    
  } catch (error) {
    console.error('❌ Proxy error:', error.message);
    res.status(500).json({
      error: 'Proxy Error',
      message: error.message,
      timestamp: Date.now()
    });
  }
}

/**
 * リトライ機能付きフェッチ
 */
async function fetchWithRetry(url, req, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const headers = buildHeaders(req);
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
      
      const response = await fetch(url, {
        method: req.method,
        headers,
        body: req.body,
        redirect: 'follow',
        signal: controller.signal
      });
      
      clearTimeout(timeout);
      return response;
      
    } catch (error) {
      console.warn(`⚠️ Fetch attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) throw error;
      
      // 指数バックオフ
      await sleep(Math.pow(2, i) * 1000);
    }
  }
}

/**
 * ヘッダー構築
 */
function buildHeaders(req) {
  const headers = {
    'User-Agent': USER_AGENTS.chrome,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'ja,en-US;q=0.9,en;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'DNT': '1',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none'
  };
  
  // Cookie転送
  if (req.headers.cookie) {
    headers['Cookie'] = req.headers.cookie;
  }
  
  // Range転送（動画対応）
  if (req.headers.range) {
    headers['Range'] = req.headers.range;
  }
  
  return headers;
}

/**
 * レスポンス処理
 */
async function processResponse(response, targetUrl) {
  const contentType = response.headers.get('content-type') || '';
  const origin = new URL(targetUrl).origin;
  
  // ヘッダー準備
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'X-Powered-By': 'Transparent-Proxy-v2.1',
    'Content-Type': contentType
  };
  
  // Cookie転送
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    headers['Set-Cookie'] = setCookie;
  }
  
  let body;
  let cacheable = false;
  
  // HTML書き換え
  if (contentType.includes('text/html')) {
    const html = await response.text();
    body = await rewriteHTML(html, origin);
    cacheable = true;
  }
  // CSS書き換え
  else if (contentType.includes('text/css')) {
    const css = await response.text();
    body = rewriteCSS(css, origin);
    cacheable = true;
  }
  // バイナリ
  else {
    body = await response.buffer();
    cacheable = contentType.includes('image') || contentType.includes('font');
  }
  
  return { headers, body, cacheable };
}

/**
 * CAPTCHA検出
 */
function isCaptchaPage(response, contentType) {
  if (!contentType.includes('text/html')) return false;
  
  // Cloudflare CAPTCHA
  if (response.headers.get('cf-ray')) {
    return response.status === 403;
  }
  
  // hCAPTCHA検出
  // TODO: HTML解析で検出
  
  return false;
}

/**
 * URL検証
 */
function isValidUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * スリープ
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  handleProxyRequest
};
