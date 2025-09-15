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

        // Make it globally accessible
        window.app = this; 
    }

    init() {
        this.bindGlobalEvents();
        this.themeManager.init();
        this.navigateTo('dashboard');
    }

    bindGlobalEvents() {
        // Navigation
        document.querySelector('.nav').addEventListener('click', (e) => {
            if (e.target.matches('.nav-btn')) {
                this.navigateTo(e.target.dataset.page);
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

    navigateTo(page, params = {}) {
        this.currentPage = page;
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

        switch (page) {
            case 'dashboard':
                this.uiManager.loadDashboard();
                break;
            case 'transactions':
                this.uiManager.loadTransactionsPage();
                if (params.date) {
                    const dateFilter = document.getElementById('date-filter');
                    if (dateFilter) {
                        dateFilter.value = params.date;
                        this.uiManager.filterTransactions();
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
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new AccountingApp();
    app.init();
});