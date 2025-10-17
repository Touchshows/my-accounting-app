class AccountingApp {
    constructor() {
        const storageManager = new StorageManager();
        this.dataManager = new DataManager(storageManager);
        this.uiManager = new UIManager(this.dataManager);
        this.themeManager = new ThemeManager();

        // Resolve circular dependency
        this.dataManager.setUIManager(this.uiManager);

        this.currentTransactionType = null;
        this.editingTransactionId = null;
        this.currentPage = 'dashboard';
        this.pageStack = [];

        // Make it globally accessible
        window.app = this; 
    }

    init() {
        this.bindGlobalEvents();
        this.themeManager.init();
        const initial = this.parseHashState() || { page: 'dashboard', params: {} };
        this.navigateTo(initial.page, initial.params, { historyReplace: true });
    }

    bindGlobalEvents() {
        document.querySelector('.nav').addEventListener('click', (e) => {
            if (e.target.matches('.nav-btn') && e.target.dataset.page) {
                this.navigateTo(e.target.dataset.page);
            }
        });

        const backBtn = document.getElementById('nav-back');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.goBack());
        }

        window.addEventListener('popstate', (e) => {
            if (this.pageStack.length > 1) {
                this.pageStack.pop();
            }
            const st = e.state;
            if (st && st.page) {
                this.navigateTo(st.page, st.params || {}, { skipStackPush: true });
            }
        });

        // Quick add buttons
        document.getElementById('quick-income').addEventListener('click', () => {
            this.uiManager.openTransactionModal('income');
        });

        document.getElementById('quick-expense').addEventListener('click', () => {
            this.uiManager.openTransactionModal('expense');
        });

        // Modals
        document.querySelectorAll('.modal .close-btn, .modal .btn-cancel').forEach(btn => {
            btn.addEventListener('click', () => {
                this.uiManager.closeAllModals();
            });
        });

        // Transaction form
        document.getElementById('transaction-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uiManager.handleTransactionFormSubmit();
        });

        // Category form
        document.getElementById('category-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uiManager.handleCategoryFormSubmit();
        });

        // Budget form
        document.getElementById('budget-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.uiManager.handleBudgetFormSubmit();
        });

        // Delegated event listener for dynamic content
        document.querySelector('.main').addEventListener('click', (e) => {
            const editBtn = e.target.closest('.btn-edit-transaction');
            if (editBtn) {
                const id = editBtn.dataset.id;
                const type = editBtn.dataset.type;
                this.uiManager.editTransaction(id, type);
                return;
            }

            const deleteBtn = e.target.closest('.btn-delete-transaction');
            if (deleteBtn) {
                const id = deleteBtn.dataset.id;
                this.uiManager.deleteTransaction(id);
            }
        });
    }

    navigateTo(page, params = {}, options = {}) {
        if (!page) return;
        this.updateTopStateFromDOM();
        this.currentPage = page;
        const newState = { page, params };
        const last = this.pageStack[this.pageStack.length - 1];
        if (!options.skipStackPush && (!last || last.page !== page)) {
            this.pageStack.push(newState);
        }
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        const pageElement = document.getElementById(`${page}-page`);
        if (pageElement) {
            pageElement.classList.add('active');
        }

        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        const navBtn = document.querySelector(`.nav-btn[data-page="${page}"]`);
        if (navBtn) {
            navBtn.classList.add('active');
        }

        const backBtn = document.getElementById('nav-back');
        if (backBtn) {
            backBtn.disabled = this.pageStack.length <= 1;
        }

        switch (page) {
            case 'dashboard':
                this.uiManager.loadDashboard();
                break;
            case 'transactions':
                this.uiManager.loadTransactionsPage();
                const s = document.getElementById('search-input');
                const tf = document.getElementById('type-filter');
                const cf = document.getElementById('category-filter');
                const df = document.getElementById('date-filter');
                if (s && params.search != null) s.value = params.search;
                if (tf && params.type != null) tf.value = params.type;
                if (cf && params.category != null) cf.value = params.category;
                if (df && params.date != null) df.value = params.date;
                this.uiManager.filterTransactions();
                if (params.scrollTop != null) {
                    const list = document.getElementById('transactions-list');
                    if (list) {
                        setTimeout(() => { list.scrollTop = params.scrollTop || 0; }, 0);
                    }
                }
                break;
            case 'categories':
                this.uiManager.loadCategoriesPage();
                break;
            case 'budgets':
                this.uiManager.loadBudgetsPage();
                break;
            case 'statistics':
                this.uiManager.loadStatisticsPage();
                break;
            case 'settings':
                this.uiManager.loadSettingsPage();
                break;
        }

        const urlHash = this.buildHash(newState);
        if (options.historyReplace) {
            window.history.replaceState(newState, '', urlHash);
        } else if (!options.skipHistoryPush) {
            window.history.pushState(newState, '', urlHash);
        }
    }

    goBack() {
        if (this.pageStack.length > 1) {
            window.history.back();
        } else {
            const backBtn = document.getElementById('nav-back');
            if (backBtn) backBtn.disabled = true;
        }
    }

    updateTopStateFromDOM() {
        if (!this.pageStack.length) return;
        const top = this.pageStack[this.pageStack.length - 1];
        if (!top || !top.page) return;
        if (top.page === 'transactions') {
            const s = document.getElementById('search-input');
            const tf = document.getElementById('type-filter');
            const cf = document.getElementById('category-filter');
            const df = document.getElementById('date-filter');
            const list = document.getElementById('transactions-list');
            top.params = {
                search: s ? s.value : '',
                type: tf ? tf.value : '',
                category: cf ? cf.value : '',
                date: df ? df.value : '',
                scrollTop: list ? list.scrollTop : 0
            };
        }
    }

    syncTransactionsFiltersState() {
        if (!this.pageStack.length) return;
        const top = this.pageStack[this.pageStack.length - 1];
        if (!top || top.page !== 'transactions') return;
        const s = document.getElementById('search-input');
        const tf = document.getElementById('type-filter');
        const cf = document.getElementById('category-filter');
        const df = document.getElementById('date-filter');
        const list = document.getElementById('transactions-list');
        top.params = {
            search: s ? s.value : '',
            type: tf ? tf.value : '',
            category: cf ? cf.value : '',
            date: df ? df.value : '',
            scrollTop: list ? list.scrollTop : 0
        };
        const urlHash = this.buildHash(top);
        window.history.replaceState(top, '', urlHash);
    }

    buildHash(state) {
        const p = state.params || {};
        const q = [];
        Object.keys(p).forEach(k => {
            if (p[k] !== '' && p[k] != null && k !== 'scrollTop') {
                q.push(`${encodeURIComponent(k)}=${encodeURIComponent(p[k])}`);
            }
        });
        const qs = q.length ? `?${q.join('&')}` : '';
        return `#${state.page}${qs}`;
    }

    parseHashState() {
        const h = window.location.hash || '';
        if (!h || h.length < 2) return null;
        const pure = h.slice(1);
        const [page, query] = pure.split('?');
        if (!page) return null;
        const params = {};
        if (query) {
            query.split('&').forEach(pair => {
                const [k, v] = pair.split('=');
                if (k) params[decodeURIComponent(k)] = decodeURIComponent(v || '');
            });
        }
        return { page, params };
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new AccountingApp();
    app.init();
});