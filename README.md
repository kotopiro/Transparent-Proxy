# 🚀 Transparent Proxy

**超高速・広告ブロック・ステルスモード搭載のWebプロキシ**

Shadow Proxy、Interstellar Proxy、Ultraviolet、Wakame Proxy と同等の機能を持つ、完全日本語対応の次世代Webプロキシです。

---

## ✨ 特徴

### 🎯 コア機能
- 🔒 **ステルスモード** - User-Agent偽装、Referer削除、トラッキング防止
- 🚫 **広告ブロック** - 広告ドメイン自動ブロック、トラッキングスクリプト削除
- 🪟 **about:blank表示** - 学校・企業のフィルタリング回避
- ⚡ **超高速** - Cloudflare Workers + キャッシュで爆速
- 🎨 **高級UI** - グラスモーフィズム、ネオングロー、スムーズアニメーション
- 📱 **PWA対応** - スマホにインストール可能

### 🛠️ 高度な機能
- 📑 **タブ機能** - 複数ページを同時に開ける
- 📜 **履歴管理** - 訪問したページを記録
- ⭐ **ブックマーク** - お気に入りのページを保存
- ⚙️ **設定** - 検索エンジン、広告ブロック、キャッシュの切り替え
- ⌨️ **ショートカット** - Ctrl+T, Ctrl+W など完備
- 🌐 **多言語検索** - Google, DuckDuckGo, Bing, Yahoo! JAPAN

---

## 🚀 デプロイ方法

### 方法1: Render（推奨 - 自動デプロイ）

1. **GitHub でフォーク**
   ```bash
   https://github.com/your-username/transparent-proxy
   ```

