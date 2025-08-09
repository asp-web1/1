document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeSettings();
});

function initializeSettings() {
    loadCurrentSettings();
    updateSystemInfo();
    setupEventListeners();
}

function setupEventListeners() {
    // Listen for settings changes
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', function() {
            toggleDarkMode();
        });
    }
    
    // Listen for data updates
    window.addEventListener('storage', function(e) {
        if (e.key === 'sageData') {
            setTimeout(() => {
                updateSystemInfo();
            }, 100);
        }
    });
}

function loadCurrentSettings() {
    const settings = dataManager.getSettings();
    
    // Load dark mode setting
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        darkModeToggle.checked = settings.darkMode || false;
    }
    
    // Load exam date setting
    const examDateInput = document.getElementById('examDate');
    if (examDateInput) {
        const examDate = dataManager.getData().examDate || '2026-02-05T09:00';
        examDateInput.value = examDate;
    }
}

function toggleDarkMode() {
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (!darkModeToggle) return;
    
    const isDark = darkModeToggle.checked;
    const body = document.body;
    
    if (isDark) {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
    
    dataManager.updateSettings({ darkMode: isDark });
    showNotification('Dark mode ' + (isDark ? 'enabled' : 'disabled'));
}

function updateExamDate() {
    const examDateInput = document.getElementById('examDate');
    if (!examDateInput) return;
    
    const newDate = examDateInput.value;
    if (newDate) {
        const data = dataManager.getData();
        data.examDate = newDate;
        dataManager.saveData(data);
        showNotification('Exam date updated successfully!');
    }
}

function exportData() {
    try {
        dataManager.exportData();
        
        // Update last backup date
        const settings = dataManager.getSettings();
        settings.lastBackup = new Date().toLocaleDateString();
        dataManager.updateSettings(settings);
        
        updateSystemInfo();
        showNotification('Data exported successfully!');
    } catch (error) {
        showNotification('Error exporting data: ' + error.message, 'error');
    }
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showNotification('Please select a valid JSON file', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const jsonData = e.target.result;
            
            // Validate JSON format
            let parsedData;
            try {
                parsedData = JSON.parse(jsonData);
            } catch (parseError) {
                showNotification('Invalid JSON file format', 'error');
                return;
            }
            
            // Validate required fields
            if (!parsedData.dailyProgress || !Array.isArray(parsedData.dailyProgress)) {
                showNotification('Invalid data format: missing dailyProgress array', 'error');
                return;
            }
            
            if (!parsedData.subjects || !Array.isArray(parsedData.subjects)) {
                showNotification('Invalid data format: missing subjects array', 'error');
                return;
            }
            
            // Confirm before importing
            if (!confirm(`This will replace all your current data with the imported data. This action cannot be undone.\n\nImported data contains:\n- ${parsedData.dailyProgress.length} progress entries\n- ${parsedData.subjects.length} subjects\n\nContinue?`)) {
                return;
            }
            
            const success = dataManager.importData(jsonData);
            if (success) {
                showNotification('Data imported successfully!');
                updateSystemInfo();
                // Refresh the page to show imported data
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                showNotification('Failed to import data: Invalid format', 'error');
            }
        } catch (error) {
            showNotification('Error importing data: ' + error.message, 'error');
            console.error('Import error:', error);
        }
    };
    
    reader.onerror = function() {
        showNotification('Error reading file', 'error');
    };
    
    reader.readAsText(file);
    
    // Clear the file input for next use
    event.target.value = '';
}

function clearAllData() {
    if (!confirm('Are you sure you want to clear ALL data? This action cannot be undone.')) {
        return;
    }
    
    if (!confirm('This will permanently delete all your subjects, progress, targets, and settings. Continue?')) {
        return;
    }
    
    try {
        localStorage.clear();
        showNotification('All data cleared successfully!');
        setTimeout(() => {
            window.location.href = '/index.html';
        }, 1000);
    } catch (error) {
        showNotification('Error clearing data: ' + error.message, 'error');
    }
}

function saveSettings() {
    const settings = {
        darkMode: document.getElementById('darkModeToggle').checked
    };
    
    dataManager.updateSettings(settings);
    showNotification('Settings saved successfully!');
}

function resetSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults?')) {
        return;
    }
    
    // Reset to default settings
    const defaultSettings = {
        darkMode: false
    };
    
    dataManager.updateSettings(defaultSettings);
    loadCurrentSettings();
    showNotification('Settings reset to defaults!');
}

function updateSystemInfo() {
    const data = dataManager.getData();
    const progress = dataManager.getDailyProgress();
    const subjects = dataManager.getSubjects();
    
    // Calculate data statistics
    const dataSize = JSON.stringify(data).length;
    const dataSizeKB = Math.round(dataSize / 1024);
    
    // Update statistics cards
    document.getElementById('totalEntries').textContent = progress.length;
    document.getElementById('daysTracked').textContent = progress.filter(p => parseFloat(p.hoursStudied) > 0).length;
    document.getElementById('storageUsed').textContent = dataSizeKB + ' KB';
    
    // Set last backup info
    const settings = dataManager.getSettings();
    const lastBackupDate = settings.lastBackup || 'Never';
    document.getElementById('lastBackup').textContent = lastBackupDate;
    
    // Update system information
    const browserInfo = document.getElementById('browserInfo');
    if (browserInfo) {
        browserInfo.textContent = navigator.userAgent.split(' ').slice(-2).join(' ');
    }
    
    const accountCreated = document.getElementById('accountCreated');
    if (accountCreated) {
        const createdAt = settings.createdAt || 'Unknown';
        if (createdAt !== 'Unknown') {
            accountCreated.textContent = new Date(createdAt).toLocaleDateString();
        } else {
            accountCreated.textContent = createdAt;
        }
    }
}

function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${type === 'error' ? '#e74c3c' : '#27ae60'};
        color: white;
        border-radius: 5px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
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
