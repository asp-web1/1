document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDailyProgress();
});

let editingId = null;

function initializeDailyProgress() {
    loadSubjects();
    loadProgressHistory();
    setupFormHandlers();
    setTodayDate();
    updateProgressStats();
}

function setTodayDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInput = document.getElementById('progressDate');
    if (dateInput) {
        dateInput.value = today;
    }
}

function loadSubjects() {
    const subjects = dataManager.getSubjects();
    const select = document.getElementById('subjectSelect');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Select a subject</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name;
        option.textContent = subject.name;
        select.appendChild(option);
    });
}

function setupFormHandlers() {
    const form = document.getElementById('progressForm');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        date: document.getElementById('progressDate').value,
        hoursStudied: parseFloat(document.getElementById('hoursStudied').value),
        subject: document.getElementById('subjectSelect').value,
        type: document.getElementById('studyType').value,
        remarks: document.getElementById('progressNotes').value,
        currentAffairs: document.getElementById('currentAffairs').checked
    };
    
    if (editingId) {
        dataManager.updateDailyProgress(editingId, formData);
        editingId = null;
    } else {
        dataManager.addDailyProgress(formData);
    }
    
    clearForm();
    loadProgressHistory();
    updateProgressStats();
    
    // Refresh statistics if statistics page is open
    if (typeof updateOverviewStats === 'function') {
        updateOverviewStats();
    }
    
    showNotification('Progress saved successfully!');
}

function formatDateDDMMYYYY(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

let progressHistoryPage = 1;
const PROGRESS_PAGE_SIZE = 10;

function loadProgressHistory() {
    const progress = dataManager.getDailyProgress();
    const historyContainer = document.getElementById('progressHistory');
    
    if (!historyContainer) return;
    
    if (progress.length === 0) {
        historyContainer.innerHTML = `
            <div class="empty-state enhanced">
                <div class="empty-icon">📝</div>
                <h4>No Progress Data Yet</h4>
                <p>Start tracking your daily study sessions to see your progress history.</p>
            </div>
        `;
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(progress.length / PROGRESS_PAGE_SIZE);
    const startIndex = (progressHistoryPage - 1) * PROGRESS_PAGE_SIZE;
    const endIndex = startIndex + PROGRESS_PAGE_SIZE;
    const pageProgress = progress.slice(startIndex, endIndex);
    
    // Create table structure
    const tableHTML = `
        <div class="progress-table-container">
            <table class="progress-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Hours</th>
                        <th>Subject</th>
                        <th>Type</th>
                        <th>CA</th>
                        <th>Remarks</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${pageProgress.map(entry => `
                        <tr class="progress-row">
                            <td class="date-cell">${formatDateDDMMYYYY(entry.date)}</td>
                            <td class="hours-cell">${entry.hoursStudied}h</td>
                            <td class="subject-cell">${entry.subject}</td>
                            <td class="type-cell">
                                <span class="study-type-badge type-${entry.type.toLowerCase()}">${entry.type}</span>
                            </td>
                            <td class="ca-cell">
                                ${entry.currentAffairs ? '<span class="ca-indicator active">✓</span>' : '<span class="ca-indicator">-</span>'}
                            </td>
                            <td class="remarks-cell">${entry.remarks || '-'}</td>
                            <td class="actions-cell">
                                <button class="btn-action btn-edit" onclick="editProgress(${entry.id})" title="Edit">
                                    <span class="action-icon">✏️</span>
                                </button>
                                <button class="btn-action btn-delete" onclick="deleteProgress(${entry.id})" title="Delete">
                                    <span class="action-icon">🗑️</span>
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    // Add pagination controls
    const paginationHTML = totalPages > 1 ? `
        <div class="pagination-controls">
            <button class="btn btn-sm btn-secondary" ${progressHistoryPage <= 1 ? 'disabled' : ''} 
                    onclick="changeProgressPage(${progressHistoryPage - 1})">Previous</button>
            <span class="pagination-info">Page ${progressHistoryPage} of ${totalPages} (${progress.length} total entries)</span>
            <button class="btn btn-sm btn-secondary" ${progressHistoryPage >= totalPages ? 'disabled' : ''} 
                    onclick="changeProgressPage(${progressHistoryPage + 1})">Next</button>
        </div>
    ` : '';
    
    historyContainer.innerHTML = tableHTML + paginationHTML;
}

function changeProgressPage(newPage) {
    progressHistoryPage = newPage;
    loadProgressHistory();
}

function editProgress(id) {
    const progress = dataManager.getDailyProgress();
    const entry = progress.find(p => p.id === id);
    if (!entry) return;
    
    // Populate form with entry data
    document.getElementById('progressDate').value = entry.date;
    document.getElementById('hoursStudied').value = entry.hoursStudied;
    document.getElementById('subjectSelect').value = entry.subject;
    document.getElementById('studyType').value = entry.type;
    document.getElementById('progressNotes').value = entry.remarks || '';
    document.getElementById('currentAffairs').checked = entry.currentAffairs || false;
    
    editingId = id;
    
    // Scroll to form
    document.getElementById('progressForm').scrollIntoView({ behavior: 'smooth' });
}

function deleteProgress(id) {
    if (!confirm('Are you sure you want to delete this progress entry?')) {
        return;
    }
    
    dataManager.deleteDailyProgress(id);
    loadProgressHistory();
    updateProgressStats();
    showNotification('Progress entry deleted successfully!');
}

function updateProgressStats() {
    const progress = dataManager.getDailyProgress();
    const today = new Date().toISOString().split('T')[0];
    
    // Calculate today's hours
    const todayHours = progress
        .filter(p => p.date === today)
        .reduce((sum, p) => sum + parseFloat(p.hoursStudied || 0), 0);
    
    // Calculate this week's hours
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekHours = progress
        .filter(p => new Date(p.date) >= weekStart)
        .reduce((sum, p) => sum + parseFloat(p.hoursStudied || 0), 0);
    
    // Calculate this month's hours
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthHours = progress
        .filter(p => new Date(p.date) >= monthStart)
        .reduce((sum, p) => sum + parseFloat(p.hoursStudied || 0), 0);
    
    // Calculate study streak
    const studyStreak = calculateStudyStreak(progress);
    
    // Update display
    const todayHoursEl = document.getElementById('todayHours');
    const weekHoursEl = document.getElementById('weekHours');
    const monthHoursEl = document.getElementById('monthHours');
    const studyStreakEl = document.getElementById('studyStreak');
    
    if (todayHoursEl) todayHoursEl.textContent = todayHours.toFixed(1);
    if (weekHoursEl) weekHoursEl.textContent = weekHours.toFixed(1);
    if (monthHoursEl) monthHoursEl.textContent = monthHours.toFixed(1);
    if (studyStreakEl) studyStreakEl.textContent = studyStreak;
}

function calculateStudyStreak(progress) {
    if (progress.length === 0) return 0;
    
    const today = new Date();
    let streak = 0;
    let currentDate = new Date(today);
    
    while (true) {
        const dateStr = currentDate.toISOString().split('T')[0];
        const hasStudyData = progress.some(p => p.date === dateStr);
        
        if (hasStudyData) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }
    
    return streak;
}

function clearForm() {
    const form = document.getElementById('progressForm');
    if (form) {
        form.reset();
        setTodayDate();
    }
}

function showNotification(message) {
    // Create a simple notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--success-color);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Function to show add progress modal (if needed)
function showAddProgressModal() {
    // This function can be used if you want to show a modal instead of inline form
    // For now, the form is inline, so this is not needed
}
