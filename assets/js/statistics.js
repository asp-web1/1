document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeStatistics();
});

function initializeStatistics() {
    updateOverviewStats();
    setupRangeSelectors();
    renderOverallChart();
    renderSubjectChart();
    renderMonthlyChart();
    renderDailyChart();
    renderRecentActivity();
    
    // Add event listeners for real-time updates
    setupStatisticsEventListeners();
}

function setupStatisticsEventListeners() {
    // Refresh statistics when data changes
    window.addEventListener('storage', function(e) {
        if (e.key === 'sageData') {
            setTimeout(() => {
                updateOverviewStats();
                renderOverallChart();
                renderSubjectChart();
                renderMonthlyChart();
                renderDailyChart();
                renderRecentActivity();
            }, 100);
        }
    });
    
    // Listen for custom data update events
    window.addEventListener('sageDataUpdated', function(e) {
        setTimeout(() => {
            updateOverviewStats();
            renderOverallChart();
            renderSubjectChart();
            renderMonthlyChart();
            renderDailyChart();
            renderRecentActivity();
        }, 100);
    });
    
    // Also refresh when returning to the page
    window.addEventListener('focus', function() {
        if (document.visibilityState === 'visible') {
            updateOverviewStats();
        }
    });
}

function setupRangeSelectors() {
    const currentDate = new Date();
    const currentMonth = currentDate.toISOString().slice(0, 7);
    
    // Set default values for range selectors
    const subjectRange = document.getElementById('subjectRange');
    const monthlyRange = document.getElementById('monthlyRange');
    const dailyRange = document.getElementById('dailyRange');
    const overallRange = document.getElementById('overallRange');
    
    if (subjectRange) subjectRange.value = currentMonth;
    if (monthlyRange) monthlyRange.value = currentMonth;
    if (dailyRange) dailyRange.value = currentMonth;
    if (overallRange) overallRange.value = currentMonth;
    
    // Setup subject selector
    setupSubjectSelector();
}

function setupSubjectSelector() {
    const subjects = dataManager.getSubjects();
    const subjectCheckboxes = document.getElementById('subjectCheckboxes');
    
    if (subjectCheckboxes) {
        // Clear existing options except "All Subjects"
        subjectCheckboxes.innerHTML = '<label class="subject-checkbox-item"><input type="checkbox" value="all" checked> All Subjects</label>';
        
        // Add subject options as checkboxes
        subjects.forEach(subject => {
            const checkboxItem = document.createElement('label');
            checkboxItem.className = 'subject-checkbox-item';
            checkboxItem.innerHTML = `
                <input type="checkbox" value="${subject.id}"> ${subject.name}
            `;
            subjectCheckboxes.appendChild(checkboxItem);
        });
        
        // Add event listeners for checkboxes
        const checkboxes = subjectCheckboxes.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', handleSubjectCheckboxChange);
        });
    }
}

function handleSubjectCheckboxChange() {
    const allSubjectsCheckbox = document.querySelector('#subjectCheckboxes input[value="all"]');
    const subjectCheckboxes = document.querySelectorAll('#subjectCheckboxes input[type="checkbox"]:not([value="all"])');
    
    if (this.value === 'all') {
        // If "All Subjects" is checked, uncheck others
        if (this.checked) {
            subjectCheckboxes.forEach(cb => cb.checked = false);
        }
    } else {
        // If a specific subject is checked, uncheck "All Subjects"
        if (this.checked) {
            if (allSubjectsCheckbox) {
                allSubjectsCheckbox.checked = false;
            }
        }
        
        // If no specific subjects are checked, check "All Subjects"
        const anySubjectChecked = Array.from(subjectCheckboxes).some(cb => cb.checked);
        if (!anySubjectChecked) {
            allSubjectsCheckbox.checked = true;
        }
    }
    
    renderSubjectChart();
}

function toggleSubjectSelector() {
    const subjectCheckboxes = document.getElementById('subjectCheckboxes');
    const toggleButton = document.getElementById('toggleSubjectSelector');
    const toggleText = document.getElementById('toggleSubjectText');
    
    if (subjectCheckboxes.style.display === 'none') {
        subjectCheckboxes.style.display = 'flex';
        toggleText.textContent = 'Hide';
    } else {
        subjectCheckboxes.style.display = 'none';
        toggleText.textContent = 'Show';
    }
}

