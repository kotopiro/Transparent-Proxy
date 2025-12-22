// ========== 設定 ==========
const CONFIG = {
    WORKER_URL: 'https://transparent-proxy-worker.mnxsv69789.workers.dev',
    SEARCH_ENGINES: {
        google: 'https://www.google.com/search?q=',
        duckduckgo: 'https://duckduckgo.com/?q=',
        bing: 'https://www.bing.com/search?q=',
        yahoo: 'https://search.yahoo.co.jp/search?p='
    },
    DEFAULT_SEARCH: 'google',
    CACHE_TTL: 3600000, // 1時間
    MAX_HISTORY: 100,
    ABOUT_BLANK: true
};

// ========== 状態管理 ==========
const state = {
    tabs: [],
    activeTabId: null,
    tabIdCounter: 0,
    history: [],
    bookmarks: [],
    proxyMode: 'stealth', // stealth, fast, normal
    settings: {
        aboutBlank: true,
        adBlock: true,
        cache: true,
        searchEngine: 'google'
    }
};

// ========== DOM要素 ==========
const el = {};

// ========== 初期化 ==========
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Transparent Proxy 起動中...');
    
    // DOM要素取得
    initElements();
    
    // イベント設定
    setupEvents();
    
    // 設定読み込み
    loadSettings();
    
    // 初期タブ作成
    createNewTab();
    
    // Service Worker登録
    registerServiceWorker();
    
    console.log('✅ 準備完了');
    updateStatus('準備完了', '#00ff88');
});

// ========== DOM要素取得 ==========
function initElements() {
    el.urlInput = document.getElementById('urlInput');
    el.goBtn = document.getElementById('goBtn');
    el.clearBtn = document.getElementById('clearBtn');
    el.reloadBtn = document.getElementById('reloadBtn');
    el.downloadBtn = document.getElementById('downloadBtn');
    el.fullscreenBtn = document.getElementById('fullscreenBtn');
    el.newTabBtn = document.getElementById('newTab');
    el.historyBtn = document.getElementById('history');
    el.bookmarksBtn = document.getElementById('bookmarks');
    el.settingsBtn = document.getElementById('settings');
    el.modeBtn = document.getElementById('modeBtn');
    el.contentArea = document.getElementById('contentArea');
    el.tabBar = document.getElementById('tabBar');
    el.statusText = document.getElementById('statusText');
    el.proxyModeText = document.getElementById('proxyModeText');
}

// ========== イベント設定 ==========
function setupEvents() {
    // URLバー
    el.goBtn.addEventListener('click', navigate);
    el.urlInput.addEventListener('keypress', e => e.key === 'Enter' && navigate());
    el.clearBtn.addEventListener('click', () => el.urlInput.value = '');
    
    // コントロール
    el.reloadBtn.addEventListener('click', reloadCurrentTab);
    el.downloadBtn.addEventListener('click', downloadCurrent);
    el.fullscreenBtn.addEventListener('click', toggleFullscreen);
    el.newTabBtn.addEventListener('click', createNewTab);
    el.historyBtn.addEventListener('click', () => openSidePanel('historyPanel'));
    el.bookmarksBtn.addEventListener('click', () => openSidePanel('bookmarksPanel'));
    el.settingsBtn.addEventListener('click', () => openSidePanel('settingsPanel'));
    el.modeBtn.addEventListener('click', toggleProxyMode);
    
    // ショートカット
    setupShortcuts();
}

// ========== ショートカット ==========
function setupShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.ctrlKey || e.metaKey) {
            const handlers = {
                't': () => (e.preventDefault(), createNewTab()),
                'w': () => (e.preventDefault(), closeCurrentTab()),
                'r': () => (e.preventDefault(), reloadCurrentTab()),
                'l': () => (e.preventDefault(), el.urlInput.focus(), el.urlInput.select()),
                'h': () => (e.preventDefault(), openSidePanel('historyPanel')),
                'b': () => (e.preventDefault(), openSidePanel('bookmarksPanel')),
                'd': () => (e.preventDefault(), bookmarkCurrent())
            };
            handlers[e.key]?.();
        }
        if (e.key === 'F11') {
            e.preventDefault();
            toggleFullscreen();
        }
    });
}

