// ========================================
// Proxy Manager - プロキシエンジン
// ========================================

class ProxyManager {
    constructor() {
        this.proxyEndpoint = '/proxy/';
        this.cache = new Map();
        this.cacheTTL = 3600000; // 1時間
    }
    
    init() {
        console.log('🌐 Proxy Manager 初期化完了');
    }
    
    // ========== メインナビゲーション ==========
    
    navigate() {
        const urlInput = document.getElementById('urlInput');
        if (!urlInput) return;
        
        let input = urlInput.value.trim();
        if (!input) return;
        
        let targetUrl;
        
        // URL or 検索クエリ判定
        if (input.match(/^https?:\/\//)) {
            targetUrl = input;
        } else if (input.includes('.') && !input.includes(' ')) {
            targetUrl = 'https://' + input;
        } else {
            const searchEngine = window.settingsManager.getSearchEngine();
            targetUrl = searchEngine + encodeURIComponent(input);
        }
        
        this.loadUrl(targetUrl);
    }
    
    loadUrl(url) {
        const tab = window.tabManager.getActiveTab();
        if (!tab) {
            console.error('アクティブなタブがありません');
            return;
        }
        
        console.log('🌐 Loading:', url);
        window.updateStatus('読み込み中...', 'var(--warning)');
        window.uiManager.incrementAccessCount();
        
        // Welcome画面を削除
        window.uiManager.hideWelcomeScreen();
        
        // 既存ウィンドウを閉じる
        if (tab.aboutBlankWindow && !tab.aboutBlankWindow.closed) {
            try {
                tab.aboutBlankWindow.close();
            } catch (e) {
                console.warn('ウィンドウクローズ失敗:', e);
            }
        }
        
        // プロキシURL生成
        const encodedUrl = btoa(url);
        const proxyUrl = `${this.proxyEndpoint}${encodedUrl}`;
        
        // タブ情報更新
        const hostname = this.getHostname(url);
        tab.url = url;
        tab.title = hostname;
        tab.favicon = window.tabManager.getFavicon(url);
        
        // 履歴追加
        window.historyManager.addToHistory(url, hostname);
        
        // タブバー更新
        window.tabManager.render();
        
        // about:blank で開く
        if (window.settingsManager.get('aboutBlank')) {
            this.openInAboutBlank(tab, url, proxyUrl);
        } else {
            this.openInIframe(tab, url, proxyUrl);
        }
    }
    
    // ========== about:blank 表示 ==========
    
    openInAboutBlank(tab, url, proxyUrl) {
        const blank = window.open('about:blank', '_blank', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
        
        if (!blank) {
            window.showToast('ポップアップがブロックされました', 'error');
            window.updateStatus('ポップアップがブロックされました', 'var(--danger)');
            return;
        }
        
        tab.aboutBlankWindow = blank;
        
        setTimeout(() => {
            if (blank.closed) {
                window.updateStatus('ウィンドウが閉じられました', 'var(--danger)');
                return;
            }
            
            blank.document.write(this.generateAboutBlankHTML(url, proxyUrl, tab.title));
            blank.document.close();
            
            window.updateStatus(`読み込み完了: ${tab.title}`, 'var(--success)');
        }, 100);
    }
    
    generateAboutBlankHTML(url, proxyUrl, title) {
        return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>HOME</title>
    <link rel="icon" type="image/x-icon" href="/assets/img/favicon.ico">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: linear-gradient(135deg, #05070f, #0a0e27);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            overflow: hidden;
        }
        .control-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(15, 20, 45, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0, 217, 255, 0.3);
            padding: 12px 20px;
            display: flex;
            gap: 12px;
            align-items: center;
            z-index: 99999;
            box-shadow: 0 4px 20px rgba(0, 217, 255, 0.2);
        }
        .url-display {
            flex: 1;
            background: rgba(0, 217, 255, 0.08);
            border: 1px solid rgba(0, 217, 255, 0.3);
            color: #00d9ff;
            padding: 10px 20px;
            border-radius: 24px;
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.3s;
        }
        .url-display:hover {
            background: rgba(0, 217, 255, 0.15);
            border-color: #00d9ff;
        }
        .btn {
            background: rgba(0, 217, 255, 0.1);
            border: 1px solid rgba(0, 217, 255, 0.3);
            color: #00d9ff;
            padding: 10px 16px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .btn:hover {
            background: rgba(0, 217, 255, 0.2);
            border-color: #00d9ff;
            transform: translateY(-2px);
        }
        .content {
            padding-top: 60px;
            height: 100vh;
        }
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #fff;
        }
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 9999;
        }
        .spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(0, 217, 255, 0.2);
            border-top: 3px solid #00d9ff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { color: #00d9ff; font-size: 14px; font-weight: 600; }
        .status {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(15, 20, 45, 0.95);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(0, 217, 255, 0.3);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 12px;
            color: #00d9ff;
            z-index: 9998;
        }
    </style>
</head>
<body>
    <div class="control-bar">
        <div class="url-display" onclick="copyUrl()" title="クリックでURLをコピー">${this.escapeHtml(url)}</div>
        <button class="btn" onclick="reload()" title="再読み込み (Ctrl+R)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
            </svg>
        </button>
        <button class="btn" onclick="openNew()" title="新しいウィンドウで開く">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
        </button>
        <button class="btn" onclick="window.close()" title="閉じる (Ctrl+W)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    </div>
    <div class="loading" id="loading">
        <div class="spinner"></div>
        <div class="loading-text">読み込み中...</div>
    </div>
    <div class="status" id="status">🔒 Transparent Proxy</div>
    <div class="content">
        <iframe src="${proxyUrl}" id="frame"></iframe>
    </div>
    <script>
        const originalUrl = '${url.replace(/'/g, "\\'")}';
        const frame = document.getElementById('frame');
        const loading = document.getElementById('loading');
        const status = document.getElementById('status');
        
        frame.onload = () => {
            loading.style.display = 'none';
            status.textContent = '✅ 読み込み完了';
            setTimeout(() => status.style.display = 'none', 3000);
        };
        
        frame.onerror = () => {
            loading.innerHTML = '<div style="color: #ff4444; font-size: 18px;">❌ 読み込みエラー</div>';
        };
        
        function reload() {
            loading.style.display = 'block';
            status.style.display = 'block';
            status.textContent = '🔄 再読み込み中...';
            frame.src = frame.src;
        }
        
        function copyUrl() {
            navigator.clipboard.writeText(originalUrl).then(() => {
                status.style.display = 'block';
                status.textContent = '✅ URLをコピーしました';
                setTimeout(() => status.style.display = 'none', 2000);
            });
        }
        
        function openNew() {
            window.open(originalUrl, '_blank');
        }
        
        // ショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                if (e.key === 'r') { e.preventDefault(); reload(); }
                if (e.key === 'w') { e.preventDefault(); window.close(); }
            }
        });
    </script>
</body>
</html>`;
    }
    
    // ========== iframe 表示（フォールバック） ==========
    
    openInIframe(tab, url, proxyUrl) {
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;
        
        window.uiManager.hideWelcomeScreen();
        
        const iframe = document.createElement('iframe');
        iframe.src = proxyUrl;
        iframe.onload = () => {
            window.updateStatus(`読み込み完了: ${tab.title}`, 'var(--success)');
        };
        iframe.onerror = () => {
            window.updateStatus('読み込みエラー', 'var(--danger)');
            window.showToast('ページの読み込みに失敗しました', 'error');
        };
        
        contentArea.appendChild(iframe);
    }
    
    // ========== その他の機能 ==========
    
    reloadCurrentTab() {
        const tab = window.tabManager.getActiveTab();
        if (!tab || !tab.url) {
            window.showToast('再読み込みするページがありません', 'warning');
            return;
        }
        
        this.loadUrl(tab.url);
    }
    
    getHostname(url) {
        try {
            return new URL(url).hostname;
        } catch {
            return 'Invalid URL';
        }
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    clearCache() {
        this.cache.clear();
        window.showToast('キャッシュをクリアしました', 'success');
    }
}

// グローバルインスタンス
window.proxyManager = new ProxyManager();
