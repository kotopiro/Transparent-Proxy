// グローバル設定
const WORKER_URL = 'https://transparent-proxy-worker.mnxsv69789.workers.dev'; // ← あなたのWorker URLに置き換え
const SEARCH_ENGINE = 'https://www.google.com/search?q=';

// タブ管理
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;

// 履歴・ブックマーク
let history = JSON.parse(localStorage.getItem('proxyHistory') || '[]');
let bookmarks = JSON.parse(localStorage.getItem('proxyBookmarks') || '[]');

// DOM要素
const urlInput = document.getElementById('urlInput');
const goBtn = document.getElementById('goBtn');
const reloadBtn = document.getElementById('reloadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newTabBtn = document.getElementById('newTab');
const historyBtn = document.getElementById('history');
const bookmarksBtn = document.getElementById('bookmarks');
const contentArea = document.getElementById('contentArea');
const tabBar = document.getElementById('tabBar');

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Transparent Proxy loaded');
    createNewTab();
    setupEventListeners();
    createSidePanels();
});

// イベントリスナー設定
function setupEventListeners() {
    goBtn.addEventListener('click', navigate);
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') navigate();
    });
    reloadBtn.addEventListener('click', reloadCurrentTab);
    downloadBtn.addEventListener('click', downloadCurrent);
    newTabBtn.addEventListener('click', createNewTab);
    historyBtn.addEventListener('click', () => openSidePanel('history'));
    bookmarksBtn.addEventListener('click', () => openSidePanel('bookmarks'));
}

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
    
    // すべてのパネルを閉じる
    document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
    
    // 対象パネルを開く
    panel.classList.add('open');
    
    // リスト更新
    if (type === 'history') {
        renderHistory();
    } else {
        renderBookmarks();
    }
}

// サイドパネル閉じる
window.closeSidePanel = function(panelId) {
    document.getElementById(panelId).classList.remove('open');
};

// 履歴描画
function renderHistory() {
    const listEl = document.getElementById('historyList');
    if (history.length === 0) {
        listEl.innerHTML = '<p style="color: rgba(0,217,255,0.5);">No history yet</p>';
        return;
    }
    
    listEl.innerHTML = history.slice().reverse().map(item => `
        <div class="history-item" onclick="loadUrl('${item.url}')">
            <div style="font-weight: bold;">${item.title}</div>
            <div style="font-size: 12px; color: rgba(0,217,255,0.7);">${item.url}</div>
            <div style="font-size: 11px; color: rgba(0,217,255,0.5);">${new Date(item.timestamp).toLocaleString()}</div>
        </div>
    `).join('');
}

// ブックマーク描画
function renderBookmarks() {
    const listEl = document.getElementById('bookmarksList');
    if (bookmarks.length === 0) {
        listEl.innerHTML = '<p style="color: rgba(0,217,255,0.5);">No bookmarks yet</p>';
        return;
    }
    
    listEl.innerHTML = bookmarks.map((item, index) => `
        <div class="bookmark-item">
            <div onclick="loadUrl('${item.url}')" style="flex: 1; cursor: pointer;">
                <div style="font-weight: bold;">${item.title}</div>
                <div style="font-size: 12px; color: rgba(0,217,255,0.7);">${item.url}</div>
            </div>
            <button class="icon-btn" onclick="removeBookmark(${index})" style="margin-left: 10px;">🗑️</button>
        </div>
    `).join('');
}

// 履歴追加
function addToHistory(url, title) {
    history.unshift({
        url,
        title,
        timestamp: Date.now()
    });
    
    // 最大100件
    if (history.length > 100) history.pop();
    
    localStorage.setItem('proxyHistory', JSON.stringify(history));
}

// 履歴クリア
window.clearHistory = function() {
    if (confirm('Clear all history?')) {
        history = [];
        localStorage.removeItem('proxyHistory');
        renderHistory();
    }
};

// ブックマーク追加
function addBookmark(url, title) {
    if (bookmarks.some(b => b.url === url)) {
        alert('Already bookmarked!');
        return;
    }
    
    bookmarks.push({ url, title });
    localStorage.setItem('proxyBookmarks', JSON.stringify(bookmarks));
    alert('Bookmarked!');
}

// ブックマーク削除
window.removeBookmark = function(index) {
    bookmarks.splice(index, 1);
    localStorage.setItem('proxyBookmarks', JSON.stringify(bookmarks));
    renderBookmarks();
};

// 新しいタブ作成
function createNewTab() {
    const tabId = tabIdCounter++;
    const tab = {
        id: tabId,
        url: '',
        title: 'New Tab',
        iframe: null
    };
    
    tabs.push(tab);
    renderTabBar();
    switchToTab(tabId);
}

// タブバー描画
function renderTabBar() {
    tabBar.innerHTML = '';
    tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === activeTabId ? 'active' : ''}`;
        tabEl.innerHTML = `
            <span>${tab.title}</span>
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

// タブ切り替え
function switchToTab(tabId) {
    activeTabId = tabId;
    const tab = tabs.find(t => t.id === tabId);
    
    // すべてのiframeを非表示
    document.querySelectorAll('iframe').forEach(iframe => {
        iframe.style.display = 'none';
    });
    
    // ローディング非表示
    document.querySelectorAll('.loading').forEach(el => el.remove());
    
    // アクティブなiframeを表示
    if (tab.iframe) {
        tab.iframe.style.display = 'block';
        contentArea.querySelector('.welcome-screen')?.remove();
    }
    
    urlInput.value = tab.url;
    renderTabBar();
}

