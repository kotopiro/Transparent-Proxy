# 📡 API仕様書 - Transparent Proxy v2.1.0

このドキュメントでは、Transparent ProxyのAPIエンドポイントを説明します。

---

## 📋 目次

- [ベースURL](#ベースurl)
- [認証](#認証)
- [エンドポイント](#エンドポイント)
  - [ヘルスチェック](#ヘルスチェック)
  - [設定情報](#設定情報)
  - [プロキシ](#プロキシ)
- [エラーハンドリング](#エラーハンドリング)
- [レート制限](#レート制限)

---

## 🌐 ベースURL

```
本番: https://your-domain.com
開発: http://localhost:3000
```

---

## 🔐 認証

現在のバージョンでは認証は不要です。

将来のバージョンで以下を追加予定:
- APIキー認証
- OAuth 2.0
- JWT

---

## 📡 エンドポイント

### ヘルスチェック

サーバーの状態を確認します。

**エンドポイント:**
```
GET /health
```

**レスポンス:**
```json
{
  "status": "ok",
  "version": "2.1.0",
  "timestamp": "2024-12-24T12:00:00.000Z",
  "uptime": 12345.67
}
```

**ステータスコード:**
- `200` - サーバー正常
- `503` - サーバーエラー

**使用例:**
```bash
curl https://your-domain.com/health
```

---

### 設定情報

現在の設定を取得します。

**エンドポイント:**
```
GET /api/config
```

**レスポンス:**
```json
{
  "version": "2.1.0",
  "features": {
    "serviceWorker": true,
    "pwa": true,
    "history": true,
    "bookmarks": true,
    "aboutBlank": true,
    "particles": true
  },
  "ui": {
    "defaultTheme": "dark",
    "title": "HOME",
    "maxTabs": 20,
    "maxHistory": 100,
    "maxBookmarks": 50
  },
  "adblock": {
    "enabled": true
  },
  "captcha": {
    "enabled": false
  },
  "urlEncoding": {
    "enabled": true,
    "type": "base64"
  }
}
```

**ステータスコード:**
- `200` - 成功

**使用例:**
```bash
curl https://your-domain.com/api/config
```

---

### プロキシ

URLをプロキシ経由で取得します。

**エンドポイント:**
```
ALL /proxy/:encodedUrl
```

**パラメータ:**
- `encodedUrl` (required) - Base64エンコードされたURL

**リクエストメソッド:**
- `GET`, `POST`, `PUT`, `DELETE`, `PATCH`, `HEAD`, `OPTIONS`

**リクエストヘッダー:**
```
User-Agent: Mozilla/5.0 ...
Accept: text/html,application/xhtml+xml,...
Accept-Language: ja,en;q=0.9
```

**レスポンス:**
プロキシされたコンテンツ（HTML/CSS/JS/画像など）

**レスポンスヘッダー:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: *
Content-Type: text/html; charset=utf-8
```

**エラーレスポンス:**
```json
{
  "error": "プロキシエラーが発生しました",
  "message": "Invalid URL",
  "timestamp": "2024-12-24T12:00:00.000Z"
}
```

**ステータスコード:**
- `200` - 成功
- `400` - 無効なリクエスト
- `403` - ブロックされたドメイン
- `429` - レート制限超過
- `500` - サーバーエラー
- `502` - プロキシ先エラー
- `504` - タイムアウト

**使用例:**

```javascript
// JavaScriptから
const url = 'https://example.com';
const encodedUrl = btoa(url);
const proxyUrl = `https://your-domain.com/proxy/${encodedUrl}`;

fetch(proxyUrl)
  .then(response => response.text())
  .then(html => console.log(html));
```

```bash
# curlから
URL="https://example.com"
ENCODED=$(echo -n "$URL" | base64)
curl "https://your-domain.com/proxy/$ENCODED"
```

---

## ❌ エラーハンドリング

すべてのエラーは以下の形式で返されます:

```json
{
  "error": "エラータイプ",
  "message": "詳細メッセージ",
  "timestamp": "ISO 8601形式のタイムスタンプ"
}
```

### エラータイプ

| エラーコード | メッセージ | 原因 |
|------------|----------|------|
| `400` | Invalid URL | URLが不正 |
| `400` | Invalid Base64 encoding | Base64デコード失敗 |
| `403` | Blocked domain | ブラックリストに含まれる |
| `429` | Rate limit exceeded | レート制限超過 |
| `500` | Internal Server Error | サーバーエラー |
| `502` | Proxy target error | プロキシ先がエラー |
| `504` | Gateway Timeout | タイムアウト |

---

## 🚦 レート制限

無料プランでは以下の制限があります:

**制限:**
- **リクエスト数:** 100回/分
- **ウィンドウ:** 60秒
- **識別:** IPアドレス

**レート制限超過時:**
```json
{
  "error": "Rate limit exceeded",
  "message": "リクエストが多すぎます。しばらく待ってから再試行してください。",
  "retryAfter": 60,
  "timestamp": "2024-12-24T12:00:00.000Z"
}
```

**レスポンスヘッダー:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640350000
Retry-After: 60
```

---

## 📊 使用例

### 基本的な使い方

```javascript
async function fetchThroughProxy(url) {
  const encodedUrl = btoa(url);
  const proxyUrl = `https://your-domain.com/proxy/${encodedUrl}`;
  
  try {
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    console.error('Proxy error:', error);
    throw error;
  }
}

// 使用例
fetchThroughProxy('https://example.com')
  .then(html => console.log(html))
  .catch(error => console.error(error));
```

### エラーハンドリング付き

```javascript
async function safeProxyFetch(url) {
  const encodedUrl = btoa(url);
  const proxyUrl = `https://your-domain.com/proxy/${encodedUrl}`;
  
  try {
    const response = await fetch(proxyUrl);
    
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After') || 60;
      console.log(`Rate limited. Retry after ${retryAfter}s`);
      return null;
    }
    
    if (response.status === 403) {
      console.log('Domain is blocked');
      return null;
    }
    
    if (!response.ok) {
      const error = await response.json();
      console.error('Proxy error:', error);
      return null;
    }
    
    return await response.text();
  } catch (error) {
    console.error('Network error:', error);
    return null;
  }
}
```

---

## 🔜 将来の機能

### v2.2.0予定
- **認証API** - APIキー・OAuth対応
- **ユーザー管理** - アカウント作成・ログイン
- **統計API** - アクセスログ・使用量確認
- **Webhook** - プロキシイベント通知

### v3.0.0予定
- **GraphQL API** - 柔軟なクエリ
- **WebSocket** - リアルタイム通信
- **カスタムフィルター** - ユーザー定義ブロックリスト

---

## 📞 サポート

APIに関する質問:
- **Issues:** [GitHub Issues](https://github.com/kotopiro/Transparent-Proxy/issues)
- **Email:** takorou.0001@gmail.com

---

**API v2.1.0 - Last updated: 2024-12-24**
