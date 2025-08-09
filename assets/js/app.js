document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeDashboard();
    initializeDarkMode();
});

function initializeDashboard() {
    updateCountdown();
    updateStats();
    updateTargets();
    loadTodayEvents();
    loadRecentActivity();
    updateCurrentDate();
    
    // Update countdown every second
    setInterval(updateCountdown, 1000);
    
    // Listen for data updates
    setupEventListeners();
}

function setupEventListeners() {
    // Listen for storage updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'sageData') {
            setTimeout(() => {
                updateStats();
                updateTargets();
                loadTodayEvents();
                loadRecentActivity();
            }, 100);
        }
    });
    
    // Listen for custom data update events
    window.addEventListener('sageDataUpdated', function(e) {
        setTimeout(() => {
            updateStats();
            updateTargets();
            loadTodayEvents();
            loadRecentActivity();
        }, 100);
    });
    
    // Listen for calendar update events
    window.addEventListener('calendarUpdated', function() {
        setTimeout(() => {
            loadTodayEvents();
        }, 100);
    });
    
    // Also refresh when returning to the page
    window.addEventListener('focus', function() {
        if (document.visibilityState === 'visible') {
            updateStats();
            updateTargets();
            loadTodayEvents();
        }
    });
}

function initializeDarkMode() {
    const settings = dataManager.getSettings();
    if (settings.darkMode) {
        document.body.classList.add('dark-mode');
        updateDarkModeButton();
    }
}

function toggleDarkMode() {
    const body = document.body;
    const isDark = body.classList.contains('dark-mode');
    
    if (isDark) {
        body.classList.remove('dark-mode');
        dataManager.updateSettings({ darkMode: false });
    } else {
        body.classList.add('dark-mode');
        dataManager.updateSettings({ darkMode: true });
    }
    
    updateDarkModeButton();
}

function updateDarkModeButton() {
    const button = document.getElementById('darkModeToggle');
    const isDark = document.body.classList.contains('dark-mode');
    
    if (button) {
        button.checked = isDark;
    }
}

function updateCurrentDate() {
    const now = new Date();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = dayNames[now.getDay()];
    const dateString = formatDateDDMMYYYY(now.toISOString().split('T')[0]);
    
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
        dateElement.textContent = `${dayName}, ${dateString}`;
    }
}

