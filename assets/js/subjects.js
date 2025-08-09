document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeSubjects();
});

let editingSubjectId = null;
let currentSubjectId = null;
let openSubtopicId = null;

// Add global state to track open subtopics sections
let openSubtopicSections = new Set();

function initializeSubjects() {
    renderSubjectsList();
    setupModalHandlers();
    updateSubjectsOverview();
}

function setupModalHandlers() {
    // Subject modal handlers
    const addSubjectForm = document.getElementById('addSubjectForm');
    const addSubjectModal = document.getElementById('addSubjectModal');
    
    if (addSubjectForm) {
        addSubjectForm.addEventListener('submit', handleAddSubjectSubmit);
    }
    
    // Close modal when clicking outside
    if (addSubjectModal) {
        addSubjectModal.addEventListener('click', function(e) {
            if (e.target === addSubjectModal) {
                closeAddSubjectModal();
            }
        });
    }
    
    // Subtopic modal handlers
    const addSubtopicForm = document.getElementById('addSubtopicForm');
    const addSubtopicModal = document.getElementById('addSubtopicModal');
    
    if (addSubtopicForm) {
        addSubtopicForm.addEventListener('submit', handleAddSubtopicSubmit);
    }
    
    if (addSubtopicModal) {
        addSubtopicModal.addEventListener('click', function(e) {
            if (e.target === addSubtopicModal) {
                closeAddSubtopicModal();
            }
        });
    }
}

function updateSubjectsOverview() {
    const subjects = dataManager.getSubjects();
    const progress = dataManager.getDailyProgress();
    
    // Update overview statistics
    document.getElementById('totalSubjects').textContent = subjects.length;
    
    // Calculate average progress
    let totalProgress = 0;
    let totalTopics = 0;
    subjects.forEach(subject => {
        const subjectProgress = calculateSubjectProgress(subject);
        totalProgress += subjectProgress;
        totalTopics += subject.subtopics ? subject.subtopics.length : 0;
    });
    
    const avgProgress = subjects.length > 0 ? Math.round(totalProgress / subjects.length) : 0;
    document.getElementById('avgProgress').textContent = avgProgress + '%';
    document.getElementById('totalTopics').textContent = totalTopics;
    
    // Find most studied subject
    const subjectHours = {};
    progress.forEach(p => {
        if (p.subject) {
            subjectHours[p.subject] = (subjectHours[p.subject] || 0) + parseFloat(p.hoursStudied || 0);
        }
    });
    
    let mostStudied = '-';
    let maxHours = 0;
    Object.entries(subjectHours).forEach(([subject, hours]) => {
        if (hours > maxHours) {
            maxHours = hours;
            mostStudied = subject;
        }
    });
    
    document.getElementById('mostStudied').textContent = mostStudied;
}

