// ========================================
// Transparent Proxy - Main Application
// 理論上最強のWebプロキシ
// ========================================

console.log(`
╔═══════════════════════════════════════════════╗
║                                               ║
║       🚀 Transparent Proxy v2.0 🚀           ║
║                                               ║
║       理論上最強のWebプロキシ                  ║
║       Interstellar超え                        ║
║                                               ║
╚═══════════════════════════════════════════════╝
`);

// ========== グローバル設定 ==========
window.APP_CONFIG = {
    version: '2.0.0',
    name: 'Transparent Proxy',
    author: 'Transparent Proxy Team',
    github: 'https://github.com/yourusername/transparent-proxy',
    buildDate: '2024-12-23'
};

// ========== 初期化 ==========
class App {
    constructor() {
        this.initialized = false;
        this.startTime = Date.now();
    }
    
    async init() {
        if (this.initialized) return;
        
        console.log('🚀 アプリケーション起動中...');
        
        try {
            // 1. UI Manager
            if (window.uiManager) {
                window.uiManager.init();
                console.log('✅ UI Manager');
            }
            
            // 2. Settings Manager
            if (window.settingsManager) {
                window.settingsManager.init();
                console.log('✅ Settings Manager');
            }
            
            // 3. Tab Manager
            if (window.tabManager) {
                window.tabManager.init();
                console.log('✅ Tab Manager');
            }
            
            // 4. History Manager（自動初期化済み）
            console.log('✅ History Manager');
            
            // 5. Proxy Manager
            if (window.proxyManager) {
                window.proxyManager.init();
                console.log('✅ Proxy Manager');
            }
            
            // 6. Shortcut Manager
            if (window.shortcutManager) {
                window.shortcutManager.init();
                console.log('✅ Shortcut Manager');
            }
            
            // 7. イベントリスナー設定
            this.setupEventListeners();
            console.log('✅ Event Listeners');
            
            // 8. Service Worker登録
            await this.registerServiceWorker();
            
            this.initialized = true;
            
            const loadTime = Date.now() - this.startTime;
            console.log(`✅ 起動完了 (${loadTime}ms)`);
            
            window.updateStatus('準備完了', 'var(--success)');
            
            // Welcome メッセージ
            setTimeout(() => {
                window.showToast('Transparent Proxy へようこそ！', 'success', 5000);
            }, 500);
            
        } catch (error) {
            console.error('❌ 初期化エラー:', error);
            window.showToast('初期化エラーが発生しました', 'error');
        }
    }
    
    setupEventListeners() {
        // GO ボタン
        const goBtn = document.getElementById('goBtn');
        if (goBtn) {
            goBtn.addEventListener('click', () => {
                window.proxyManager.navigate();
            });
        }
        
        // URL入力欄
        const urlInput = document.getElementById('urlInput');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    window.proxyManager.navigate();
                }
            });
        }
        
        // リロードボタン
        const reloadBtn = document.getElementById('reloadBtn');
        if (reloadBtn) {
            reloadBtn.addEventListener('click', () => {
                window.proxyManager.reloadCurrentTab();
            });
        }
        
        // フルスクリーンボタン
        const fullscreenBtn = document.getElementById('fullscreenBtn');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', () => {
                window.shortcutManager.toggleFullscreen();
            });
        }
        
        // 新規タブボタン
        const newTabBtn = document.getElementById('newTabBtn');
        if (newTabBtn) {
            newTabBtn.addEventListener('click', () => {
                window.tabManager.createTab();
            });
        }
        
        // 履歴ボタン
        const historyBtn = document.getElementById('historyBtn');
        if (historyBtn) {
            historyBtn.addEventListener('click', () => {
                window.uiManager.toggleSidePanel('historyPanel');
            });
        }
        
        // ブックマークボタン
        const bookmarksBtn = document.getElementById('bookmarksBtn');
        if (bookmarksBtn) {
            bookmarksBtn.addEventListener('click', () => {
                window.uiManager.toggleSidePanel('bookmarksPanel');
            });
        }
        
        // 設定ボタン
        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                window.uiManager.toggleSidePanel('settingsPanel');
            });
        }
        
        // 履歴クリアボタン
        const clearHistoryBtn = document.getElementById('clearHistoryBtn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                window.historyManager.clearHistory();
            });
        }
        
        // フルスクリーン変更検知
        document.addEventListener('fullscreenchange', () => {
            const isFullscreen = !!document.fullscreenElement;
            console.log('フルスクリーン:', isFullscreen);
        });
        
        // オンライン/オフライン検知
        window.addEventListener('online', () => {
            window.showToast('オンラインに戻りました', 'success');
            window.updateStatus('オンライン', 'var(--success)');
        });
        
        window.addEventListener('offline', () => {
            window.showToast('オフラインです', 'warning');
            window.updateStatus('オフライン', 'var(--danger)');
        });
        
        // ページアンロード時の警告
        window.addEventListener('beforeunload', (e) => {
            const tabs = window.tabManager?.tabs || [];
            if (tabs.length > 1 || (tabs.length === 1 && tabs[0].url)) {
                e.preventDefault();
                e.returnValue = '';
            }
        });
    }
    
    async registerServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('/sw.js');
                console.log('✅ Service Worker 登録成功:', registration.scope);
            } catch (error) {
                console.warn('⚠️ Service Worker 登録失敗:', error);
            }
        }
    }
    
    // デバッグ情報
    getDebugInfo() {
        return {
            version: window.APP_CONFIG.version,
            uptime: Date.now() - this.startTime,
            tabs: window.tabManager?.tabs.length || 0,
            history: window.historyManager?.history.length || 0,
            bookmarks: window.historyManager?.bookmarks.length || 0,
            settings: window.settingsManager?.settings || {},
            stats: window.uiManager?.stats || {},
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            online: navigator.onLine
        };
    }
    
    // コンソールコマンド
    setupConsoleCommands() {
        window.tp = {
            info: () => console.table(this.getDebugInfo()),
            clear: () => {
                window.historyManager?.clearHistory();
                window.proxyManager?.clearCache();
                console.log('✅ すべてクリアしました');
            },
            export: () => {
                const data = {
                    settings: window.settingsManager?.settings,
                    history: window.historyManager?.history,
                    bookmarks: window.historyManager?.bookmarks
                };
                console.log('データ:', data);
                return data;
            },
            stats: () => console.table(window.uiManager?.stats),
            help: () => {
                console.log(`
Transparent Proxy コンソールコマンド:
  tp.info()    - デバッグ情報表示
  tp.clear()   - すべてクリア
  tp.export()  - データエクスポート
  tp.stats()   - 統計情報
  tp.help()    - ヘルプ表示
                `);
            }
        };
        
        console.log('💡 コンソールコマンド: tp.help()');
    }
}

// ========== アプリケーション起動 ==========
const app = new App();

// DOM読み込み完了後に初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app.init();
        app.setupConsoleCommands();
    });
} else {
    app.init();
    app.setupConsoleCommands();
}

// グローバルに公開
window.app = app;

// エラーハンドリング
window.addEventListener('error', (e) => {
    console.error('グローバルエラー:', e.error);
    window.showToast('エラーが発生しました', 'error');
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('未処理のPromiseエラー:', e.reason);
    window.showToast('処理エラーが発生しました', 'error');
});

// パフォーマンス測定
window.addEventListener('load', () => {
    if (window.performance && window.performance.timing) {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        console.log(`📊 ページ読み込み時間: ${loadTime}ms`);
    }
});

console.log('✅ app.js 読み込み完了');