function updateOverviewStats() {
    const progress = dataManager.getDailyProgress();
    
    // Total study hours
    const totalHours = progress.reduce((sum, entry) => sum + (parseFloat(entry.hoursStudied) || 0), 0);
    document.getElementById('totalStudyHours').textContent = totalHours.toFixed(1);
    
    // Average daily hours (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentProgress = progress.filter(entry => new Date(entry.date) >= thirtyDaysAgo);
    const avgHours = recentProgress.length > 0 ? 
        recentProgress.reduce((sum, entry) => sum + (parseFloat(entry.hoursStudied) || 0), 0) / recentProgress.length : 0;
    document.getElementById('avgDailyHours').textContent = avgHours.toFixed(1);
    
    // Total study days
    const studyDays = progress.filter(entry => parseFloat(entry.hoursStudied) > 0).length;
    document.getElementById('totalStudyDays').textContent = studyDays;
    
    // Current streak and best streak
    const streak = dataManager.calculateStudyStreak();
    const bestStreak = dataManager.calculateBestStreak();
    document.getElementById('currentStreak').textContent = streak;
    document.getElementById('bestStreakStats').textContent = `Best: ${bestStreak} days`;
}

function formatDateDDMMYYYY(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function renderOverallChart() {
    const progress = dataManager.getDailyProgress();
    const range = document.getElementById('overallRange')?.value || new Date().toISOString().slice(0, 7);
    
    if (!progress || progress.length === 0) {
        const charts = new SimpleCharts();
        charts.createNoDataMessage('overallChart', '📊 No data available for the selected period');
        return;
    }
    
    // Filter data for the selected month
    const [year, month] = range.split('-');
    const filteredProgress = progress.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() == year && entryDate.getMonth() == month - 1;
    });
    
    if (filteredProgress.length === 0) {
        const charts = new SimpleCharts();
        charts.createNoDataMessage('overallChart', '📊 No data available for the selected period');
        return;
    }
    
    // Prepare data for the chart
    const chartData = filteredProgress.map(entry => ({
        label: formatDateForChart(entry.date),
        value: parseFloat(entry.hoursStudied) || 0
    }));
    
    try {
        const charts = new SimpleCharts();
        charts.createBarChart('overallChart', chartData, {
            title: 'Daily Study Hours',
            xAxisLabel: 'Date',
            yAxisLabel: 'Hours',
            showGrid: true,
            showTooltips: true
        });
    } catch (error) {
        console.error('Error rendering overall chart:', error);
        const charts = new SimpleCharts();
        charts.createNoDataMessage('overallChart', '❌ Error rendering chart');
    }
}

function formatDateForChart(dateStr) {
    const date = new Date(dateStr);
    return `${date.getDate()}/${date.getMonth() + 1}`;
}

function renderSubjectChart() {
    const subjects = dataManager.getSubjects();
    const progress = dataManager.getDailyProgress();
    const range = document.getElementById('subjectRange')?.value || new Date().toISOString().slice(0, 7);
    
    if (subjects.length === 0) {
        const charts = new SimpleCharts();
        charts.createNoDataMessage('subjectChart', '📚 No subjects available');
        return;
    }
    
    // Get selected subjects
    const selectedSubjects = getSelectedSubjects();
    
    if (selectedSubjects.length === 0) {
        const charts = new SimpleCharts();
        charts.createNoDataMessage('subjectChart', '📋 Please select at least one subject');
        return;
    }
    
    // Filter data for the selected month
    const [year, month] = range.split('-');
    const filteredProgress = progress.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() == year && entryDate.getMonth() == month - 1;
    });
    
    // Calculate total hours for each subject
    const subjectData = selectedSubjects.map(subject => {
        const subjectProgress = filteredProgress.filter(entry => entry.subjectId === subject.id.toString());
        const totalHours = subjectProgress.reduce((sum, entry) => sum + (parseFloat(entry.hoursStudied) || 0), 0);
        
        return {
            label: subject.name,
            value: totalHours
        };
    }).filter(data => data.value > 0);
    
    if (subjectData.length === 0) {
        const charts = new SimpleCharts();
        charts.createNoDataMessage('subjectChart', '📊 No study data for selected subjects in this period');
        return;
    }
    
    try {
        const charts = new SimpleCharts();
        charts.createBarChart('subjectChart', subjectData, {
            title: 'Subject-wise Study Hours',
            xAxisLabel: 'Subjects',
            yAxisLabel: 'Total Hours',
            showGrid: true,
            showTooltips: true
        });
    } catch (error) {
        console.error('Error rendering subject chart:', error);
        const charts = new SimpleCharts();
        charts.createNoDataMessage('subjectChart', '❌ Error rendering chart');
    }
}

