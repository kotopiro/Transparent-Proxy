// ========================================
// Crypto Utils - URL暗号化・難読化
// ========================================

const crypto = require('crypto');

// XOR暗号化キー（環境変数から取得、なければデフォルト）
const XOR_KEY = process.env.XOR_KEY || 'TransparentProxy2024';

/**
 * URLエンコード方式
 */
const ENCODING_METHODS = {
  BASE64: 'base64',
  XOR: 'xor',
  AES: 'aes',
  PLAIN: 'plain'
};

/**
 * URLをエンコード
 */
function encodeUrl(url, method = 'base64') {
  switch (method.toLowerCase()) {
    case 'base64':
      return encodeBase64(url);
    case 'xor':
      return encodeXOR(url);
    case 'aes':
      return encodeAES(url);
    case 'plain':
      return url;
    default:
      return encodeBase64(url);
  }
}

/**
 * URLをデコード
 */
function decodeUrl(encoded) {
  // 自動検出してデコード
  
  // Base64チェック（標準的なBase64文字のみ）
  if (/^[A-Za-z0-9+/]+=*$/.test(encoded)) {
    try {
      const decoded = decodeBase64(encoded);
      if (isValidUrl(decoded)) return decoded;
    } catch {}
  }
  
  // XORチェック（16進数文字列）
  if (/^[0-9a-fA-F]+$/.test(encoded) && encoded.length % 2 === 0) {
    try {
      const decoded = decodeXOR(encoded);
      if (isValidUrl(decoded)) return decoded;
    } catch {}
  }
  
  // AESチェック（iv:encrypted形式）
  if (encoded.includes(':')) {
    try {
      const decoded = decodeAES(encoded);
      if (isValidUrl(decoded)) return decoded;
    } catch {}
  }
  
  // プレーンURL
  if (isValidUrl(encoded)) {
    return encoded;
  }
  
  // すべて失敗
  return null;
}

/**
 * Base64エンコード
 */
function encodeBase64(str) {
  return Buffer.from(str, 'utf-8').toString('base64');
}

/**
 * Base64デコード
 */
function decodeBase64(str) {
  return Buffer.from(str, 'base64').toString('utf-8');
}

/**
 * XORエンコード（16進数文字列として出力）
 */
function encodeXOR(str) {
  const key = XOR_KEY;
  const result = [];
  
  for (let i = 0; i < str.length; i++) {
    const charCode = str.charCodeAt(i) ^ key.charCodeAt(i % key.length);
    result.push(charCode.toString(16).padStart(2, '0'));
  }
  
  return result.join('');
}

/**
 * XORデコード
 */
function decodeXOR(encoded) {
  const key = XOR_KEY;
  const result = [];
  
  for (let i = 0; i < encoded.length; i += 2) {
    const charCode = parseInt(encoded.substr(i, 2), 16);
    const decoded = charCode ^ key.charCodeAt((i / 2) % key.length);
    result.push(String.fromCharCode(decoded));
  }
  
  return result.join('');
}

/**
 * AES-256-CBC エンコード
 */
function encodeAES(str) {
  const key = crypto.scryptSync(XOR_KEY, 'salt', 32);
  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(str, 'utf-8', 'hex');
  encrypted += cipher.final('hex');
  
  // iv:encrypted形式で返す
  return iv.toString('hex') + ':' + encrypted;
}

/**
 * AES-256-CBC デコード
 */
function decodeAES(encrypted) {
  const [ivHex, encryptedHex] = encrypted.split(':');
  
  if (!ivHex || !encryptedHex) {
    throw new Error('Invalid AES format');
  }
  
  const key = crypto.scryptSync(XOR_KEY, 'salt', 32);
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf-8');
  decrypted += decipher.final('utf-8');
  
  return decrypted;
}

/**
 * URL検証
 */
function isValidUrl(str) {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * ランダムな方式でエンコード（フィルター回避用）
 */
function encodeUrlRandom(url) {
  const methods = ['base64', 'xor', 'aes'];
  const randomMethod = methods[Math.floor(Math.random() * methods.length)];
  
  const encoded = encodeUrl(url, randomMethod);
  
  return {
    encoded,
    method: randomMethod
  };
}

/**
 * ハッシュ生成（キャッシュキー用）
 */
function generateHash(str, algorithm = 'md5') {
  return crypto.createHash(algorithm).update(str).digest('hex');
}

/**
 * HMAC生成（署名用）
 */
function generateHMAC(data, secret = XOR_KEY) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * HMAC検証
 */
function verifyHMAC(data, signature, secret = XOR_KEY) {
  const expected = generateHMAC(data, secret);
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

module.exports = {
  encodeUrl,
  decodeUrl,
  encodeBase64,
  decodeBase64,
  encodeXOR,
  decodeXOR,
  encodeAES,
  decodeAES,
  encodeUrlRandom,
  generateHash,
  generateHMAC,
  verifyHMAC,
  ENCODING_METHODS
};
