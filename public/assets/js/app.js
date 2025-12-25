// public/assets/js/app.js
// メインアプリケーション - 完全動作版

console.log('🚀 Transparent Proxy v2.1.0 Starting...');

// ========== グローバル設定 ==========
const CONFIG = {
    SEARCH_ENGINE: 'https://www.google.com/search?q=',
    ABOUT_BLANK: true,
    MAX_TABS: 20
};

// ========== 状態管理 ==========
const state = {
    tabs: [],
    activeTabId: null,
    tabIdCounter: 0,
    history: [],
    bookmarks: []
};

// ========== DOM要素 ==========
let elements = {};

// ========== 初期化 ==========
window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM loaded');
    
    // DOM要素取得
    elements = {
        urlInput: document.getElementById('urlInput'),
        goBtn: document.getElementById('goBtn'),
        reloadBtn: document.getElementById('reloadBtn'),
        downloadBtn: document.getElementById('downloadBtn'),
        newTabBtn: document.getElementById('newTab'),
        historyBtn: document.getElementById('history'),
        bookmarksBtn: document.getElementById('bookmarks'),
        settingsBtn: document.getElementById('settings'),
        contentArea: document.getElementById('contentArea'),
        tabBar: document.getElementById('tabBar'),
        statusBar: document.getElementById('statusBar'),
        statusText: document.getElementById('statusText')
    };
    
    // 要素確認
    if (!elements.urlInput || !elements.goBtn || !elements.contentArea) {
        console.error('❌ Required elements not found!');
        alert('エラー: 必要な要素が見つかりません');
        return;
    }
    
    // イベントリスナー設定
    setupEventListeners();
    
    // 初期タブ作成
    createNewTab();
    
    console.log('✅ App initialized');
    updateStatus('Ready', 'success');
});

// ========== イベントリスナー設定 ==========
function setupEventListeners() {
    // GO ボタン
    elements.goBtn.addEventListener('click', handleGo);
    
    // Enter キー
    elements.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleGo();
    });
    
    // リロード
    elements.reloadBtn.addEventListener('click', handleReload);
    
    // ダウンロード
    elements.downloadBtn.addEventListener('click', handleDownload);
    
    // 新しいタブ
    elements.newTabBtn.addEventListener('click', createNewTab);
    
    // 履歴
    elements.historyBtn.addEventListener('click', () => {
        alert('履歴: ' + state.history.length + ' 件\n\n' + 
              state.history.slice(0, 5).map(h => h.title).join('\n'));
    });
    
    // ブックマーク
    elements.bookmarksBtn.addEventListener('click', () => {
        const tab = getCurrentTab();
        if (tab && tab.url) {
            state.bookmarks.push({ url: tab.url, title: tab.title });
            alert('✅ ブックマークに追加しました！');
        } else {
            alert('ブックマーク: ' + state.bookmarks.length + ' 件');
        }
    });
    
    // 設定
    if (elements.settingsBtn) {
        elements.settingsBtn.addEventListener('click', () => {
            alert('設定機能は開発中です');
        });
    }
}

// ========== タブ管理 ==========
function createNewTab() {
    if (state.tabs.length >= CONFIG.MAX_TABS) {
        alert('タブの最大数に達しました');
        return;
    }
    
    const tabId = state.tabIdCounter++;
    const tab = {
        id: tabId,
        url: '',
        title: 'New Tab',
        iframe: null,
        aboutBlankWindow: null
    };
    
    state.tabs.push(tab);
    renderTabBar();
    switchToTab(tabId);
    
    console.log('✅ New tab created:', tabId);
}

function renderTabBar() {
    if (!elements.tabBar) return;
    
    elements.tabBar.innerHTML = '';
    
    state.tabs.forEach(tab => {
        const tabEl = document.createElement('div');
        tabEl.className = `tab ${tab.id === state.activeTabId ? 'active' : ''}`;
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
        
        elements.tabBar.appendChild(tabEl);
    });
}

function switchToTab(tabId) {
    state.activeTabId = tabId;
    const tab = getCurrentTab();
    
    // すべての iframe を非表示
    document.querySelectorAll('iframe').forEach(iframe => {
        iframe.style.display = 'none';
    });
    
    // アクティブな iframe を表示
    if (tab && tab.iframe) {
        tab.iframe.style.display = 'block';
        const welcomeScreen = elements.contentArea.querySelector('.welcome-screen');
        if (welcomeScreen) welcomeScreen.remove();
    }
    
    // URLバー更新
    if (tab) {
        elements.urlInput.value = tab.url;
    }
    
    renderTabBar();
}

function closeTab(tabId) {
    const index = state.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    
    const tab = state.tabs[index];
    
    // iframe削除
    if (tab.iframe) tab.iframe.remove();
    
    // about:blank ウィンドウを閉じる
    if (tab.aboutBlankWindow && !tab.aboutBlankWindow.closed) {
        tab.aboutBlankWindow.close();
    }
    
    state.tabs.splice(index, 1);
    
    // タブが0になったら新規作成
    if (state.tabs.length === 0) {
        createNewTab();
    } else if (state.activeTabId === tabId) {
        switchToTab(state.tabs[Math.max(0, index - 1)].id);
    } else {
        renderTabBar();
    }
}

function getCurrentTab() {
    return state.tabs.find(t => t.id === state.activeTabId);
}

