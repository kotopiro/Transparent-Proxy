// ========================================
// Shortcuts - キーボードショートカット
// ========================================

class ShortcutManager {
    constructor() {
        this.shortcuts = {
            // タブ操作
            'ctrl+t': () => window.tabManager.createTab(),
            'ctrl+w': () => {
                const tab = window.tabManager.getActiveTab();
                if (tab) window.tabManager.closeTab(tab.id);
            },
            'ctrl+shift+t': () => this.reopenClosedTab(),
            'ctrl+tab': () => this.nextTab(),
            'ctrl+shift+tab': () => this.prevTab(),
            'ctrl+1': () => this.switchToTabByIndex(0),
            'ctrl+2': () => this.switchToTabByIndex(1),
            'ctrl+3': () => this.switchToTabByIndex(2),
            'ctrl+4': () => this.switchToTabByIndex(3),
            'ctrl+5': () => this.switchToTabByIndex(4),
            'ctrl+6': () => this.switchToTabByIndex(5),
            'ctrl+7': () => this.switchToTabByIndex(6),
            'ctrl+8': () => this.switchToTabByIndex(7),
            'ctrl+9': () => this.switchToLastTab(),
            
            // ナビゲーション
            'ctrl+r': () => window.proxyManager.reloadCurrentTab(),
            'f5': () => window.proxyManager.reloadCurrentTab(),
            'ctrl+l': () => this.focusUrlBar(),
            'alt+left': () => this.historyBack(),
            'alt+right': () => this.historyForward(),
            
            // パネル
            'ctrl+h': () => window.uiManager.toggleSidePanel('historyPanel'),
            'ctrl+b': () => window.uiManager.toggleSidePanel('bookmarksPanel'),
            'ctrl+shift+s': () => window.uiManager.toggleSidePanel('settingsPanel'),
            'ctrl+d': () => this.bookmarkCurrentPage(),
            
            // 表示
            'f11': () => this.toggleFullscreen(),
            'ctrl+plus': () => this.zoomIn(),
            'ctrl+minus': () => this.zoomOut(),
            'ctrl+0': () => this.resetZoom(),
            
            // 検索
            'ctrl+f': () => this.openSearch(),
            'escape': () => this.handleEscape()
        };
        
        this.closedTabs = [];
        this.maxClosedTabs = 10;
    }
    
