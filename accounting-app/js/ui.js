class UIManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    // Helper to show notifications
    showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        container.appendChild(notification);

        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Helper to close all modals
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
    }

    // Transaction related UI
    createTransactionItem(transaction) {
        const category = this.dataManager.getCategories().find(c => c.id === transaction.categoryId);
        const categoryName = (category && category.name) ? category.name : '未分类';
        const categoryIcon = (category && category.icon) ? category.icon : '📊';
        
        return `
            <div class="transaction-item" data-id="${transaction.id}">
                <div class="transaction-info">
                    <div class="transaction-category">
                        ${categoryIcon} ${categoryName}
                    </div>
                    <div class="transaction-description">${transaction.description || '无描述'}</div>
                    <div class="transaction-date">${Utils.formatDate(transaction.date, 'MM月DD日')}</div>
                </div>
                <div class="transaction-right">
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${Utils.formatCurrency(transaction.amount)}
                    </div>
                    <div class="transaction-actions">
                        <button class="btn-edit-transaction" data-id="${transaction.id}" data-type="${transaction.type}" title="编辑">
                            ✏️
                        </button>
                        <button class="btn-delete-transaction" data-id="${transaction.id}" title="删除">
                            🗑️
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    loadDashboard() {
        const monthlyStats = this.dataManager.getStatistics('month');
        const allTimeStats = this.dataManager.getStatistics('all');
        
        document.getElementById('balance-amount').textContent = Utils.formatCurrency(allTimeStats.balance);
        document.getElementById('income-amount').textContent = Utils.formatCurrency(monthlyStats.totalIncome);
        document.getElementById('expense-amount').textContent = Utils.formatCurrency(monthlyStats.totalExpense);

        this.loadRecentTransactions();
        this.loadBudgetAlerts();
    }

    loadRecentTransactions() {
        const transactions = this.dataManager.getTransactions().slice(0, 5);
        const container = document.getElementById('recent-list');
        
        if (transactions.length === 0) {
            container.innerHTML = UIComponents.createEmptyState('📝', '暂无交易记录', '点击上方按钮开始记账');
            return;
        }

        container.innerHTML = transactions.map(transaction => 
            this.createTransactionItem(transaction)
        ).join('');
    }

    loadTransactionsPage() {
        const page = document.getElementById('transactions-page');
        const transactions = this.dataManager.getTransactions();
        
        page.innerHTML = `
            <div class="settings-header">
                <h2>📊 交易记录</h2>
            </div>
            
            <div class="settings-section">
                <div class="transactions-header">
                    <h3>操作面板</h3>
                    <div class="transactions-actions">
                        <button class="btn-primary" id="add-income-btn">+ 收入</button>
                        <button class="btn-secondary" id="add-expense-btn">- 支出</button>
                    </div>
                </div>
            </div>
            
            <div class="settings-section">
                <h3>🔍 筛选条件</h3>
                <div class="transactions-filters">
                    <input type="text" id="search-input" placeholder="搜索交易...">
                    <select id="type-filter">
                        <option value="">所有类型</option>
                        <option value="income">收入</option>
                        <option value="expense">支出</option>
                    </select>
                    <select id="category-filter">
                        <option value="">所有分类</option>
                    </select>
                    <input type="date" id="date-filter">
                </div>
            </div>
            
            <div class="settings-section">
                <h3>📝 交易列表</h3>
                <div class="transactions-list" id="transactions-list">
                    ${transactions.length === 0 ? 
                        UIComponents.createEmptyState('📝', '暂无交易记录', '点击上方按钮开始记账') :
                        transactions.map(t => this.createTransactionItem(t)).join('')
                    }
                </div>
            </div>
        `;
        
        this.bindTransactionsPageEvents();
    }

    updateTransactionsList(transactions) {
        const container = document.getElementById('transactions-list');
        if (transactions.length === 0) {
            container.innerHTML = UIComponents.createEmptyState('🔍', '未找到匹配的交易记录');
        } else {
            container.innerHTML = transactions.map(t => this.createTransactionItem(t)).join('');
        }
    }

    loadCategoryFilterOptions() {
        const categoryFilter = document.getElementById('category-filter');
        const categories = this.dataManager.getCategories();
        
        categoryFilter.innerHTML = '<option value="">所有分类</option>' + 
            categories.map(cat => 
                `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
            ).join('');
    }

    bindTransactionsPageEvents() {
        document.getElementById('add-income-btn').addEventListener('click', () => {
            this.openTransactionModal('income');
        });

        document.getElementById('add-expense-btn').addEventListener('click', () => {
            this.openTransactionModal('expense');
        });

        document.getElementById('search-input').addEventListener('input', () => {
            this.filterTransactions();
        });

        document.getElementById('type-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('category-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        document.getElementById('date-filter').addEventListener('change', () => {
            this.filterTransactions();
        });

        this.loadCategoryFilterOptions();
    }

    filterTransactions() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        const typeFilter = document.getElementById('type-filter').value;
        const categoryFilter = document.getElementById('category-filter').value;
        const dateFilter = document.getElementById('date-filter').value;

        let filtered = this.dataManager.getTransactions().filter(t => {
            const category = this.dataManager.getCategories().find(c => c.id === t.categoryId);
            const categoryName = category ? category.name.toLowerCase() : '';
            const description = t.description ? t.description.toLowerCase() : '';

            const matchesSearch = description.includes(searchTerm) || categoryName.includes(searchTerm);
            const matchesType = !typeFilter || t.type === typeFilter;
            const matchesCategory = !categoryFilter || t.categoryId === categoryFilter;
            const matchesDate = !dateFilter || t.date === dateFilter;

            return matchesSearch && matchesType && matchesCategory && matchesDate;
        });

        this.updateTransactionsList(filtered);
    }

    editTransaction(id, type) {
        const transaction = this.dataManager.getTransactionById(id);
        if (transaction) {
            window.app.currentTransactionType = type;
            window.app.editingTransactionId = id;
            this.openTransactionModal(type, transaction);
        }
    }

    deleteTransaction(id) {
        if (confirm('确定要删除此交易吗？')) {
            this.dataManager.deleteTransaction(id);
            window.app.navigateTo(window.app.currentPage);
        }
    }

    openTransactionModal(type, transaction = null) {
        this.closeAllModals(); // Close any open modals first
        
        window.app.currentTransactionType = type;
        window.app.editingTransactionId = transaction ? transaction.id : null;
        
        const modal = document.getElementById('transaction-modal');
        const title = modal.querySelector('h3');
        const form = document.getElementById('transaction-form');
        
        if (transaction) {
            title.textContent = '编辑交易';
        } else {
            title.textContent = type === 'income' ? '添加收入' : '添加支出';
        }
        
        this.loadCategoryOptions(type);
        
        if (transaction) {
            document.getElementById('amount').value = transaction.amount;
            document.getElementById('category').value = transaction.categoryId;
            document.getElementById('description').value = transaction.description || '';
            document.getElementById('date').value = transaction.date;
        } else {
            form.reset();
            document.getElementById('date').value = Utils.formatDate(new Date());
        }
        
        modal.classList.add('active');
        document.getElementById('amount').focus();
    }

    loadCategoryOptions(type) {
        const categorySelect = document.getElementById('category');
        const categories = this.dataManager.getCategories().filter(c => c.type === type);
        
        categorySelect.innerHTML = '<option value="">选择分类</option>' + 
            categories.map(cat => 
                `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`
            ).join('');
    }

    handleTransactionFormSubmit() {
        const form = document.getElementById('transaction-form');
        const amount = parseFloat(form.querySelector('#amount').value);
        const categoryId = form.querySelector('#category').value;
        const date = form.querySelector('#date').value;
        const description = form.querySelector('#description').value.trim();
        const type = window.app.currentTransactionType;
        const editingId = window.app.editingTransactionId;

        if (isNaN(amount) || amount <= 0) {
            this.showNotification('请输入有效的金额', 'error');
            return;
        }
        if (!categoryId) {
            this.showNotification('请选择一个分类', 'error');
            return;
        }
        if (!date) {
            this.showNotification('请选择日期', 'error');
            return;
        }

        const transactionData = { amount, categoryId: categoryId, date, description, type };
        if (editingId) {
            transactionData.id = editingId;
        }

        try {
            this.dataManager.saveTransaction(transactionData);
            this.closeAllModals();
            window.app.navigateTo(window.app.currentPage || 'dashboard'); // Reload current page or dashboard
        } catch (error) {
            this.showNotification(`保存交易失败: ${error.message}`, 'error');
            console.error("Error saving transaction:", error);
        }
    }

    // Category related UI
    createCategoryCard(category) {
        return `
            <div class="category-card" data-id="${category.id}">
                <div class="category-icon" style="background-color: ${category.color}20">
                    ${category.icon}
                </div>
                <div class="category-name">${category.name}</div>
                <div class="category-actions">
                    <button class="btn-edit-category" data-id="${category.id}">编辑</button>
                    <button class="btn-delete-category" data-id="${category.id}">删除</button>
                </div>
            </div>
        `;
    }

    loadCategoriesPage() {
        const page = document.getElementById('categories-page');
        const categories = this.dataManager.getCategories();
        const incomeCategories = categories.filter(c => c.type === 'income');
        const expenseCategories = categories.filter(c => c.type === 'expense');
        
        page.innerHTML = `
            <div class="categories-header">
                <h2>分类管理</h2>
                <button class="btn-primary" id="add-category-btn">+ 添加分类</button>
            </div>
            
            <div class="categories-sections">
                <div class="category-section">
                    <h3>💰 收入分类</h3>
                    <div class="categories-grid" id="income-categories">
                        ${incomeCategories.map(cat => this.createCategoryCard(cat)).join('')}
                    </div>
                </div>
                
                <div class="category-section">
                    <h3>💸 支出分类</h3>
                    <div class="categories-grid" id="expense-categories">
                        ${expenseCategories.map(cat => this.createCategoryCard(cat)).join('')}
                    </div>
                </div>
            </div>
        `;
        
        this.bindCategoriesPageEvents();
    }

    bindCategoriesPageEvents() {
        document.getElementById('add-category-btn').addEventListener('click', () => {
            this.openCategoryModal();
        });

        document.getElementById('categories-page').addEventListener('click', (e) => {
            if (e.target.matches('.btn-edit-category')) {
                const id = e.target.dataset.id;
                const category = this.dataManager.getCategories().find(c => c.id === id);
                if (category) {
                    this.openCategoryModal(category);
                }
            } else if (e.target.matches('.btn-delete-category')) {
                const id = e.target.dataset.id;
                if (confirm('确定要删除此分类吗？这将同时删除此分类下的所有交易记录。')) {
                    this.dataManager.deleteCategory(id);
                    this.loadCategoriesPage(); // Reload the page after deletion
                }
            }
        });
    }

    openCategoryModal(category = null) {
        this.closeAllModals(); // Close any open modals first

        const modal = document.getElementById('category-modal');
        const title = modal.querySelector('h2');
        const form = document.getElementById('category-form');

        if (category) {
            title.textContent = '编辑分类';
            document.getElementById('category-name').value = category.name;
            document.getElementById('category-type').value = category.type;
            document.getElementById('category-icon').value = category.icon;
            document.getElementById('category-color').value = category.color;
        } else {
            title.textContent = '添加分类';
            form.reset();
            document.getElementById('category-color').value = '#cccccc'; // Default color
        }

        modal.classList.add('active');
        document.getElementById('category-name').focus();
    }

    handleCategoryFormSubmit() {
        const form = document.getElementById('category-form');
        const name = form.querySelector('#category-name').value.trim();
        const type = form.querySelector('#category-type').value;
        const icon = form.querySelector('#category-icon').value.trim();
        const color = form.querySelector('#category-color').value;
        const editingId = form.dataset.editingId; // Assuming you set this when opening modal for edit

        if (!name || !icon) {
            this.showNotification('请填写完整信息', 'error');
            return;
        }

        const categoryData = { name, type, icon, color };
        if (editingId) {
            categoryData.id = editingId;
        }

        try {
            this.dataManager.saveCategory(categoryData);
            this.closeAllModals();
            this.loadCategoriesPage(); // Reload categories page
        } catch (error) {
            this.showNotification(`保存分类失败: ${error.message}`, 'error');
            console.error("Error saving category:", error);
        }
    }

    // Statistics related UI
    loadStatisticsPage() {
        const page = document.getElementById('statistics-page');
        
        page.innerHTML = `
            <div class="statistics-header">
                <h2>📊 统计分析</h2>
                <div class="date-range-selector">
                    <select id="time-range">
                        <option value="today">今日</option>
                        <option value="month">本月</option>
                        <option value="year">本年</option>
                        <option value="all">全部</option>
                        <option value="custom">自定义</option>
                    </select>
                    <div id="custom-date-range" style="display: none;">
                        <input type="date" id="start-date">
                        <span>至</span>
                        <input type="date" id="end-date">
                        <button class="btn-primary" id="apply-date-range">应用</button>
                    </div>
                </div>
            </div>
            
            <div class="statistics-overview">
                <div class="stat-card balance-stat">
                    <h3>总余额</h3>
                    <div class="stat-amount" id="total-balance">¥0.00</div>
                </div>
                <div class="stat-card income-stat">
                    <h3>总收入</h3>
                    <div class="stat-amount" id="total-income">¥0.00</div>
                </div>
                <div class="stat-card expense-stat">
                    <h3>总支出</h3>
                    <div class="stat-amount" id="total-expense">¥0.00</div>
                </div>
                <div class="stat-card transaction-stat">
                    <h3>交易笔数</h3>
                    <div class="stat-amount" id="transaction-count">0</div>
                </div>
            </div>
            
            <div class="charts-container">
                <div class="chart-section">
                    <h3>💰 收入分类占比</h3>
                    <div class="pie-chart-container">
                        <div class="pie-chart" id="income-category-chart">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#e0e0e0" stroke-width="20"></circle>
                                <g id="income-arcs"></g>
                            </svg>
                            <div class="chart-center">
                                <div class="chart-total" id="income-chart-total">¥0</div>
                                <div class="chart-label">收入总计</div>
                            </div>
                        </div>
                        <div class="chart-legend" id="income-legend"></div>
                    </div>
                </div>
                <div class="chart-section">
                    <h3>💸 支出分类占比</h3>
                    <div class="pie-chart-container">
                        <div class="pie-chart" id="expense-category-chart">
                            <svg width="200" height="200" viewBox="0 0 200 200">
                                <circle cx="100" cy="100" r="80" fill="none" stroke="#e0e0e0" stroke-width="20"></circle>
                                <g id="expense-arcs"></g>
                            </svg>
                            <div class="chart-center">
                                <div class="chart-total" id="expense-chart-total">¥0</div>
                                <div class="chart-label">支出总计</div>
                            </div>
                        </div>
                        <div class="chart-legend" id="expense-legend"></div>
                    </div>
                </div>
            </div>
            
            <div class="trend-analysis-section">
                <div class="chart-section">
                    <h3>📈 收支趋势分析</h3>
                    <div class="trend-controls">
                         <div class="trend-type-selector">
                             <button class="trend-type-btn active" data-type="daily">按天</button>
                             <button class="trend-type-btn" data-type="monthly">按月</button>
                         </div>
                         <div class="trend-period-selector">
                             <button class="trend-period-btn" data-period="6months" style="display:none;">近6个月</button>
                             <button class="trend-period-btn" data-period="12months" style="display:none;">近12个月</button>
                             <button class="trend-period-btn" data-period="24months" style="display:none;">近24个月</button>
                             <button class="trend-period-btn active" data-period="30days">近30天</button>
                             <button class="trend-period-btn" data-period="90days">近90天</button>
                             <button class="trend-period-btn" data-period="180days">近180天</button>
                         </div>
                     </div>
                    <div class="trend-charts-container">
                         <div class="trend-chart-wrapper">
                             <h4>💰 收入趋势</h4>
                             <div class="chart-with-tooltip">
                                 <canvas id="income-trend-chart" width="800" height="300"></canvas>
                                 <div id="income-tooltip" class="chart-tooltip"></div>
                             </div>
                         </div>
                         <div class="trend-chart-wrapper">
                             <h4>💸 支出趋势</h4>
                             <div class="chart-with-tooltip">
                                 <canvas id="expense-trend-chart" width="800" height="300"></canvas>
                                 <div id="expense-tooltip" class="chart-tooltip"></div>
                             </div>
                         </div>
                     </div>
                </div>
            </div>
            
            <div class="ranking-section">
                 <div class="chart-section">
                     <h3>📊 分类排行</h3>
                     <div class="ranking-tabs">
                         <button class="ranking-tab active" data-type="expense">💸 支出排行</button>
                         <button class="ranking-tab" data-type="income">💰 收入排行</button>
                     </div>
                     <div id="category-ranking" class="ranking-list"></div>
                 </div>
             </div>
             
             <div class="comparison-section">
                  <div class="chart-section">
                      <h3>📊 时间对比分析</h3>
                      <div class="comparison-controls">
                          <div class="comparison-mode-selector">
                              <button class="comparison-mode-btn active" data-mode="preset">预设对比</button>
                              <button class="comparison-mode-btn" data-mode="custom">自定义对比</button>
                          </div>
                          <div class="custom-comparison-controls" id="custom-comparison-controls" style="display:none;">
                              <div class="comparison-period">
                                  <label>对比期间1：</label>
                                  <input type="date" id="period1-start" class="date-input">
                                  <span>至</span>
                                  <input type="date" id="period1-end" class="date-input">
                              </div>
                              <div class="comparison-period">
                                  <label>对比期间2：</label>
                                  <input type="date" id="period2-start" class="date-input">
                                  <span>至</span>
                                  <input type="date" id="period2-end" class="date-input">
                              </div>
                              <button class="btn-primary" id="apply-custom-comparison">应用对比</button>
                          </div>
                      </div>
                      <div class="comparison-container">
                          <div class="comparison-cards">
                              <div class="comparison-card">
                                  <h4 id="comparison1-title">本月 vs 上月（环比）</h4>
                                  <div class="comparison-data" id="comparison1-data"></div>
                              </div>
                              <div class="comparison-card">
                                  <h4 id="comparison2-title">本月 vs 去年同月（同比）</h4>
                                  <div class="comparison-data" id="comparison2-data"></div>
                              </div>
                          </div>
                          <div class="comparison-chart">
                              <canvas id="comparison-chart" width="600" height="300"></canvas>
                          </div>
                      </div>
                  </div>
              </div>
        `;
        
        this.bindStatisticsPageEvents();
        const todayStats = this.dataManager.getStatistics('today');
        this.updateStatisticsOverview(todayStats);
        this.updateCategoryRanking(todayStats.expenseByCategory, 'expense');
        this.updateCategoryPieCharts(todayStats);
        this.initializeTrendChart();
        this.updateMonthlyComparison();
    }

    bindStatisticsPageEvents() {
        const timeRangeSelect = document.getElementById('time-range');
        const customDateRange = document.getElementById('custom-date-range');

        timeRangeSelect.addEventListener('change', (e) => {
            const range = e.target.value;
            if (range === 'custom') {
                customDateRange.style.display = 'flex';
            } else {
                customDateRange.style.display = 'none';
                const stats = this.dataManager.getStatistics(range);
                this.updateStatisticsOverview(stats);
                this.updateCategoryRanking(stats.expenseByCategory, 'expense'); // Default to expense ranking
                this.updateCategoryPieCharts(stats);
            }
        });

        document.getElementById('apply-date-range').addEventListener('click', () => {
            const startDate = document.getElementById('start-date').value;
            const endDate = document.getElementById('end-date').value;
            if (startDate && endDate) {
                const stats = this.dataManager.getStatistics('custom', { start: startDate, end: endDate });
                this.updateStatisticsOverview(stats);
                this.updateCategoryRanking(stats.expenseByCategory, 'expense');
                this.updateCategoryPieCharts(stats);
            } else {
                this.showNotification('请选择有效的日期范围', 'error');
            }
        });

        document.querySelectorAll('.ranking-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.ranking-tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                const type = e.target.dataset.type;
                const currentRange = timeRangeSelect.value;
                let customDates = null;
                if (currentRange === 'custom') {
                    customDates = { start: document.getElementById('start-date').value, end: document.getElementById('end-date').value };
                }
                const stats = this.dataManager.getStatistics(currentRange, customDates);
                this.updateCategoryRanking(type === 'expense' ? stats.expenseByCategory : stats.incomeByCategory, type);
            });
        });
        
        // 趋势图表类型切换事件
         document.querySelectorAll('.trend-type-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 document.querySelectorAll('.trend-type-btn').forEach(b => b.classList.remove('active'));
                 e.target.classList.add('active');
                 const type = e.target.dataset.type;
                 this.switchTrendType(type);
             });
         });
         
         // 趋势图表周期选择事件
         document.querySelectorAll('.trend-period-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 document.querySelectorAll('.trend-period-btn').forEach(b => b.classList.remove('active'));
                 e.target.classList.add('active');
                 const period = e.target.dataset.period;
                 const type = document.querySelector('.trend-type-btn.active').dataset.type;
                 this.updateTrendChart(period, type);
             });
         });
         
         // 对比模式切换事件
         document.querySelectorAll('.comparison-mode-btn').forEach(btn => {
             btn.addEventListener('click', (e) => {
                 document.querySelectorAll('.comparison-mode-btn').forEach(b => b.classList.remove('active'));
                 e.target.classList.add('active');
                 const mode = e.target.dataset.mode;
                 this.switchComparisonMode(mode);
             });
         });
         
         // 自定义对比应用事件
         document.getElementById('apply-custom-comparison').addEventListener('click', () => {
             this.applyCustomComparison();
         });
    }

    updateStatisticsOverview(stats) {
        document.getElementById('total-balance').textContent = Utils.formatCurrency(stats.balance);
        document.getElementById('total-income').textContent = Utils.formatCurrency(stats.totalIncome);
        document.getElementById('total-expense').textContent = Utils.formatCurrency(stats.totalExpense);
        document.getElementById('transaction-count').textContent = stats.transactionCount || 0;
    }

    updateCategoryRanking(categoryStats, type) {
        const container = document.getElementById('category-ranking');
        const categories = this.dataManager.getCategories();
        
        const statsArray = Object.entries(categoryStats).map(([categoryId, amount]) => {
            const category = categories.find(c => c.id === categoryId);
            return { ...category, amount };
        }).sort((a, b) => b.amount - a.amount);

        if (statsArray.length === 0) {
            const emptyMessage = type === 'expense' ? '暂无支出记录' : '暂无收入记录';
            container.innerHTML = UIComponents.createEmptyState('📊', emptyMessage, '在选择的时间范围内没有相关交易记录');
            return;
        }
        
        const totalAmount = statsArray.reduce((sum, stat) => sum + stat.amount, 0);
        
        container.innerHTML = `
            <div class="ranking-section">
                <div class="ranking-items">
                    ${statsArray.slice(0, 10).map((stat, index) => {
                        const percentage = totalAmount > 0 ? ((stat.amount / totalAmount) * 100).toFixed(1) : 0;
                        return `
                            <div class="ranking-item">
                                <div class="ranking-number">${index + 1}</div>
                                <div class="ranking-category">
                                    <span class="category-icon">${stat.icon}</span>
                                    <span class="category-name">${stat.name}</span>
                                </div>
                                <div class="ranking-stats">
                                    <div class="ranking-amount">${Utils.formatCurrency(stat.amount)}</div>
                                    <div class="ranking-percentage">${percentage}%</div>
                                </div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                ${statsArray.length > 10 ? `
                    <div class="ranking-more">
                        <span class="ranking-more-text">还有 ${statsArray.length - 10} 个分类未显示</span>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Settings related UI
    loadSettingsPage() {
        this.bindSettingsPageEvents();
    }

    bindSettingsPageEvents() {
        // 导出JSON功能
        const exportJsonBtn = document.getElementById('export-json');
        if (exportJsonBtn) {
            exportJsonBtn.addEventListener('click', () => {
                this.exportDataAsJSON();
            });
        }

        // 导出Excel功能
        const exportExcelBtn = document.getElementById('export-excel');
        if (exportExcelBtn) {
            exportExcelBtn.addEventListener('click', () => {
                this.exportDataAsExcel();
            });
        }

        // 导入数据功能
        const importBtn = document.getElementById('import-data');
        const importFile = document.getElementById('import-file');
        if (importBtn && importFile) {
            importBtn.addEventListener('click', () => {
                // 确保每次点击都能触发 change（即使选择同一文件）
                importFile.value = '';
                // iOS Safari 有时需要先聚焦再点击
                try { importFile.focus(); } catch (e) {}
                importFile.click();
            });

            importFile.addEventListener('change', (e) => {
                const file = e.target.files && e.target.files[0];
                if (!file) return;
                this.importData(file);
                // 处理完立即清空，避免下次选同一文件不触发 change
                setTimeout(() => { e.target.value = ''; }, 0);
            });
        }

        const debugDataBtn = document.getElementById('debug-data');
        if (debugDataBtn) {
            debugDataBtn.addEventListener('click', () => {
                this.debugData();
            });
        }

        // 清空数据功能
        const clearDataBtn = document.getElementById('clear-all-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    debugData() {
        console.log("--- 数据诊断开始 ---");
        try {
            const transactions = this.dataManager.getTransactions();
            const categories = this.dataManager.getCategories();

            console.log("交易数据 (前5条):", transactions.slice(0, 5));
            console.log("分类数据:", categories);

            let inconsistentTransactions = [];
            const categoryIds = categories.map(c => String(c.id));
            console.log("所有分类ID:", categoryIds);

            transactions.forEach(t => {
                const category = categories.find(c => String(c.id) === String(t.categoryId));
                if (!category) {
                    inconsistentTransactions.push(t);
                }
            });

            if (inconsistentTransactions.length > 0) {
                console.warn("发现不一致的交易记录 (分类ID未找到):", inconsistentTransactions);
                const missingCategoryIds = inconsistentTransactions.map(t => t.categoryId);
                console.warn("未找到的分类ID列表:", [...new Set(missingCategoryIds)]);
            } else {
                console.log("所有交易记录的分类ID均有效。");
            }

            this.showNotification('数据诊断完成，请查看控制台输出', 'info');

        } catch (error) {
            console.error("数据诊断时发生错误:", error);
            this.showNotification('数据诊断失败', 'error');
        }
        console.log("--- 数据诊断结束 ---");
    }

     exportDataAsJSON() {
         try {
             const transactions = this.dataManager.getTransactions();
             const categories = this.dataManager.getCategories();
             
             // 调试：输出数据结构
             console.log('交易数据样本:', transactions.slice(0, 3));
             console.log('分类数据:', categories);
             
             const data = {
                 transactions: transactions,
                 categories: categories,
                 budgets: this.dataManager.getBudgets(),
                 exportDate: new Date().toISOString(),
                 version: '1.0'
             };

             const jsonString = JSON.stringify(data, null, 2);
            // 统一下载方法（iOS Safari 兼容）
            Utils.downloadFile(jsonString, `记账数据_${new Date().toISOString().split('T')[0]}.json`, 'application/json');

            this.showNotification('JSON数据导出成功！', 'success');
         } catch (error) {
             console.error('导出JSON失败:', error);
             this.showNotification('导出失败，请重试', 'error');
         }
     }

    exportDataAsExcel() {
         try {
             const transactions = this.dataManager.getTransactions();
             const categories = this.dataManager.getCategories();
             
             // 创建CSV内容
             let csvContent = '\uFEFF'; // BOM for UTF-8
             csvContent += '日期,类型,分类,金额,描述\n';
             
             transactions.forEach(transaction => {
                 // 格式化日期，确保正确显示
                 let formattedDate = transaction.date;
                 if (transaction.date) {
                     const date = new Date(transaction.date);
                     if (!isNaN(date.getTime())) {
                         formattedDate = date.toLocaleDateString('zh-CN');
                     }
                 }
                 
                 // 查找分类，使用更宽松的匹配
                  let categoryName = '未分类';
                  if (transaction.categoryId) {
                      // 尝试多种匹配方式
                      const category = categories.find(c => {
                          return c.id === transaction.categoryId || 
                                 c.id === String(transaction.categoryId) ||
                                 String(c.id) === String(transaction.categoryId);
                      });
                      
                      if (category) {
                          categoryName = category.name;
                      } else {
                          // 如果找不到分类，尝试从交易记录中获取分类名称
                          if (transaction.categoryName) {
                              categoryName = transaction.categoryName;
                          } else {
                              // 调试：输出未匹配的分类ID
                              console.log('未找到分类:', transaction.categoryId, '可用分类:', categories.map(c => c.id));
                              categoryName = `未知分类(${transaction.categoryId})`;
                          }
                      }
                  }
                 
                 const type = transaction.type === 'income' ? '收入' : '支出';
                 const amount = parseFloat(transaction.amount) || 0;
                 const description = (transaction.description || '').replace(/"/g, '""'); // 转义引号
                 
                 csvContent += `"${formattedDate}","${type}","${categoryName}",${amount},"${description}"\n`;
             });
             
             // 使用统一的下载工具（iOS Safari 兼容）
             Utils.downloadFile(csvContent, `记账数据_${new Date().toISOString().split('T')[0]}.csv`, 'text/csv;charset=utf-8;');

             this.showNotification('Excel数据导出成功！', 'success');
         } catch (error) {
             console.error('导出Excel失败:', error);
             this.showNotification('导出失败，请重试', 'error');
         }
     }

    importData(file) {
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // 验证数据格式
                if (!data.transactions || !Array.isArray(data.transactions)) {
                    this.showNotification('无效的数据格式：缺少交易记录', 'error');
                    return;
                }
                
                // 显示导入预览信息
                const importInfo = this.analyzeImportData(data);
                const confirmMessage = `准备导入数据：\n` +
                    `• 交易记录：${importInfo.transactions.total} 条（新增 ${importInfo.transactions.new} 条，重复 ${importInfo.transactions.duplicate} 条）\n` +
                    `• 分类：${importInfo.categories.total} 个（新增 ${importInfo.categories.new} 个，重复 ${importInfo.categories.duplicate} 个）\n` +
                    `• 预算：${importInfo.budgets.total} 个（新增 ${importInfo.budgets.new} 个，重复 ${importInfo.budgets.duplicate} 个）\n\n` +
                    `重复的数据将被跳过，确定要继续导入吗？`;
                
                if (confirm(confirmMessage)) {
                    let importedCount = 0;
                    const categoryIdMap = {}; // 用于映射旧ID到新ID

                    // 1. 导入分类并创建ID映射
                    if (data.categories && Array.isArray(data.categories)) {
                        const existingCategories = this.dataManager.getCategories();
                        data.categories.forEach(category => {
                            // 优先通过名称和类型查找现有分类
                            const existingCat = existingCategories.find(c => c.name === category.name && c.type === category.type);
                            
                            if (existingCat) {
                                // 如果分类已存在，则映射旧ID到现有ID
                                categoryIdMap[category.id] = existingCat.id;
                            } else {
                                // 如果分类不存在，则添加新分类并映射
                                const createdCategory = this.dataManager.saveCategory({
                                    name: category.name || '未命名分类',
                                    type: category.type || 'expense',
                                    color: category.color || '#666666',
                                    icon: category.icon || '💰'
                                });
                                if (createdCategory && createdCategory.id) {
                                    categoryIdMap[category.id] = createdCategory.id;
                                }
                            }
                        });
                    }

                    // 2. 导入交易记录，使用ID映射
                    data.transactions.forEach(transaction => {
                        const existingTransactions = this.dataManager.getTransactions();
                        // 使用映射后的 categoryId 进行重复性检查
                        const newCategoryId = categoryIdMap[transaction.categoryId] || transaction.categoryId;

                        const isDuplicate = existingTransactions.some(existing =>
                            existing.date === transaction.date &&
                            existing.amount === transaction.amount &&
                            existing.type === transaction.type &&
                            existing.categoryId === newCategoryId && // 使用新的ID检查
                            existing.description === transaction.description
                        );

                        if (!isDuplicate) {
                            const transactionToAdd = {
                                amount: parseFloat(transaction.amount) || 0,
                                type: transaction.type || 'expense',
                                categoryId: newCategoryId, // 使用新的ID
                                description: transaction.description || '',
                                date: transaction.date || new Date().toISOString().split('T')[0]
                            };
                            this.dataManager.saveTransaction(transactionToAdd);
                            importedCount++;
                        }
                    });

                    // 3. 导入预算，同样使用ID映射
                    if (data.budgets && Array.isArray(data.budgets)) {
                        data.budgets.forEach(budget => {
                            const existingBudgets = this.dataManager.getBudgets();
                            const newCategoryId = categoryIdMap[budget.categoryId] || budget.categoryId;

                            const isDuplicate = existingBudgets.some(existing =>
                                existing.categoryId === newCategoryId && // 使用新的ID检查
                                existing.period === budget.period
                            );

                            if (!isDuplicate) {
                                const budgetToAdd = {
                                    categoryId: newCategoryId, // 使用新的ID
                                    amount: parseFloat(budget.amount) || 0,
                                    period: budget.period || 'monthly',
                                    createdAt: budget.createdAt || new Date().toISOString()
                                };
                                this.dataManager.saveBudget(budgetToAdd);
                            }
                        });
                    }
                    
                    // 刷新当前页面
                    const currentPage = document.querySelector('.page.active');
                    if (currentPage) {
                        const pageId = currentPage.id.replace('-page', '');
                        if (pageId === 'dashboard') this.loadDashboard();
                        else if (pageId === 'transactions') this.loadTransactionsPage();
                        else if (pageId === 'statistics') this.loadStatisticsPage();
                        else if (pageId === 'categories') this.loadCategoriesPage();
                        else if (pageId === 'budgets') this.loadBudgetsPage();
                    }
                    
                    this.showNotification(`数据导入成功！共导入 ${importedCount} 条新交易记录`, 'success');
                }
            } catch (error) {
                console.error('导入数据失败: 解析或处理文件时出错。', error);
                console.log('失败的文件内容:', e.target.result);
                this.showNotification(`导入失败，请检查文件格式或查看控制台了解详情。`, 'error');
            }
        };
        
        reader.readAsText(file, 'utf-8');
    }
    
    analyzeImportData(data) {
        const existingTransactions = this.dataManager.getTransactions();
        const existingCategories = this.dataManager.getCategories();
        const existingBudgets = this.dataManager.getBudgets();
        
        const result = {
            transactions: { total: 0, new: 0, duplicate: 0 },
            categories: { total: 0, new: 0, duplicate: 0 },
            budgets: { total: 0, new: 0, duplicate: 0 }
        };
        
        // 分析交易记录
        if (data.transactions && Array.isArray(data.transactions)) {
            result.transactions.total = data.transactions.length;
            data.transactions.forEach(transaction => {
                const isDuplicate = existingTransactions.some(existing => 
                    existing.date === transaction.date &&
                    existing.amount === transaction.amount &&
                    existing.type === transaction.type &&
                    existing.categoryId === transaction.categoryId &&
                    existing.description === transaction.description
                );
                if (isDuplicate) {
                    result.transactions.duplicate++;
                } else {
                    result.transactions.new++;
                }
            });
        }
        
        // 分析分类
        if (data.categories && Array.isArray(data.categories)) {
            result.categories.total = data.categories.length;
            data.categories.forEach(category => {
                const isDuplicate = existingCategories.some(existing => existing.id === category.id);
                if (isDuplicate) {
                    result.categories.duplicate++;
                } else {
                    result.categories.new++;
                }
            });
        }
        
        // 分析预算
        if (data.budgets && Array.isArray(data.budgets)) {
            result.budgets.total = data.budgets.length;
            data.budgets.forEach(budget => {
                const isDuplicate = existingBudgets.some(existing => 
                    existing.categoryId === budget.categoryId &&
                    existing.period === budget.period
                );
                if (isDuplicate) {
                    result.budgets.duplicate++;
                } else {
                    result.budgets.new++;
                }
            });
        }
        
        return result;
    }

    clearAllData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            if (confirm('请再次确认：这将永久删除所有交易记录、分类和预算数据！')) {
                try {
                    localStorage.clear();
                    location.reload();
                } catch (error) {
                    console.error('清空数据失败:', error);
                    this.showNotification('清空数据失败，请重试', 'error');
                }
            }
        }
    }

    // 预算相关UI方法
    loadBudgetsPage() {
        const page = document.getElementById('budgets-page');
        const budgets = this.dataManager.getBudgets();
        const budgetProgress = this.dataManager.getAllBudgetProgress();
        
        page.innerHTML = `
            <div class="settings-header">
                <h2>💰 预算管理</h2>
            </div>
            
            <div class="settings-section">
                <div class="budgets-header">
                    <h3>我的预算</h3>
                    <button class="btn-primary" id="add-budget-btn">+ 创建预算</button>
                </div>
            </div>
            
            <div class="budgets-grid" id="budgets-grid">
                ${budgetProgress.length === 0 ? 
                    UIComponents.createEmptyState('💰', '暂无预算', '点击上方按钮创建您的第一个预算') :
                    budgetProgress.map(progress => this.createBudgetCard(progress)).join('')
                }
            </div>
        `;
        
        this.bindBudgetsPageEvents();
    }

    createBudgetCard(progress) {
        const { budget, spent, remaining, percentage, isOverBudget } = progress;
        const category = this.dataManager.getCategories().find(c => c.id === budget.categoryId);
        const categoryName = budget.categoryId === 'all' ? '所有支出' : (category ? category.name : budget.categoryId);
        const categoryIcon = budget.categoryId === 'all' ? '💸' : (category ? category.icon : '📊');
        
        const statusClass = isOverBudget ? 'over-budget' : (percentage >= 80 ? 'warning' : 'normal');
        const periodText = {
            'weekly': '每周',
            'monthly': '每月', 
            'yearly': '每年'
        }[budget.period] || budget.period;
        
        return `
            <div class="budget-card ${statusClass}" data-id="${budget.id}">
                <div class="budget-header">
                    <div class="budget-info">
                        <div class="budget-category">
                            ${categoryIcon} ${categoryName}
                        </div>
                        <div class="budget-name">${budget.name}</div>
                        <div class="budget-period">${periodText}</div>
                    </div>
                    <div class="budget-actions">
                        <button class="btn-edit-budget" data-id="${budget.id}" title="编辑">✏️</button>
                        <button class="btn-delete-budget" data-id="${budget.id}" title="删除">🗑️</button>
                    </div>
                </div>
                
                <div class="budget-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                    <div class="progress-text">
                        <span class="spent">已用: ${Utils.formatCurrency(spent)}</span>
                        <span class="percentage">${percentage.toFixed(1)}%</span>
                    </div>
                </div>
                
                <div class="budget-amounts">
                    <div class="budget-total">预算: ${Utils.formatCurrency(budget.amount)}</div>
                    <div class="budget-remaining ${remaining < 0 ? 'negative' : ''}">
                        ${remaining >= 0 ? '剩余' : '超支'}: ${Utils.formatCurrency(Math.abs(remaining))}
                    </div>
                </div>
                
                ${budget.description ? `<div class="budget-description">${budget.description}</div>` : ''}
            </div>
        `;
    }

    bindBudgetsPageEvents() {
        // 创建预算按钮
        const addBudgetBtn = document.getElementById('add-budget-btn');
        if (addBudgetBtn) {
            addBudgetBtn.addEventListener('click', () => {
                this.openBudgetModal();
            });
        }
        
        // 编辑预算按钮
        document.querySelectorAll('.btn-edit-budget').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const budgetId = btn.dataset.id;
                const budget = this.dataManager.getBudgetById(budgetId);
                this.openBudgetModal(budget);
            });
        });
        
        // 删除预算按钮
        document.querySelectorAll('.btn-delete-budget').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const budgetId = btn.dataset.id;
                const budget = this.dataManager.getBudgetById(budgetId);
                if (confirm(`确定要删除预算"${budget.name}"吗？`)) {
                    this.dataManager.deleteBudget(budgetId);
                    this.loadBudgetsPage(); // 重新加载页面
                }
            });
        });
    }

    openBudgetModal(budget = null) {
        const modal = document.getElementById('budget-modal');
        const form = document.getElementById('budget-form');
        const title = modal.querySelector('h3');
        
        // 关闭其他模态框
        this.closeAllModals();
        
        // 设置标题和编辑ID
        title.textContent = budget ? '编辑预算' : '创建预算';
        form.dataset.editId = budget ? budget.id : '';
        
        // 加载分类选项
        this.loadBudgetCategoryOptions();
        
        // 填充表单数据或重置表单
        if (budget) {
            document.getElementById('budget-name').value = budget.name || '';
            document.getElementById('budget-amount').value = budget.amount || '';
            document.getElementById('budget-category').value = budget.categoryId || 'all';
            document.getElementById('budget-period').value = budget.period || 'monthly';
            document.getElementById('budget-description').value = budget.description || '';
        } else {
            form.reset();
            document.getElementById('budget-category').value = 'all';
            document.getElementById('budget-period').value = 'monthly';
        }
        
        // 显示模态框
        modal.classList.add('active');
        document.getElementById('budget-name').focus();
    }

    loadBudgetCategoryOptions() {
        const select = document.getElementById('budget-category');
        const categories = this.dataManager.getCategories().filter(c => c.type === 'expense');
        
        select.innerHTML = '<option value="all">💸 所有支出</option>';
        categories.forEach(category => {
            select.innerHTML += `<option value="${category.id}">${category.icon} ${category.name}</option>`;
        });
    }

    handleBudgetFormSubmit() {
        const form = document.getElementById('budget-form');
        const editId = form.dataset.editId;
        
        const budgetData = {
            name: document.getElementById('budget-name').value.trim(),
            amount: parseFloat(document.getElementById('budget-amount').value),
            categoryId: document.getElementById('budget-category').value,
            period: document.getElementById('budget-period').value,
            description: document.getElementById('budget-description').value.trim()
        };
        
        if (editId) {
            budgetData.id = editId;
        }
        
        this.dataManager.saveBudget(budgetData);
         this.closeAllModals();
         this.loadBudgetsPage(); // 重新加载页面
     }

     loadBudgetAlerts() {
         const alerts = this.dataManager.checkBudgetAlerts();
         
         // 移除现有的预算提醒
         const existingAlerts = document.querySelectorAll('.budget-alert');
         existingAlerts.forEach(alert => alert.remove());
         
         if (alerts.length === 0) return;
         
         // 在最近交易上方添加预算提醒区域
         const recentTransactions = document.querySelector('.recent-transactions');
         const alertsContainer = document.createElement('div');
         alertsContainer.className = 'budget-alerts';
         alertsContainer.innerHTML = `
             <h3>💰 预算提醒</h3>
             <div class="alerts-list">
                 ${alerts.map(alert => this.createBudgetAlert(alert)).join('')}
             </div>
         `;
         
         recentTransactions.parentNode.insertBefore(alertsContainer, recentTransactions);
     }

     createBudgetAlert(alert) {
         const iconMap = {
             'over_budget': '🚨',
             'warning': '⚠️'
         };
         
         const classMap = {
             'over_budget': 'danger',
             'warning': 'warning'
         };
         
         return `
              <div class="budget-alert ${classMap[alert.type]}">
                  <div class="alert-icon">${iconMap[alert.type]}</div>
                  <div class="alert-content">
                      <div class="alert-message">${alert.message}</div>
                      <div class="alert-action">
                          <button class="btn-link" onclick="app.navigateTo('budgets')">查看预算</button>
                      </div>
                  </div>
              </div>
          `;
      }

      updateCategoryPieCharts(stats) {
           this.updateCategoryPieChart('income', stats.incomeByCategory, stats.totalIncome);
           this.updateCategoryPieChart('expense', stats.expenseByCategory, stats.totalExpense);
       }

       updateCategoryPieChart(type, categoryData, total) {
           const chartId = `${type}-arcs`;
           const legendId = `${type}-legend`;
           const totalId = `${type}-chart-total`;
           
           // 更新中心总计显示
           document.getElementById(totalId).textContent = Utils.formatCurrency(total);
           
           // 清空现有的圆弧和图例
           const arcsContainer = document.getElementById(chartId);
           const legendContainer = document.getElementById(legendId);
           arcsContainer.innerHTML = '';
           legendContainer.innerHTML = '';
           
           if (total === 0 || !categoryData || Object.keys(categoryData).length === 0) {
               // 没有数据时显示空状态
               legendContainer.innerHTML = `
                   <div class="empty-chart-state">
                       <div class="empty-icon">📊</div>
                       <div class="empty-text">暂无${type === 'income' ? '收入' : '支出'}数据</div>
                   </div>
               `;
               return;
           }
           
           // 获取分类信息并计算百分比
           const categories = this.dataManager.getCategories();
           const categoryEntries = Object.entries(categoryData)
               .sort(([,a], [,b]) => b - a) // 按金额降序排列
               .slice(0, 8); // 最多显示8个分类
           
           // 预定义颜色数组
           const colors = [
               '#4CAF50', '#2196F3', '#FF9800', '#E91E63', 
               '#9C27B0', '#00BCD4', '#CDDC39', '#FF5722',
               '#607D8B', '#795548', '#FFC107', '#3F51B5'
           ];
           
           let currentOffset = 0;
           const circumference = 502; // 2 * π * 80
           
           categoryEntries.forEach(([categoryId, amount], index) => {
               const category = categories.find(c => c.id === categoryId);
               const categoryName = category ? category.name : categoryId;
               const categoryIcon = category ? category.icon : '📊';
               const color = colors[index % colors.length];
               
               const percentage = (amount / total) * 100;
               const arcLength = (percentage / 100) * circumference;
               
               // 创建圆弧
               const arc = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
               arc.setAttribute('cx', '100');
               arc.setAttribute('cy', '100');
               arc.setAttribute('r', '80');
               arc.setAttribute('fill', 'none');
               arc.setAttribute('stroke', color);
               arc.setAttribute('stroke-width', '20');
               arc.setAttribute('stroke-dasharray', `${arcLength} ${circumference - arcLength}`);
               arc.setAttribute('stroke-dashoffset', `-${currentOffset}`);
               arc.setAttribute('transform', 'rotate(-90 100 100)');
               arc.style.transition = 'stroke-dasharray 0.8s ease, stroke-dashoffset 0.8s ease';
               
               arcsContainer.appendChild(arc);
               
               // 创建图例项
                const legendItem = document.createElement('div');
                legendItem.className = 'legend-item clickable-legend';
                legendItem.setAttribute('data-category-id', categoryId);
                legendItem.setAttribute('data-category-type', type);
                legendItem.innerHTML = `
                    <div class="legend-color" style="background: ${color}"></div>
                    <div class="legend-info">
                        <div class="legend-label">${categoryIcon} ${categoryName}</div>
                        <div class="legend-value">${Utils.formatCurrency(amount)}</div>
                        <div class="legend-percent">${percentage.toFixed(1)}%</div>
                    </div>
                    <div class="legend-arrow">→</div>
                `;
                
                // 添加点击事件
                legendItem.addEventListener('click', () => {
                    this.viewCategoryTransactions(categoryId, type);
                });
                
                legendContainer.appendChild(legendItem);
               
               currentOffset += arcLength;
           });
        }

        viewCategoryTransactions(categoryId, type) {
            // 跳转到交易记录页面
            window.app.navigateTo('transactions');
            
            // 等待页面加载完成后设置筛选条件
            setTimeout(() => {
                // 设置分类筛选
                const categoryFilter = document.getElementById('category-filter');
                if (categoryFilter) {
                    categoryFilter.value = categoryId;
                }
                
                // 设置类型筛选
                const typeFilter = document.getElementById('type-filter');
                if (typeFilter) {
                    typeFilter.value = type;
                }
                
                // 触发筛选
                this.filterTransactions();
                
                // 显示提示信息
                const category = this.dataManager.getCategories().find(c => c.id === categoryId);
                const categoryName = category ? category.name : categoryId;
                const typeName = type === 'income' ? '收入' : '支出';
                this.showNotification(`已筛选显示"${categoryName}"${typeName}记录`, 'info');
            }, 100);
         }

         // 趋势图表相关方法
         initializeTrendChart() {
             this.updateTrendChart('30days', 'daily');
         }
         
         switchTrendType(type) {
             // 显示/隐藏对应的周期按钮
             const monthlyBtns = document.querySelectorAll('[data-period$="months"]');
             const dailyBtns = document.querySelectorAll('[data-period$="days"]');
             
             if (type === 'monthly') {
                 monthlyBtns.forEach(btn => btn.style.display = 'inline-block');
                 dailyBtns.forEach(btn => btn.style.display = 'none');
                 // 激活第一个月度按钮
                 document.querySelectorAll('.trend-period-btn').forEach(b => b.classList.remove('active'));
                 monthlyBtns[0].classList.add('active');
                 this.updateTrendChart(monthlyBtns[0].dataset.period, type);
             } else {
                 monthlyBtns.forEach(btn => btn.style.display = 'none');
                 dailyBtns.forEach(btn => btn.style.display = 'inline-block');
                 // 激活第一个日度按钮
                 document.querySelectorAll('.trend-period-btn').forEach(b => b.classList.remove('active'));
                 dailyBtns[0].classList.add('active');
                 this.updateTrendChart(dailyBtns[0].dataset.period, type);
             }
         }

         updateTrendChart(period, type = 'monthly') {
             // 获取趋势数据
             const trendData = this.getTrendData(period, type);
             
             if (trendData.length === 0) {
                 this.drawEmptyTrendCharts();
                 return;
             }
             
             // 绘制收入趋势图
             this.drawSingleTrendChart('income-trend-chart', 'income-tooltip', trendData, 'income', type);
             
             // 绘制支出趋势图
             this.drawSingleTrendChart('expense-trend-chart', 'expense-tooltip', trendData, 'expense', type);
         }

         getTrendData(period, type = 'monthly') {
             const transactions = this.dataManager.getTransactions();
             const now = new Date();
             
             if (type === 'monthly') {
                 const months = parseInt(period.replace('months', ''));
                 const startDate = new Date(now.getFullYear(), now.getMonth() - months + 1, 1);
                 
                 const monthlyData = {};
                 
                 // 初始化月份数据
                 for (let i = 0; i < months; i++) {
                     const date = new Date(startDate.getFullYear(), startDate.getMonth() + i, 1);
                     const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
                     monthlyData[key] = { income: 0, expense: 0, period: key, label: `${date.getMonth() + 1}月` };
                 }
                 
                 // 统计每月数据
                 transactions.forEach(transaction => {
                     const transactionDate = new Date(transaction.date);
                     if (transactionDate >= startDate) {
                         const key = `${transactionDate.getFullYear()}-${(transactionDate.getMonth() + 1).toString().padStart(2, '0')}`;
                         if (monthlyData[key]) {
                             if (transaction.type === 'income') {
                                 monthlyData[key].income += transaction.amount;
                             } else {
                                 monthlyData[key].expense += transaction.amount;
                             }
                         }
                     }
                 });
                 
                 return Object.values(monthlyData).sort((a, b) => a.period.localeCompare(b.period));
             } else {
                 // 按天统计
                 const days = parseInt(period.replace('days', ''));
                 const startDate = new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
                 startDate.setHours(0, 0, 0, 0);
                 
                 const dailyData = {};
                 
                 // 初始化每日数据
                 for (let i = 0; i < days; i++) {
                     const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
                     const key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
                     dailyData[key] = { 
                         income: 0, 
                         expense: 0, 
                         period: key, 
                         label: `${date.getMonth() + 1}/${date.getDate()}` 
                     };
                 }
                 
                 // 统计每日数据
                 transactions.forEach(transaction => {
                     const transactionDate = new Date(transaction.date);
                     if (transactionDate >= startDate) {
                         const key = transaction.date; // 交易日期已经是YYYY-MM-DD格式
                         if (dailyData[key]) {
                             if (transaction.type === 'income') {
                                 dailyData[key].income += transaction.amount;
                             } else {
                                 dailyData[key].expense += transaction.amount;
                             }
                         }
                     }
                 });
                 
                 return Object.values(dailyData).sort((a, b) => a.period.localeCompare(b.period));
             }
         }

         drawTrendChart(ctx, canvas, data) {
             const padding = 60;
             const chartWidth = canvas.width - 2 * padding;
             const chartHeight = canvas.height - 2 * padding;
             
             // 找到最大值用于缩放
             const maxValue = Math.max(
                 ...data.map(d => Math.max(d.income, d.expense))
             );
             
             if (maxValue === 0) {
                 this.drawEmptyTrendChart(ctx, canvas);
                 return;
             }
             
             // 绘制坐标轴
             ctx.strokeStyle = '#e0e0e0';
             ctx.lineWidth = 1;
             
             // Y轴
             ctx.beginPath();
             ctx.moveTo(padding, padding);
             ctx.lineTo(padding, padding + chartHeight);
             ctx.stroke();
             
             // X轴
             ctx.beginPath();
             ctx.moveTo(padding, padding + chartHeight);
             ctx.lineTo(padding + chartWidth, padding + chartHeight);
             ctx.stroke();
             
             // 绘制网格线和标签
             ctx.font = '12px Arial';
             ctx.fillStyle = '#666';
             
             // Y轴标签
             for (let i = 0; i <= 5; i++) {
                 const value = (maxValue / 5) * i;
                 const y = padding + chartHeight - (chartHeight / 5) * i;
                 
                 // 网格线
                 if (i > 0) {
                     ctx.strokeStyle = '#f0f0f0';
                     ctx.beginPath();
                     ctx.moveTo(padding, y);
                     ctx.lineTo(padding + chartWidth, y);
                     ctx.stroke();
                 }
                 
                 // 标签
                 ctx.fillText(Utils.formatCurrency(value), 5, y + 4);
             }
             
             // X轴标签
              const labelStep = Math.max(1, Math.floor(data.length / 10)); // 最多显示10个标签
              data.forEach((item, index) => {
                  if (index % labelStep === 0 || index === data.length - 1) {
                      const x = padding + (chartWidth / (data.length - 1)) * index;
                      ctx.fillText(item.label, x - 15, padding + chartHeight + 20);
                  }
              });
             
             // 绘制收入线
             ctx.strokeStyle = '#4CAF50';
             ctx.lineWidth = 3;
             ctx.beginPath();
             data.forEach((item, index) => {
                 const x = padding + (chartWidth / (data.length - 1)) * index;
                 const y = padding + chartHeight - (item.income / maxValue) * chartHeight;
                 if (index === 0) {
                     ctx.moveTo(x, y);
                 } else {
                     ctx.lineTo(x, y);
                 }
             });
             ctx.stroke();
             
             // 绘制支出线
             ctx.strokeStyle = '#F44336';
             ctx.lineWidth = 3;
             ctx.beginPath();
             data.forEach((item, index) => {
                 const x = padding + (chartWidth / (data.length - 1)) * index;
                 const y = padding + chartHeight - (item.expense / maxValue) * chartHeight;
                 if (index === 0) {
                     ctx.moveTo(x, y);
                 } else {
                     ctx.lineTo(x, y);
                 }
             });
             ctx.stroke();
             
             // 绘制数据点
             data.forEach((item, index) => {
                 const x = padding + (chartWidth / (data.length - 1)) * index;
                 
                 // 收入点
                 const incomeY = padding + chartHeight - (item.income / maxValue) * chartHeight;
                 ctx.fillStyle = '#4CAF50';
                 ctx.beginPath();
                 ctx.arc(x, incomeY, 4, 0, 2 * Math.PI);
                 ctx.fill();
                 
                 // 支出点
                 const expenseY = padding + chartHeight - (item.expense / maxValue) * chartHeight;
                 ctx.fillStyle = '#F44336';
                 ctx.beginPath();
                 ctx.arc(x, expenseY, 4, 0, 2 * Math.PI);
                 ctx.fill();
             });
             
             // 绘制图例
             ctx.font = '14px Arial';
             ctx.fillStyle = '#4CAF50';
             ctx.fillRect(padding + chartWidth - 120, padding + 10, 15, 15);
             ctx.fillStyle = '#333';
             ctx.fillText('收入', padding + chartWidth - 100, padding + 22);
             
             ctx.fillStyle = '#F44336';
             ctx.fillRect(padding + chartWidth - 120, padding + 35, 15, 15);
             ctx.fillStyle = '#333';
             ctx.fillText('支出', padding + chartWidth - 100, padding + 47);
         }

         drawEmptyTrendCharts() {
             const incomeCanvas = document.getElementById('income-trend-chart');
             const expenseCanvas = document.getElementById('expense-trend-chart');
             
             [incomeCanvas, expenseCanvas].forEach(canvas => {
                 const ctx = canvas.getContext('2d');
                 ctx.clearRect(0, 0, canvas.width, canvas.height);
                 ctx.fillStyle = '#ccc';
                 ctx.font = '16px Arial';
                 ctx.textAlign = 'center';
                 ctx.fillText('暂无趋势数据', canvas.width / 2, canvas.height / 2);
                 ctx.textAlign = 'left';
             });
         }

         drawSingleTrendChart(canvasId, tooltipId, data, dataType, chartType) {
             const canvas = document.getElementById(canvasId);
             const ctx = canvas.getContext('2d');
             const tooltip = document.getElementById(tooltipId);
             
             // 清空画布
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             
             const padding = 60;
             const chartWidth = canvas.width - 2 * padding;
             const chartHeight = canvas.height - 2 * padding;
             
             // 获取对应类型的最大值
             const maxValue = Math.max(...data.map(d => d[dataType]));
             
             if (maxValue === 0) {
                 ctx.fillStyle = '#ccc';
                 ctx.font = '16px Arial';
                 ctx.textAlign = 'center';
                 ctx.fillText(`暂无${dataType === 'income' ? '收入' : '支出'}数据`, canvas.width / 2, canvas.height / 2);
                 ctx.textAlign = 'left';
                 return;
             }
             
             // 绘制坐标轴
             ctx.strokeStyle = '#e0e0e0';
             ctx.lineWidth = 1;
             
             // Y轴
             ctx.beginPath();
             ctx.moveTo(padding, padding);
             ctx.lineTo(padding, padding + chartHeight);
             ctx.stroke();
             
             // X轴
             ctx.beginPath();
             ctx.moveTo(padding, padding + chartHeight);
             ctx.lineTo(padding + chartWidth, padding + chartHeight);
             ctx.stroke();
             
             // 绘制网格线和Y轴标签
             ctx.font = '12px Arial';
             ctx.fillStyle = '#666';
             
             for (let i = 0; i <= 5; i++) {
                 const value = (maxValue / 5) * i;
                 const y = padding + chartHeight - (chartHeight / 5) * i;
                 
                 if (i > 0) {
                     ctx.strokeStyle = '#f0f0f0';
                     ctx.beginPath();
                     ctx.moveTo(padding, y);
                     ctx.lineTo(padding + chartWidth, y);
                     ctx.stroke();
                 }
                 
                 ctx.fillText(Utils.formatCurrency(value), 5, y + 4);
             }
             
             // X轴标签
             const labelStep = Math.max(1, Math.floor(data.length / 10));
             data.forEach((item, index) => {
                 if (index % labelStep === 0 || index === data.length - 1) {
                     const x = padding + (chartWidth / (data.length - 1)) * index;
                     ctx.fillText(item.label, x - 15, padding + chartHeight + 20);
                 }
             });
             
             // 绘制趋势线
             const color = dataType === 'income' ? '#4CAF50' : '#F44336';
             ctx.strokeStyle = color;
             ctx.lineWidth = 3;
             ctx.beginPath();
             
             data.forEach((item, index) => {
                 const x = padding + (chartWidth / (data.length - 1)) * index;
                 const y = padding + chartHeight - (item[dataType] / maxValue) * chartHeight;
                 if (index === 0) {
                     ctx.moveTo(x, y);
                 } else {
                     ctx.lineTo(x, y);
                 }
             });
             ctx.stroke();
             
             // 绘制数据点并存储位置信息
             const dataPoints = [];
             data.forEach((item, index) => {
                 const x = padding + (chartWidth / (data.length - 1)) * index;
                 const y = padding + chartHeight - (item[dataType] / maxValue) * chartHeight;
                 
                 ctx.fillStyle = color;
                 ctx.beginPath();
                 ctx.arc(x, y, 4, 0, 2 * Math.PI);
                 ctx.fill();
                 
                 // 存储数据点信息用于鼠标悬停
                 dataPoints.push({
                     x: x,
                     y: y,
                     value: item[dataType],
                     label: item.label,
                     period: item.period
                 });
             });
             
             // 添加鼠标事件监听
             this.addChartMouseEvents(canvas, tooltip, dataPoints, dataType, chartType);
         }

         addChartMouseEvents(canvas, tooltip, dataPoints, dataType, chartType) {
             const eventHandler = (e) => {
                 const rect = canvas.getBoundingClientRect();
                 const mouseX = e.clientX - rect.left;
                 const mouseY = e.clientY - rect.top;

                 let closestPoint = null;
                 let minDistance = Infinity;

                 dataPoints.forEach(point => {
                     const distance = Math.sqrt(Math.pow(mouseX - point.x, 2) + Math.pow(mouseY - point.y, 2));
                     if (distance < minDistance) {
                         minDistance = distance;
                         closestPoint = point;
                     }
                 });

                 if (closestPoint && minDistance < 20) {
                     if (e.type === 'mousemove') {
                         canvas.style.cursor = 'pointer';
                         tooltip.style.display = 'block';
                         tooltip.style.left = `${e.clientX + 15}px`;
                         tooltip.style.top = `${e.clientY + 15}px`;

                         const typeText = dataType === 'income' ? '收入' : '支出';
                         tooltip.innerHTML = `
                             <div class="tooltip-label">${closestPoint.label}</div>
                             <div class="tooltip-value">${typeText}: ${Utils.formatCurrency(closestPoint.value)}</div>
                             ${chartType === 'daily' ? '<div class="tooltip-hint">点击查看当天记录</div>' : ''}
                         `;
                     } else if (e.type === 'click' && chartType === 'daily') {
                         this.showDailyTransactions(closestPoint.period);
                     }
                 } else {
                     canvas.style.cursor = 'default';
                     tooltip.style.display = 'none';
                 }
             };

             canvas.addEventListener('mousemove', eventHandler);
             canvas.addEventListener('click', eventHandler);

             canvas.addEventListener('mouseleave', () => {
                 tooltip.style.display = 'none';
                 canvas.style.cursor = 'default';
             });
         }

         showDailyTransactions(date) {
            window.app.navigateTo('transactions', { date: date });
        }

         // 计算点到线段的距离
         distanceToLineSegment(px, py, x1, y1, x2, y2) {
             const A = px - x1;
             const B = py - y1;
             const C = x2 - x1;
             const D = y2 - y1;
             
             const dot = A * C + B * D;
             const lenSq = C * C + D * D;
             
             if (lenSq === 0) {
                 // 线段退化为点
                 return Math.sqrt(A * A + B * B);
             }
             
             let param = dot / lenSq;
             
             let xx, yy;
             
             if (param < 0) {
                 xx = x1;
                 yy = y1;
             } else if (param > 1) {
                 xx = x2;
                 yy = y2;
             } else {
                 xx = x1 + param * C;
                 yy = y1 + param * D;
             }
             
             const dx = px - xx;
             const dy = py - yy;
             return Math.sqrt(dx * dx + dy * dy);
         }

         // 对比分析相关方法
         updateMonthlyComparison() {
             const now = new Date();
             const currentMonth = now.getMonth();
             const currentYear = now.getFullYear();
             
             // 获取本月数据
             const thisMonthStats = this.getMonthStats(currentYear, currentMonth);
             
             // 获取上月数据（环比）
             const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
             const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
             const lastMonthStats = this.getMonthStats(lastMonthYear, lastMonth);
             
             // 获取去年同月数据（同比）
             const lastYearStats = this.getMonthStats(currentYear - 1, currentMonth);
             
             // 更新环比数据
             this.updateComparisonCard('comparison1-data', thisMonthStats, lastMonthStats, '上月');
             document.getElementById('comparison1-title').textContent = '本月 vs 上月（环比）';
             
             // 更新同比数据
             this.updateComparisonCard('comparison2-data', thisMonthStats, lastYearStats, '去年同月');
             document.getElementById('comparison2-title').textContent = '本月 vs 去年同月（同比）';
             
             // 绘制对比图表
             this.drawComparisonChart(thisMonthStats, lastMonthStats, lastYearStats, ['本月', '上月', '去年同月']);
         }
         
         switchComparisonMode(mode) {
             const customControls = document.getElementById('custom-comparison-controls');
             if (mode === 'custom') {
                 customControls.style.display = 'block';
                 // 设置默认日期
                 const now = new Date();
                 const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
                 const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                 const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                 const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
                 
                 document.getElementById('period1-start').value = thisMonthStart.toISOString().split('T')[0];
                 document.getElementById('period1-end').value = thisMonthEnd.toISOString().split('T')[0];
                 document.getElementById('period2-start').value = lastMonthStart.toISOString().split('T')[0];
                 document.getElementById('period2-end').value = lastMonthEnd.toISOString().split('T')[0];
             } else {
                 customControls.style.display = 'none';
                 this.updateMonthlyComparison();
             }
         }
         
         applyCustomComparison() {
             const period1Start = document.getElementById('period1-start').value;
             const period1End = document.getElementById('period1-end').value;
             const period2Start = document.getElementById('period2-start').value;
             const period2End = document.getElementById('period2-end').value;
             
             if (!period1Start || !period1End || !period2Start || !period2End) {
                 this.showNotification('请选择完整的对比时间范围', 'error');
                 return;
             }
             
             // 获取两个时间段的数据
             const period1Stats = this.getPeriodStats(period1Start, period1End);
             const period2Stats = this.getPeriodStats(period2Start, period2End);
             
             // 格式化日期显示
             const formatDate = (dateStr) => {
                 const date = new Date(dateStr);
                 return `${date.getMonth() + 1}/${date.getDate()}`;
             };
             
             const period1Label = `${formatDate(period1Start)}-${formatDate(period1End)}`;
             const period2Label = `${formatDate(period2Start)}-${formatDate(period2End)}`;
             
             // 更新对比卡片
             this.updateComparisonCard('comparison1-data', period1Stats, period2Stats, '期间2');
             document.getElementById('comparison1-title').textContent = `期间1 vs 期间2`;
             
             // 隐藏第二个对比卡片
             document.getElementById('comparison2-data').innerHTML = `
                 <div class="custom-period-info">
                     <div class="period-label">期间1: ${period1Label}</div>
                     <div class="period-label">期间2: ${period2Label}</div>
                 </div>
             `;
             document.getElementById('comparison2-title').textContent = '自定义对比时间';
             
             // 绘制对比图表
             this.drawComparisonChart(period1Stats, period2Stats, { income: 0, expense: 0 }, [period1Label, period2Label, '']);
         }
         
         getPeriodStats(startDate, endDate) {
             const transactions = this.dataManager.getTransactions();
             const start = new Date(startDate);
             const end = new Date(endDate);
             end.setHours(23, 59, 59, 999); // 包含结束日期的全天
             
             let income = 0;
             let expense = 0;
             let count = 0;
             
             transactions.forEach(transaction => {
                 const transactionDate = new Date(transaction.date);
                 if (transactionDate >= start && transactionDate <= end) {
                     if (transaction.type === 'income') {
                         income += transaction.amount;
                     } else {
                         expense += transaction.amount;
                     }
                     count++;
                 }
             });
             
             return { income, expense, balance: income - expense, count };
         }

         getMonthStats(year, month) {
             const transactions = this.dataManager.getTransactions();
             const startDate = new Date(year, month, 1);
             const endDate = new Date(year, month + 1, 0);
             
             let income = 0;
             let expense = 0;
             let count = 0;
             
             transactions.forEach(transaction => {
                 const transactionDate = new Date(transaction.date);
                 if (transactionDate >= startDate && transactionDate <= endDate) {
                     if (transaction.type === 'income') {
                         income += transaction.amount;
                     } else {
                         expense += transaction.amount;
                     }
                     count++;
                 }
             });
             
             return { income, expense, balance: income - expense, count };
         }

         updateComparisonCard(cardId, current, previous, periodName) {
             const card = document.getElementById(cardId);
             
             const incomeChange = this.calculateChange(current.income, previous.income);
             const expenseChange = this.calculateChange(current.expense, previous.expense);
             const balanceChange = this.calculateChange(current.balance, previous.balance);
             
             card.innerHTML = `
                 <div class="comparison-item">
                     <div class="comparison-label">收入对比</div>
                     <div class="comparison-values">
                         <span class="current-value">${Utils.formatCurrency(current.income)}</span>
                         <span class="vs-text">vs</span>
                         <span class="previous-value">${Utils.formatCurrency(previous.income)}</span>
                     </div>
                     <div class="comparison-change ${incomeChange.type}">
                         ${incomeChange.icon} ${incomeChange.text}
                     </div>
                 </div>
                 <div class="comparison-item">
                     <div class="comparison-label">支出对比</div>
                     <div class="comparison-values">
                         <span class="current-value">${Utils.formatCurrency(current.expense)}</span>
                         <span class="vs-text">vs</span>
                         <span class="previous-value">${Utils.formatCurrency(previous.expense)}</span>
                     </div>
                     <div class="comparison-change ${expenseChange.type}">
                         ${expenseChange.icon} ${expenseChange.text}
                     </div>
                 </div>
                 <div class="comparison-item">
                     <div class="comparison-label">余额对比</div>
                     <div class="comparison-values">
                         <span class="current-value">${Utils.formatCurrency(current.balance)}</span>
                         <span class="vs-text">vs</span>
                         <span class="previous-value">${Utils.formatCurrency(previous.balance)}</span>
                     </div>
                     <div class="comparison-change ${balanceChange.type}">
                         ${balanceChange.icon} ${balanceChange.text}
                     </div>
                 </div>
             `;
         }

         calculateChange(current, previous) {
             if (previous === 0) {
                 return {
                     type: current > 0 ? 'positive' : 'neutral',
                     icon: current > 0 ? '📈' : '➖',
                     text: current > 0 ? '新增' : '无变化'
                 };
             }
             
             const change = current - previous;
             const percentage = Math.abs((change / previous) * 100);
             
             if (Math.abs(change) < 0.01) {
                 return {
                     type: 'neutral',
                     icon: '➖',
                     text: '无变化'
                 };
             }
             
             return {
                 type: change > 0 ? 'positive' : 'negative',
                 icon: change > 0 ? '📈' : '📉',
                 text: `${change > 0 ? '+' : ''}${Utils.formatCurrency(Math.abs(change))} (${percentage.toFixed(1)}%)`
             };
         }

         drawComparisonChart(current, lastMonth, lastYear, labels = ['本月', '上月', '去年同月']) {
             const canvas = document.getElementById('comparison-chart');
             const ctx = canvas.getContext('2d');
             
             // 清空画布
             ctx.clearRect(0, 0, canvas.width, canvas.height);
             
             const data = [
                 { label: labels[0], income: current.income, expense: current.expense },
                 { label: labels[1], income: lastMonth.income, expense: lastMonth.expense },
                 { label: labels[2], income: lastYear.income, expense: lastYear.expense }
             ].filter(item => item.label); // 过滤掉空标签
             
             const maxValue = Math.max(
                 ...data.map(d => Math.max(d.income, d.expense))
             );
             
             if (maxValue === 0) {
                 ctx.fillStyle = '#ccc';
                 ctx.font = '16px Arial';
                 ctx.textAlign = 'center';
                 ctx.fillText('暂无对比数据', canvas.width / 2, canvas.height / 2);
                 ctx.textAlign = 'left';
                 return;
             }
             
             const barWidth = 60;
             const barSpacing = 40;
             const groupSpacing = 80;
             const startX = 80;
             const chartHeight = canvas.height - 100;
             
             data.forEach((item, index) => {
                 const x = startX + index * (barWidth * 2 + barSpacing + groupSpacing);
                 
                 // 收入柱
                 const incomeHeight = (item.income / maxValue) * chartHeight;
                 ctx.fillStyle = '#4CAF50';
                 ctx.fillRect(x, canvas.height - 50 - incomeHeight, barWidth, incomeHeight);
                 
                 // 支出柱
                 const expenseHeight = (item.expense / maxValue) * chartHeight;
                 ctx.fillStyle = '#F44336';
                 ctx.fillRect(x + barWidth + barSpacing, canvas.height - 50 - expenseHeight, barWidth, expenseHeight);
                 
                 // 标签
                 ctx.fillStyle = '#333';
                 ctx.font = '12px Arial';
                 ctx.textAlign = 'center';
                 ctx.fillText(item.label, x + barWidth + barSpacing / 2, canvas.height - 30);
                 
                 // 数值标签
                 ctx.fillStyle = '#4CAF50';
                 ctx.fillText(Utils.formatCurrency(item.income), x + barWidth / 2, canvas.height - 55 - incomeHeight);
                 
                 ctx.fillStyle = '#F44336';
                 ctx.fillText(Utils.formatCurrency(item.expense), x + barWidth + barSpacing + barWidth / 2, canvas.height - 55 - expenseHeight);
             });
             
             // 图例
             ctx.textAlign = 'left';
             ctx.font = '14px Arial';
             ctx.fillStyle = '#4CAF50';
             ctx.fillRect(startX, 20, 15, 15);
             ctx.fillStyle = '#333';
             ctx.fillText('收入', startX + 20, 32);
             
             ctx.fillStyle = '#F44336';
             ctx.fillRect(startX + 80, 20, 15, 15);
             ctx.fillStyle = '#333';
             ctx.fillText('支出', startX + 100, 32);
         }
    }