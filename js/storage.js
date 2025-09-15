// 本地存储管理类
class StorageManager {
    constructor() {
        this.STORAGE_KEYS = {
            TRANSACTIONS: 'accounting_transactions',
            CATEGORIES: 'accounting_categories',
            SETTINGS: 'accounting_settings',
            BUDGETS: 'accounting_budgets'
        };
        this.initializeDefaultData();
    }

    // 初始化默认数据
    initializeDefaultData() {
        if (!this.getCategories().length) {
            const defaultCategories = [
                // 收入分类
                { id: 'salary', name: '工资', type: 'income', color: '#4CAF50', icon: '💰' },
                { id: 'bonus', name: '奖金', type: 'income', color: '#8BC34A', icon: '🎁' },
                { id: 'investment', name: '投资收益', type: 'income', color: '#CDDC39', icon: '📈' },
                { id: 'other_income', name: '其他收入', type: 'income', color: '#FFC107', icon: '💵' },
                
                // 支出分类
                { id: 'food', name: '餐饮', type: 'expense', color: '#FF5722', icon: '🍽️' },
                { id: 'transport', name: '交通', type: 'expense', color: '#FF9800', icon: '🚗' },
                { id: 'shopping', name: '购物', type: 'expense', color: '#E91E63', icon: '🛍️' },
                { id: 'entertainment', name: '娱乐', type: 'expense', color: '#9C27B0', icon: '🎬' },
                { id: 'healthcare', name: '医疗', type: 'expense', color: '#F44336', icon: '🏥' },
                { id: 'education', name: '教育', type: 'expense', color: '#3F51B5', icon: '📚' },
                { id: 'housing', name: '住房', type: 'expense', color: '#607D8B', icon: '🏠' },
                { id: 'other_expense', name: '其他支出', type: 'expense', color: '#795548', icon: '💸' }
            ];
            this.saveCategories(defaultCategories);
        }
    }

    // 交易记录相关方法
    getTransactions() {
        const data = localStorage.getItem(this.STORAGE_KEYS.TRANSACTIONS);
        return data ? JSON.parse(data) : [];
    }

    saveTransactions(transactions) {
        localStorage.setItem(this.STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }

    addTransaction(transaction) {
        const transactions = this.getTransactions();
        const newTransaction = {
            id: this.generateId(),
            ...transaction,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        transactions.unshift(newTransaction);
        this.saveTransactions(transactions);
        return newTransaction;
    }

    updateTransaction(id, updates) {
        const transactions = this.getTransactions();
        const index = transactions.findIndex(t => t.id === id);
        if (index !== -1) {
            transactions[index] = {
                ...transactions[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveTransactions(transactions);
            return transactions[index];
        }
        return null;
    }

    saveTransaction(transactionData) {
        const isEditing = !!transactionData.id;
        
        if (isEditing) {
            return this.updateTransaction(transactionData.id, transactionData);
        } else {
            return this.addTransaction(transactionData);
        }
    }

    deleteTransaction(id) {
        const transactions = this.getTransactions();
        const filteredTransactions = transactions.filter(t => t.id !== id);
        this.saveTransactions(filteredTransactions);
        return filteredTransactions.length < transactions.length;
    }

    // 分类相关方法
    getCategories() {
        const data = localStorage.getItem(this.STORAGE_KEYS.CATEGORIES);
        return data ? JSON.parse(data) : [];
    }

    saveCategories(categories) {
        localStorage.setItem(this.STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }

    getCategoriesByType(type) {
        return this.getCategories().filter(cat => cat.type === type);
    }

    addCategory(category) {
        const categories = this.getCategories();
        const newCategory = {
            id: this.generateId(),
            ...category
        };
        categories.push(newCategory);
        this.saveCategories(categories);
        return newCategory;
    }

    updateCategory(id, updates) {
        const categories = this.getCategories();
        const index = categories.findIndex(c => c.id === id);
        if (index !== -1) {
            categories[index] = {
                ...categories[index],
                ...updates
            };
            this.saveCategories(categories);
            return categories[index];
        }
        return null;
    }

    saveCategory(categoryData) {
        const isEditing = !!categoryData.id;
        
        if (isEditing) {
            return this.updateCategory(categoryData.id, categoryData);
        } else {
            return this.addCategory(categoryData);
        }
    }

    deleteCategory(id) {
        const categories = this.getCategories();
        const filteredCategories = categories.filter(c => c.id !== id);
        this.saveCategories(filteredCategories);
        return filteredCategories.length < categories.length;
    }

    // 统计相关方法
    getStatistics(startDate, endDate) {
        const transactions = this.getTransactions();
        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const start = startDate ? new Date(startDate) : new Date('1900-01-01');
            const end = endDate ? new Date(endDate) : new Date();
            return transactionDate >= start && transactionDate <= end;
        });

        const income = filteredTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expense = filteredTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense,
            transactionCount: filteredTransactions.length
        };
    }

    getMonthlyStatistics() {
        const transactions = this.getTransactions();
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();

        const monthlyTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });

        return this.calculateStatistics(monthlyTransactions);
    }

