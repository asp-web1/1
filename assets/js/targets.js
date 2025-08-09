document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeTargets();
});

function initializeTargets() {
    updateTargetsDisplay();
    loadMilestones();
    renderTargetHistory();
    setupEventListeners();
    setupModalHandlers();
}

function setupEventListeners() {
    // Listen for data updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'sageData') {
            setTimeout(() => {
                updateTargetsDisplay();
                loadMilestones();
                renderTargetHistory();
            }, 100);
        }
    });
    
    window.addEventListener('sageDataUpdated', function(e) {
        setTimeout(() => {
            updateTargetsDisplay();
            loadMilestones();
            renderTargetHistory();
        }, 100);
    });
}

function setupModalHandlers() {
    // Targets modal
    const targetsForm = document.getElementById('targetsForm');
    const targetsModal = document.getElementById('targetsModal');
    
    if (targetsForm) {
        targetsForm.addEventListener('submit', handleTargetsSubmit);
    }
    
    if (targetsModal) {
        targetsModal.addEventListener('click', function(e) {
            if (e.target === targetsModal) {
                closeTargetsModal();
            }
        });
    }
    
    // Milestone modal
    const milestoneForm = document.getElementById('milestoneForm');
    const milestoneModal = document.getElementById('milestoneModal');
    
    if (milestoneForm) {
        milestoneForm.addEventListener('submit', handleMilestoneSubmit);
    }
    
    if (milestoneModal) {
        milestoneModal.addEventListener('click', function(e) {
            if (e.target === milestoneModal) {
                closeMilestoneModal();
            }
        });
    }
}

function updateTargetsDisplay() {
    const targets = dataManager.getTargets();
    const progress = dataManager.getDailyProgress();
    
    // Calculate current week progress
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    const weekProgress = progress.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= weekStart;
    });
    
    const weeklyHours = weekProgress.reduce((sum, entry) => sum + (parseFloat(entry.hoursStudied) || 0), 0);
    const weeklyDays = weekProgress.filter(entry => parseFloat(entry.hoursStudied) > 0).length;
    
    // Calculate current month progress
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthProgress = progress.filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= monthStart;
    });
    
    const monthlyHours = monthProgress.reduce((sum, entry) => sum + (parseFloat(entry.hoursStudied) || 0), 0);
    const monthlyDays = monthProgress.filter(entry => parseFloat(entry.hoursStudied) > 0).length;
    
    // Update weekly targets
    document.getElementById('weeklyHours').textContent = weeklyHours.toFixed(1);
    document.getElementById('weeklyTarget').textContent = targets.weekly.hours || 0;
    document.getElementById('weeklyDays').textContent = weeklyDays;
    document.getElementById('weeklyTargetDays').textContent = targets.weekly.days || 0;
    
    const weeklyProgressPercent = targets.weekly.hours > 0 ? (weeklyHours / targets.weekly.hours) * 100 : 0;
    const weeklyProgressFill = document.getElementById('weeklyProgressFill');
    weeklyProgressFill.style.width = Math.min(weeklyProgressPercent, 100) + '%';
    
    // Update weekly status with enhanced styling
    const weeklyStatus = document.getElementById('weeklyStatus');
    if (targets.weekly.hours === 0) {
        weeklyStatus.textContent = 'Not set';
        weeklyStatus.className = 'target-status enhanced not-set';
    } else if (weeklyProgressPercent >= 100) {
        weeklyStatus.textContent = '🎉 Completed!';
        weeklyStatus.className = 'target-status enhanced completed';
    } else if (weeklyProgressPercent >= 75) {
        weeklyStatus.textContent = '🚀 On Track!';
        weeklyStatus.className = 'target-status enhanced on-track';
    } else if (weeklyProgressPercent >= 50) {
        weeklyStatus.textContent = '📈 Good Progress';
        weeklyStatus.className = 'target-status enhanced on-track';
    } else {
        weeklyStatus.textContent = '⚠️ Behind Schedule';
        weeklyStatus.className = 'target-status enhanced behind';
    }
    
    // Update monthly targets
    document.getElementById('monthlyHours').textContent = monthlyHours.toFixed(1);
    document.getElementById('monthlyTarget').textContent = targets.monthly.hours || 0;
    document.getElementById('monthlyDays').textContent = monthlyDays;
    document.getElementById('monthlyTargetDays').textContent = targets.monthly.days || 0;
    
    const monthlyProgressPercent = targets.monthly.hours > 0 ? (monthlyHours / targets.monthly.hours) * 100 : 0;
    const monthlyProgressFill = document.getElementById('monthlyProgressFill');
    monthlyProgressFill.style.width = Math.min(monthlyProgressPercent, 100) + '%';
    
    // Update monthly status with enhanced styling
    const monthlyStatus = document.getElementById('monthlyStatus');
    if (targets.monthly.hours === 0) {
        monthlyStatus.textContent = 'Not set';
        monthlyStatus.className = 'target-status enhanced not-set';
    } else if (monthlyProgressPercent >= 100) {
        monthlyStatus.textContent = '🎉 Completed!';
        monthlyStatus.className = 'target-status enhanced completed';
    } else if (monthlyProgressPercent >= 75) {
        monthlyStatus.textContent = '🚀 On Track!';
        monthlyStatus.className = 'target-status enhanced on-track';
    } else if (monthlyProgressPercent >= 50) {
        monthlyStatus.textContent = '📈 Good Progress';
        monthlyStatus.className = 'target-status enhanced on-track';
    } else {
        monthlyStatus.textContent = '⚠️ Behind Schedule';
        monthlyStatus.className = 'target-status enhanced behind';
    }
}

