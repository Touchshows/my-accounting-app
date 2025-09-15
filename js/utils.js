// 工具函数集合
class Utils {
    // 格式化金额显示
    static formatCurrency(amount, currency = '¥') {
        const num = parseFloat(amount) || 0;
        return `${currency}${num.toLocaleString('zh-CN', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }

    // 格式化日期显示
    static formatDate(dateString, format = 'YYYY-MM-DD') {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        switch (format) {
            case 'YYYY-MM-DD':
                return `${year}-${month}-${day}`;
            case 'MM-DD':
                return `${month}-${day}`;
            case 'YYYY年MM月DD日':
                return `${year}年${month}月${day}日`;
            case 'MM月DD日':
                return `${month}月${day}日`;
            default:
                return `${year}-${month}-${day}`;
        }
    }

    // 获取相对时间描述
    static getRelativeTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) {
            return '今天';
        } else if (diffDays === 1) {
            return '昨天';
        } else if (diffDays < 7) {
            return `${diffDays}天前`;
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7);
            return `${weeks}周前`;
        } else if (diffDays < 365) {
            const months = Math.floor(diffDays / 30);
            return `${months}个月前`;
        } else {
            const years = Math.floor(diffDays / 365);
            return `${years}年前`;
        }
    }

    // 验证金额输入
    static validateAmount(amount) {
        const num = parseFloat(amount);
        return !isNaN(num) && num > 0 && num <= 999999999;
    }

    // 防抖函数
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // 节流函数
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 生成随机颜色
    static generateRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
            '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // 下载文件
    static downloadFile(content, filename, contentType = 'application/json') {
        const blob = new Blob([content], { type: contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // 读取文件
    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    // 显示通知
    static showNotification(message, type = 'info', duration = 3000) {
        // 创建通知元素
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // 添加样式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '10000',
            transform: 'translateX(100%)',
            transition: 'transform 0.3s ease',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        // 设置背景色
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#FF9800',
            info: '#2196F3'
        };
        notification.style.backgroundColor = colors[type] || colors.info;
        
        // 添加到页面
        document.body.appendChild(notification);
        
        // 显示动画
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // 自动隐藏
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    // 确认对话框
    static confirm(message, title = '确认') {
        return new Promise((resolve) => {
            const result = window.confirm(`${title}\n\n${message}`);
            resolve(result);
        });
    }

    // 获取当前月份范围
    static getCurrentMonthRange() {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    // 获取当前年份范围
    static getCurrentYearRange() {
        const now = new Date();
        const start = new Date(now.getFullYear(), 0, 1);
        const end = new Date(now.getFullYear(), 11, 31);
        return {
            start: start.toISOString().split('T')[0],
            end: end.toISOString().split('T')[0]
        };
    }

    // 导出为Excel文件（CSV格式，Excel兼容）
    static exportToExcel(data, filename = '记账数据') {
        if (!data || data.length === 0) {
            Utils.showNotification('没有数据可以导出', 'warning');
            return;
        }
    
        // 创建CSV内容
        let csvContent = '';
        
        // 添加表头（只添加一次）
        csvContent += '日期,类型,分类,金额,描述,创建时间\n';
        
        // 添加数据行
        data.forEach(transaction => {
            const category = storage.getCategories().find(c => c.id === transaction.category);
            const categoryName = category ? category.name : transaction.category;
            
            const row = [
                Utils.formatDate(transaction.date, 'YYYY-MM-DD'),
                transaction.type === 'income' ? '收入' : '支出',
                categoryName,
                parseFloat(transaction.amount),
                transaction.description || '',
                Utils.formatDate(transaction.createdAt, 'YYYY-MM-DD HH:mm:ss')
            ];
            
            // 处理包含逗号或引号的单元格
            const processedRow = row.map(cell => {
                const cellStr = String(cell);
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            });
            
            csvContent += processedRow.join(',') + '\n';
        });
        
        // 添加BOM以支持中文
        const BOM = '\uFEFF';
        const finalContent = BOM + csvContent;
        
        // 下载文件
        Utils.downloadFile(finalContent, `${filename}_${Utils.formatDate(new Date(), 'YYYY-MM-DD')}.csv`, 'text/csv;charset=utf-8');
        Utils.showNotification('数据导出成功！', 'success');
    }

    // 导出为真正的Excel文件（使用SheetJS库）
    static exportToRealExcel(data, filename = '记账数据') {
        if (!data || data.length === 0) {
            Utils.showNotification('没有数据可以导出', 'warning');
            return;
        }
    
        // 检查是否加载了SheetJS库
        if (typeof XLSX === 'undefined') {
            // 如果没有加载SheetJS，回退到CSV导出
            Utils.showNotification('正在导出为CSV格式（Excel兼容）...', 'info');
            Utils.exportToExcel(data, filename);
            return;
        }
        
        // 创建工作表数据（直接创建对象数组）
        const worksheetData = data.map(transaction => {
            const category = storage.getCategories().find(c => c.id === transaction.category);
            const categoryName = category ? category.name : transaction.category;
            
            return {
                '日期': Utils.formatDate(transaction.date, 'YYYY-MM-DD'),
                '类型': transaction.type === 'income' ? '收入' : '支出',
                '分类': categoryName,
                '金额': parseFloat(transaction.amount),
                '描述': transaction.description || '',
                '创建时间': Utils.formatDate(transaction.createdAt, 'YYYY-MM-DD HH:mm:ss')
            };
        });
        
        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        
        // 添加工作表到工作簿
        XLSX.utils.book_append_sheet(workbook, worksheet, '交易记录');
        
        // 导出文件
        const fileName = `${filename}_${Utils.formatDate(new Date(), 'YYYY-MM-DD')}.xlsx`;
        XLSX.writeFile(workbook, fileName);
        
        Utils.showNotification('Excel文件导出成功！', 'success');
    }

    // 初始化主题管理器
    static initThemeManager() {
        if (!window.themeManager) {
            window.themeManager = new ThemeManager();
        }
        return window.themeManager;
    }

    // 切换主题
    static setTheme(theme) {
        const themeManager = Utils.initThemeManager();
        themeManager.setTheme(theme);
    }

    // 获取当前主题
    static getCurrentTheme() {
        const themeManager = Utils.initThemeManager();
        return themeManager.getCurrentTheme();
    }
}