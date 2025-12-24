// ========================================
// CAPTCHA Solver - CAPTCHA自動突破
// ========================================

/**
 * CAPTCHA解決（基本実装）
 * 
 * 注意: 完全なCAPTCHA突破は複雑で、多くの場合は外部サービス（2Captcha等）が必要。
 * ここでは基本的なCloudflare Challenge突破のみ実装。
 */

const fetch = require('node-fetch');

/**
 * CAPTCHAを解決
 */
async function solveCaptcha(url, response) {
  try {
    const html = await response.text();
    
    // Cloudflare Challengeチェック
    if (isCloudflareChallenge(html)) {
      console.log('🔓 Cloudflare challenge detected');
      return await solveCloudflareChallenge(url, html);
    }
    
    // hCAPTCHAチェック
    if (isHCaptcha(html)) {
      console.log('🔓 hCAPTCHA detected');
      return await solveHCaptcha(url, html);
    }
    
    // reCAPTCHAチェック
    if (isRecaptcha(html)) {
      console.log('🔓 reCAPTCHA detected');
      return await solveRecaptcha(url, html);
    }
    
    return false;
  } catch (error) {
    console.error('❌ CAPTCHA solve error:', error.message);
    return false;
  }
}

/**
 * Cloudflare Challenge検出
 */
function isCloudflareChallenge(html) {
  return html.includes('Checking your browser') || 
         html.includes('Just a moment') ||
         html.includes('cf-browser-verification');
}

/**
 * hCAPTCHA検出
 */
function isHCaptcha(html) {
  return html.includes('hcaptcha.com') || html.includes('h-captcha');
}

/**
 * reCAPTCHA検出
 */
function isRecaptcha(html) {
  return html.includes('google.com/recaptcha') || html.includes('g-recaptcha');
}

/**
 * Cloudflare Challenge解決
 * 
 * Cloudflareの"Checking your browser"チャレンジは、
 * JavaScriptチャレンジを解いてCookieを取得する必要がある。
 * 
 * 完全な実装には以下が必要:
 * 1. HTMLからJavaScriptチャレンジを抽出
 * 2. JavaScriptを実行してトークン生成
 * 3. トークンと共に再リクエスト
 */
async function solveCloudflareChallenge(url, html) {
  console.log('⚠️ Cloudflare challenge solving is complex and not fully implemented');
  console.log('💡 Consider using a headless browser (Puppeteer) for full support');
  
  // 簡易実装: 5秒待ってリトライ（Cloudflareの待機時間）
  await sleep(5000);
  
  // TODO: 完全実装
  // - HTMLからチャレンジスクリプト抽出
  // - VM環境でJavaScript実行
  // - cf_clearanceクッキー取得
  
  return false;
}

/**
 * hCAPTCHA解決
 * 
 * hCAPTCHAの解決には以下の方法がある:
 * 1. 外部サービス（2Captcha, Anti-Captcha等）
 * 2. 機械学習モデル（精度は低い）
 * 3. ユーザーに解かせる（Proxyの場合は現実的でない）
 */
async function solveHCaptcha(url, html) {
  console.log('⚠️ hCAPTCHA solving requires external service or ML model');
  console.log('💡 Options:');
  console.log('   - 2Captcha API: https://2captcha.com');
  console.log('   - Anti-Captcha API: https://anti-captcha.com');
  
  // TODO: 外部サービス統合
  // const siteKey = extractHCaptchaSiteKey(html);
  // const token = await call2CaptchaAPI(siteKey, url);
  // return token;
  
  return false;
}

/**
 * reCAPTCHA解決
 */
async function solveRecaptcha(url, html) {
  console.log('⚠️ reCAPTCHA solving requires external service');
  console.log('💡 Same as hCAPTCHA - use 2Captcha or Anti-Captcha');
  
  // TODO: 外部サービス統合
  
  return false;
}

/**
 * 2Captcha API呼び出し（サンプル）
 */
async function call2CaptchaAPI(siteKey, pageUrl) {
  const API_KEY = process.env.CAPTCHA_API_KEY;
  
  if (!API_KEY) {
    console.warn('⚠️ CAPTCHA_API_KEY not set in environment variables');
    return null;
  }
  
  try {
    // ステップ1: CAPTCHAタスク送信
    const taskResponse = await fetch('https://2captcha.com/in.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        key: API_KEY,
        method: 'hcaptcha',
        sitekey: siteKey,
        pageurl: pageUrl,
        json: 1
      })
    });
    
    const taskData = await taskResponse.json();
    
    if (taskData.status !== 1) {
      throw new Error(taskData.request);
    }
    
    const taskId = taskData.request;
    
    // ステップ2: 結果を待つ（ポーリング）
    for (let i = 0; i < 30; i++) {
      await sleep(5000); // 5秒待機
      
      const resultResponse = await fetch(
        `https://2captcha.com/res.php?key=${API_KEY}&action=get&id=${taskId}&json=1`
      );
      
      const resultData = await resultResponse.json();
      
      if (resultData.status === 1) {
        return resultData.request; // トークン
      }
      
      if (resultData.request !== 'CAPCHA_NOT_READY') {
        throw new Error(resultData.request);
      }
    }
    
    throw new Error('Timeout waiting for CAPTCHA solution');
    
  } catch (error) {
    console.error('❌ 2Captcha API error:', error.message);
    return null;
  }
}

/**
 * スリープ
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * hCAPTCHA sitekey抽出
 */
function extractHCaptchaSiteKey(html) {
  const match = html.match(/data-sitekey=["']([^"']+)["']/);
  return match ? match[1] : null;
}

/**
 * reCAPTCHA sitekey抽出
 */
function extractRecaptchaSiteKey(html) {
  const match = html.match(/data-sitekey=["']([^"']+)["']/) ||
                html.match(/\?k=([^&"']+)/);
  return match ? match[1] : null;
}

module.exports = {
  solveCaptcha
};