// ========== ナビゲーション ==========
function handleGo() {
    let input = elements.urlInput.value.trim();
    
    if (!input) {
        updateStatus('URLを入力してください', 'error');
        return;
    }
    
    console.log('🔍 Navigate to:', input);
    
    // URL or 検索クエリ判定
    let targetUrl;
    if (input.match(/^https?:\/\//)) {
        targetUrl = input;
    } else if (input.includes('.') && !input.includes(' ')) {
        targetUrl = 'https://' + input;
    } else {
        targetUrl = CONFIG.SEARCH_ENGINE + encodeURIComponent(input);
    }
    
    loadUrl(targetUrl);
}

function loadUrl(url) {
    const tab = getCurrentTab();
    if (!tab) return;
    
    updateStatus('読み込み中...', 'loading');
    console.log('🌐 Loading:', url);
    
    // プロキシURL生成
    const encodedUrl = btoa(url);
    const proxyUrl = `/proxy/${encodedUrl}`;
    
    console.log('🔗 Proxy URL:', proxyUrl);
    
    if (CONFIG.ABOUT_BLANK) {
        // about:blank に表示
        loadInAboutBlank(url, proxyUrl, tab);
    } else {
        // iframe に表示
        loadInIframe(url, proxyUrl, tab);
    }
    
    // 履歴に追加
    addToHistory(url, new URL(url).hostname);
}

function loadInIframe(url, proxyUrl, tab) {
    // Welcome 画面を削除
    const welcomeScreen = elements.contentArea.querySelector('.welcome-screen');
    if (welcomeScreen) welcomeScreen.remove();
    
    // 既存の iframe を削除
    if (tab.iframe) tab.iframe.remove();
    
    // 新しい iframe を作成
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%; height:100%; border:none; background:#fff;';
    iframe.src = proxyUrl;
    
    iframe.onload = () => {
        console.log('✅ Loaded');
        updateStatus('読み込み完了', 'success');
    };
    
    iframe.onerror = () => {
        console.error('❌ Load error');
        updateStatus('読み込みエラー', 'error');
    };
    
    tab.iframe = iframe;
    tab.url = url;
    tab.title = new URL(url).hostname;
    
    elements.contentArea.appendChild(iframe);
    renderTabBar();
}

function loadInAboutBlank(url, proxyUrl, tab) {
    // 既存のウィンドウがあれば閉じる
    if (tab.aboutBlankWindow && !tab.aboutBlankWindow.closed) {
        tab.aboutBlankWindow.close();
    }
    
    // about:blank ウィンドウを開く
    const win = window.open('about:blank', '_blank');
    
    if (!win) {
        alert('ポップアップがブロックされました。ポップアップを許可してください。');
        updateStatus('ポップアップブロック', 'error');
        return;
    }
    
    tab.aboutBlankWindow = win;
    tab.url = url;
    tab.title = new URL(url).hostname;
    renderTabBar();
    
    // コンテンツを書き込み
    win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>HOME</title>
            <style>
                body { margin: 0; padding: 0; overflow: hidden; }
                iframe { width: 100%; height: 100vh; border: none; }
                .url-bar {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    padding: 10px;
                    background: rgba(10, 14, 39, 0.95);
                    backdrop-filter: blur(10px);
                    border-bottom: 2px solid #00d9ff;
                    display: flex;
                    gap: 10px;
                    z-index: 1000;
                }
                .url-display {
                    flex: 1;
                    padding: 8px 15px;
                    background: rgba(0, 217, 255, 0.1);
                    border: 1px solid #00d9ff;
                    border-radius: 20px;
                    color: #00d9ff;
                    font-size: 14px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    white-space: nowrap;
                }
                .btn {
                    padding: 8px 15px;
                    background: rgba(0, 217, 255, 0.2);
                    border: 1px solid #00d9ff;
                    border-radius: 20px;
                    color: #00d9ff;
                    cursor: pointer;
                    font-size: 14px;
                }
                .btn:hover {
                    background: rgba(0, 217, 255, 0.3);
                }
                #content { margin-top: 50px; height: calc(100vh - 50px); }
            </style>
        </head>
        <body>
            <div class="url-bar">
                <div class="url-display">${url}</div>
                <button class="btn" onclick="location.reload()">🔄</button>
                <button class="btn" onclick="window.open('${url}', '_blank')">↗️</button>
                <button class="btn" onclick="window.close()">❌</button>
            </div>
            <div id="content">
                <iframe src="${proxyUrl}"></iframe>
            </div>
        </body>
        </html>
    `);
    win.document.close();
    
    updateStatus('about:blank で開きました', 'success');
}

// ========== その他の操作 ==========
function handleReload() {
    const tab = getCurrentTab();
    if (tab && tab.url) {
        loadUrl(tab.url);
    }
}

function handleDownload() {
    const tab = getCurrentTab();
    if (!tab || !tab.url) {
        alert('❌ URLがありません');
        return;
    }
    window.open(tab.url, '_blank');
    updateStatus('ダウンロード開始', 'success');
}

function addToHistory(url, title) {
    state.history.unshift({
        url: url,
        title: title,
        timestamp: Date.now()
    });
    
    if (state.history.length > 100) {
        state.history.pop();
    }
}

function updateStatus(message, type = 'info') {
    if (!elements.statusText) return;
    
    elements.statusText.textContent = message;
    
    const colors = {
        success: '#00ff88',
        error: '#ff4444',
        loading: '#ffaa00',
        info: '#00d9ff'
    };
    
    elements.statusText.style.color = colors[type] || colors.info;
}

console.log('✅ App.js loaded');