function loadMilestones() {
    const milestones = dataManager.getMilestones();
    const subjects = dataManager.getSubjects();
    const grid = document.getElementById('milestonesGrid');
    
    if (Object.keys(milestones).length === 0) {
        grid.innerHTML = `
            <div class="empty-state enhanced">
                <div class="empty-icon">🏆</div>
                <h4>No Milestones Set</h4>
                <p>Create milestones to track your subject-specific goals</p>
                <button class="btn btn-primary enhanced" onclick="showMilestoneModal()">
                    <span>➕</span> Add First Milestone
                </button>
            </div>
        `;
        return;
    }
    
    const milestonesHTML = Object.entries(milestones).map(([subjectId, milestone]) => {
        const subject = subjects.find(s => s.id.toString() === subjectId);
        if (!subject) return '';
        
        const currentProgress = calculateSubjectProgress(subject);
        const progressPercent = milestone.targetProgress > 0 ? (currentProgress / milestone.targetProgress) * 100 : 0;
        const daysUntilTarget = Math.ceil((new Date(milestone.targetDate) - new Date()) / (1000 * 60 * 60 * 24));
        
        let statusClass = 'pending';
        let statusText = 'Pending';
        let statusIcon = '⏳';
        
        if (progressPercent >= 100) {
            statusClass = 'completed';
            statusText = '🎉 Completed!';
            statusIcon = '✅';
        } else if (daysUntilTarget < 0) {
            statusClass = 'overdue';
            statusText = '⚠️ Overdue';
            statusIcon = '🚨';
        } else if (progressPercent >= 75) {
            statusClass = 'on-track';
            statusText = '🚀 On track!';
            statusIcon = '🔥';
        } else if (progressPercent >= 50) {
            statusClass = 'on-track';
            statusText = '📈 Good progress';
            statusIcon = '📊';
        }
        
        return `
            <div class="milestone-card enhanced ${statusClass}">
                <div class="milestone-header">
                    <div class="milestone-title">
                        <h4>${milestone.title}</h4>
                        <span class="milestone-subject">${subject.name}</span>
                    </div>
                    <div class="milestone-icon">${statusIcon}</div>
                </div>
                <div class="milestone-progress">
                    <div class="progress-info">
                        <span class="current-progress">${currentProgress}%</span>/<span class="target-progress">${milestone.targetProgress}%</span>
                    </div>
                    <div class="progress-bar enhanced">
                        <div class="progress-fill enhanced" style="width: ${Math.min(progressPercent, 100)}%"></div>
                    </div>
                </div>
                <div class="milestone-details">
                    <div class="milestone-date">
                        <span class="target-date">Target: ${formatDateDDMMYYYY(milestone.targetDate)}</span>
                        <span class="days-left ${daysUntilTarget < 0 ? 'overdue' : ''}">
                            ${daysUntilTarget > 0 ? daysUntilTarget + ' days left' : Math.abs(daysUntilTarget) + ' days overdue'}
                        </span>
                    </div>
                    <div class="milestone-status enhanced ${statusClass}">${statusText}</div>
                </div>
                ${milestone.description ? `<div class="milestone-description">${milestone.description}</div>` : ''}
                <div class="milestone-actions">
                    <button class="btn btn-sm btn-primary enhanced" onclick="editMilestone('${subjectId}')">
                        <span>✏️</span> Edit
                    </button>
                    <button class="btn btn-sm btn-danger enhanced" onclick="deleteMilestone('${subjectId}')">
                        <span>🗑️</span> Delete
                    </button>
                </div>
            </div>
        `;
    }).join('');
    
    grid.innerHTML = milestonesHTML;
}