    getCategoryStatistics(type, startDate, endDate) {
        const transactions = this.getTransactions();
        const categories = this.getCategories();
        
        console.log('Debug - 所有交易记录:', transactions);
        console.log('Debug - 所有分类:', categories);
        
        const filteredTransactions = transactions.filter(t => {
            const transactionDate = new Date(t.date);
            const start = startDate ? new Date(startDate) : new Date('1900-01-01');
            const end = endDate ? new Date(endDate) : new Date();
            const matchesType = t.type === type;
            const matchesDate = transactionDate >= start && transactionDate <= end;
            
            console.log(`Debug - 交易 ${t.id}: type=${t.type}, category=${t.category}, date=${t.date}, matchesType=${matchesType}, matchesDate=${matchesDate}`);
            
            return matchesType && matchesDate;
        });
        
        console.log(`Debug - 过滤后的${type}交易:`, filteredTransactions);

        const categoryStats = {};
        
        // 首先初始化所有该类型的分类
        categories.filter(c => c.type === type).forEach(category => {
            categoryStats[category.id] = {
                name: category.name,
                color: category.color,
                icon: category.icon,
                amount: 0,
                count: 0
            };
        });
        
        // 统计实际的交易数据
        filteredTransactions.forEach(t => {
            // 尝试多种方式匹配分类
            let categoryKey = null;
            
            // 方式1：直接匹配ID
            if (categoryStats[t.category]) {
                categoryKey = t.category;
            } else {
                // 方式2：通过名称匹配
                const categoryByName = categories.find(c => c.name === t.category && c.type === type);
                if (categoryByName) {
                    categoryKey = categoryByName.id;
                } else {
                    // 方式3：创建新的分类条目
                    const category = categories.find(c => c.id === t.category);
                    categoryKey = t.category;
                    categoryStats[categoryKey] = {
                        name: category ? category.name : t.category,
                        color: category ? category.color : '#999',
                        icon: category ? category.icon : '📊',
                        amount: 0,
                        count: 0
                    };
                }
            }
            
            if (categoryKey && categoryStats[categoryKey]) {
                categoryStats[categoryKey].amount += parseFloat(t.amount);
                categoryStats[categoryKey].count += 1;
                console.log(`Debug - 添加到分类 ${categoryKey}: +${t.amount}, 总计: ${categoryStats[categoryKey].amount}`);
            }
        });
        
        console.log('Debug - 最终分类统计:', categoryStats);

        // 返回所有分类，按金额排序（有数据的在前）
        const result = Object.values(categoryStats)
            .sort((a, b) => {
                if (a.amount > 0 && b.amount === 0) return -1;
                if (a.amount === 0 && b.amount > 0) return 1;
                return b.amount - a.amount;
            });
            
        console.log('Debug - 返回结果:', result);
        return result;
    }

    // 数据导入导出
    exportData() {
        const data = {
            transactions: this.getTransactions(),
            categories: this.getCategories(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };
        return JSON.stringify(data, null, 2);
    }

    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.transactions) {
                this.saveTransactions(data.transactions);
            }
            if (data.categories) {
                this.saveCategories(data.categories);
            }
            return true;
        } catch (error) {
            console.error('导入数据失败:', error);
            return false;
        }
    }

    // 工具方法
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    calculateStatistics(transactions) {
        const income = transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        const expense = transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);

        return {
            totalIncome: income,
            totalExpense: expense,
            balance: income - expense
        };
    }

    // 预算相关方法
    getBudgets() {
        const data = localStorage.getItem(this.STORAGE_KEYS.BUDGETS);
        return data ? JSON.parse(data) : [];
    }

    saveBudgets(budgets) {
        localStorage.setItem(this.STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    }

    addBudget(budget) {
        const budgets = this.getBudgets();
        const newBudget = {
            id: this.generateId(),
            ...budget,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        budgets.push(newBudget);
        this.saveBudgets(budgets);
        return newBudget;
    }

    updateBudget(id, updates) {
        const budgets = this.getBudgets();
        const index = budgets.findIndex(b => b.id === id);
        if (index !== -1) {
            budgets[index] = {
                ...budgets[index],
                ...updates,
                updatedAt: new Date().toISOString()
            };
            this.saveBudgets(budgets);
            return budgets[index];
        }
        return null;
    }

    deleteBudget(id) {
        const budgets = this.getBudgets();
        const filteredBudgets = budgets.filter(b => b.id !== id);
        this.saveBudgets(filteredBudgets);
        return filteredBudgets.length < budgets.length;
    }

    getBudgetsByPeriod(period) {
        return this.getBudgets().filter(budget => budget.period === period);
    }

    getBudgetsByCategory(categoryId) {
        return this.getBudgets().filter(budget => budget.categoryId === categoryId);
    }

    // 清空所有数据
    clearAllData() {
        localStorage.removeItem(this.STORAGE_KEYS.TRANSACTIONS);
        localStorage.removeItem(this.STORAGE_KEYS.CATEGORIES);
        localStorage.removeItem(this.STORAGE_KEYS.SETTINGS);
        localStorage.removeItem(this.STORAGE_KEYS.BUDGETS);
        this.initializeDefaultData();
    }
}