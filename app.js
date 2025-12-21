const WORKER_URL = 'https://transparent-proxy-worker.mnxsv69789.workers.dev';
const SEARCH_ENGINE = 'https://www.google.com/search?q=';

let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let history = [];
let bookmarks = [];
let proxyMode = 'stealth'; // stealth, fast, normal
let aboutBlankMode = true; // 常にabout:blankで開く

console.log('🚀 Transparent Proxy - Ultimate Edition');
console.log('Worker URL:', WORKER_URL);
console.log('About:blank mode: ENABLED');

let urlInput, goBtn, reloadBtn, downloadBtn, newTabBtn, historyBtn, bookmarksBtn, contentArea, tabBar, statusBar;

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded');
    
    urlInput = document.getElementById('urlInput');
    goBtn = document.getElementById('goBtn');
    reloadBtn = document.getElementById('reloadBtn');
    downloadBtn = document.getElementById('downloadBtn');
    newTabBtn = document.getElementById('newTab');
    historyBtn = document.getElementById('history');
    bookmarksBtn = document.getElementById('bookmarks');
    contentArea = document.getElementById('contentArea');
    tabBar = document.getElementById('tabBar');
    
    if (!urlInput || !goBtn || !contentArea) {
        console.error('❌ Required elements missing');
        return;
    }
    
    setupEventListeners();
    createSidePanels();
    createStatusBar();
    createNewTab();
    
    // ショートカットキー
    setupShortcuts();
    
    console.log('✅ Ultimate Edition Ready!');
});

// イベントリスナー
function setupEventListeners() {
    goBtn.addEventListener('click', () => {
        console.log('🚀 GO clicked');
        navigate();
    });
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('⚡ Enter pressed');
            navigate();
        }
    });
    
    reloadBtn.addEventListener('click', () => {
        console.log('🔄 Reload');
        reloadCurrentTab();
    });
    
    downloadBtn.addEventListener('click', () => {
        console.log('⬇️ Download');
        downloadCurrent();
    });
    
    newTabBtn.addEventListener('click', () => {
        console.log('📄 New tab');
        createNewTab();
    });
    
    if (historyBtn) {
        historyBtn.addEventListener('click', () => openSidePanel('history'));
    }
    
    if (bookmarksBtn) {
        bookmarksBtn.addEventListener('click', () => openSidePanel('bookmarks'));
    }
}

// ショートカットキー
function setupShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Ctrl+T: 新しいタブ
        if (e.ctrlKey && e.key === 't') {
            e.preventDefault();
            createNewTab();
        }
        
        // Ctrl+W: タブを閉じる
        if (e.ctrlKey && e.key === 'w') {
            e.preventDefault();
            const tab = tabs.find(t => t.id === activeTabId);
            if (tab) closeTab(tab.id);
        }
        
        // Ctrl+R: リロード
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            reloadCurrentTab();
        }
        
        // Ctrl+L: URLバーにフォーカス
        if (e.ctrlKey && e.key === 'l') {
            e.preventDefault();
            urlInput.focus();
            urlInput.select();
        }
        
        // Ctrl+H: 履歴
        if (e.ctrlKey && e.key === 'h') {
            e.preventDefault();
            openSidePanel('history');
        }
        
        // Ctrl+B: ブックマーク
        if (e.ctrlKey && e.key === 'b') {
            e.preventDefault();
            openSidePanel('bookmarks');
        }
        
        // Ctrl+D: 現在のページをブックマーク
        if (e.ctrlKey && e.key === 'd') {
            e.preventDefault();
            const tab = tabs.find(t => t.id === activeTabId);
            if (tab && tab.url) {
                addBookmark(tab.url, tab.title);
            }
        }
    });
}

// ステータスバー作成
function createStatusBar() {
    statusBar = document.createElement('div');
    statusBar.className = 'status-bar';
    statusBar.innerHTML = `
        <div class="status-left">
            <span id="statusText">Ready</span>
        </div>
        <div class="status-right">
            <span style="margin-right: 15px;">Mode: <span id="proxyModeText" style="color: #00d9ff; font-weight: 600;">Stealth</span></span>
            <button class="icon-btn" onclick="toggleProxyMode()" title="プロキシモード切替" style="font-size: 14px; width: auto; padding: 4px 12px; height: auto;">🔒</button>
        </div>
    `;
    document.body.appendChild(statusBar);
}

// ステータス更新
function updateStatus(text, color = '#00d9ff') {
    const statusText = document.getElementById('statusText');
    if (statusText) {
        statusText.textContent = text;
        statusText.style.color = color;
    }
}

