// UI组件类
class UIComponents {
    // 创建加载指示器
    static createLoader() {
        return '<div class="loading"></div>';
    }

    // 创建确认对话框
    static createConfirmDialog(message, onConfirm, onCancel) {
        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.innerHTML = `
            <div class="confirm-dialog-content">
                <div class="confirm-dialog-message">${message}</div>
                <div class="confirm-dialog-actions">
                    <button class="btn-cancel" id="confirm-cancel">取消</button>
                    <button class="btn-danger" id="confirm-ok">确定</button>
                </div>
            </div>
        `;
        
        // 添加样式
        Object.assign(dialog.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            width: '100%',
            height: '100%',
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: '10000'
        });
        
        // 绑定事件
        dialog.querySelector('#confirm-ok').addEventListener('click', () => {
            document.body.removeChild(dialog);
            if (onConfirm) onConfirm();
        });
        
        dialog.querySelector('#confirm-cancel').addEventListener('click', () => {
            document.body.removeChild(dialog);
            if (onCancel) onCancel();
        });
        
        document.body.appendChild(dialog);
        return dialog;
    }

    // 创建统计卡片
    static createStatCard(title, amount, type = 'default') {
        const colorClass = {
            income: 'stat-card-income',
            expense: 'stat-card-expense',
            balance: 'stat-card-balance',
            default: 'stat-card-default'
        }[type];
        
        return `
            <div class="stat-card ${colorClass}">
                <h3 class="stat-card-title">${title}</h3>
                <div class="stat-card-amount">${Utils.formatCurrency(amount)}</div>
            </div>
        `;
    }

    // 创建分类标签
    static createCategoryTag(category) {
        return `
            <span class="category-tag" style="background-color: ${category.color}20; color: ${category.color}">
                ${category.icon} ${category.name}
            </span>
        `;
    }

    // 创建空状态组件
    static createEmptyState(icon, title, subtitle) {
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${icon}</div>
                <div class="empty-state-text">${title}</div>
                ${subtitle ? `<div class="empty-state-subtext">${subtitle}</div>` : ''}
            </div>
        `;
    }
}

// 图表组件类（简化版，不依赖外部库）
class SimpleChart {
    constructor(container, data, options = {}) {
        this.container = container;
        this.data = data;
        this.options = {
            width: 300,
            height: 200,
            colors: ['#4CAF50', '#f44336', '#FF9800', '#2196F3', '#9C27B0'],
            ...options
        };
    }

    // 绘制饼图
    drawPieChart() {
        const { width, height, colors } = this.options;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) / 2 - 20;
        
        const total = this.data.reduce((sum, item) => sum + item.value, 0);
        let currentAngle = 0;
        
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        
        this.data.forEach((item, index) => {
            const angle = (item.value / total) * 2 * Math.PI;
            const x1 = centerX + radius * Math.cos(currentAngle);
            const y1 = centerY + radius * Math.sin(currentAngle);
            const x2 = centerX + radius * Math.cos(currentAngle + angle);
            const y2 = centerY + radius * Math.sin(currentAngle + angle);
            
            const largeArcFlag = angle > Math.PI ? 1 : 0;
            const color = colors[index % colors.length];
            
            svg += `
                <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z"
                      fill="${color}" stroke="white" stroke-width="2"/>
            `;
            
            currentAngle += angle;
        });
        
        svg += '</svg>';
        
        this.container.innerHTML = svg;
    }

    // 绘制柱状图
    drawBarChart() {
        const { width, height, colors } = this.options;
        const margin = { top: 20, right: 20, bottom: 40, left: 40 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        const maxValue = Math.max(...this.data.map(d => d.value));
        const barWidth = chartWidth / this.data.length * 0.8;
        const barSpacing = chartWidth / this.data.length * 0.2;
        
        let svg = `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`;
        
        this.data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = margin.left + index * (barWidth + barSpacing);
            const y = margin.top + chartHeight - barHeight;
            const color = colors[index % colors.length];
            
            svg += `
                <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}"
                      fill="${color}" rx="4"/>
                <text x="${x + barWidth/2}" y="${height - 10}" 
                      text-anchor="middle" font-size="12" fill="#666">
                    ${item.label}
                </text>
            `;
        });
        
        svg += '</svg>';
        
        this.container.innerHTML = svg;
    }
}