function updateCountdown() {
    const examDateStr = dataManager.getData().examDate;
    if (!examDateStr) {
        document.getElementById('countdownTimer').innerHTML = '<div class="exam-day">🎯 Set your exam date in Settings!</div>';
        return;
    }
    
    const examDate = new Date(examDateStr);
    const now = new Date();
    const diff = examDate - now;
    
    if (diff <= 0) {
        document.getElementById('countdownTimer').innerHTML = '<div class="exam-day">🎯 Exam Day is Here!</div>';
        return;
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    // Update with smooth animation
    updateCountdownElement('days', days);
    updateCountdownElement('hours', hours);
    updateCountdownElement('minutes', minutes);
    
    // Add seconds display if it exists
    const secondsElement = document.getElementById('seconds');
    if (secondsElement) {
        updateCountdownElement('seconds', seconds);
    }
}

function updateCountdownElement(elementId, value) {
    const element = document.getElementById(elementId);
    if (element && element.textContent !== value.toString()) {
        element.style.transform = 'scale(1.1)';
        element.textContent = value;
        setTimeout(() => {
            element.style.transform = 'scale(1)';
        }, 150);
    }
}

function updateExamDate() {
    const newDate = document.getElementById('examDate').value;
    if (newDate) {
        const data = dataManager.getData();
        data.examDate = newDate;
        dataManager.saveData(data);
        updateCountdown();
        showNotification('Exam date updated successfully!');
    }
}

function updateStats() {
    // Study streak
    const streak = dataManager.calculateStudyStreak();
    const bestStreak = dataManager.calculateBestStreak();
    document.getElementById('studyStreak').textContent = streak;
    document.getElementById('bestStreak').textContent = `Best: ${bestStreak} days`;
    
    // Total hours this month
    const totalHours = dataManager.calculateTotalHours('month');
    document.getElementById('totalHours').textContent = totalHours.toFixed(1);
    
    // Overall progress
    const progress = dataManager.calculateOverallProgress();
    document.getElementById('overallProgress').textContent = progress + '%';
    
    // Active subjects
    const subjects = dataManager.getSubjects();
    const activeSubjects = subjects.filter(s => s.subtopics && s.subtopics.length > 0).length;
    document.getElementById('activeSubjects').textContent = activeSubjects;
}

function updateTargets() {
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
    document.getElementById('weeklyProgressFill').style.width = Math.min(weeklyProgressPercent, 100) + '%';
    
    // Update monthly targets
    document.getElementById('monthlyHours').textContent = monthlyHours.toFixed(1);
    document.getElementById('monthlyTarget').textContent = targets.monthly.hours || 0;
    document.getElementById('monthlyDays').textContent = monthlyDays;
    document.getElementById('monthlyTargetDays').textContent = targets.monthly.days || 0;
    
    const monthlyProgressPercent = targets.monthly.hours > 0 ? (monthlyHours / targets.monthly.hours) * 100 : 0;
    document.getElementById('monthlyProgressFill').style.width = Math.min(monthlyProgressPercent, 100) + '%';
}

// Function to update home page stats from other pages
function updateHomePageStats() {
    if (window.location.pathname.includes('home.html')) {
        updateStats();
        updateTargets();
    }
}

function loadTodayEvents() {
    const calendar = dataManager.getCalendarEvents();
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    
    // Filter events for today with proper date comparison
    const todayEvents = calendar.filter(event => {
        if (!event.date) return false;
        
        // Handle different date formats
        let eventDate;
        if (event.date.includes('T')) {
            // ISO string format
            eventDate = new Date(event.date);
        } else {
            // Date string format (YYYY-MM-DD)
            eventDate = new Date(event.date + 'T00:00:00');
        }
        
        const eventDateString = eventDate.toISOString().split('T')[0];
        return eventDateString === todayString;
    });
    
    const eventsContainer = document.getElementById('todayEvents');
    
    if (todayEvents.length === 0) {
        eventsContainer.innerHTML = '<div class="no-events">No events for today</div>';
        return;
    }
    
    const eventsHTML = todayEvents.map(event => `
        <div class="event-item">
            <div class="event-icon">${getEventIcon(event.type)}</div>
            <div class="event-content">
                <div class="event-title">${event.topic || event.title || 'Event'}</div>
                <div class="event-type">${event.type ? event.type.charAt(0).toUpperCase() + event.type.slice(1) : 'Event'}${event.subject ? ' - ' + event.subject : ''}</div>
                <div class="event-time">${formatDateDDMMYYYY(event.date)}</div>
            </div>
        </div>
    `).join('');
    
    eventsContainer.innerHTML = eventsHTML;
}

function getEventIcon(type) {
    const icons = {
        'study': '📚',
        'revision': '🔄',
        'test': '📝',
        'break': '☕',
        'default': '📅'
    };
    return icons[type] || icons.default;
}

function formatDateDDMMYYYY(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

let activityPage = 1;
const ACTIVITY_PAGE_SIZE = 5;

function loadRecentActivity() {
    const progress = dataManager.getDailyProgress();
    const start = 0;
    const end = Math.min(activityPage * ACTIVITY_PAGE_SIZE, progress.length);
    const recentProgress = progress.slice(start, end);
    const activityContainer = document.getElementById('recentActivity');
    
    if (recentProgress.length === 0) {
        activityContainer.innerHTML = '<div class="no-activity">Start tracking your daily progress!</div>';
        return;
    }
    
    const activityHTML = recentProgress.map(entry => `
        <div class="activity-item">
            <div class="activity-icon">📖</div>
            <div class="activity-content">
                <div class="activity-title">${entry.subject} - ${entry.type}</div>
                <div class="activity-details">
                    ${entry.hoursStudied}h on ${formatDateDDMMYYYY(entry.date)}
                </div>
            </div>
        </div>
    `).join('');
    
    let showMoreBtn = '';
    if (progress.length > end) {
        showMoreBtn = '<button class="btn btn-secondary" id="showMoreActivity">Show More</button>';
    }
    
    activityContainer.innerHTML = activityHTML + showMoreBtn;
    
    if (showMoreBtn) {
        document.getElementById('showMoreActivity').onclick = function() {
            activityPage++;
            loadRecentActivity();
        };
    }
}

// Targets Modal Functions
function showTargetsModal() {
    const targets = dataManager.getTargets();
    document.getElementById('weeklyTargetHours').value = targets.weekly.hours || 0;
    document.getElementById('weeklyTargetDays').value = targets.weekly.days || 0;
    document.getElementById('monthlyTargetHours').value = targets.monthly.hours || 0;
    document.getElementById('monthlyTargetDays').value = targets.monthly.days || 0;
    
    document.getElementById('targetsModal').classList.add('show');
    
    // Add form submit handler
    document.getElementById('targetsForm').onsubmit = handleTargetsSubmit;
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
    updateTargets();
    closeTargetsModal();
    showNotification('Targets updated successfully!');
}

function exportData() {
    dataManager.exportData();
    showNotification('Data exported successfully!');
}

function showNotification(message) {
    // Create a notification element
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
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

