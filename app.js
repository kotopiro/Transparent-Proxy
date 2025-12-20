const WORKER_URL = 'https://transparent-proxy-worker.mnxsv69789.workers.dev';
const SEARCH_ENGINE = 'https://www.google.com/search?q=';

let tabs = [];
let activeTabId = null;
let tabIdCounter = 0;
let history = [];
let bookmarks = [];

console.log('🔧 Transparent Proxy Starting...');
console.log('Worker URL:', WORKER_URL);

let urlInput, goBtn, reloadBtn, downloadBtn, newTabBtn, historyBtn, bookmarksBtn, contentArea, tabBar;

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
        console.error('❌ Required elements not found!');
        alert('エラー: HTML要素が見つかりません');
        return;
    }
    
    setupEventListeners();
    createNewTab();
    console.log('✅ Ready!');
});

function setupEventListeners() {
    goBtn.addEventListener('click', () => {
        console.log('GO clicked');
        navigate();
    });
    
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            console.log('Enter pressed');
            navigate();
        }
    });
    
    reloadBtn.addEventListener('click', () => {
        console.log('Reload clicked');
        reloadCurrentTab();
    });
    
    downloadBtn.addEventListener('click', () => {
        console.log('Download clicked');
        downloadCurrent();
    });
    
    newTabBtn.addEventListener('click', () => {
        console.log('New tab clicked');
        createNewTab();
    });
    
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            alert('履歴: ' + history.length + ' 件\n\n' + history.slice(0, 5).map(h => h.title).join('\n'));
        });
    }
    
    if (bookmarksBtn) {
        bookmarksBtn.addEventListener('click', () => {
            const tab = tabs.find(t => t.id === activeTabId);
            if (tab && tab.url) {
                bookmarks.push({ url: tab.url, title: tab.title });
                alert('✅ ブックマークに追加しました！');
            } else {
                alert('ブックマーク: ' + bookmarks.length + ' 件');
            }
        });
    }
}

function createNewTab() {
    console.log('Creating new tab');
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

function renderTabBar() {
    if (!tabBar) return;
    
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

function switchToTab(tabId) {
    activeTabId = tabId;
    const tab = tabs.find(t => t.id === tabId);
    
    document.querySelectorAll('iframe').forEach(iframe => {
        iframe.style.display = 'none';
    });
    
    if (tab && tab.iframe) {
        tab.iframe.style.display = 'block';
        const welcomeScreen = contentArea.querySelector('.welcome-screen');
        if (welcomeScreen) welcomeScreen.remove();
    }
    
    if (tab) {
        urlInput.value = tab.url;
    }
    renderTabBar();
}

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

function navigate() {
    let input = urlInput.value.trim();
    console.log('Navigate:', input);
    
    if (!input) return;
    
    let targetUrl;
    if (input.match(/^https?:\/\//)) {
        targetUrl = input;
    } else if (input.includes('.') && !input.includes(' ')) {
        targetUrl = 'https://' + input;
    } else {
        targetUrl = SEARCH_ENGINE + encodeURIComponent(input);
    }
    
    console.log('Target URL:', targetUrl);
    loadUrl(targetUrl);
}

function loadUrl(url) {
    console.log('Loading:', url);
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;
    
    const welcomeScreen = contentArea.querySelector('.welcome-screen');
    if (welcomeScreen) welcomeScreen.remove();
    
    if (tab.iframe) tab.iframe.remove();
    
    const encodedUrl = btoa(url);
    const proxyUrl = `${WORKER_URL}/proxy/${encodedUrl}`;
    
    console.log('Proxy URL:', proxyUrl);
    
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%; height:100%; border:none; background:#fff;';
    iframe.src = proxyUrl;
    
    iframe.onerror = () => {
        console.error('❌ Iframe error');
        alert('読み込みエラー！Worker URLを確認してください。');
    };
    
    iframe.onload = () => {
        console.log('✅ Loaded');
    };
    
    tab.iframe = iframe;
    tab.url = url;
    tab.title = new URL(url).hostname;
    
    history.unshift({ url, title: tab.title, timestamp: Date.now() });
    if (history.length > 100) history.pop();
    
    contentArea.appendChild(iframe);
    renderTabBar();
}

function reloadCurrentTab() {
    const tab = tabs.find(t => t.id === activeTabId);
    if (tab && tab.url) {
        loadUrl(tab.url);
    }
}

function downloadCurrent() {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab || !tab.url) {
        alert('❌ URLがありません');
        return;
    }
    window.open(tab.url, '_blank');
}
