class ExamDataManager {
    constructor() {
        this.initializeStorage();
        this.setupStorageOptimization();
    }
    
    initializeStorage() {
        const defaultData = {
            examDate: '2026-02-05T09:00:00',
            dailyProgress: [],
            subjects: [],
            calendar: [],
            targets: {
                weekly: { hours: 0, days: 0 },
                monthly: { hours: 0, days: 0 }
            },
            milestones: {},
            analytics: {
                learningCurves: {},
                efficiencyMetrics: {},
                studyPatterns: {},
                examReadiness: {}
            },
            settings: {
                createdAt: new Date().toISOString(),
                darkMode: false,
                dataVersion: '2.0'
            }
        };
        
        if (!localStorage.getItem('sageData')) {
            localStorage.setItem('sageData', JSON.stringify(defaultData));
        } else {
            // Migrate old data if needed
            this.migrateOldData();
        }
    }
    
    migrateOldData() {
        const oldData = localStorage.getItem('aspExamData');
        if (oldData) {
            try {
                const parsed = JSON.parse(oldData);
                const newData = {
                    examDate: parsed.examDate || '2026-02-05T09:00:00',
                    dailyProgress: parsed.dailyProgress || [],
                    subjects: parsed.subjects || [],
                    calendar: parsed.calendar || [],
                    targets: {
                        weekly: { hours: 0, days: 0 },
                        monthly: { hours: 0, days: 0 }
                    },
                    milestones: {},
                    analytics: {
                        learningCurves: {},
                        efficiencyMetrics: {},
                        studyPatterns: {},
                        examReadiness: {}
                    },
                    settings: {
                        createdAt: parsed.settings?.createdAt || new Date().toISOString(),
                        darkMode: false,
                        dataVersion: '2.0'
                    }
                };
                localStorage.setItem('sageData', JSON.stringify(newData));
                localStorage.removeItem('aspExamData');
            } catch (e) {
                console.error('Data migration failed:', e);
            }
        }
    }
    
    setupStorageOptimization() {
        // Optimize for large datasets - increased limits for scalability
        this.maxSubjects = 50;
        this.maxSubtopicsPerSubject = 20; // Reduced from 30 to match requirements
        this.maxDailyEntries = 400; // Match requirements for 400+ days
        this.chunkSize = 50; // Reduced chunk size for better performance
        
        // Add indexing for faster lookups
        this.subjectIndex = new Map();
        this.subtopicIndex = new Map();
        
        // Performance monitoring
        this.performanceMetrics = {
            renderTime: 0,
            dataSize: 0,
            lastOptimization: Date.now()
        };
    }
    
    getData() {
        try {
            const data = localStorage.getItem('sageData');
            return data ? JSON.parse(data) : {};
        } catch (e) {
            console.error('Error reading data:', e);
            return {};
        }
    }
    
    saveData(data) {
        try {
            // Validate data size before saving
            const dataSize = JSON.stringify(data).length;
            const maxSize = 5 * 1024 * 1024; // 5MB limit
            
            if (dataSize > maxSize) {
                this.cleanupOldData(data);
            }
            
            localStorage.setItem('sageData', JSON.stringify(data));
            
            // Notify other tabs/pages about data change
            window.dispatchEvent(new StorageEvent('storage', {
                key: 'sageData',
                newValue: JSON.stringify(data)
            }));
            
            // Trigger custom event for real-time updates
            window.dispatchEvent(new CustomEvent('sageDataUpdated', { detail: data }));
            
        } catch (e) {
            console.error('Error saving data:', e);
            this.handleStorageError(e);
        }
    }
    
    cleanupOldData(data) {
        // Remove old daily progress entries beyond 400 days
        if (data.dailyProgress && data.dailyProgress.length > this.maxDailyEntries) {
            data.dailyProgress = data.dailyProgress
                .sort((a, b) => new Date(b.date) - new Date(a.date))
                .slice(0, this.maxDailyEntries);
        }
        
        // Remove old calendar events beyond 1 year
        if (data.calendar && data.calendar.length > 365) {
            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            data.calendar = data.calendar.filter(event => 
                new Date(event.date) > oneYearAgo
            );
        }
    }
    
    handleStorageError(error) {
        console.error('Storage error:', error);
        // Try to recover by clearing some old data
        const data = this.getData();
        this.cleanupOldData(data);
        this.saveData(data);
    }
    
