/**
 * Simple Charts Library - Lightweight alternative to Plotly.js
 * Provides basic charting functionality for SAGE application
 */

class SimpleCharts {
    constructor() {
        this.colors = {
            primary: 'rgba(102, 126, 234, 0.8)',
            primaryLine: '#667eea',
            secondary: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c',
            text: '#2c3e50',
            grid: '#e1e1e1'
        };
    }

    /**
     * Create a bar chart
     */
    createBarChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const {
            title = '',
            xAxisLabel = '',
            yAxisLabel = '',
            width = 800,
            height = 400,
            showGrid = true,
            showTooltips = true
        } = options;

        // Clear container
        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = `${height}px`;

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.backgroundColor = '#ffffff';

        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create chart group
        const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chartGroup.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);

        // Calculate scales
        const maxValue = Math.max(...data.map(d => d.value));
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;

        // Draw grid lines
        if (showGrid) {
            const gridLines = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gridLines.setAttribute('class', 'grid-lines');
            
            // Horizontal grid lines
            for (let i = 0; i <= 5; i++) {
                const y = (chartHeight / 5) * i;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', 0);
                line.setAttribute('y1', y);
                line.setAttribute('x2', chartWidth);
                line.setAttribute('y2', y);
                line.setAttribute('stroke', this.colors.grid);
                line.setAttribute('stroke-width', '1');
                gridLines.appendChild(line);
            }
            chartGroup.appendChild(gridLines);
        }

        // Draw bars
        data.forEach((item, index) => {
            const barHeight = (item.value / maxValue) * chartHeight;
            const x = (chartWidth / data.length) * index + barSpacing / 2;
            const y = chartHeight - barHeight;

            const bar = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            bar.setAttribute('x', x);
            bar.setAttribute('y', y);
            bar.setAttribute('width', barWidth);
            bar.setAttribute('height', barHeight);
            bar.setAttribute('fill', this.colors.primary);
            bar.setAttribute('stroke', this.colors.primaryLine);
            bar.setAttribute('stroke-width', '1');

            // Add hover effects
            bar.addEventListener('mouseenter', () => {
                bar.setAttribute('fill', this.colors.primaryLine);
                if (showTooltips) {
                    this.showTooltip(container, item.label + ': ' + item.value, event);
                }
            });

            bar.addEventListener('mouseleave', () => {
                bar.setAttribute('fill', this.colors.primary);
                this.hideTooltip(container);
            });

            chartGroup.appendChild(bar);

            // Add x-axis labels
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', x + barWidth / 2);
            label.setAttribute('y', chartHeight + 20);
            label.setAttribute('text-anchor', 'middle');
            label.setAttribute('font-size', '12');
            label.setAttribute('fill', this.colors.text);
            label.textContent = item.label;
            chartGroup.appendChild(label);
        });

        // Add y-axis labels
        for (let i = 0; i <= 5; i++) {
            const value = (maxValue / 5) * (5 - i);
            const y = (chartHeight / 5) * i + 5;
            
            const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            label.setAttribute('x', -10);
            label.setAttribute('y', y);
            label.setAttribute('text-anchor', 'end');
            label.setAttribute('font-size', '12');
            label.setAttribute('fill', this.colors.text);
            label.textContent = value.toFixed(1);
            chartGroup.appendChild(label);
        }

        // Add title
        if (title) {
            const titleElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            titleElement.setAttribute('x', width / 2);
            titleElement.setAttribute('y', 25);
            titleElement.setAttribute('text-anchor', 'middle');
            titleElement.setAttribute('font-size', '16');
            titleElement.setAttribute('font-weight', 'bold');
            titleElement.setAttribute('fill', this.colors.text);
            titleElement.textContent = title;
            svg.appendChild(titleElement);
        }

        svg.appendChild(chartGroup);
        container.appendChild(svg);
    }

    /**
     * Create a line chart
     */
    createLineChart(containerId, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const {
            title = '',
            width = 800,
            height = 400,
            showGrid = true,
            showTooltips = true,
            strokeColor = this.colors.secondary,
            strokeWidth = 3
        } = options;

        // Clear container
        container.innerHTML = '';
        container.style.position = 'relative';
        container.style.width = '100%';
        container.style.height = `${height}px`;

        // Create SVG
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', '100%');
        svg.setAttribute('height', '100%');
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
        svg.style.backgroundColor = '#ffffff';

        const margin = { top: 40, right: 40, bottom: 60, left: 60 };
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;

        // Create chart group
        const chartGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        chartGroup.setAttribute('transform', `translate(${margin.left}, ${margin.top})`);

        // Calculate scales
        const maxValue = Math.max(...data.map(d => d.value));
        const minValue = Math.min(...data.map(d => d.value));
        const valueRange = maxValue - minValue || 1;

        // Draw grid lines
        if (showGrid) {
            const gridLines = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            gridLines.setAttribute('class', 'grid-lines');
            
            // Horizontal grid lines
            for (let i = 0; i <= 5; i++) {
                const y = (chartHeight / 5) * i;
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', 0);
                line.setAttribute('y1', y);
                line.setAttribute('x2', chartWidth);
                line.setAttribute('y2', y);
                line.setAttribute('stroke', this.colors.grid);
                line.setAttribute('stroke-width', '1');
                gridLines.appendChild(line);
            }
            chartGroup.appendChild(gridLines);
        }

        // Create path for line
        let pathData = '';
        data.forEach((item, index) => {
            const x = (chartWidth / (data.length - 1)) * index;
            const y = chartHeight - ((item.value - minValue) / valueRange) * chartHeight;
            
            if (index === 0) {
                pathData += `M ${x} ${y}`;
            } else {
                pathData += ` L ${x} ${y}`;
            }
        });

        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', pathData);
        path.setAttribute('stroke', strokeColor);
        path.setAttribute('stroke-width', strokeWidth);
        path.setAttribute('fill', 'none');
        chartGroup.appendChild(path);

        // Add data points
        data.forEach((item, index) => {
            const x = (chartWidth / (data.length - 1)) * index;
            const y = chartHeight - ((item.value - minValue) / valueRange) * chartHeight;

            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            circle.setAttribute('cx', x);
            circle.setAttribute('cy', y);
            circle.setAttribute('r', 4);
            circle.setAttribute('fill', strokeColor);
            circle.setAttribute('stroke', '#ffffff');
            circle.setAttribute('stroke-width', 2);

            // Add hover effects
            circle.addEventListener('mouseenter', (event) => {
                circle.setAttribute('r', 6);
                if (showTooltips) {
                    this.showTooltip(container, item.label + ': ' + item.value, event);
                }
            });

            circle.addEventListener('mouseleave', () => {
                circle.setAttribute('r', 4);
                this.hideTooltip(container);
            });

            chartGroup.appendChild(circle);
        });

        // Add axes labels and title similar to bar chart
        // ... (similar implementation as bar chart)

        svg.appendChild(chartGroup);
        container.appendChild(svg);
    }

    /**
     * Show tooltip
     */
    showTooltip(container, text, event) {
        const tooltip = document.createElement('div');
        tooltip.className = 'chart-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.background = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = 'white';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '1000';
        tooltip.textContent = text;

        const rect = container.getBoundingClientRect();
        tooltip.style.left = (event.clientX - rect.left + 10) + 'px';
        tooltip.style.top = (event.clientY - rect.top - 30) + 'px';

        container.appendChild(tooltip);
    }

    /**
     * Hide tooltip
     */
    hideTooltip(container) {
        const tooltip = container.querySelector('.chart-tooltip');
        if (tooltip) {
            tooltip.remove();
        }
    }

    /**
     * Create no data message
     */
    createNoDataMessage(containerId, message = 'No data available') {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `<div class="no-data">${message}</div>`;
    }
}

// Export for use
window.SimpleCharts = SimpleCharts;