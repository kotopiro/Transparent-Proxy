// ========================================
// UI Manager - UI制御システム
// ========================================

class UIManager {
    constructor() {
        this.statusText = document.getElementById('statusText');
        this.loadingOverlay = document.getElementById('loadingOverlay');
        this.toastContainer = document.getElementById('toastContainer');
        this.stats = {
            accessCount: 0,
            blockedAds: 0,
            savedTime: 0
        };
    }
    
    init() {
        this.setupEventListeners();
        this.startStatsAnimation();
        console.log('🎨 UI Manager 初期化完了');
    }
    
    setupEventListeners() {
        // パネルクローズボタン
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', () => {
                const panelId = btn.dataset.panel || btn.closest('.side-panel').id;
                this.closeSidePanel(panelId);
            });
        });
        
        // URLクリアボタン
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                const urlInput = document.getElementById('urlInput');
                if (urlInput) {
                    urlInput.value = '';
                    urlInput.focus();
                }
            });
        }
        
        // メニューボタン
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            menuBtn.addEventListener('click', () => {
                this.toggleSidePanel('settingsPanel');
            });
        }
        
        // モード切替ボタン
        const modeBtn = document.getElementById('modeBtn');
        if (modeBtn) {
            modeBtn.addEventListener('click', () => {
                window.settingsManager.toggleProxyMode();
            });
        }
        
        // パネル外クリックで閉じる
        document.addEventListener('click', (e) => {
            const openPanels = document.querySelectorAll('.side-panel.open');
            openPanels.forEach(panel => {
                if (!panel.contains(e.target) && !this.isControlButton(e.target)) {
                    panel.classList.remove('open');
                }
            });
        });
    }
    
    isControlButton(element) {
        return element.closest('#historyBtn, #bookmarksBtn, #settingsBtn, #menuBtn') !== null;
    }
    
    // ========== ステータス ==========
    
    updateStatus(text, color = 'var(--text-accent)') {
        if (this.statusText) {
            this.statusText.textContent = text;
            this.statusText.style.color = color;
        }
        console.log('📊 Status:', text);
    }
    
    showLoading(text = '読み込み中...') {
        if (this.loadingOverlay) {
            const loadingText = this.loadingOverlay.querySelector('.loading-text');
            if (loadingText) {
                loadingText.textContent = text;
            }
            this.loadingOverlay.classList.add('show');
        }
    }
    
    hideLoading() {
        if (this.loadingOverlay) {
            this.loadingOverlay.classList.remove('show');
        }
    }
    
    // ========== トースト通知 ==========
    
    showToast(message, type = 'info', duration = 3000) {
        if (!this.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        const colors = {
            success: 'var(--success)',
            error: 'var(--danger)',
            warning: 'var(--warning)',
            info: 'var(--primary)'
        };
        
        toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 20px;">${icons[type] || icons.info}</span>
                <span style="flex: 1;">${this.escapeHtml(message)}</span>
                <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: none; color: var(--text-tertiary); cursor: pointer; font-size: 20px; padding: 0; width: 24px; height: 24px;">×</button>
            </div>
        `;
        
        toast.style.borderLeft = `4px solid ${colors[type]}`;
        
        this.toastContainer.appendChild(toast);
        
        // 自動削除
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    // ========== サイドパネル ==========
    
    toggleSidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (!panel) return;
        
        const isOpen = panel.classList.contains('open');
        
        // すべてのパネルを閉じる
        document.querySelectorAll('.side-panel').forEach(p => {
            p.classList.remove('open');
        });
        
        // 対象パネルを開く
        if (!isOpen) {
            panel.classList.add('open');
            
            // パネルごとの処理
            if (panelId === 'historyPanel') {
                window.historyManager.renderHistory();
            } else if (panelId === 'bookmarksPanel') {
                window.historyManager.renderBookmarks();
            } else if (panelId === 'settingsPanel') {
                window.settingsManager.updateUI();
            }
        }
    }
    
    closeSidePanel(panelId) {
        const panel = document.getElementById(panelId);
        if (panel) {
            panel.classList.remove('open');
        }
    }
    
    closeAllPanels() {
        document.querySelectorAll('.side-panel').forEach(panel => {
            panel.classList.remove('open');
        });
    }
    
    // ========== 統計 ==========
    
    incrementAccessCount() {
        this.stats.accessCount++;
        this.updateStatsDisplay();
    }
    
    incrementBlockedAds(count = 1) {
        this.stats.blockedAds += count;
        this.stats.savedTime += count * 2; // 広告1つあたり2秒節約と仮定
        this.updateStatsDisplay();
    }
    
    updateStatsDisplay() {
        const accessEl = document.querySelector('[data-count="0"]');
        const blockedEl = document.querySelectorAll('[data-count="0"]')[1];
        const timeEl = document.querySelectorAll('[data-count="0"]')[2];
        
        if (accessEl) {
            this.animateValue(accessEl, parseInt(accessEl.textContent) || 0, this.stats.accessCount, 500);
        }
        if (blockedEl) {
            this.animateValue(blockedEl, parseInt(blockedEl.textContent) || 0, this.stats.blockedAds, 500);
        }
        if (timeEl) {
            this.animateValue(timeEl, parseInt(timeEl.textContent) || 0, this.stats.savedTime, 500);
        }
    }
    
    animateValue(element, start, end, duration) {
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                current = end;
                clearInterval(timer);
            }
            element.textContent = Math.floor(current);
        }, 16);
    }
    
    startStatsAnimation() {
        // Welcome画面の統計をアニメーション
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach((el, index) => {
            setTimeout(() => {
                el.classList.add('counting');
            }, index * 200);
        });
    }
    
    // ========== ウェルカム画面 ==========
    
    hideWelcomeScreen() {
        const welcomeScreen = document.querySelector('.welcome-screen');
        if (welcomeScreen) {
            welcomeScreen.style.animation = 'fadeOut 0.5s ease-out';
            setTimeout(() => {
                welcomeScreen.remove();
            }, 500);
        }
    }
    
    showWelcomeScreen() {
        const contentArea = document.getElementById('contentArea');
        if (!contentArea) return;
        
        // 既存のコンテンツをクリア
        contentArea.innerHTML = '';
        
        // Welcome画面を再作成
        const welcomeHTML = `
            <div class="welcome-screen">
                <div class="welcome-content">
                    <div class="welcome-logo">
                        <svg width="160" height="160" viewBox="0 0 160 160">
                            <defs>
                                <linearGradient id="welcomeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" style="stop-color:#00d9ff;stop-opacity:1" />
                                    <stop offset="50%" style="stop-color:#00fff7;stop-opacity:1" />
                                    <stop offset="100%" style="stop-color:#0099cc;stop-opacity:1" />
                                </linearGradient>
                                <filter id="glow">
                                    <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                                    <feMerge>
                                        <feMergeNode in="coloredBlur"/>
                                        <feMergeNode in="SourceGraphic"/>
                                    </feMerge>
                                </filter>
                            </defs>
                            <circle cx="80" cy="80" r="70" fill="none" stroke="url(#welcomeGrad)" stroke-width="4" filter="url(#glow)"/>
                            <path d="M40 80 L80 40 L120 80 L80 120 Z" fill="url(#welcomeGrad)" filter="url(#glow)"/>
                        </svg>
                    </div>
                    <h1 class="welcome-title">Transparent Proxy</h1>
                    <p class="welcome-subtitle">究極のWebプロキシ体験</p>
                    <div class="welcome-features">
                        <div class="feature-card"><div class="feature-icon">⚡</div><div class="feature-text">超高速</div></div>
                        <div class="feature-card"><div class="feature-icon">🛡️</div><div class="feature-text">強固</div></div>
                        <div class="feature-card"><div class="feature-icon">🚫</div><div class="feature-text">広告ブロック</div></div>
                        <div class="feature-card"><div class="feature-icon">🔒</div><div class="feature-text">ステルス</div></div>
                    </div>
                </div>
            </div>
        `;
        
        contentArea.innerHTML = welcomeHTML;
    }
    
    // ========== ユーティリティ ==========
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }
    
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}時間${minutes % 60}分`;
        if (minutes > 0) return `${minutes}分${seconds % 60}秒`;
        return `${seconds}秒`;
    }
}

// グローバルインスタンス
window.uiManager = new UIManager();

// グローバル関数（他のモジュールから呼び出せるように）
window.updateStatus = (text, color) => window.uiManager.updateStatus(text, color);
window.showToast = (message, type, duration) => window.uiManager.showToast(message, type, duration);
window.showLoading = (text) => window.uiManager.showLoading(text);
window.hideLoading = () => window.uiManager.hideLoading();