// プロキシモード切替
window.toggleProxyMode = function() {
    const modes = ['stealth', 'fast', 'normal'];
    const currentIndex = modes.indexOf(proxyMode);
    proxyMode = modes[(currentIndex + 1) % modes.length];
    
    const modeText = document.getElementById('proxyModeText');
    const modeNames = {
        stealth: 'Stealth 🔒',
        fast: 'Fast ⚡',
        normal: 'Normal 🌐'
    };
    
    if (modeText) {
        modeText.textContent = modeNames[proxyMode];
    }
    
    updateStatus(`Mode changed to ${proxyMode.toUpperCase()}`, '#00ff88');
    console.log('🔄 Proxy mode:', proxyMode);
};

// サイドパネル作成
function createSidePanels() {
    // 履歴パネル
    const historyPanel = document.createElement('div');
    historyPanel.id = 'historyPanel';
    historyPanel.className = 'side-panel';
    historyPanel.innerHTML = `
        <button class="side-panel-close" onclick="closeSidePanel('historyPanel')">×</button>
        <h2>📜 History</h2>
        <div id="historyList"></div>
        <button class="neon-btn" onclick="clearHistory()" style="margin-top: 20px; width: 100%;">Clear All</button>
    `;
    document.body.appendChild(historyPanel);
    
    // ブックマークパネル
    const bookmarksPanel = document.createElement('div');
    bookmarksPanel.id = 'bookmarksPanel';
    bookmarksPanel.className = 'side-panel';
    bookmarksPanel.innerHTML = `
        <button class="side-panel-close" onclick="closeSidePanel('bookmarksPanel')">×</button>
        <h2>⭐ Bookmarks</h2>
        <div id="bookmarksList"></div>
    `;
    document.body.appendChild(bookmarksPanel);
}

// サイドパネル開く
function openSidePanel(type) {
    const panelId = type === 'history' ? 'historyPanel' : 'bookmarksPanel';
    const panel = document.getElementById(panelId);
    
    document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
    panel.classList.add('open');
    
    if (type === 'history') {
        renderHistory();
    } else {
        renderBookmarks();
    }
}

window.closeSidePanel = function(panelId) {
    document.getElementById(panelId).classList.remove('open');
};

// 履歴描画
function renderHistory() {
    const listEl = document.getElementById('historyList');
    if (history.length === 0) {
        listEl.innerHTML = '<p style="color: rgba(0,217,255,0.5); text-align: center; padding: 20px;">No history yet</p>';
        return;
    }
    
    listEl.innerHTML = history.slice().reverse().map(item => `
        <div class="history-item" onclick="loadUrl('${item.url.replace(/'/g, "\\'")}')">
            <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(item.title)}</div>
            <div style="font-size: 12px; color: rgba(0,217,255,0.7); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.url)}</div>
            <div style="font-size: 11px; color: rgba(0,217,255,0.5);">${new Date(item.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

// ブックマーク描画
function renderBookmarks() {
    const listEl = document.getElementById('bookmarksList');
    if (bookmarks.length === 0) {
        listEl.innerHTML = '<p style="color: rgba(0,217,255,0.5); text-align: center; padding: 20px;">No bookmarks yet</p>';
        return;
    }
    
    listEl.innerHTML = bookmarks.map((item, index) => `
        <div class="bookmark-item" style="display: flex; align-items: center;">
            <div onclick="loadUrl('${item.url.replace(/'/g, "\\'")}'); closeSidePanel('bookmarksPanel');" style="flex: 1; cursor: pointer;">
                <div style="font-weight: 600; margin-bottom: 4px;">⭐ ${escapeHtml(item.title)}</div>
                <div style="font-size: 12px; color: rgba(0,217,255,0.7); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escapeHtml(item.url)}</div>
            </div>
            <button class="icon-btn" onclick="removeBookmark(${index})" style="margin-left: 10px; font-size: 16px;">🗑️</button>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 履歴追加
function addToHistory(url, title) {
    history.unshift({ url, title, timestamp: Date.now() });
    if (history.length > 100) history.pop();
}

window.clearHistory = function() {
    if (confirm('Clear all history?')) {
        history = [];
        renderHistory();
        updateStatus('History cleared', '#00ff88');
    }
};

// ブックマーク追加
function addBookmark(url, title) {
    if (bookmarks.some(b => b.url === url)) {
        updateStatus('Already bookmarked', '#ffaa00');
        return;
    }
    bookmarks.push({ url, title });
    updateStatus('Bookmarked!', '#00ff88');
}

window.removeBookmark = function(index) {
    bookmarks.splice(index, 1);
    renderBookmarks();
    updateStatus('Bookmark removed', '#ff6666');
};

// タブ作成
function createNewTab() {
    const tabId = tabIdCounter++;
    const tab = {
        id: tabId,
        url: '',
        title: 'New Tab',
        aboutBlankWindow: null
    };
    
    tabs.push(tab);
    renderTabBar();
    switchToTab(tabId);
    updateStatus('New tab created');
}

// タブバー描画
function renderTabBar() {
    if (!tabBar) return;
    
    tabBar.innerHTML = '';
    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
        
        const favicon = tab.url ? getFavicon(tab.url) : '📄';
        
        tabEl.innerHTML = `
            <span style="margin-right: 8px;">${favicon}</span>
            <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(tab.title)}</span>
            <span class="tab-close">×</span>
        `;
        
        tabEl.addEventListener('click', (e) => {
            if (e.target.classList.contains('tab-close')) {
                closeTab(tab.id);
            } else {
                switchToTab(tab.id);
            }
        });
        
        tabBar.appendChild(tabEl);
    });
}

