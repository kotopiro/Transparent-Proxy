// ========================================
// Tabs - 高度なタブ管理システム
// ========================================

class TabManager {
    constructor() {
        this.tabs = [];
        this.activeTabId = null;
        this.tabIdCounter = 0;
        this.tabBar = document.getElementById('tabBar');
        this.contentArea = document.getElementById('contentArea');
        this.maxTabs = 20;
    }
    
    init() {
        this.createTab();
    }
    
    createTab(url = '', title = '新しいタブ') {
        if (this.tabs.length >= this.maxTabs) {
            window.showToast('タブの上限に達しました', 'warning');
            return null;
        }
        
        const tab = {
            id: this.tabIdCounter++,
            url: url,
            title: title,
            favicon: '🌐',
            aboutBlankWindow: null,
            createdAt: Date.now(),
            lastAccessAt: Date.now()
        };
        
        this.tabs.push(tab);
        this.render();
        this.switchTo(tab.id);
        
        console.log('✅ タブ作成:', tab.id);
        return tab;
    }
    
    closeTab(tabId) {
        const index = this.tabs.findIndex(t => t.id === tabId);
        if (index === -1) return;
        
        const tab = this.tabs[index];
        
        // ウィンドウを閉じる
        if (tab.aboutBlankWindow && !tab.aboutBlankWindow.closed) {
            try {
                tab.aboutBlankWindow.close();
            } catch (e) {
                console.warn('ウィンドウクローズ失敗:', e);
            }
        }
        
        this.tabs.splice(index, 1);
        
        // 最後のタブなら新規作成
        if (this.tabs.length === 0) {
            this.createTab();
            return;
        }
        
        // アクティブタブを切り替え
        if (this.activeTabId === tabId) {
            const nextTab = this.tabs[Math.max(0, index - 1)];
            this.switchTo(nextTab.id);
        } else {
            this.render();
        }
        
        console.log('🗑️ タブ削除:', tabId);
    }
    
    switchTo(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        this.activeTabId = tabId;
        tab.lastAccessAt = Date.now();
        
        // URL入力欄を更新
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.value = tab.url;
        }
        
        this.render();
        window.updateStatus(`切り替え: ${tab.title}`);
        
        console.log('🔄 タブ切り替え:', tabId);
    }
    
    getActiveTab() {
        return this.tabs.find(t => t.id === this.activeTabId);
    }
    
    updateTab(tabId, updates) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        Object.assign(tab, updates);
        this.render();
    }
    
    getFavicon(url) {
        if (!url) return '📄';
        
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            const icons = {
                'google.com': '🔍',
                'youtube.com': '📺',
                'youtu.be': '📺',
                'twitter.com': '🐦',
                'x.com': '🐦',
                'facebook.com': '👥',
                'github.com': '💻',
                'reddit.com': '🤖',
                'wikipedia.org': '📖',
                'amazon.com': '🛒',
                'amazon.co.jp': '🛒',
                'yahoo.co.jp': '💼',
                'yahoo.com': '💼',
                'bing.com': '🔎',
                'duckduckgo.com': '🦆',
                'instagram.com': '📷',
                'tiktok.com': '🎵',
                'twitch.tv': '🎮',
                'discord.com': '💬',
                'netflix.com': '🎬',
                'spotify.com': '🎵'
            };
            
            for (const [domain, icon] of Object.entries(icons)) {
                if (hostname.includes(domain)) {
                    return icon;
                }
            }
            
            return '🌐';
        } catch {
            return '🌐';
        }
    }
    
    render() {
        if (!this.tabBar) return;
        
        this.tabBar.innerHTML = this.tabs.map(tab => {
            const isActive = tab.id === this.activeTabId;
            const favicon = this.getFavicon(tab.url);
            const displayTitle = tab.title.length > 25 
                ? tab.title.substring(0, 25) + '...' 
                : tab.title;
            
            return `
                <div class="tab ${isActive ? 'active' : ''}" data-tab-id="${tab.id}">
                    <span class="tab-favicon">${favicon}</span>
                    <span class="tab-title">${this.escapeHtml(displayTitle)}</span>
                    <span class="tab-close" data-tab-id="${tab.id}">×</span>
                </div>
            `;
        }).join('');
        
        // イベントリスナー再設定
        this.attachEvents();
    }
    
    attachEvents() {
        // タブクリック
        this.tabBar.querySelectorAll('.tab').forEach(tabEl => {
            const tabId = parseInt(tabEl.dataset.tabId);
            
            tabEl.addEventListener('click', (e) => {
                if (e.target.classList.contains('tab-close')) {
                    this.closeTab(tabId);
                } else {
                    this.switchTo(tabId);
                }
            });
        });
        
        // タブクローズボタン
        this.tabBar.querySelectorAll('.tab-close').forEach(closeBtn => {
            const tabId = parseInt(closeBtn.dataset.tabId);
            
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeTab(tabId);
            });
        });
    }
    
    closeAllExcept(tabId) {
        const tabsToClose = this.tabs.filter(t => t.id !== tabId);
        tabsToClose.forEach(tab => this.closeTab(tab.id));
    }
    
    closeAll() {
        while (this.tabs.length > 0) {
            this.closeTab(this.tabs[0].id);
        }
        this.createTab();
    }
    
    duplicateTab(tabId) {
        const tab = this.tabs.find(t => t.id === tabId);
        if (!tab) return;
        
        this.createTab(tab.url, tab.title);
    }
    
    reorderTabs(fromIndex, toIndex) {
        const [removed] = this.tabs.splice(fromIndex, 1);
        this.tabs.splice(toIndex, 0, removed);
        this.render();
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    getStats() {
        return {
            total: this.tabs.length,
            active: this.activeTabId,
            oldest: Math.min(...this.tabs.map(t => t.createdAt)),
            newest: Math.max(...this.tabs.map(t => t.createdAt))
        };
    }
}

// グローバルインスタンス
window.tabManager = new TabManager();