function renderSubjectsList() {
    const startTime = performance.now();
    const subjects = dataManager.getSubjects();
    const subjectsList = document.getElementById('subjectsList');
    
    if (!subjectsList) return;
    
    if (subjects.length === 0) {
        subjectsList.innerHTML = `
            <div class="empty-state enhanced">
                <div class="empty-icon">📚</div>
                <h4>No Subjects Added Yet</h4>
                <p>Start by adding your first subject to begin tracking your study progress.</p>
                <div class="d-flex gap-3 justify-center mt-4">
                    <button class="btn btn-primary" onclick="showAddSubjectModal()">
                        <span>➕</span> Add First Subject
                    </button>
                    <button class="btn btn-secondary" onclick="addSampleData()">
                        <span>📊</span> Add Sample Data
                    </button>
                </div>
            </div>
        `;
        return;
    }
    
    // Performance optimization: Build HTML string efficiently
    const subjectsHTML = subjects.map(subject => {
        const progress = calculateSubjectProgress(subject);
        const subtopicsCount = subject.subtopics ? subject.subtopics.length : 0;
        const isSubtopicSectionOpen = openSubtopicSections.has(subject.id);
        
        return `
            <div class="subject-card" data-subject-id="${subject.id}">
                <div class="subject-header">
                    <div class="subject-title">
                        <h4>${subject.name}</h4>
                        <div class="subject-meta">${subtopicsCount} subtopics</div>
                    </div>
                    <div class="subject-actions">
                        <button class="btn btn-sm btn-primary" onclick="editSubject(${subject.id})">
                            <span>✏️</span> Edit
                        </button>
                        <button class="btn btn-sm btn-error" onclick="deleteSubject(${subject.id})">
                            <span>🗑️</span> Delete
                        </button>
                    </div>
                </div>
                <div class="subject-description">
                    ${subject.description || 'No description provided'}
                </div>
                <div class="subject-progress">
                    <div class="progress-info">
                        <span class="current-progress">${progress}%</span>
                        <span class="target-progress">Complete</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="subject-subtopics">
                    <div class="subtopics-header">
                        <h5>Subtopics (${subtopicsCount})</h5>
                        <div class="subtopics-actions">
                            <button class="btn btn-sm btn-secondary" onclick="showAddSubtopicModal(${subject.id})">
                                <span>➕</span> Add Subtopic
                            </button>
                            <button class="btn btn-xs btn-secondary subtopics-toggle" id="toggle-btn-${subject.id}" onclick="toggleSubtopics(${subject.id})">
                                ${isSubtopicSectionOpen ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>
                    <div class="subtopics-list" id="subtopics-${subject.id}" style="display: ${isSubtopicSectionOpen ? 'block' : 'none'};">
                        ${renderSubtopicsList(subject.subtopics || [], subject.id)}
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    subjectsList.innerHTML = subjectsHTML;
    
    // Log performance metrics
    const renderTime = performance.now() - startTime;
    if (subjects.length > 10) {
        console.log(`Rendered ${subjects.length} subjects in ${renderTime.toFixed(2)}ms`);
    }
}

function formatDateDDMMYYYY(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function renderSubtopicsList(subtopics, subjectId) {
    if (subtopics.length === 0) {
        return '<p class="no-subtopics">No subtopics added yet.</p>';
    }
    
    return `
        <div class="subtopics-container">
            <div class="subtopics-grid">
                ${subtopics.map(subtopic => {
                    const isOpen = openSubtopicId === subtopic.id;
                    const completedTasks = [
                        subtopic.lecture,
                        subtopic.theory,
                        subtopic.notes,
                        ...(subtopic.testSeries || []),
                        subtopic.pyq,
                        subtopic.workbook
                    ].filter(Boolean).length;
                    
                    return `
                        <div class="subtopic-card">
                            <div class="subtopic-header" onclick="toggleSubtopicDetail(${subtopic.id})">
                                <div class="subtopic-title">
                                    <span class="subtopic-name">${subtopic.name}</span>
                                    <span class="subtopic-progress-badge">${completedTasks}/9</span>
                                </div>
                                <div class="subtopic-toggle">
                                    <span class="toggle-icon">${isOpen ? '▼' : '▶'}</span>
                                </div>
                            </div>
                            <div class="subtopic-content" style="display: ${isOpen ? 'block' : 'none'};">
                                <div class="subtopic-description">${subtopic.description || 'No description'}</div>
                                <div class="subtopic-tasks">
                                    <div class="task-grid">
                                        <label class="task-item ${subtopic.lecture ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.lecture ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'lecture', this.checked)">
                                            <span>Lecture</span>
                                        </label>
                                        <label class="task-item ${subtopic.theory ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.theory ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'theory', this.checked)">
                                            <span>Theory</span>
                                        </label>
                                        <label class="task-item ${subtopic.notes ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.notes ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'notes', this.checked)">
                                            <span>Notes</span>
                                        </label>
                                        <label class="task-item ${subtopic.workbook ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.workbook ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'workbook', this.checked)">
                                            <span>Workbook</span>
                                        </label>
                                        <label class="task-item ${subtopic.pyq ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.pyq ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'pyq', this.checked)">
                                            <span>PYQ</span>
                                        </label>
                                        <label class="task-item ${subtopic.testSeries && subtopic.testSeries[0] ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.testSeries && subtopic.testSeries[0] ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'testSeries', this.checked, 0)">
                                            <span>Test 1</span>
                                        </label>
                                        <label class="task-item ${subtopic.testSeries && subtopic.testSeries[1] ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.testSeries && subtopic.testSeries[1] ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'testSeries', this.checked, 1)">
                                            <span>Test 2</span>
                                        </label>
                                        <label class="task-item ${subtopic.testSeries && subtopic.testSeries[2] ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.testSeries && subtopic.testSeries[2] ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'testSeries', this.checked, 2)">
                                            <span>Test 3</span>
                                        </label>
                                        <label class="task-item ${subtopic.testSeries && subtopic.testSeries[3] ? 'completed' : ''}">
                                            <input type="checkbox" ${subtopic.testSeries && subtopic.testSeries[3] ? 'checked' : ''} 
                                                   onchange="updateSubtopicTask(${subtopic.id}, 'testSeries', this.checked, 3)">
                                            <span>Test 4</span>
                                        </label>
                                    </div>
                                </div>
                                <div class="subtopic-date">Added: ${formatDateDDMMYYYY(subtopic.createdAt)}</div>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
}

function toggleSubtopicDetail(subtopicId) {
    if (openSubtopicId === subtopicId) {
        openSubtopicId = null;
    } else {
        openSubtopicId = subtopicId;
    }
    
    // Store current scroll position
    const currentScroll = window.scrollY;
    
    renderSubjectsList();
    
    // Restore scroll position to prevent auto-scrolling to top
    window.scrollTo(0, currentScroll);
}

// Subject Modal Functions
function showAddSubjectModal() {
    editingSubjectId = null;
    const modal = document.getElementById('addSubjectModal');
    const form = document.getElementById('addSubjectForm');
    
    if (form) {
        form.reset();
    }
    
    if (modal) {
        modal.classList.add('show');
    }
}

function editSubject(subjectId) {
    const subjects = dataManager.getSubjects();
    const subject = subjects.find(s => s.id === subjectId);
    if (!subject) return;
    
    editingSubjectId = subjectId;
    
    // For now, we'll just show the add modal and populate it
    // In a full implementation, you'd want a separate edit modal
    const modal = document.getElementById('addSubjectModal');
    const nameInput = document.getElementById('subjectName');
    const descInput = document.getElementById('subjectDescription');
    
    if (nameInput) nameInput.value = subject.name;
    if (descInput) descInput.value = subject.description || '';
    
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAddSubjectModal() {
    const modal = document.getElementById('addSubjectModal');
    if (modal) {
        modal.classList.remove('show');
    }
    editingSubjectId = null;
}

function handleAddSubjectSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('subjectName');
    const descInput = document.getElementById('subjectDescription');
    
    if (!nameInput || !descInput) return;
    
    const subjectData = {
        name: nameInput.value.trim(),
        description: descInput.value.trim()
    };
    
    if (!subjectData.name) {
        showNotification('Please enter a subject name');
        return;
    }
    
    if (editingSubjectId) {
        // Update existing subject
        dataManager.updateSubject(editingSubjectId, subjectData);
        showNotification('Subject updated successfully!');
    } else {
        // Add new subject
        dataManager.addSubject(subjectData);
        showNotification('Subject added successfully!');
    }
    
    closeAddSubjectModal();
    renderSubjectsList();
    updateSubjectsOverview();
}

function deleteSubject(subjectId) {
    if (!confirm('Are you sure you want to delete this subject? This will also delete all its subtopics.')) {
        return;
    }
    
    dataManager.deleteSubject(subjectId);
    renderSubjectsList();
    updateSubjectsOverview();
    showNotification('Subject deleted successfully!');
}

// Subtopic Modal Functions
function showAddSubtopicModal(subjectId) {
    currentSubjectId = subjectId;
    const modal = document.getElementById('addSubtopicModal');
    const form = document.getElementById('addSubtopicForm');
    const subjectSelect = document.getElementById('subtopicSubject');
    
    if (form) {
        form.reset();
    }
    
    // Populate subject select
    if (subjectSelect) {
        const subjects = dataManager.getSubjects();
        subjectSelect.innerHTML = '<option value="">Select subject</option>';
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject.id;
            option.textContent = subject.name;
            if (subject.id === subjectId) {
                option.selected = true;
            }
            subjectSelect.appendChild(option);
        });
    }
    
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAddSubtopicModal() {
    const modal = document.getElementById('addSubtopicModal');
    if (modal) {
        modal.classList.remove('show');
    }
    currentSubjectId = null;
}

function handleAddSubtopicSubmit(e) {
    e.preventDefault();
    
    const nameInput = document.getElementById('subtopicName');
    const descInput = document.getElementById('subtopicDescription');
    const subjectSelect = document.getElementById('subtopicSubject');
    
    if (!nameInput || !subjectSelect) return;
    
    const subtopicData = {
        name: nameInput.value.trim(),
        description: descInput ? descInput.value.trim() : ''
    };
    
    // Convert subjectId to number to ensure consistency
    let subjectId = subjectSelect.value || currentSubjectId;
    if (subjectId) {
        subjectId = parseInt(subjectId);
    }
    
    if (!subtopicData.name) {
        showNotification('Please enter a subtopic name');
        return;
    }
    
    if (!subjectId) {
        showNotification('Please select a subject');
        return;
    }
    
    try {
        // Add subtopic to the selected subject
        dataManager.addSubtopic(subjectId, subtopicData);
        
        // Close modal and refresh the list
        closeAddSubtopicModal();
        
        // Ensure the subtopics section is open for the current subject
        openSubtopicSections.add(subjectId);
        
        // Render the subjects list to show the new subtopic
        renderSubjectsList();
        updateSubjectsOverview();
        
        showNotification('Subtopic added successfully!');
    } catch (error) {
        showNotification('Error adding subtopic: ' + error.message);
        console.error('Error adding subtopic:', error);
    }
}

function updateSubtopicTask(subtopicId, taskType, completed, testIndex = null) {
    // Store current open states before updating
    const currentOpenStates = new Set(openSubtopicSections);
    
    dataManager.updateSubtopicTask(subtopicId, taskType, completed, testIndex);
    
    // Restore open states after rendering
    renderSubjectsList();
    updateSubjectsOverview();
    
    // Restore the open states
    currentOpenStates.forEach(subjectId => {
        const subtopicsDiv = document.getElementById(`subtopics-${subjectId}`);
        const toggleBtn = document.getElementById(`toggle-btn-${subjectId}`);
        if (subtopicsDiv && toggleBtn) {
            subtopicsDiv.style.display = 'block';
            toggleBtn.textContent = 'Hide';
            openSubtopicSections.add(subjectId);
        }
    });
    
    // Update home page stats if available
    if (typeof updateHomePageStats === 'function') {
        updateHomePageStats();
    }
    
    // Update home page reminders and activity if available
    if (typeof loadReminders === 'function' && window.location.pathname.includes('home.html')) {
        loadReminders();
    }
    if (typeof loadRecentActivity === 'function' && window.location.pathname.includes('home.html')) {
        loadRecentActivity();
    }
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

function toggleSubtopics(subjectId) {
    const subtopicsDiv = document.getElementById(`subtopics-${subjectId}`);
    const toggleBtn = document.getElementById(`toggle-btn-${subjectId}`);
    if (!subtopicsDiv || !toggleBtn) return;
    
    if (subtopicsDiv.style.display === 'none') {
        subtopicsDiv.style.display = 'block';
        toggleBtn.textContent = 'Hide';
        openSubtopicSections.add(subjectId);
    } else {
        subtopicsDiv.style.display = 'none';
        toggleBtn.textContent = 'Show';
        openSubtopicSections.delete(subjectId);
    }
}

// Add sample data function for development/testing
function addSampleData() {
    // Add sample subjects
    const subject1Id = dataManager.addSubject({ 
        name: "Electrical Machines", 
        description: "Study of electrical machines and their applications" 
    });
    const subject2Id = dataManager.addSubject({ 
        name: "Power Systems", 
        description: "Power generation, transmission and distribution" 
    });
    const subject3Id = dataManager.addSubject({ 
        name: "Control Systems", 
        description: "Automatic control theory and applications" 
    });
    
    // Add sample subtopics
    dataManager.addSubtopic(subject1Id, { 
        name: "DC Motors", 
        description: "Direct current motor principles and applications" 
    });
    dataManager.addSubtopic(subject1Id, { 
        name: "AC Motors", 
        description: "Alternating current motor types and characteristics" 
    });
    dataManager.addSubtopic(subject1Id, { 
        name: "Transformers", 
        description: "Transformer theory and applications" 
    });
    
    dataManager.addSubtopic(subject2Id, { 
        name: "Power Generation", 
        description: "Methods of electrical power generation" 
    });
    dataManager.addSubtopic(subject2Id, { 
        name: "Transmission Lines", 
        description: "Power transmission line analysis" 
    });
    dataManager.addSubtopic(subject2Id, { 
        name: "Distribution Systems", 
        description: "Power distribution network design" 
    });
    
    dataManager.addSubtopic(subject3Id, { 
        name: "System Modeling", 
        description: "Mathematical modeling of control systems" 
    });
    dataManager.addSubtopic(subject3Id, { 
        name: "Transfer Functions", 
        description: "Transfer function analysis" 
    });
    dataManager.addSubtopic(subject3Id, { 
        name: "Stability Analysis", 
        description: "System stability criteria and analysis" 
    });
    
    // Add sample daily progress (last 10 days)
    const today = new Date();
    for (let i = 0; i < 10; i++) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateString = date.toISOString().split('T')[0];
        
        // Skip some days to create realistic pattern
        if (i % 3 !== 0) { // Study every other day
            dataManager.addDailyProgress({
                date: dateString,
                hoursStudied: (Math.random() * 4 + 2).toFixed(1), // 2-6 hours
                subject: ["Electrical Machines", "Power Systems", "Control Systems"][i % 3],
                type: ["theory", "lecture", "numerical", "notes", "revision"][i % 5],
                currentAffairs: i % 2 === 0,
                remarks: `Sample study session ${i + 1}`
            });
        }
    }
    
    renderSubjectsList();
    updateSubjectsOverview();
    showNotification('Sample data added successfully! You can now test all features.');
}