// タブを閉じる
function closeTab(tabId) {
    const index = tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    
    const tab = tabs[index];
    if (tab.iframe) tab.iframe.remove();
    
    tabs.splice(index, 1);
    
    if (tabs.length === 0) {
        createNewTab();
    } else if (activeTabId === tabId) {
        switchToTab(tabs[Math.max(0, index - 1)].id);
    } else {
        renderTabBar();
    }
}

// ナビゲーション
function navigate() {
    let input = urlInput.value.trim();
    if (!input) return;
    
    // URL or 検索クエリ判定
    let targetUrl;
    if (input.match(/^https?:\/\//)) {
        targetUrl = input;
    } else if (input.includes('.') && !input.includes(' ')) {
        targetUrl = 'https://' + input;
    } else {
        targetUrl = SEARCH_ENGINE + encodeURIComponent(input);
    }
    
    loadUrl(targetUrl);
}

// URL読み込み（about:blank版）
function loadUrl(url) {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    
    // Welcome画面を削除
    const welcomeScreen = contentArea.querySelector('.welcome-screen');
    if (welcomeScreen) welcomeScreen.remove();
    
    // 既存のiframeを削除
    if (tab.iframe) tab.iframe.remove();
    
    // ローディング表示
    showLoading();
    
    // about:blank ウィンドウを開く
    const blank = window.open('about:blank', '_blank');
    
    // プロキシURL生成
    const encodedUrl = btoa(url);
    const proxyUrl = `${WORKER_URL}/proxy/${encodedUrl}`;
    
    // about:blank内にiframeを注入
    setTimeout(() => {
        blank.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Transparent Proxy</title>
                <style>
                    * { margin: 0; padding: 0; }
                    body { overflow: hidden; background: #0a0e27; }
                    iframe { width: 100vw; height: 100vh; border: none; }
                    .top-bar {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background: rgba(15, 20, 45, 0.95);
                        backdrop-filter: blur(10px);
                        border-bottom: 2px solid #00d9ff;
                        padding: 10px 20px;
                        display: flex;
                        gap: 10px;
                        z-index: 999999;
                        box-shadow: 0 2px 10px rgba(0, 217, 255, 0.3);
                    }
                    .top-bar input {
                        flex: 1;
                        background: rgba(0, 217, 255, 0.1);
                        border: 2px solid #00d9ff;
                        color: #fff;
                        padding: 8px 15px;
                        border-radius: 20px;
                        font-size: 14px;
                        outline: none;
                    }
                    .top-bar button {
                        background: linear-gradient(135deg, #00d9ff, #0099cc);
                        border: none;
                        color: #fff;
                        padding: 8px 20px;
                        border-radius: 20px;
                        cursor: pointer;
                        font-weight: bold;
                        transition: all 0.3s ease;
                    }
                    .top-bar button:hover {
                        transform: translateY(-2px);
                        box-shadow: 0 4px 15px rgba(0, 217, 255, 0.5);
                    }
                    .content { padding-top: 60px; }
                </style>
            </head>
            <body>
                <div class="top-bar">
                    <input type="text" id="urlBar" value="${url}" placeholder="Enter URL...">
                    <button onclick="go()">GO</button>
                    <button onclick="reload()">🔄</button>
                    <button onclick="addBookmark()">⭐</button>
                </div>
                <div class="content">
                    <iframe src="${proxyUrl}" id="proxyFrame"></iframe>
                </div>
                <script>
                    const workerUrl = '${WORKER_URL}';
                    function go() {
                        let input = document.getElementById('urlBar').value.trim();
                        if (!input) return;
                        let targetUrl = input.match(/^https?:\\/\\//) ? input : 'https://' + input;
                        let encoded = btoa(targetUrl);
                        document.getElementById('proxyFrame').src = workerUrl + '/proxy/' + encoded;
                    }
                    function reload() {
                        document.getElementById('proxyFrame').src = document.getElementById('proxyFrame').src;
                    }
                    function addBookmark() {
                        alert('Bookmark feature: Use the main window for full bookmark management');
                    }
                    document.getElementById('urlBar').addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') go();
                    });
                </script>
            </body>
            </html>
        `);
        blank.document.close();
    }, 100);
    
    // タブ情報更新
    tab.url = url;
    tab.title = new URL(url).hostname;
    
    // 履歴追加
    addToHistory(url, tab.title);
    
    // ローディング非表示
    hideLoading();
    
    renderTabBar();
    
    console.log('🌐 Loading in about:blank:', url);
    console.log('🔗 Proxy URL:', proxyUrl);
}

// ローディング表示
function showLoading() {
    const loading = document.createElement('div');
    loading.className = 'loading';
    loading.innerHTML = `
        <div class="loading-spinner"></div>
        <div class="loading-text">Loading...</div>
    `;
    contentArea.appendChild(loading);
}

// ローディング非表示
function hideLoading() {
    setTimeout(() => {
        document.querySelectorAll('.loading').forEach(el => el.remove());
    }, 1000);
}

// リロード
function reloadCurrentTab() {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.url) {
        loadUrl(tab.url);
    }
}

// ダウンロード（URL直接）
function downloadCurrent() {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab || !tab.url) {
        alert('❌ No URL to download');
        return;
    }
    
    // 新しいウィンドウで開く（ダウンロードトリガー）
    window.open(tab.url, '_blank');
    console.log('⬇️ Download triggered for:', tab.url);
}https://transparent-proxy-worker.mnxsv69789.workers.dev/