function getSubjectColor(subjectId) {
    const colors = [
        '#667eea', '#764ba2', '#f093fb', '#f5576c',
        '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
        '#fa709a', '#fee140', '#a8edea', '#fed6e3',
        '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef'
    ];
    return colors[subjectId % colors.length];
}

function getSelectedSubjects() {
    const subjects = dataManager.getSubjects();
    const allSubjectsCheckbox = document.querySelector('#subjectCheckboxes input[value="all"]');
    const subjectCheckboxes = document.querySelectorAll('#subjectCheckboxes input[type="checkbox"]:not([value="all"])');
    
    if (allSubjectsCheckbox && allSubjectsCheckbox.checked) {
        return subjects;
    }
    
    const selectedSubjectIds = Array.from(subjectCheckboxes)
        .filter(cb => cb.checked)
        .map(cb => cb.value);
    
    return subjects.filter(subject => selectedSubjectIds.includes(subject.id.toString()));
}

function renderMonthlyChart() {
    const progress = dataManager.getDailyProgress();
    const chartContainer = document.getElementById('monthlyChart');
    const rangeSelector = document.getElementById('monthlyRange');
    
    if (progress.length === 0) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>No Study Data</h4>
                <p>Add daily progress entries to see your study patterns</p>
            </div>
        `;
        return;
    }
    
    const selectedMonth = rangeSelector ? rangeSelector.value : new Date().toISOString().slice(0, 7);
    const [year, month] = selectedMonth.split('-');
    
    const chartData = [];
    const daysInMonth = new Date(year, month, 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dateString = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const entry = progress.find(e => e.date === dateString);
        const hours = entry ? parseFloat(entry.hoursStudied) || 0 : 0;
        
        if (hours > 0 || i % 5 === 0) { // Show every 5th day or days with study hours
            chartData.push({
                label: `${i}`,
                value: hours
            });
        }
    }
    
    try {
        const charts = new SimpleCharts();
        charts.createLineChart('monthlyChart', chartData, {
            title: `Monthly Study Progress (${selectedMonth})`,
            strokeColor: '#667eea',
            strokeWidth: 3,
            showGrid: true,
            showTooltips: true
        });
    } catch (error) {
        console.error('Error rendering monthly chart:', error);
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>Error Rendering Chart</h4>
                <p>Unable to display monthly chart</p>
            </div>
        `;
    }
}

