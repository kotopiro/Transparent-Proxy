# 🔧 Transparent Proxy Worker

Cloudflare Workers で動作するプロキシバックエンド

---

## 📦 セットアップ

### 1. Wrangler インストール

```bash
npm install -g wrangler
```

### 2. ログイン

```bash
wrangler login
```

ブラウザが開くので「Allow」をクリック

### 3. デプロイ

```bash
wrangler deploy
```

### 4. Worker URL を確認

デプロイ成功後に表示される URL をコピー:

```
https://transparent-proxy-worker.your-subdomain.workers.dev
```

---

## ⚙️ 設定

### wrangler.toml

```toml
name = "transparent-proxy-worker"
main = "index.js"
compatibility_date = "2024-01-01"

[env.production]
workers_dev = false
```

### カスタムドメイン（オプション）

```toml
routes = [
  { pattern = "proxy.yourdomain.com/*", custom_domain = true }
]
```

---

## 🚀 機能

### コア機能
- ✅ プロキシリクエスト処理
- ✅ HTML/CSS/JavaScript書き換え
- ✅ 広告ブロック
- ✅ キャッシュ
- ✅ CORS対応

### 広告ブロック
以下のドメインを自動ブロック:
- doubleclick.net
- googlesyndication.com
- googleadservices.com
- facebook.net
- analytics.google.com
- その他多数

### HTML書き換え
- 相対URL → 絶対URL
- `<base>` タグ注入
- CSPメタタグ削除
- X-Frame-Options削除
- インラインスタイルのurl()修正
- フォームaction修正
- JavaScript書き換え防止スクリプト注入

---

## 📊 パフォーマンス

### レスポンス時間
- キャッシュヒット: **< 50ms**
- キャッシュミス: **200-500ms**

### スループット
- 無料プラン: **100,000リクエスト/日**
- 有料プラン: **10,000,000リクエスト/月**

---

## 🔍 デバッグ

### ローカル開発

```bash
wrangler dev
```

ローカルサーバーが起動: `http://localhost:8787`

### ログ確認

```bash
wrangler tail
```

リアルタイムでログを表示

---

## 🐛 トラブルシューティング

### エラー: "Error: No account_id found"

```bash
wrangler login
```

### エラー: "Error: Script already exists"

`wrangler.toml` の `name` を変更

### エラー: "Error: Authentication failed"

```bash
wrangler logout
wrangler login
```

---

## 📝 API仕様

### エンドポイント

**ヘルスチェック**
```
GET /
```

レスポンス:
```
🚀 Transparent Proxy Worker - Ultimate Edition
```

---

**プロキシリクエスト**
```
GET /proxy/{base64_url}
```

パラメータ:
- `base64_url`: Base64エンコードされたURL

例:
```
GET /proxy/aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbQ==
```

レスポンス: プロキシされたコンテンツ

---

## 🔒 セキュリティ

### 実装済み
- ✅ CORS ヘッダー
- ✅ User-Agent偽装
- ✅ Referer削除
- ✅ トラッキングブロック

### 制限事項
- ❌ WebSocket非対応
- ❌ DRM保護コンテンツ非対応
- ❌ 一部のSPA非対応

---

## 📊 監視

### Cloudflare Dashboard
1. https://dash.cloudflare.com にログイン
2. 「Workers & Pages」→ Worker名をクリック
3. 「Metrics」タブで確認:
   - リクエスト数
   - エラー率
   - CPU時間
   - データ転送量

---

## 🚀 本番環境

### 環境変数（オプション）

```bash
wrangler secret put ADMIN_KEY
```

`index.js` で使用:
```javascript
const adminKey = env.ADMIN_KEY;
```

### カスタムドメイン設定

1. Cloudflare で DNS レコード追加
2. `wrangler.toml` に追加:
```toml
routes = [
  { pattern = "proxy.yourdomain.com/*", custom_domain = true }
]
```
3. デプロイ

---

## 📈 スケーリング

### 無料プラン
- 100,000リクエスト/日
- 10ms CPU時間/リクエスト
- 無制限帯域幅

### 有料プラン（$5/月）
- 10,000,000リクエスト/月
- 50ms CPU時間/リクエスト
- 無制限帯域幅

---

## 🤝 コントリビューション

改善案があれば Issue または PR で！

---

## 📄 ライセンス

MIT License - 親プロジェクトと同じ