function calculateSubjectProgress(subject) {
    if (!subject.subtopics || subject.subtopics.length === 0) return 0;
    
    let totalProgress = 0;
    subject.subtopics.forEach(subtopic => {
        const completedTasks = [
            subtopic.lecture,
            subtopic.theory,
            subtopic.notes,
            ...subtopic.testSeries,
            subtopic.pyq,
            subtopic.workbook
        ].filter(Boolean).length;
        
        totalProgress += completedTasks / 9;
    });
    
    return Math.round((totalProgress / subject.subtopics.length) * 100);
}

function renderTargetHistory() {
    const progress = dataManager.getDailyProgress();
    const targets = dataManager.getTargets();
    const chartContainer = document.getElementById('targetHistoryChart');
    
    if (progress.length === 0) {
        chartContainer.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #666;">
                <h4>No Data Available</h4>
                <p>Start tracking your progress to see target history</p>
            </div>
        `;
        return;
    }
    
    // Group progress by week
    const weeklyData = {};
    progress.forEach(entry => {
        const date = new Date(entry.date);
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        const weekKey = weekStart.toISOString().split('T')[0];
        
        if (!weeklyData[weekKey]) {
            weeklyData[weekKey] = {
                hours: 0,
                days: 0,
                target: targets.weekly.hours || 0
            };
        }
        
        weeklyData[weekKey].hours += parseFloat(entry.hoursStudied) || 0;
        if (parseFloat(entry.hoursStudied) > 0) {
            weeklyData[weekKey].days++;
        }
    });
    
    const weeks = Object.keys(weeklyData).sort();
    const actualHours = weeks.map(week => weeklyData[week].hours);
    const targetHours = weeks.map(week => weeklyData[week].target);
    const weekLabels = weeks.map(week => formatDateDDMMYYYY(week));
    
    const trace1 = {
        x: weekLabels,
        y: actualHours,
        type: 'bar',
        name: 'Actual Hours',
        marker: { color: '#667eea' }
    };
    
    const trace2 = {
        x: weekLabels,
        y: targetHours,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Target Hours',
        line: { color: '#e74c3c', dash: 'dash' },
        marker: { color: '#e74c3c' }
    };
    
    const layout = {
        title: 'Weekly Target vs Actual Study Hours',
        xaxis: { title: 'Week' },
        yaxis: { title: 'Hours' },
        barmode: 'group',
        plot_bgcolor: '#f8f9fa',
        paper_bgcolor: '#fff',
        height: 400
    };
    
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    Plotly.newPlot(chartContainer, [trace1, trace2], layout, config);
}

// Modal Functions
function showTargetsModal() {
    const targets = dataManager.getTargets();
    document.getElementById('weeklyTargetHours').value = targets.weekly.hours || 0;
    document.getElementById('weeklyTargetDays').value = targets.weekly.days || 0;
    document.getElementById('monthlyTargetHours').value = targets.monthly.hours || 0;
    document.getElementById('monthlyTargetDays').value = targets.monthly.days || 0;
    
    document.getElementById('targetsModal').classList.add('show');
}

function closeTargetsModal() {
    document.getElementById('targetsModal').classList.remove('show');
}

function handleTargetsSubmit(e) {
    e.preventDefault();
    
    const targets = {
        weekly: {
            hours: parseFloat(document.getElementById('weeklyTargetHours').value) || 0,
            days: parseInt(document.getElementById('weeklyTargetDays').value) || 0
        },
        monthly: {
            hours: parseFloat(document.getElementById('monthlyTargetHours').value) || 0,
            days: parseInt(document.getElementById('monthlyTargetDays').value) || 0
        }
    };
    
    dataManager.setTargets(targets);
    updateTargetsDisplay();
    renderTargetHistory();
    closeTargetsModal();
    showNotification('Targets updated successfully!');
}

function showMilestoneModal() {
    const subjects = dataManager.getSubjects();
    const select = document.getElementById('milestoneSubject');
    
    select.innerHTML = '<option value="">Select Subject</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.id;
        option.textContent = subject.name;
        select.appendChild(option);
    });
    
    document.getElementById('milestoneDate').value = new Date().toISOString().split('T')[0];
    document.getElementById('milestoneModal').classList.add('show');
}

function closeMilestoneModal() {
    document.getElementById('milestoneModal').classList.remove('show');
    document.getElementById('milestoneForm').reset();
}

function handleMilestoneSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const milestone = {
        title: formData.get('milestoneTitle'),
        targetDate: formData.get('milestoneDate'),
        targetProgress: parseFloat(formData.get('milestoneProgress')) || 0,
        description: formData.get('milestoneDescription'),
        createdAt: new Date().toISOString()
    };
    
    const subjectId = formData.get('milestoneSubject');
    dataManager.setMilestone(subjectId, milestone);
    
    loadMilestones();
    closeMilestoneModal();
    showNotification('Milestone added successfully!');
}

function editMilestone(subjectId) {
    const milestones = dataManager.getMilestones();
    const milestone = milestones[subjectId];
    const subjects = dataManager.getSubjects();
    const subject = subjects.find(s => s.id.toString() === subjectId);
    
    if (!milestone || !subject) return;
    
    // Populate form with existing data
    document.getElementById('milestoneSubject').value = subjectId;
    document.getElementById('milestoneTitle').value = milestone.title;
    document.getElementById('milestoneDate').value = milestone.targetDate;
    document.getElementById('milestoneProgress').value = milestone.targetProgress;
    document.getElementById('milestoneDescription').value = milestone.description || '';
    
    // Change form action to update
    const form = document.getElementById('milestoneForm');
    form.onsubmit = function(e) {
        e.preventDefault();
        updateMilestone(subjectId);
    };
    
    document.getElementById('milestoneModal').classList.add('show');
}

function updateMilestone(subjectId) {
    const formData = new FormData(document.getElementById('milestoneForm'));
    const milestone = {
        title: formData.get('milestoneTitle'),
        targetDate: formData.get('milestoneDate'),
        targetProgress: parseFloat(formData.get('milestoneProgress')) || 0,
        description: formData.get('milestoneDescription'),
        lastUpdated: new Date().toISOString()
    };
    
    dataManager.setMilestone(subjectId, milestone);
    
    loadMilestones();
    closeMilestoneModal();
    showNotification('Milestone updated successfully!');
}

function deleteMilestone(subjectId) {
    if (!confirm('Are you sure you want to delete this milestone?')) {
        return;
    }
    
    const milestones = dataManager.getMilestones();
    delete milestones[subjectId];
    
    const data = dataManager.getData();
    data.milestones = milestones;
    dataManager.saveData(data);
    
    loadMilestones();
    showNotification('Milestone deleted successfully!');
}

function formatDateDDMMYYYY(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #27ae60;
        color: white;
        padding: 12px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}