    // Daily Progress CRUD with optimization
    addDailyProgress(entry) {
        const data = this.getData();
        data.dailyProgress = data.dailyProgress || [];
        
        // Check if entry for same date already exists
        const existingIndex = data.dailyProgress.findIndex(e => e.date === entry.date);
        
        if (existingIndex !== -1) {
            // Update existing entry
            data.dailyProgress[existingIndex] = {
                ...data.dailyProgress[existingIndex],
                ...entry,
                lastUpdated: new Date().toISOString()
            };
        } else {
            // Add new entry
            data.dailyProgress.push({
                ...entry,
                id: Date.now() + Math.random(),
                timestamp: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }
        
        this.saveData(data);
        this.updateAnalytics(entry);
    }
    
    updateDailyProgress(id, entry) {
        const data = this.getData();
        const index = data.dailyProgress.findIndex(item => item.id === id);
        if (index !== -1) {
            data.dailyProgress[index] = { 
                ...data.dailyProgress[index], 
                ...entry,
                lastUpdated: new Date().toISOString()
            };
            this.saveData(data);
            this.updateAnalytics(entry);
        }
    }
    
    deleteDailyProgress(id) {
        const data = this.getData();
        data.dailyProgress = data.dailyProgress.filter(item => item.id !== id);
        this.saveData(data);
    }
    
    getDailyProgress(limit = null) {
        const data = this.getData();
        let progress = (data.dailyProgress || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (limit) {
            progress = progress.slice(0, limit);
        }
        
        return progress;
    }
    
    // Subject CRUD with limits
    addSubject(subject) {
        const data = this.getData();
        data.subjects = data.subjects || [];
        
        if (data.subjects.length >= this.maxSubjects) {
            throw new Error(`Maximum ${this.maxSubjects} subjects allowed`);
        }
        
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000000);
        data.subjects.push({
            ...subject,
            id: uniqueId,
            subtopics: [],
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        this.saveData(data);
        return uniqueId;
    }
    
    updateSubject(id, subject) {
        const data = this.getData();
        const index = data.subjects.findIndex(item => item.id === id);
        if (index !== -1) {
            data.subjects[index] = { 
                ...data.subjects[index], 
                ...subject,
                lastUpdated: new Date().toISOString()
            };
            this.saveData(data);
        }
    }
    
    deleteSubject(id) {
        const data = this.getData();
        data.subjects = data.subjects.filter(item => item.id !== id);
        this.saveData(data);
    }
    
    getSubjects() {
        const data = this.getData();
        return data.subjects || [];
    }
    
    // Subtopic CRUD with limits
    addSubtopic(subjectId, subtopic) {
        const data = this.getData();
        // Ensure subjectId is a number for consistent comparison
        const targetSubjectId = parseInt(subjectId);
        const subject = data.subjects.find(s => parseInt(s.id) === targetSubjectId);
        
        if (!subject) {
            throw new Error(`Subject with ID ${subjectId} not found`);
        }
        
        subject.subtopics = subject.subtopics || [];
        
        if (subject.subtopics.length >= this.maxSubtopicsPerSubject) {
            throw new Error(`Maximum ${this.maxSubtopicsPerSubject} subtopics per subject allowed`);
        }
        
        const uniqueId = Date.now() + Math.floor(Math.random() * 1000000);
        const newSubtopic = {
            ...subtopic,
            id: uniqueId,
            lecture: false,
            theory: false,
            notes: false,
            testSeries: [false, false, false, false],
            pyq: false,
            workbook: false,
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        };
        
        subject.subtopics.push(newSubtopic);
        this.saveData(data);
        
        return uniqueId;
    }
    
    updateSubtopic(subjectId, subtopicId, updates) {
        const data = this.getData();
        const subject = data.subjects.find(s => s.id === subjectId);
        if (subject) {
            const subtopic = subject.subtopics.find(st => st.id === subtopicId);
            if (subtopic) {
                Object.assign(subtopic, updates, { lastUpdated: new Date().toISOString() });
                this.saveData(data);
            }
        }
    }
    
    deleteSubtopic(subtopicId) {
        const data = this.getData();
        for (const subject of data.subjects) {
            if (subject.subtopics) {
                const index = subject.subtopics.findIndex(st => st.id === subtopicId);
                if (index !== -1) {
                    subject.subtopics.splice(index, 1);
                    this.saveData(data);
                    return;
                }
            }
        }
    }
    
    updateSubtopicTask(subtopicId, taskType, completed, testIndex = null) {
        const data = this.getData();
        const targetSubtopicId = parseInt(subtopicId);
        
        for (const subject of data.subjects) {
            if (subject.subtopics) {
                const subtopic = subject.subtopics.find(st => parseInt(st.id) === targetSubtopicId);
                if (subtopic) {
                    if (taskType === 'testSeries') {
                        if (!subtopic.testSeries) {
                            subtopic.testSeries = [false, false, false, false];
                        }
                        if (testIndex !== null && testIndex >= 0 && testIndex < 4) {
                            subtopic.testSeries[testIndex] = completed;
                        }
                    } else {
                        subtopic[taskType] = completed;
                    }
                    subtopic.lastUpdated = new Date().toISOString();
                    this.saveData(data);
                    return;
                }
            }
        }
        
        console.warn(`Subtopic with ID ${subtopicId} not found`);
    }
    
    // Calendar CRUD
    addCalendarEvent(event) {
        const data = this.getData();
        data.calendar = data.calendar || [];
        data.calendar.push({
            ...event,
            id: Date.now() + Math.random(),
            createdAt: new Date().toISOString(),
            lastUpdated: new Date().toISOString()
        });
        this.saveData(data);
    }
    
    getCalendarEvents() {
        const data = this.getData();
        return data.calendar || [];
    }
    
    // Targets and Milestones
    setTargets(targets) {
        const data = this.getData();
        data.targets = { ...data.targets, ...targets };
        this.saveData(data);
    }
    
    getTargets() {
        const data = this.getData();
        return data.targets || { weekly: { hours: 0, days: 0 }, monthly: { hours: 0, days: 0 } };
    }
    
    setMilestone(subjectId, milestone) {
        const data = this.getData();
        data.milestones = data.milestones || {};
        data.milestones[subjectId] = milestone;
        this.saveData(data);
    }
    
    getMilestones() {
        const data = this.getData();
        return data.milestones || {};
    }
    
    // Analytics
    updateAnalytics(entry) {
        const data = this.getData();
        data.analytics = data.analytics || {};
        
        // Update learning curves
        if (!data.analytics.learningCurves[entry.subject]) {
            data.analytics.learningCurves[entry.subject] = [];
        }
        data.analytics.learningCurves[entry.subject].push({
            date: entry.date,
            hours: entry.hoursStudied,
            type: entry.type
        });
        
        // Update study patterns
        const hour = new Date().getHours();
        if (!data.analytics.studyPatterns[hour]) {
            data.analytics.studyPatterns[hour] = 0;
        }
        data.analytics.studyPatterns[hour] += entry.hoursStudied;
        
        this.saveData(data);
    }
    
    getAnalytics() {
        const data = this.getData();
        return data.analytics || {};
    }
    
    // Settings
    updateSettings(settings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...settings };
        this.saveData(data);
    }
    
    getSettings() {
        const data = this.getData();
        return data.settings || {};
    }
    
    // Statistics calculations with optimization
    calculateStudyStreak() {
        const data = this.getData();
        const progress = data.dailyProgress || [];
        
        if (progress.length === 0) return 0;
        
        // Sort progress by date (newest first) and filter out zero hours
        const sortedProgress = progress
            .filter(p => parseFloat(p.hoursStudied) > 0)
            .sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (sortedProgress.length === 0) return 0;
        
        let streak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayString = today.toISOString().split('T')[0];
        
        // Check if we have progress for today
        const hasTodayProgress = sortedProgress.some(p => p.date === todayString);
        
        // Start counting from today if we have progress, otherwise from yesterday
        let currentDate = new Date(today);
        if (!hasTodayProgress) {
            currentDate.setDate(today.getDate() - 1);
        }
        
        // Count consecutive days backwards
        for (let i = 0; i < 365; i++) { // Limit to 1 year to prevent infinite loop
            const checkDate = new Date(currentDate);
            checkDate.setDate(currentDate.getDate() - i);
            const dateString = checkDate.toISOString().split('T')[0];
            
            const hasProgress = sortedProgress.some(p => p.date === dateString);
            
            if (hasProgress) {
                streak++;
            } else {
                break; // Break the streak if we find a day without progress
            }
        }
        
        return streak;
    }
    
    calculateBestStreak() {
        const data = this.getData();
        const progress = data.dailyProgress || [];
        
        if (progress.length === 0) return 0;
        
        // Sort progress by date (oldest first)
        const sortedProgress = progress
            .filter(p => parseFloat(p.hoursStudied) > 0)
            .sort((a, b) => new Date(a.date) - new Date(b.date));
        
        if (sortedProgress.length === 0) return 0;
        
        let bestStreak = 0;
        let currentStreak = 0;
        let previousDate = null;
        
        for (let entry of sortedProgress) {
            const entryDate = new Date(entry.date);
            entryDate.setHours(0, 0, 0, 0);
            
            if (previousDate === null) {
                currentStreak = 1;
            } else {
                const dayDiff = Math.floor((entryDate - previousDate) / (1000 * 60 * 60 * 24));
                
                if (dayDiff === 1) {
                    // Consecutive day
                    currentStreak++;
                } else {
                    // Break in streak
                    bestStreak = Math.max(bestStreak, currentStreak);
                    currentStreak = 1;
                }
            }
            
            previousDate = entryDate;
        }
        
        // Check the last streak
        bestStreak = Math.max(bestStreak, currentStreak);
        
        return bestStreak;
    }
    
    calculateTotalHours(period = 'month') {
        const data = this.getData();
        const now = new Date();
        let startDate;
        
        switch (period) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return data.dailyProgress.reduce((total, entry) => 
                    total + (parseFloat(entry.hoursStudied) || 0), 0);
        }
        
        return data.dailyProgress
            .filter(entry => new Date(entry.date) >= startDate)
            .reduce((total, entry) => total + (parseFloat(entry.hoursStudied) || 0), 0);
    }
    
    calculateOverallProgress() {
        const data = this.getData();
        const subjects = data.subjects || [];
        
        if (subjects.length === 0) return 0;
        
        let totalProgress = 0;
        subjects.forEach(subject => {
            const subtopics = subject.subtopics || [];
            if (subtopics.length === 0) return;
            
            let subjectProgress = 0;
            subtopics.forEach(subtopic => {
                const completedTasks = [
                    subtopic.lecture,
                    subtopic.theory,
                    subtopic.notes,
                    ...subtopic.testSeries,
                    subtopic.pyq,
                    subtopic.workbook
                ].filter(Boolean).length;
                
                subjectProgress += completedTasks / 9;
            });
            
            totalProgress += subjectProgress / subtopics.length;
        });
        
        return Math.round((totalProgress / subjects.length) * 100);
    }
    
    // Performance optimization methods
    getChunkedData(type, page = 1, size = this.chunkSize) {
        const data = this.getData();
        const items = data[type] || [];
        const start = (page - 1) * size;
        const end = start + size;
        
        return {
            items: items.slice(start, end),
            total: items.length,
            page: page,
            totalPages: Math.ceil(items.length / size),
            hasMore: end < items.length
        };
    }
    
    // Optimize data structure for performance
    optimizeDataStructure() {
        const data = this.getData();
        
        // Remove empty subjects
        if (data.subjects) {
            data.subjects = data.subjects.filter(subject => 
                subject.name && subject.name.trim()
            );
        }
        
        // Remove orphaned subtopics
        if (data.subjects) {
            data.subjects.forEach(subject => {
                if (subject.subtopics) {
                    subject.subtopics = subject.subtopics.filter(subtopic => 
                        subtopic.name && subtopic.name.trim()
                    );
                }
            });
        }
        
        // Sort data for better performance
        if (data.dailyProgress) {
            data.dailyProgress.sort((a, b) => new Date(b.date) - new Date(a.date));
        }
        
        this.saveData(data);
        this.performanceMetrics.lastOptimization = Date.now();
    }
    
    // Get performance metrics
    getPerformanceMetrics() {
        const data = this.getData();
        this.performanceMetrics.dataSize = JSON.stringify(data).length;
        return this.performanceMetrics;
    }
    
    // Data export for backup
    exportData() {
        const data = this.getData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sage_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
    
    // Data import
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            if (data.examDate && data.dailyProgress && data.subjects) {
                this.saveData(data);
                return true;
            }
            return false;
        } catch (e) {
            console.error('Import failed:', e);
            return false;
        }
    }
}

const dataManager = new ExamDataManager();
