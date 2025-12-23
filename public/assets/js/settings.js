// ========================================
// Settings - 設定管理システム
// ========================================

class SettingsManager {
    constructor() {
        this.storageKey = 'transparentProxySettings';
        this.defaults = {
            aboutBlank: true,
            adBlock: true,
            cache: true,
            searchEngine: 'google',
            theme: 'dark',
            particles: true,
            proxyMode: 'stealth',
            autoSave: true,
            notifications: true
        };
        this.settings = { ...this.defaults };
        this.searchEngines = {
            google: 'https://www.google.com/search?q=',
            duckduckgo: 'https://duckduckgo.com/?q=',
            bing: 'https://www.bing.com/search?q=',
            yahoo: 'https://search.yahoo.co.jp/search?p='
        };
        
        this.load();
        this.applySettings();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
    }
    
    setupEventListeners() {
        // about:blank モード
        const aboutBlankToggle = document.getElementById('aboutBlankMode');
        if (aboutBlankToggle) {
            aboutBlankToggle.addEventListener('change', (e) => {
                this.set('aboutBlank', e.target.checked);
            });
        }
        
        // 広告ブロック
        const adBlockToggle = document.getElementById('adBlockMode');
        if (adBlockToggle) {
            adBlockToggle.addEventListener('change', (e) => {
                this.set('adBlock', e.target.checked);
            });
        }
        
        // キャッシュ
        const cacheToggle = document.getElementById('cacheMode');
        if (cacheToggle) {
            cacheToggle.addEventListener('change', (e) => {
                this.set('cache', e.target.checked);
            });
        }
        
        // 検索エンジン
        const searchEngine = document.getElementById('searchEngine');
        if (searchEngine) {
            searchEngine.addEventListener('change', (e) => {
                this.set('searchEngine', e.target.value);
            });
        }
        
        // テーマ
        const themeMode = document.getElementById('themeMode');
        if (themeMode) {
            themeMode.addEventListener('change', (e) => {
                this.set('theme', e.target.value);
                this.applyTheme();
            });
        }
        
        // パーティクル
        const particlesToggle = document.getElementById('particlesMode');
        if (particlesToggle) {
            particlesToggle.addEventListener('change', (e) => {
                this.set('particles', e.target.checked);
                this.toggleParticles();
            });
        }
    }
    
    get(key) {
        return this.settings[key] !== undefined ? this.settings[key] : this.defaults[key];
    }
    
    set(key, value) {
        this.settings[key] = value;
        this.save();
        this.applySettings();
        console.log(`⚙️ 設定変更: ${key} = ${value}`);
        
        // 通知
        if (this.get('notifications')) {
            const messages = {
                aboutBlank: value ? 'about:blank モードを有効にしました' : 'about:blank モードを無効にしました',
                adBlock: value ? '広告ブロックを有効にしました' : '広告ブロックを無効にしました',
                cache: value ? 'キャッシュを有効にしました' : 'キャッシュを無効にしました',
                searchEngine: `検索エンジンを${value}に変更しました`,
                theme: `テーマを${value}に変更しました`,
                particles: value ? 'パーティクルを有効にしました' : 'パーティクルを無効にしました'
            };
            
            if (messages[key]) {
                window.showToast(messages[key], 'success');
            }
        }
    }
    
    reset() {
        if (confirm('すべての設定をリセットしますか？')) {
            this.settings = { ...this.defaults };
            this.save();
            this.applySettings();
            this.updateUI();
            window.showToast('設定をリセットしました', 'success');
        }
    }
    
    applySettings() {
        // テーマ適用
        this.applyTheme();
        
        // パーティクル適用
        this.toggleParticles();
    }
    
    applyTheme() {
        const theme = this.get('theme');
        
        if (theme === 'auto') {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            document.body.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
        } else {
            document.body.setAttribute('data-theme', theme);
        }
    }
    
    toggleParticles() {
        const enabled = this.get('particles');
        
        if (window.particleSystem) {
            window.particleSystem.toggle(enabled);
        }
        
        const canvas = document.getElementById('particles');
        if (canvas) {
            canvas.style.display = enabled ? 'block' : 'none';
        }
    }
    
    updateUI() {
        // チェックボックス
        const aboutBlankToggle = document.getElementById('aboutBlankMode');
        if (aboutBlankToggle) {
            aboutBlankToggle.checked = this.get('aboutBlank');
        }
        
        const adBlockToggle = document.getElementById('adBlockMode');
        if (adBlockToggle) {
            adBlockToggle.checked = this.get('adBlock');
        }
        
        const cacheToggle = document.getElementById('cacheMode');
        if (cacheToggle) {
            cacheToggle.checked = this.get('cache');
        }
        
        const particlesToggle = document.getElementById('particlesMode');
        if (particlesToggle) {
            particlesToggle.checked = this.get('particles');
        }
        
        // セレクト
        const searchEngine = document.getElementById('searchEngine');
        if (searchEngine) {
            searchEngine.value = this.get('searchEngine');
        }
        
        const themeMode = document.getElementById('themeMode');
        if (themeMode) {
            themeMode.value = this.get('theme');
        }
    }
    
    getSearchEngine() {
        const engine = this.get('searchEngine');
        return this.searchEngines[engine] || this.searchEngines.google;
    }
    
    toggleProxyMode() {
        const modes = ['stealth', 'fast', 'normal'];
        const current = this.get('proxyMode');
        const currentIndex = modes.indexOf(current);
        const next = modes[(currentIndex + 1) % modes.length];
        
        this.set('proxyMode', next);
        
        // UI更新
        const modeText = document.getElementById('proxyModeText');
        if (modeText) {
            const names = {
                stealth: 'ステルス',
                fast: '高速',
                normal: '通常'
            };
            modeText.textContent = names[next];
        }
        
        return next;
    }
    
    // ストレージ
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
        } catch (e) {
            console.error('設定保存エラー:', e);
        }
    }
    
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (data) {
                this.settings = { ...this.defaults, ...JSON.parse(data) };
            }
        } catch (e) {
            console.error('設定読み込みエラー:', e);
        }
    }
    
    export() {
        const dataStr = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'transparent-proxy-settings.json';
        a.click();
        URL.revokeObjectURL(url);
        window.showToast('設定をエクスポートしました', 'success');
    }
    
    import(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.settings = { ...this.defaults, ...data };
                this.save();
                this.applySettings();
                this.updateUI();
                window.showToast('設定をインポートしました', 'success');
            } catch (err) {
                window.showToast('インポートに失敗しました', 'error');
                console.error('インポートエラー:', err);
            }
        };
        reader.readAsText(file);
    }
}

// グローバルインスタンス
window.settingsManager = new SettingsManager();
