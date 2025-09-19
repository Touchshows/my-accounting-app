class ThemeManager {
    constructor() {
        this.themeRadios = document.querySelectorAll('input[name="theme"]');
        this.themeSelector = document.getElementById('theme-selector');
        this.themes = [
            { value: 'light', name: '浅色', color: '#667eea' },
            { value: 'dark', name: '深色', color: '#7c3aed' },
            { value: 'blue', name: '海洋蓝', color: '#0ea5e9' },
            { value: 'green', name: '自然绿', color: '#22c55e' },
            { value: 'purple', name: '优雅紫', color: '#a855f7' },
            { value: 'orange', name: '活力橙', color: '#f97316' }
        ];
    }

    init() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        this.createThemeSelector();
        this.applyTheme(savedTheme);
        this.bindEvents();
    }

    createThemeSelector() {
        if (!this.themeSelector) return;
        
        const themeOptions = this.themes.map(theme => `
            <div class="theme-option" data-theme="${theme.value}">
                <div class="theme-preview" style="background: ${theme.color}"></div>
                <span class="theme-name">${theme.name}</span>
            </div>
        `).join('');
        
        this.themeSelector.innerHTML = `
            <div class="theme-selector-header">
                <h4>🎨 选择主题</h4>
            </div>
            <div class="theme-options">
                ${themeOptions}
            </div>
        `;
    }

    bindEvents() {
        // 兼容原有的radio按钮
        this.themeRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.applyTheme(e.target.value);
            });
        });

        // 新的主题选择器事件
        if (this.themeSelector) {
            this.themeSelector.addEventListener('click', (e) => {
                const themeOption = e.target.closest('.theme-option');
                if (themeOption) {
                    const theme = themeOption.dataset.theme;
                    this.applyTheme(theme);
                }
            });
        }
    }

    applyTheme(theme) {
        let newTheme = theme;
        if (theme === 'auto') {
            newTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', theme);

        // 更新radio按钮状态
        this.themeRadios.forEach(radio => {
            radio.checked = radio.value === theme;
        });

        // 更新主题选择器状态
        if (this.themeSelector) {
            this.themeSelector.querySelectorAll('.theme-option').forEach(option => {
                option.classList.toggle('active', option.dataset.theme === newTheme);
            });
        }

        // 显示主题切换通知
        const themeName = this.themes.find(t => t.value === newTheme)?.name || newTheme;
        if (window.app && window.app.uiManager) {
            window.app.uiManager.showNotification(`已切换到${themeName}主题`, 'success');
        }
    }

    getCurrentTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    getAvailableThemes() {
        return this.themes;
    }
}