function getFavicon(url) {
    try {
        const domain = new URL(url).hostname;
        if (domain.includes('google')) return '🔍';
        if (domain.includes('youtube')) return '📺';
        if (domain.includes('twitter') || domain.includes('x.com')) return '🐦';
        if (domain.includes('facebook')) return '👥';
        if (domain.includes('github')) return '💻';
        if (domain.includes('reddit')) return '🤖';
        if (domain.includes('wikipedia')) return '📖';
        return '🌐';
    } catch {
        return '🌐';
    }
}

// タブ切り替え
function switchToTab(tabId) {
    activeTabId = tabId;
    const tab = tabs.find(t => t.id === tabId);
    
    if (tab) {
        urlInput.value = tab.url;
        updateStatus(`Switched to: ${tab.title}`);
    }
    
    renderTabBar();
}

// タブを閉じる
function closeTab(tabId) {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    
    const tab = tabs[index];
    
    // about:blankウィンドウを閉じる
    if (tab.aboutBlankWindow && !tab.aboutBlankWindow.closed) {
        tab.aboutBlankWindow.close();
    }
    
    tabs.splice(index, 1);
    
    if (tabs.length === 0) {
        createNewTab();
    } else if (activeTabId === tabId) {
        switchToTab(tabs[Math.max(0, index - 1)].id);
    } else {
        renderTabBar();
    }
    
    updateStatus('Tab closed');
}

