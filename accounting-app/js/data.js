class DataManager {
    constructor(storage) {
        this.storage = storage;
        this.uiManager = null; // Injected later to avoid circular dependency
        try {
            const transactions = this.storage.getTransactions();
            const categories = this.storage.getCategories();
            let needsSave = false;

            this.transactions = transactions.map(t => {
                if (t.categoryId) {
                    // Already in the new format
                    return t;
                }
                
                if (t.category) { // Old format with category name/id as 'category'
                    const categoryObject = categories.find(c => c.id === t.category || c.name === t.category);
                    if (categoryObject) {
                        needsSave = true;
                        const { category, ...rest } = t;
                        return { ...rest, categoryId: categoryObject.id };
                    }
                }
                
                // If no category information or cannot be migrated, return as is.
                return t;
            });

            if (needsSave) {
                console.log("Data migration: Updated transactions to use categoryId. Saving back to storage.");
                this.storage.saveTransactions(this.transactions);
            }
        } catch (error) {
            console.error("Error initializing DataManager:", error);
            this.transactions = [];
        }
    }

    setUIManager(uiManager) {
        this.uiManager = uiManager;
    }

    getTransactions(filters = {}) {
        let filtered = this.transactions;

        if (filters.type) {
            filtered = filtered.filter(t => t.type === filters.type);
        }
        if (filters.sortBy) {
            filtered.sort((a, b) => new Date(b[filters.sortBy]) - new Date(a[filters.sortBy]));
        }

        return filtered;
    }

    getTransactionById(id) {
        return this.transactions.find(t => t.id === id);
    }

    saveTransaction(transactionData) {
        const isEditing = !!transactionData.id;
        const transaction = this.storage.saveTransaction(transactionData);
        
        if (isEditing) {
            const index = this.transactions.findIndex(t => t.id === transaction.id);
            this.transactions[index] = transaction;
        } else {
            this.transactions.push(transaction);
        }

        if (this.uiManager) {
            this.uiManager.showNotification(`${isEditing ? '更新' : '添加'}成功`);
        }
    }

    deleteTransaction(id) {
        this.storage.deleteTransaction(id);
        this.transactions = this.transactions.filter(t => t.id !== id);
        if (this.uiManager) {
            this.uiManager.showNotification('交易删除成功');
        }
    }

    getCategories() {
        return this.storage.getCategories();
    }

    saveCategory(categoryData) {
        const category = this.storage.saveCategory(categoryData);
        if (this.uiManager) {
            this.uiManager.showNotification('分类保存成功');
        }
        return category;
    }

    deleteCategory(id) {
        this.storage.deleteCategory(id);
        if (this.uiManager) {
            this.uiManager.showNotification('分类删除成功');
        }
    }

    getStatistics(range = 'month', customDates = {}) {
        const allTransactions = this.getTransactions({ sortBy: 'date' });
        let filteredTransactions = [];

        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const today = `${year}-${month}-${day}`;

        switch (range) {
            case 'today':
                filteredTransactions = allTransactions.filter(t => t.date === today);
                break;
            case 'month':
                const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                filteredTransactions = allTransactions.filter(t => new Date(t.date) >= firstDayOfMonth);
                break;
            case 'year':
                const firstDayOfYear = new Date(now.getFullYear(), 0, 1);
                filteredTransactions = allTransactions.filter(t => new Date(t.date) >= firstDayOfYear);
                break;
            case 'custom':
                if (customDates.start && customDates.end) {
                    filteredTransactions = allTransactions.filter(t => 
                        t.date >= customDates.start && t.date <= customDates.end
                    );
                }
                break;
            case 'all':
            default:
                filteredTransactions = allTransactions;
                break;
        }

        const stats = {
            totalIncome: 0,
            totalExpense: 0,
            balance: 0,
            transactionCount: 0,
            incomeByCategory: {},
            expenseByCategory: {},
        };

        filteredTransactions.forEach(t => {
            if (t.type === 'income') {
                stats.totalIncome += t.amount;
                stats.incomeByCategory[t.categoryId] = (stats.incomeByCategory[t.categoryId] || 0) + t.amount;
            } else {
                stats.totalExpense += t.amount;
                stats.expenseByCategory[t.categoryId] = (stats.expenseByCategory[t.categoryId] || 0) + t.amount;
            }
        });

        stats.balance = stats.totalIncome - stats.totalExpense;
        stats.transactionCount = filteredTransactions.length;
        return stats;
    }

    exportData() {
        this.storage.exportData();
    }

    importData(data) {
        const success = this.storage.importData(data);
        if (success) {
            this.transactions = this.storage.getTransactions();
            if (this.uiManager) {
                this.uiManager.showNotification('数据导入成功');
            }
        } else {
            if (this.uiManager) {
                this.uiManager.showNotification('数据导入失败', 'error');
            }
        }
        return success;
    }

    clearAllData() {
        this.storage.clearAllData();
        this.transactions = [];
        if (this.uiManager) {
            this.uiManager.showNotification('所有数据已清空');
        }
    }

    // 预算相关方法
    getBudgets() {
        return this.storage.getBudgets();
    }

    saveBudget(budgetData) {
        const isEditing = !!budgetData.id;
        let budget;
        
        if (isEditing) {
            budget = this.storage.updateBudget(budgetData.id, budgetData);
        } else {
            budget = this.storage.addBudget(budgetData);
        }
        
        if (this.uiManager) {
            this.uiManager.showNotification(`预算${isEditing ? '更新' : '创建'}成功`);
        }
        return budget;
    }

    deleteBudget(id) {
        this.storage.deleteBudget(id);
        if (this.uiManager) {
            this.uiManager.showNotification('预算删除成功');
        }
    }

    getBudgetById(id) {
        return this.getBudgets().find(b => b.id === id);
    }

    getBudgetProgress(budgetId) {
        const budget = this.getBudgetById(budgetId);
        if (!budget) return null;

        const now = new Date();
        let startDate, endDate;

        // 根据预算周期计算时间范围
        switch (budget.period) {
            case 'monthly':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            case 'weekly':
                const dayOfWeek = now.getDay();
                startDate = new Date(now);
                startDate.setDate(now.getDate() - dayOfWeek);
                endDate = new Date(startDate);
                endDate.setDate(startDate.getDate() + 6);
                break;
            case 'yearly':
                startDate = new Date(now.getFullYear(), 0, 1);
                endDate = new Date(now.getFullYear(), 11, 31);
                break;
            default:
                return null;
        }

        // 获取该时间范围内的支出
        const transactions = this.getTransactions();
        const relevantTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const matchesTimeRange = transactionDate >= startDate && transactionDate <= endDate;
            const matchesType = t.type === 'expense';
            const matchesCategory = budget.categoryId === 'all' || t.categoryId === budget.categoryId;
            return matchesTimeRange && matchesType && matchesCategory;
        });

        const spent = relevantTransactions.reduce((sum, t) => sum + t.amount, 0);
        const remaining = budget.amount - spent;
        const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

        return {
            budget,
            spent,
            remaining,
            percentage: Math.min(percentage, 100),
            isOverBudget: spent > budget.amount,
            transactions: relevantTransactions
        };
    }

    getAllBudgetProgress() {
        const budgets = this.getBudgets();
        return budgets.map(budget => this.getBudgetProgress(budget.id)).filter(Boolean);
    }

    checkBudgetAlerts() {
        const budgetProgress = this.getAllBudgetProgress();
        const alerts = [];

        budgetProgress.forEach(progress => {
            if (progress.isOverBudget) {
                alerts.push({
                    type: 'over_budget',
                    budget: progress.budget,
                    message: `预算"${progress.budget.name}"已超支 ¥${(progress.spent - progress.budget.amount).toFixed(2)}`
                });
            } else if (progress.percentage >= 80) {
                alerts.push({
                    type: 'warning',
                    budget: progress.budget,
                    message: `预算"${progress.budget.name}"已使用 ${progress.percentage.toFixed(1)}%`
                });
            }
        });

        return alerts;
    }
}