2. **Render に接続**
   - [Render](https://render.com) にアクセス
   - 「New +」→「Static Site」
   - GitHub リポジトリを選択
   - 「Create Static Site」

3. **完了！**
   - 自動でデプロイされます
   - URL が発行されます（例: `https://transparent-proxy.onrender.com`）

---

### 方法2: InfinityFree（無料独自ドメイン）

1. **ファイルをダウンロード**
   - 緑の「Code」ボタン → 「Download ZIP」
   - ZIPを解凍

2. **InfinityFree にアップロード**
   - [InfinityFree](https://infinityfree.net) でアカウント作成
   - File Manager → `htdocs` フォルダを開く
   - すべてのファイルをアップロード

3. **Worker URL を設定**
   - `app.js` の1行目を編集
   ```javascript
   const CONFIG = {
       WORKER_URL: 'https://your-worker.workers.dev',
       ...
   ```

4. **完了！**
   - 独自ドメインで公開されます

---

### 方法3: Cloudflare Pages（最速）

1. **GitHub に push**
   ```bash
   git clone https://github.com/your-username/transparent-proxy
   cd transparent-proxy
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Cloudflare Pages に接続**
   - [Cloudflare Dashboard](https://dash.cloudflare.com) にログイン
   - 「Workers & Pages」→「Create application」→「Pages」
   - GitHub リポジトリを選択
   - 「Begin setup」

3. **ビルド設定**
   ```
   Build command: (空欄)
   Build output directory: /
   ```

4. **完了！**
   - 爆速で公開されます

---

## 🔧 Cloudflare Worker のセットアップ

### 前提条件
- Node.js 18以上
- npm または yarn

### 手順

1. **Wrangler インストール**
   ```bash
   npm install -g wrangler
   ```

2. **ログイン**
   ```bash
   wrangler login
   ```

3. **Worker をデプロイ**
   ```bash
   cd worker
   wrangler deploy
   ```

4. **Worker URL をコピー**
   - 例: `https://transparent-proxy-worker.your-subdomain.workers.dev`

5. **フロントエンドに設定**
   - `app.js` の1行目を編集
   ```javascript
   WORKER_URL: 'https://transparent-proxy-worker.your-subdomain.workers.dev'
   ```

---

## ⚙️ 設定ファイル

### app.js
```javascript
const CONFIG = {
    WORKER_URL: 'https://your-worker.workers.dev',  // ← 必須: あなたのWorker URL
    SEARCH_ENGINES: {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q=',
        yahoo: 'https://search.yahoo.co.jp/search?p='
    },
    DEFAULT_SEARCH: 'google',
    CACHE_TTL: 3600000,  // キャッシュ有効期限（ミリ秒）
    MAX_HISTORY: 100,     // 最大履歴数
    ABOUT_BLANK: true     // about:blank で開くか
};
```

---

## ⌨️ ショートカットキー

| キー | 機能 |
|------|------|
| `Ctrl + T` | 新しいタブを開く |
| `Ctrl + W` | タブを閉じる |
| `Ctrl + R` | 再読み込み |
| `Ctrl + L` | URLバーにフォーカス |
| `Ctrl + H` | 履歴を開く |
| `Ctrl + B` | ブックマークを開く |
| `Ctrl + D` | 現在のページをブックマーク |
| `F11` | フルスクリーン切り替え |

---

## 🛡️ プライバシー

### 収集するデータ
- **なし** - すべてローカルで処理されます

### 保存されるデータ
- 履歴・ブックマーク → ブラウザのlocalStorage（端末内）
- 設定 → ブラウザのlocalStorage（端末内）

### 外部送信
- **なし** - すべての通信はCloudflare Workers経由

---

## 🔒 セキュリティ

### 実装済み
- ✅ HTTPS強制
- ✅ CSP削除（iframe表示用）
- ✅ X-Frame-Options削除
- ✅ User-Agent偽装
- ✅ Referer削除
- ✅ トラッキング防止

### 注意事項
- ⚠️ DRM保護コンテンツ（Netflix、YouTube Premium等）は再生できません
- ⚠️ ログインが必要なサイトは動作しない場合があります
- ⚠️ 一部のSPAは完全に動作しない可能性があります

---

## 🤝 コントリビューション

プルリクエスト大歓迎！

### 開発環境
```bash
# クローン
git clone https://github.com/kotopiro/Transparent-Proxy
cd transparent-proxy

# Worker開発
cd worker
npm install
wrangler dev

# フロントエンド開発
# Live Serverなどで index.html を開く
```

### コーディング規約
- インデント: スペース4つ
- 命名: camelCase
- コメント: 日本語OK

---

## 🌟 類似プロジェクト

- [Shadow Proxy](https://github.com/nebulaservices/shadow)
- [Interstellar Proxy](https://github.com/InterstellarNetwork/Interstellar)
- [Ultraviolet](https://github.com/titaniumnetwork-dev/Ultraviolet)
- [Nebula](https://github.com/nebulaservices/nebula)
- [Holy Unblocker](https://github.com/holy-unblocker/website)

---

## 📞 サポート

### 問題が発生した場合
1. [Issues](https://github.com/kotopiro/Transparent-Proxy/issues) で検索
2. 新しいIssueを作成
3. 以下を含める:
   - 問題の説明
   - 再現手順
   - ブラウザ・OSのバージョン
   - スクリーンショット

### よくある質問

**Q: YouTubeの動画が再生できません**  
A: DRM保護のため、一部の動画は再生できません。トップページの閲覧は可能です。

**Q: ログインできません**  
A: Cookieの分離により、一部のサイトはログインできません。

**Q: 画像が表示されません**  
A: 相対パスの書き換えに失敗している可能性があります。Issueで報告してください。

**Q: ポップアップがブロックされます**  
A: ブラウザの設定で、このサイトのポップアップを許可してください。

---

## 🎉 謝辞

- Cloudflare Workers
- Ultraviolet プロジェクト
- TitaniumNetwork
- すべてのコントリビューター

---

## 📊 統計

![GitHub Stars](https://img.shields.io/github/stars/kotopiro/Transparent-Proxy?style=social)
![GitHub Forks](https://img.shields.io/github/forks/kotopiro/Transparent-Proxy?style=social)
![GitHub Issues](https://img.shields.io/github/issues/kotopiro/Transparent-Proxy)
![GitHub License](https://img.shields.io/github/license/kotopiro/Transparent-Proxy)

---

**作成者: [kotopiro(Takorou(uioik))](https://github.com/kotopiro)**  
**バージョン: 2.0.0**  
**最終更新: 2025年12月**
