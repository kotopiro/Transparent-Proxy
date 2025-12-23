// ========================================
// History - 履歴・ブックマーク管理
// ========================================

class HistoryManager {
    constructor() {
        this.history = [];
        this.bookmarks = [];
        this.maxHistory = 100;
        this.storageKey = 'transparentProxyHistory';
        this.bookmarksKey = 'transparentProxyBookmarks';
        
        this.load();
    }
    
    // ========== 履歴 ==========
    
    addToHistory(url, title) {
        const entry = {
            url,
            title,
            timestamp: Date.now(),
            id: this.generateId()
        };
        
        // 重複チェック
        const existing = this.history.findIndex(h => h.url === url);
        if (existing !== -1) {
            this.history.splice(existing, 1);
        }
        
        this.history.unshift(entry);
        
        // 上限チェック
        if (this.history.length > this.maxHistory) {
            this.history = this.history.slice(0, this.maxHistory);
        }
        
        this.save();
        console.log('📝 履歴追加:', title);
    }
    
    removeFromHistory(id) {
        const index = this.history.findIndex(h => h.id === id);
        if (index !== -1) {
            this.history.splice(index, 1);
            this.save();
            this.renderHistory();
        }
    }
    
    clearHistory() {
        if (confirm('すべての履歴を削除しますか？')) {
            this.history = [];
            this.save();
            this.renderHistory();
            window.showToast('履歴を削除しました', 'success');
        }
    }
    
    searchHistory(query) {
        const lowerQuery = query.toLowerCase();
        return this.history.filter(h => 
            h.title.toLowerCase().includes(lowerQuery) ||
            h.url.toLowerCase().includes(lowerQuery)
        );
    }
    
    getHistoryByDate(date) {
        const startOfDay = new Date(date).setHours(0, 0, 0, 0);
        const endOfDay = new Date(date).setHours(23, 59, 59, 999);
        
        return this.history.filter(h => 
            h.timestamp >= startOfDay && h.timestamp <= endOfDay
        );
    }
    
    getRecentHistory(count = 10) {
        return this.history.slice(0, count);
    }
    
