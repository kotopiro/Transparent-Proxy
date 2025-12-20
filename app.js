// グローバル設定
const WORKER_URL = 'https://transparent-proxy-worker.mnxsv69789.workers.dev'; // ステップ3で置き換えます
const SEARCH_ENGINE = 'https://www.google.com/search?q=';

// タブ管理
let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;

// DOM要素
const urlInput = document.getElementById('urlInput');
const goBtn = document.getElementById('goBtn');
const reloadBtn = document.getElementById('reloadBtn');
const downloadBtn = document.getElementById('downloadBtn');
const newTabBtn = document.getElementById('newTab');
const contentArea = document.getElementById('contentArea');
const tabBar = document.getElementById('tabBar');

// 初期化
window.addEventListener('DOMContentLoaded', () => {
    console.log('✅ Transparent Proxy loaded');
    createNewTab();
    setupEventListeners();
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
}

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

// URL読み込み
function loadUrl(url) {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    
    // Welcome画面を削除
    const welcomeScreen = contentArea.querySelector('.welcome-screen');
    if (welcomeScreen) welcomeScreen.remove();
    
    // 既存のiframeを削除
    if (tab.iframe) tab.iframe.remove();
    
    // 新しいiframeを作成
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%; height:100%; border:none; background:#fff;';
    
    // プロキシURL生成
    const encodedUrl = btoa(url);
    const proxyUrl = `${WORKER_URL}/proxy/${encodedUrl}`;
    
    iframe.src = proxyUrl;
    tab.iframe = iframe;
    tab.url = url;
    tab.title = new URL(url).hostname;
    
    contentArea.appendChild(iframe);
    renderTabBar();
    
    console.log('🌐 Loading:', url);
    console.log('🔗 Proxy URL:', proxyUrl);
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
}