// ========== 設定管理 ==========
function loadSettings() {
    try {
        const saved = JSON.parse(localStorage.getItem('settings'));
        if (saved) Object.assign(state.settings, saved);
        
        // UI反映
        document.getElementById('aboutBlankMode').checked = state.settings.aboutBlank;
        document.getElementById('adBlockMode').checked = state.settings.adBlock;
        document.getElementById('cacheMode').checked = state.settings.cache;
        document.getElementById('searchEngine').value = state.settings.searchEngine;
        
        // イベント
        document.getElementById('aboutBlankMode').addEventListener('change', e => {
            state.settings.aboutBlank = e.target.checked;
            saveSettings();
        });
        document.getElementById('adBlockMode').addEventListener('change', e => {
            state.settings.adBlock = e.target.checked;
            saveSettings();
        });
        document.getElementById('cacheMode').addEventListener('change', e => {
            state.settings.cache = e.target.checked;
            saveSettings();
        });
        document.getElementById('searchEngine').addEventListener('change', e => {
            state.settings.searchEngine = e.target.value;
            saveSettings();
        });
    } catch (e) {
        console.error('設定読み込みエラー:', e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem('settings', JSON.stringify(state.settings));
        updateStatus('設定を保存しました', '#00ff88');
    } catch (e) {
        console.error('設定保存エラー:', e);
    }
}

// ========== Service Worker ==========
async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            await navigator.serviceWorker.register('/sw.js');
            console.log('✅ Service Worker 登録完了');
        } catch (e) {
            console.warn('Service Worker 登録失敗:', e);
        }
    }
}

// ========== タブ管理 ==========
function createNewTab() {
    const tab = {
        id: state.tabIdCounter++,
        url: '',
        title: '新しいタブ',
        aboutBlankWindow: null
    };
    
    state.tabs.push(tab);
    renderTabBar();
    switchToTab(tab.id);
    updateStatus('新しいタブを作成しました');
}

function closeCurrentTab() {
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (tab) closeTab(tab.id);
}

function closeTab(tabId) {
    const index = state.tabs.findIndex(t => t.id === tabId);
    if (index === -1) return;
    
    const tab = state.tabs[index];
    
    // ウィンドウを閉じる
    if (tab.aboutBlankWindow && !tab.aboutBlankWindow.closed) {
        tab.aboutBlankWindow.close();
    }
    
    state.tabs.splice(index, 1);
    
    if (state.tabs.length === 0) {
        createNewTab();
    } else if (state.activeTabId === tabId) {
        switchToTab(state.tabs[Math.max(0, index - 1)].id);
    } else {
        renderTabBar();
    }
}

function switchToTab(tabId) {
    state.activeTabId = tabId;
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab) {
        el.urlInput.value = tab.url;
        updateStatus(`切り替え: ${tab.title}`);
    }
    renderTabBar();
}

function renderTabBar() {
    el.tabBar.innerHTML = state.tabs.map(tab => {
        const icon = getIconForUrl(tab.url);
        const active = tab.id === state.activeTabId ? ' active' : '';
        return `
            <div class="tab${active}" data-id="${tab.id}">
                <span>${icon}</span>
                <span style="flex: 1; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(tab.title)}</span>
                <span class="tab-close">×</span>
            </div>
        `;
    }).join('');
    
    // イベント再設定
    el.tabBar.querySelectorAll('.tab').forEach(tabEl => {
        const tabId = parseInt(tabEl.dataset.id);
        tabEl.addEventListener('click', e => {
            if (e.target.classList.contains('tab-close')) {
                closeTab(tabId);
            } else {
                switchToTab(tabId);
            }
        });
    });
}

function getIconForUrl(url) {
    if (!url) return '📄';
    try {
        const host = new URL(url).hostname;
        const icons = {
            'google': '🔍', 'youtube': '📺', 'twitter': '🐦', 'x.com': '🐦',
            'facebook': '👥', 'github': '💻', 'reddit': '🤖', 'wikipedia': '📖',
            'amazon': '🛒', 'yahoo': '💼', 'bing': '🔎', 'duckduckgo': '🦆'
        };
        for (const [key, icon] of Object.entries(icons)) {
            if (host.includes(key)) return icon;
        }
        return '🌐';
    } catch {
        return '🌐';
    }
}