// ナビゲーション
function navigate() {
    let input = urlInput.value.trim();
    if (!input) return;
    
    let targetUrl;
    if (input.match(/^https?:\/\//)) {
        targetUrl = input;
    } else if (input.includes('.') && !input.includes(' ')) {
        targetUrl = 'https://' + input;
    } else {
        targetUrl = SEARCH_ENGINE + encodeURIComponent(input);
    }
    
    console.log('🌐 Navigate to:', targetUrl);
    loadUrl(targetUrl);
}

// URL読み込み（about:blank版 - わかめ/Shadow/Utopiaレベル）
function loadUrl(url) {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    
    updateStatus('Loading...', '#ffaa00');
    
    // 既存のウィンドウを閉じる
    if (tab.aboutBlankWindow && !tab.aboutBlankWindow.closed) {
        tab.aboutBlankWindow.close();
    }
    
    // プロキシURL生成
    const encodedUrl = btoa(url);
    const proxyUrl = `${WORKER_URL}/proxy/${encodedUrl}`;
    
    console.log('🔗 Proxy URL:', proxyUrl);
    
    // about:blankウィンドウを開く
    const blank = window.open('about:blank', '_blank', 'width=1280,height=720');
    tab.aboutBlankWindow = blank;
    
    if (!blank) {
        alert('❌ ポップアップがブロックされました。ブラウザの設定でポップアップを許可してください。');
        updateStatus('Popup blocked', '#ff0000');
        return;
    }
    
    // タブ情報更新
    tab.url = url;
    tab.title = new URL(url).hostname;
    addToHistory(url, tab.title);
    renderTabBar();
    
    // about:blank内にHTMLを注入
    setTimeout(() => {
        if (blank.closed) {
            updateStatus('Window closed', '#ff6666');
            return;
        }
        
        blank.document.write(`
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(tab.title)} - Transparent Proxy</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            overflow: hidden; 
            background: linear-gradient(135deg, #0a0e27 0%, #1a1a2e 100%);
            font-family: 'Segoe UI', system-ui, sans-serif;
        }
        
        /* 上部コントロールバー */
        .control-bar {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: rgba(15, 20, 45, 0.95);
            backdrop-filter: blur(20px);
            border-bottom: 2px solid rgba(0, 217, 255, 0.3);
            padding: 12px 20px;
            display: flex;
            gap: 12px;
            z-index: 999999;
            box-shadow: 0 4px 20px rgba(0, 217, 255, 0.2);
            align-items: center;
        }
        
        .url-display {
            flex: 1;
            background: rgba(0, 217, 255, 0.08);
            border: 2px solid rgba(0, 217, 255, 0.3);
            color: #00d9ff;
            padding: 10px 20px;
            border-radius: 25px;
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .url-display:hover {
            background: rgba(0, 217, 255, 0.15);
            border-color: #00d9ff;
        }
        
        .ctrl-btn {
            background: rgba(0, 217, 255, 0.1);
            border: 2px solid rgba(0, 217, 255, 0.3);
            color: #00d9ff;
            padding: 10px 16px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.3s ease;
            font-weight: 600;
        }
        
        .ctrl-btn:hover {
            background: rgba(0, 217, 255, 0.2);
            border-color: #00d9ff;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(0, 217, 255, 0.3);
        }
        
        .ctrl-btn:active {
            transform: translateY(0);
        }
        
        /* コンテンツエリア */
        .content {
            padding-top: 65px;
            height: 100vh;
        }
        
        iframe {
            width: 100%;
            height: 100%;
            border: none;
            background: #fff;
        }
        
        /* ローディング */
        .loading {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            text-align: center;
            z-index: 999998;
        }
        
        .spinner {
            width: 60px;
            height: 60px;
            border: 4px solid rgba(0, 217, 255, 0.2);
            border-top: 4px solid #00d9ff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        .loading-text {
            color: #00d9ff;
            font-size: 16px;
            font-weight: 600;
        }
    </style>
</head>
<body>
    <div class="control-bar">
        <div class="url-display" onclick="copyUrl()" title="クリックでURLをコピー">${escapeHtml(url)}</div>
        <button class="ctrl-btn" onclick="reload()" title="リロード (Ctrl+R)">🔄</button>
        <button class="ctrl-btn" onclick="openNew()" title="新しいウィンドウで開く">↗️</button>
        <button class="ctrl-btn" onclick="window.close()" title="閉じる (Ctrl+W)">❌</button>
    </div>
    
    <div class="loading" id="loading">
        <div class="spinner"></div>
        <div class="loading-text">Loading...</div>
    </div>
    
    <div class="content">
        <iframe src="${proxyUrl}" id="proxyFrame"></iframe>
    </div>
    
    <script>
        const originalUrl = '${url.replace(/'/g, "\\'")}';
        const proxyUrl = '${proxyUrl.replace(/'/g, "\\'")}';
        
        // iframe読み込み完了
        const iframe = document.getElementById('proxyFrame');
        iframe.onload = function() {
            document.getElementById('loading').style.display = 'none';
            console.log('✅ Loaded:', originalUrl);
        };
        
        iframe.onerror = function() {
            document.getElementById('loading').innerHTML = '<div style="color: #ff4444; font-size: 18px;">❌ Failed to load</div>';
        };
        
        // リロード
        function reload() {
            document.getElementById('loading').style.display = 'block';
            iframe.src = iframe.src;
        }
        
        // URLコピー
        function copyUrl() {
            navigator.clipboard.writeText(originalUrl).then(() => {
                const urlDisplay = document.querySelector('.url-display');
                const original = urlDisplay.textContent;
                urlDisplay.textContent = '✅ Copied!';
                urlDisplay.style.color = '#00ff88';
                setTimeout(() => {
                    urlDisplay.textContent = original;
                    urlDisplay.style.color = '#00d9ff';
                }, 1500);
            });
        }
        
        // 新しいウィンドウで開く
        function openNew() {
            window.open(originalUrl, '_blank');
        }
        
        // ショートカット
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'r') {
                e.preventDefault();
                reload();
            }
            if (e.ctrlKey && e.key === 'w') {
                e.preventDefault();
                window.close();
            }
        });
    </script>
</body>
</html>
        `);
        
        blank.document.close();
        updateStatus(`Loaded: ${tab.title}`, '#00ff88');
        
    }, 100);
}

// リロード
function reloadCurrentTab() {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.url) {
        loadUrl(tab.url);
    } else {
        updateStatus('No URL to reload', '#ffaa00');
    }
}

// ダウンロード
function downloadCurrent() {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab || !tab.url) {
        updateStatus('No URL to download', '#ff6666');
        return;
    }
    window.open(tab.url, '_blank');
    updateStatus('Download started', '#00ff88');
}