    renderHistory() {
        const listEl = document.getElementById('historyList');
        if (!listEl) return;
        
        if (this.history.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">📜</div>
                    <p>履歴はありません</p>
                </div>
            `;
            return;
        }
        
        // 日付でグループ化
        const grouped = this.groupByDate();
        
        listEl.innerHTML = Object.entries(grouped).map(([date, items]) => `
            <div class="history-group">
                <h3 class="history-date">${date}</h3>
                ${items.map(item => `
                    <div class="history-item" data-url="${this.escapeHtml(item.url)}">
                        <div class="history-main" onclick="window.proxyManager.loadUrl('${this.escapeHtml(item.url)}'); window.uiManager.closeSidePanel('historyPanel');">
                            <div class="history-icon">${this.getFavicon(item.url)}</div>
                            <div class="history-info">
                                <div class="history-title">${this.escapeHtml(item.title)}</div>
                                <div class="history-url">${this.escapeHtml(this.shortenUrl(item.url))}</div>
                                <div class="history-time">${this.formatTime(item.timestamp)}</div>
                            </div>
                        </div>
                        <div class="history-actions">
                            <button class="icon-btn-sm" onclick="window.historyManager.addToBookmarks('${this.escapeHtml(item.url)}', '${this.escapeHtml(item.title)}')" title="ブックマーク">⭐</button>
                            <button class="icon-btn-sm" onclick="window.historyManager.removeFromHistory('${item.id}')" title="削除">🗑️</button>
                        </div>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }
    
    // ========== ブックマーク ==========
    
    addToBookmarks(url, title) {
        if (this.bookmarks.some(b => b.url === url)) {
            window.showToast('既にブックマーク済みです', 'warning');
            return;
        }
        
        const bookmark = {
            url,
            title,
            timestamp: Date.now(),
            id: this.generateId(),
            folder: 'default'
        };
        
        this.bookmarks.unshift(bookmark);
        this.save();
        this.renderBookmarks();
        window.showToast('ブックマークに追加しました', 'success');
        console.log('⭐ ブックマーク追加:', title);
    }
    
    removeFromBookmarks(id) {
        const index = this.bookmarks.findIndex(b => b.id === id);
        if (index !== -1) {
            this.bookmarks.splice(index, 1);
            this.save();
            this.renderBookmarks();
            window.showToast('ブックマークを削除しました', 'info');
        }
    }
    
    renderBookmarks() {
        const listEl = document.getElementById('bookmarksList');
        if (!listEl) return;
        
        if (this.bookmarks.length === 0) {
            listEl.innerHTML = `
                <div style="text-align: center; padding: 40px; color: var(--text-tertiary);">
                    <div style="font-size: 48px; margin-bottom: 16px;">⭐</div>
                    <p>ブックマークはありません</p>
                </div>
            `;
            return;
        }
        
        listEl.innerHTML = this.bookmarks.map(item => `
            <div class="bookmark-item">
                <div class="bookmark-main" onclick="window.proxyManager.loadUrl('${this.escapeHtml(item.url)}'); window.uiManager.closeSidePanel('bookmarksPanel');">
                    <div class="bookmark-icon">${this.getFavicon(item.url)}</div>
                    <div class="bookmark-info">
                        <div class="bookmark-title">${this.escapeHtml(item.title)}</div>
                        <div class="bookmark-url">${this.escapeHtml(this.shortenUrl(item.url))}</div>
                    </div>
                </div>
                <button class="icon-btn-sm" onclick="window.historyManager.removeFromBookmarks('${item.id}')" title="削除">🗑️</button>
            </div>
        `).join('');
    }
    
    // ========== ユーティリティ ==========
    
    groupByDate() {
        const grouped = {};
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        this.history.forEach(item => {
            const itemDate = new Date(item.timestamp);
            itemDate.setHours(0, 0, 0, 0);
            
            let label;
            if (itemDate.getTime() === today.getTime()) {
                label = '今日';
            } else if (itemDate.getTime() === yesterday.getTime()) {
                label = '昨日';
            } else {
                label = this.formatDate(item.timestamp);
            }
            
            if (!grouped[label]) {
                grouped[label] = [];
            }
            grouped[label].push(item);
        });
        
        return grouped;
    }
    
    formatDate(timestamp) {
        const date = new Date(timestamp);
        return `${date.getMonth() + 1}月${date.getDate()}日`;
    }
    
    formatTime(timestamp) {
        const date = new Date(timestamp);
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${hours}:${minutes}`;
    }
    
    shortenUrl(url) {
        try {
            const urlObj = new URL(url);
            let path = urlObj.pathname + urlObj.search;
            if (path.length > 50) {
                path = path.substring(0, 50) + '...';
            }
            return urlObj.hostname + path;
        } catch {
            return url.length > 60 ? url.substring(0, 60) + '...' : url;
        }
    }
    
    getFavicon(url) {
        if (!url) return '🌐';
        try {
            const hostname = new URL(url).hostname.toLowerCase();
            const icons = {
                'google': '🔍', 'youtube': '📺', 'twitter': '🐦', 'x.com': '🐦',
                'facebook': '👥', 'github': '💻', 'reddit': '🤖', 'wikipedia': '📖',
                'amazon': '🛒', 'yahoo': '💼', 'bing': '🔎', 'duckduckgo': '🦆'
            };
            for (const [key, icon] of Object.entries(icons)) {
                if (hostname.includes(key)) return icon;
            }
            return '🌐';
        } catch {
            return '🌐';
        }
    }
    
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // ========== ストレージ ==========
    
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.history));
            localStorage.setItem(this.bookmarksKey, JSON.stringify(this.bookmarks));
        } catch (e) {
            console.error('保存エラー:', e);
        }
    }
    
    load() {
        try {
            const historyData = localStorage.getItem(this.storageKey);
            const bookmarksData = localStorage.getItem(this.bookmarksKey);
            
            if (historyData) {
                this.history = JSON.parse(historyData);
            }
            
            if (bookmarksData) {
                this.bookmarks = JSON.parse(bookmarksData);
            }
        } catch (e) {
            console.error('読み込みエラー:', e);
        }
    }
    
    export() {
        return {
            history: this.history,
            bookmarks: this.bookmarks,
            exportedAt: Date.now()
        };
    }
    
    import(data) {
        if (data.history) {
            this.history = data.history;
        }
        if (data.bookmarks) {
            this.bookmarks = data.bookmarks;
        }
        this.save();
        this.renderHistory();
        this.renderBookmarks();
    }
}

// グローバルインスタンス
window.historyManager = new HistoryManager();