// ========== ナビゲーション ==========
function navigate() {
    let input = el.urlInput.value.trim();
    if (!input) return;
    
    let targetUrl;
    if (input.match(/^https?:\/\//)) {
        targetUrl = input;
    } else if (input.includes('.') && !input.includes(' ')) {
        targetUrl = 'https://' + input;
    } else {
        const engine = CONFIG.SEARCH_ENGINES[state.settings.searchEngine];
        targetUrl = engine + encodeURIComponent(input);
    }
    
    loadUrl(targetUrl);
}

function loadUrl(url) {
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (!tab) return;
    
    updateStatus('読み込み中...', '#ffaa00');
    
    // 既存ウィンドウを閉じる
    if (tab.aboutBlankWindow && !tab.aboutBlankWindow.closed) {
        tab.aboutBlankWindow.close();
    }
    
    // プロキシURL生成
    const encodedUrl = btoa(url);
    const proxyUrl = `${CONFIG.WORKER_URL}/proxy/${encodedUrl}`;
    
    // タブ更新
    tab.url = url;
    tab.title = new URL(url).hostname;
    addToHistory(url, tab.title);
    renderTabBar();
    
    // about:blank で開く
    if (state.settings.aboutBlank) {
        openInAboutBlank(tab, url, proxyUrl);
    } else {
        // iframe で開く（フォールバック）
        openInIframe(tab, url, proxyUrl);
    }
}

function openInAboutBlank(tab, url, proxyUrl) {
    const blank = window.open('about:blank', '_blank', 'width=1280,height=720');
    tab.aboutBlankWindow = blank;
    
    if (!blank) {
        alert('❌ ポップアップがブロックされました。\nブラウザの設定でポップアップを許可してください。');
        updateStatus('ポップアップがブロックされました', '#ff0000');
        return;
    }
    
    setTimeout(() => {
        if (blank.closed) return;
        
        blank.document.write(generateAboutBlankHTML(url, proxyUrl, tab.title));
        blank.document.close();
        updateStatus(`読み込み完了: ${tab.title}`, '#00ff88');
    }, 100);
}

function openInIframe(tab, url, proxyUrl) {
    const welcomeScreen = el.contentArea.querySelector('.welcome-screen');
    if (welcomeScreen) welcomeScreen.remove();
    
    const iframe = document.createElement('iframe');
    iframe.src = proxyUrl;
    iframe.onload = () => updateStatus(`読み込み完了: ${tab.title}`, '#00ff88');
    iframe.onerror = () => updateStatus('読み込みエラー', '#ff0000');
    
    el.contentArea.appendChild(iframe);
}

function generateAboutBlankHTML(url, proxyUrl, title) {
    return `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)} - Transparent Proxy</title>
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
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0, 217, 255, 0.3);
            padding: 12px 20px;
            display: flex;
            gap: 10px;
            align-items: center;
            z-index: 9999;
            box-shadow: 0 4px 20px rgba(0, 217, 255, 0.15);
        }
        .url-display {
            flex: 1;
            background: rgba(0, 217, 255, 0.08);
            border: 1px solid rgba(0, 217, 255, 0.3);
            color: #00d9ff;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s;
        }
        .url-display:hover {
            background: rgba(0, 217, 255, 0.15);
        }
        .btn {
            background: rgba(0, 217, 255, 0.1);
            border: 1px solid rgba(0, 217, 255, 0.3);
            color: #00d9ff;
            padding: 10px 16px;
            border-radius: 10px;
            cursor: pointer;
            font-size: 16px;
            transition: all 0.2s;
        }
        .btn:hover {
            background: rgba(0, 217, 255, 0.2);
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
        }
        .spinner {
            width: 48px;
            height: 48px;
            border: 3px solid rgba(0, 217, 255, 0.2);
            border-top: 3px solid #00d9ff;
            border-radius: 50%;
            animation: spin 0.6s linear infinite;
            margin: 0 auto 16px;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .loading-text { color: #00d9ff; font-size: 14px; }
    </style>
</head>
<body>
    <div class="control-bar">
        <div class="url-display" onclick="copyUrl()" title="クリックでURLをコピー">${escapeHtml(url)}</div>
        <button class="btn" onclick="reload()" title="リロード">🔄</button>
        <button class="btn" onclick="openNew()" title="新しいウィンドウで開く">↗️</button>
        <button class="btn" onclick="window.close()" title="閉じる">❌</button>
    </div>
    <div class="loading" id="loading">
        <div class="spinner"></div>
        <div class="loading-text">読み込み中...</div>
    </div>
    <div class="content">
        <iframe src="${proxyUrl}" id="frame"></iframe>
    </div>
    <script>
        const originalUrl = '${url.replace(/'/g, "\\'")}';
        const iframe = document.getElementById('frame');
        iframe.onload = () => document.getElementById('loading').style.display = 'none';
        iframe.onerror = () => document.getElementById('loading').innerHTML = '<div style="color: #ff4444;">読み込みエラー</div>';
        function reload() { iframe.src = iframe.src; document.getElementById('loading').style.display = 'block'; }
        function copyUrl() { navigator.clipboard.writeText(originalUrl).then(() => alert('URLをコピーしました')); }
        function openNew() { window.open(originalUrl, '_blank'); }
    </script>
</body>
</html>`;
}

// ========== 履歴・ブックマーク ==========
function addToHistory(url, title) {
    state.history.unshift({ url, title, timestamp: Date.now() });
    if (state.history.length > CONFIG.MAX_HISTORY) state.history.pop();
}

function bookmarkCurrent() {
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (!tab || !tab.url) {
        updateStatus('ブックマークするページがありません', '#ffaa00');
        return;
    }
    
    if (state.bookmarks.some(b => b.url === tab.url)) {
        updateStatus('既にブックマーク済みです', '#ffaa00');
        return;
    }
    
    state.bookmarks.push({ url: tab.url, title: tab.title });
    updateStatus('ブックマークに追加しました', '#00ff88');
}

window.clearHistory = function() {
    if (confirm('すべての履歴を削除しますか？')) {
        state.history = [];
        renderHistory();
        updateStatus('履歴を削除しました', '#00ff88');
    }
};

function renderHistory() {
    const list = document.getElementById('historyList');
    if (state.history.length === 0) {
        list.innerHTML = '<p style="color: rgba(0,217,255,0.5); text-align: center; padding: 20px;">履歴はありません</p>';
        return;
    }
    
    list.innerHTML = state.history.slice(0, 50).map(item => `
        <div class="history-item" onclick="loadUrl('${item.url.replace(/'/g, "\\'")}'); closeSidePanel('historyPanel');">
            <div style="font-weight: 600; margin-bottom: 4px;">${escapeHtml(item.title)}</div>
            <div style="font-size: 12px; color: rgba(0,217,255,0.7); margin-bottom: 4px; overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.url)}</div>
            <div style="font-size: 11px; color: rgba(0,217,255,0.5);">${new Date(item.timestamp).toLocaleString('ja-JP')}</div>
        </div>
    `).join('');
}

function renderBookmarks() {
    const list = document.getElementById('bookmarksList');
    if (state.bookmarks.length === 0) {
        list.innerHTML = '<p style="color: rgba(0,217,255,0.5); text-align: center; padding: 20px;">ブックマークはありません</p>';
        return;
    }
    
    list.innerHTML = state.bookmarks.map((item, i) => `
        <div class="bookmark-item" style="display: flex; align-items: center; gap: 10px;">
            <div style="flex: 1; cursor: pointer;" onclick="loadUrl('${item.url.replace(/'/g, "\\'")}'); closeSidePanel('bookmarksPanel');">
                <div style="font-weight: 600; margin-bottom: 4px;">⭐ ${escapeHtml(item.title)}</div>
                <div style="font-size: 12px; color: rgba(0,217,255,0.7); overflow: hidden; text-overflow: ellipsis;">${escapeHtml(item.url)}</div>
            </div>
            <button class="btn-mini" onclick="removeBookmark(${i})">🗑️</button>
        </div>
    `).join('');
}

window.removeBookmark = function(index) {
    state.bookmarks.splice(index, 1);
    renderBookmarks();
    updateStatus('ブックマークを削除しました', '#ff6666');
};

// ========== サイドパネル ==========
function openSidePanel(panelId) {
    document.querySelectorAll('.side-panel').forEach(p => p.classList.remove('open'));
    document.getElementById(panelId).classList.add('open');
    
    if (panelId === 'historyPanel') renderHistory();
    if (panelId === 'bookmarksPanel') renderBookmarks();
}

window.closeSidePanel = function(panelId) {
    document.getElementById(panelId).classList.remove('open');
};

// ========== その他の機能 ==========
function reloadCurrentTab() {
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (tab && tab.url) {
        loadUrl(tab.url);
    } else {
        updateStatus('再読み込みするページがありません', '#ffaa00');
    }
}

function downloadCurrent() {
    const tab = state.tabs.find(t => t.id === state.activeTabId);
    if (!tab || !tab.url) {
        updateStatus('ダウンロードするページがありません', '#ff6666');
        return;
    }
    window.open(tab.url, '_blank');
    updateStatus('ダウンロードを開始しました', '#00ff88');
}

function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
        updateStatus('フルスクリーンモード', '#00ff88');
    } else {
        document.exitFullscreen();
        updateStatus('通常モードに戻りました', '#00ff88');
    }
}

function toggleProxyMode() {
    const modes = ['stealth', 'fast', 'normal'];
    const names = { stealth: 'ステルス', fast: '高速', normal: '通常' };
    const currentIndex = modes.indexOf(state.proxyMode);
    state.proxyMode = modes[(currentIndex + 1) % modes.length];
    el.proxyModeText.textContent = names[state.proxyMode];
    updateStatus(`モードを変更: ${names[state.proxyMode]}`, '#00ff88');
}

function updateStatus(text, color = '#00d9ff') {
    el.statusText.textContent = text;
    el.statusText.style.color = color;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