function renderDailyChart() {
    const progress = dataManager.getDailyProgress();
    const chartContainer = document.getElementById('dailyChart');
    const rangeSelector = document.getElementById('dailyRange');
    
    if (progress.length === 0) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>No Study Data</h4>
                <p>Add daily progress entries to see your study patterns</p>
            </div>
        `;
        return;
    }
    
    const selectedMonth = rangeSelector ? rangeSelector.value : new Date().toISOString().slice(0, 7);
    const [year, month] = selectedMonth.split('-');
    
    // Filter data for the selected month
    const filteredProgress = progress.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getFullYear() == year && entryDate.getMonth() == month - 1;
    });
    
    if (filteredProgress.length === 0) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>No Study Data</h4>
                <p>No study entries found for the selected month</p>
            </div>
        `;
        return;
    }
    
    const chartData = filteredProgress.map(entry => ({
        label: formatDateForChart(entry.date),
        value: parseFloat(entry.hoursStudied) || 0
    }));
    
    try {
        const charts = new SimpleCharts();
        charts.createBarChart('dailyChart', chartData, {
            title: `Daily Study Hours (${selectedMonth})`,
            xAxisLabel: 'Date',
            yAxisLabel: 'Hours',
            showGrid: true,
            showTooltips: true
        });
    } catch (error) {
        console.error('Error rendering daily chart:', error);
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>Error Rendering Chart</h4>
                <p>Unable to display daily chart</p>
            </div>
        `;
    }
}

function renderRecentActivity() {
    const progress = dataManager.getDailyProgress();
    const container = document.getElementById('recentStats');
    
    if (progress.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>No Recent Activity</h4>
                <p>Start tracking your daily progress to see activity statistics</p>
            </div>
        `;
        return;
    }
    
    // Recent 7 days stats
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weekProgress = progress.filter(entry => new Date(entry.date) >= sevenDaysAgo);
    const weeklyHours = weekProgress.reduce((sum, entry) => sum + (parseFloat(entry.hoursStudied) || 0), 0);
    
    // Subject breakdown
    const subjectHours = {};
    weekProgress.forEach(entry => {
        if (!subjectHours[entry.subject]) {
            subjectHours[entry.subject] = 0;
        }
        subjectHours[entry.subject] += parseFloat(entry.hoursStudied) || 0;
    });
    
    const statsHTML = `
        <div class="stats-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 20px;">
            <div class="stat-card" style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <h5 style="margin: 0 0 10px 0; color: #333;">This Week</h5>
                <div style="font-size: 2em; color: #3498db; font-weight: bold;">${weeklyHours.toFixed(1)}h</div>
                <div style="color: #666;">Total study time</div>
            </div>
            
            <div class="stat-card" style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <h5 style="margin: 0 0 10px 0; color: #333;">Active Days</h5>
                <div style="font-size: 2em; color: #27ae60; font-weight: bold;">${weekProgress.filter(e => parseFloat(e.hoursStudied) > 0).length}</div>
                <div style="color: #666;">Out of 7 days</div>
            </div>
            
            <div class="stat-card" style="background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center;">
                <h5 style="margin: 0 0 10px 0; color: #333;">Top Subject</h5>
                <div style="font-size: 1.2em; color: #e74c3c; font-weight: bold;">
                    ${Object.keys(subjectHours).length > 0 ? 
                        Object.entries(subjectHours).sort(([,a], [,b]) => b - a)[0][0] : 'None'}
                </div>
                <div style="color: #666;">
                    ${Object.keys(subjectHours).length > 0 ? 
                        Object.entries(subjectHours).sort(([,a], [,b]) => b - a)[0][1].toFixed(1) + 'h' : '0h'}
                </div>
            </div>
        </div>
        
        ${Object.keys(subjectHours).length > 0 ? `
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
                <h5 style="margin: 0 0 15px 0; color: #333;">Weekly Subject Breakdown:</h5>
                ${Object.entries(subjectHours)
                    .sort(([,a], [,b]) => b - a)
                    .map(([subject, hours]) => `
                        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                            <span style="font-weight: 500;">${subject}</span>
                            <span style="color: #667eea; font-weight: bold;">${hours.toFixed(1)}h</span>
                        </div>
                    `).join('')}
            </div>
        ` : ''}
    `;
    
    container.innerHTML = statsHTML;
}

function calculateSubjectProgress(subject) {
    if (!subject.subtopics || subject.subtopics.length === 0) return 0;
    
    let totalProgress = 0;
    subject.subtopics.forEach(subtopic => {
        const completedTasks = [
            subtopic.lecture,
            subtopic.theory,
            subtopic.notes,
            ...(subtopic.testSeries || []),
            subtopic.pyq,
            subtopic.workbook
        ].filter(Boolean).length;
        
        totalProgress += completedTasks / 9;
    });
    
    return Math.round((totalProgress / subject.subtopics.length) * 100);
}

function exportMonthlyReport() {
    const progress = dataManager.getDailyProgress();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const monthlyProgress = progress.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === currentMonth && entryDate.getFullYear() === currentYear;
    });
    
    const totalHours = monthlyProgress.reduce((sum, entry) => sum + (parseFloat(entry.hoursStudied) || 0), 0);
    const activeDays = monthlyProgress.filter(entry => parseFloat(entry.hoursStudied) > 0).length;
    const avgHours = monthlyProgress.length > 0 ? totalHours / monthlyProgress.length : 0;
    
    let report = `ESE Exam Preparation - Monthly Report\n`;
    report += `=====================================\n\n`;
    report += `Month: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}\n\n`;
    report += `Summary:\n`;
    report += `- Total Study Hours: ${totalHours.toFixed(1)}\n`;
    report += `- Active Study Days: ${activeDays}\n`;
    report += `- Average Daily Hours: ${avgHours.toFixed(1)}\n\n`;
    report += `Daily Breakdown:\n`;
    report += `${monthlyProgress.map(entry => 
        `${formatDateDDMMYYYY(entry.date)}: ${entry.hoursStudied}h - ${entry.subject} (${entry.type})`
    ).join('\n')}\n\n`;
    report += `Generated on: ${formatDateDDMMYYYY(new Date().toISOString())}`;
    
    // Export as text file (simple fallback)
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ESE_Monthly_Report_${new Date().toISOString().slice(0, 7)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Show notification if available
    if (typeof showNotification === 'function') {
        showNotification('Monthly report exported as text file!');
    } else {
        alert('Monthly report exported successfully!');
    }
}

function showNotification(message) {
    alert(message); // Simple notification
}