    init() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        console.log('⌨️ ショートカット有効化');
    }
    
    handleKeyDown(e) {
        // 入力中は無効
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            if (e.key === 'Escape') {
                e.target.blur();
            }
            return;
        }
        
        const key = this.getKeyString(e);
        const handler = this.shortcuts[key];
        
        if (handler) {
            e.preventDefault();
            handler();
            console.log('⌨️ ショートカット実行:', key);
        }
    }
    
    getKeyString(e) {
        const parts = [];
        
        if (e.ctrlKey || e.metaKey) parts.push('ctrl');
        if (e.altKey) parts.push('alt');
        if (e.shiftKey) parts.push('shift');
        
        let key = e.key.toLowerCase();
        
        // 特殊キー
        const specialKeys = {
            'arrowleft': 'left',
            'arrowright': 'right',
            'arrowup': 'up',
            'arrowdown': 'down',
            '+': 'plus',
            '-': 'minus',
            '=': 'plus'
        };
        
        if (specialKeys[key]) {
            key = specialKeys[key];
        }
        
        parts.push(key);
        
        return parts.join('+');
    }
    
    // タブ操作
    nextTab() {
        const tabs = window.tabManager.tabs;
        const currentIndex = tabs.findIndex(t => t.id === window.tabManager.activeTabId);
        const nextIndex = (currentIndex + 1) % tabs.length;
        window.tabManager.switchTo(tabs[nextIndex].id);
    }
    
    prevTab() {
        const tabs = window.tabManager.tabs;
        const currentIndex = tabs.findIndex(t => t.id === window.tabManager.activeTabId);
        const prevIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        window.tabManager.switchTo(tabs[prevIndex].id);
    }
    
    switchToTabByIndex(index) {
        const tabs = window.tabManager.tabs;
        if (tabs[index]) {
            window.tabManager.switchTo(tabs[index].id);
        }
    }
    
    switchToLastTab() {
        const tabs = window.tabManager.tabs;
        if (tabs.length > 0) {
            window.tabManager.switchTo(tabs[tabs.length - 1].id);
        }
    }
    
    reopenClosedTab() {
        if (this.closedTabs.length === 0) {
            window.showToast('閉じたタブはありません', 'info');
            return;
        }
        
        const tab = this.closedTabs.pop();
        window.tabManager.createTab(tab.url, tab.title);
        window.showToast('タブを復元しました', 'success');
    }
    
    saveClosedTab(tab) {
        if (tab.url) {
            this.closedTabs.push({
                url: tab.url,
                title: tab.title,
                timestamp: Date.now()
            });
            
            if (this.closedTabs.length > this.maxClosedTabs) {
                this.closedTabs.shift();
            }
        }
    }
    
    // ナビゲーション
    focusUrlBar() {
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.focus();
            urlInput.select();
        }
    }
    
    historyBack() {
        // TODO: 履歴戻る実装
        window.showToast('戻る機能は未実装です', 'info');
    }
    
    historyForward() {
        // TODO: 履歴進む実装
        window.showToast('進む機能は未実装です', 'info');
    }
    
    bookmarkCurrentPage() {
        const tab = window.tabManager.getActiveTab();
        if (!tab || !tab.url) {
            window.showToast('ブックマークするページがありません', 'warning');
            return;
        }
        
        window.historyManager.addToBookmarks(tab.url, tab.title);
    }
    
    // 表示
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error('フルスクリーンエラー:', err);
            });
            window.showToast('フルスクリーンモード', 'info');
        } else {
            document.exitFullscreen();
            window.showToast('通常モードに戻りました', 'info');
        }
    }
    
    zoomIn() {
        // TODO: ズーム機能実装
        window.showToast('ズーム機能は未実装です', 'info');
    }
    
    zoomOut() {
        // TODO: ズーム機能実装
        window.showToast('ズーム機能は未実装です', 'info');
    }
    
    resetZoom() {
        // TODO: ズーム機能実装
        window.showToast('ズーム機能は未実装です', 'info');
    }
    
    // 検索
    openSearch() {
        // TODO: ページ内検索実装
        window.showToast('検索機能は未実装です', 'info');
    }
    
    handleEscape() {
        // パネルを閉じる
        const panels = document.querySelectorAll('.side-panel.open');
        panels.forEach(panel => {
            panel.classList.remove('open');
        });
        
        // オーバーレイを閉じる
        const overlay = document.getElementById('loadingOverlay');
        if (overlay && overlay.classList.contains('show')) {
            overlay.classList.remove('show');
        }
    }
    
    // ヘルプ表示
    showHelp() {
        const shortcuts = [
            { key: 'Ctrl+T', desc: '新しいタブ' },
            { key: 'Ctrl+W', desc: 'タブを閉じる' },
            { key: 'Ctrl+Shift+T', desc: '閉じたタブを復元' },
            { key: 'Ctrl+R / F5', desc: '再読み込み' },
            { key: 'Ctrl+L', desc: 'URLバーにフォーカス' },
            { key: 'Ctrl+H', desc: '履歴' },
            { key: 'Ctrl+B', desc: 'ブックマーク' },
            { key: 'Ctrl+D', desc: 'ブックマークに追加' },
            { key: 'F11', desc: 'フルスクリーン' },
            { key: 'Ctrl+Tab', desc: '次のタブ' },
            { key: 'Ctrl+Shift+Tab', desc: '前のタブ' },
            { key: 'Ctrl+1~9', desc: 'タブ切り替え' },
            { key: 'Esc', desc: 'パネルを閉じる' }
        ];
        
        const html = `
            <div style="max-width: 500px; padding: 20px;">
                <h2 style="margin-bottom: 20px; color: var(--primary);">キーボードショートカット</h2>
                <div style="display: grid; gap: 10px;">
                    ${shortcuts.map(s => `
                        <div style="display: flex; justify-content: space-between; padding: 8px; background: rgba(0,217,255,0.05); border-radius: 8px;">
                            <kbd style="background: rgba(0,217,255,0.2); padding: 4px 8px; border-radius: 4px; font-family: monospace;">${s.key}</kbd>
                            <span>${s.desc}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        
        // TODO: モーダル表示実装
        console.log('ショートカット一覧:', shortcuts);
    }
}

// グローバルインスタンス
window.shortcutManager = new ShortcutManager();
