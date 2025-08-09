document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    initializeCalendar();
});

let currentDate = new Date();
let selectedDate = null;

function initializeCalendar() {
    loadSubjectsForCalendar();
    renderCalendar();
    setupEventListeners();
    updateCalendarStats();
}

function loadSubjectsForCalendar() {
    const subjects = dataManager.getSubjects();
    const select = document.getElementById('eventSubject');
    
    if (!select) return;
    
    select.innerHTML = '<option value="">Select subject</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name;
        option.textContent = subject.name;
        select.appendChild(option);
    });
}

function setupEventListeners() {
    const eventForm = document.getElementById('addEventForm');
    const eventType = document.getElementById('eventType');
    
    if (eventForm) {
        eventForm.addEventListener('submit', handleEventSubmit);
    }
    
    if (eventType) {
        eventType.addEventListener('change', handleEventTypeChange);
    }
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Update title
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const currentMonthEl = document.getElementById('currentMonth');
    if (currentMonthEl) {
        currentMonthEl.textContent = `${monthNames[month]} ${year}`;
    }
    
    // Get first day of month and number of days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    // Get events for this month
    const events = dataManager.getCalendarEvents();
    const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate.getMonth() === month && eventDate.getFullYear() === year;
    });
    
    let calendarHTML = '';
    
    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach(day => {
        calendarHTML += `<div class="calendar-day-header">${day}</div>`;
    });
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < startingDay; i++) {
        calendarHTML += '<div class="calendar-day other-month"></div>';
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateString = date.toISOString().split('T')[0];
        const dayEvents = monthEvents.filter(event => event.date === dateString);
        
        const isToday = date.toDateString() === new Date().toDateString();
        const hasEvents = dayEvents.length > 0;
        
        let dayClasses = 'calendar-day';
        if (isToday) dayClasses += ' today';
        if (hasEvents) dayClasses += ' has-event';
        
        calendarHTML += `
            <div class="${dayClasses}" onclick="selectDate('${dateString}')">
                <div class="calendar-day-header">${day}</div>
                <div class="calendar-events">
                    ${dayEvents.map(event => `
                        <div class="calendar-event ${event.type}" title="${event.topic}">
                            ${event.topic.substring(0, 15)}${event.topic.length > 15 ? '...' : ''}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    const calendarContainer = document.getElementById('calendarContainer');
    if (calendarContainer) {
        calendarContainer.innerHTML = `
            <div class="calendar-grid">
                ${calendarHTML}
            </div>
        `;
    }
    
    // Update upcoming events
    loadUpcomingEvents();
}

function updateCalendarStats() {
    const events = dataManager.getCalendarEvents();
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    // This month's events
    const monthEvents = events.filter(event => {
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate.getMonth() === currentMonth && eventDate.getFullYear() === currentYear;
    });
    
    // Study events
    const studyEvents = events.filter(event => event.type === 'study');
    
    // Revision events
    const revisionEvents = events.filter(event => event.type === 'revision');
    
    // Today's events
    const todayEvents = events.filter(event => event.date === today);
    
    // Update display
    const monthEventsEl = document.getElementById('monthEvents');
    const studyEventsEl = document.getElementById('studyEvents');
    const revisionEventsEl = document.getElementById('revisionEvents');
    const todayEventsEl = document.getElementById('todayEvents');
    
    if (monthEventsEl) monthEventsEl.textContent = monthEvents.length;
    if (studyEventsEl) studyEventsEl.textContent = studyEvents.length;
    if (revisionEventsEl) revisionEventsEl.textContent = revisionEvents.length;
    if (todayEventsEl) todayEventsEl.textContent = todayEvents.length;
}

function loadUpcomingEvents() {
    const events = dataManager.getCalendarEvents();
    const upcomingContainer = document.getElementById('upcomingEvents');
    
    if (!upcomingContainer) return;
    
    // Get upcoming events (next 30 days, sorted by date)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const upcoming = events.filter(event => {
        if (!event.date) return false;
        const eventDate = new Date(event.date + 'T00:00:00');
        return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 10);
    
    if (upcoming.length === 0) {
        upcomingContainer.innerHTML = `
            <div class="empty-state enhanced">
                <div class="empty-icon">📅</div>
                <h4>No Upcoming Events</h4>
                <p>Schedule your study sessions and events to see them here.</p>
                <button class="btn btn-primary" onclick="showAddEventModal()">
                    <span>➕</span> Add Event
                </button>
            </div>
        `;
        return;
    }
    
    // Create table layout similar to recent progress history
    const tableHTML = `
        <div class="table-responsive">
            <table class="progress-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Event</th>
                        <th>Type</th>
                        <th>Subject</th>
                        <th>Time</th>
                        <th>Description</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${upcoming.map(event => {
                        const eventDate = new Date(event.date + 'T00:00:00');
                        const diffTime = eventDate - today;
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        
                        let timeText = '';
                        if (diffDays === 0) {
                            timeText = 'Today';
                        } else if (diffDays === 1) {
                            timeText = 'Tomorrow';
                        } else {
                            timeText = `${diffDays}d`;
                        }
                        
                        return `
                            <tr class="progress-row">
                                <td class="date-cell">
                                    <div class="date-info">
                                        <div class="date-primary">${formatDateDDMMYYYY(event.date)}</div>
                                        <div class="date-secondary">${timeText}</div>
                                    </div>
                                </td>
                                <td class="event-cell">
                                    <strong>${event.topic || 'Untitled Event'}</strong>
                                </td>
                                <td class="type-cell">
                                    <span class="type-badge ${event.type}">${event.type}</span>
                                </td>
                                <td class="subject-cell">
                                    ${event.subject || '-'}
                                </td>
                                <td class="time-cell">
                                    ${event.time || '-'}
                                </td>
                                <td class="description-cell">
                                    ${event.description || '-'}
                                </td>
                                <td class="actions-cell">
                                    <button class="btn-action edit-btn" onclick="editEvent(${event.id})" title="Edit Event">
                                        <span>✏️</span>
                                    </button>
                                    <button class="btn-action delete-btn" onclick="deleteEvent(${event.id})" title="Delete Event">
                                        <span>🗑️</span>
                                    </button>
                                </td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
    
    upcomingContainer.innerHTML = tableHTML;
}

function formatDateDDMMYYYY(dateStr) {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
    updateCalendarStats();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
    updateCalendarStats();
}

function selectDate(dateString) {
    selectedDate = dateString;
    showAddEventModal();
}

function showAddEventModal() {
    const modal = document.getElementById('addEventModal');
    const form = document.getElementById('addEventForm');
    const dateInput = document.getElementById('eventDate');
    
    if (form) {
        form.reset();
    }
    
    if (dateInput && selectedDate) {
        dateInput.value = selectedDate;
    }
    
    if (modal) {
        modal.classList.add('show');
    }
}

function closeAddEventModal() {
    const modal = document.getElementById('addEventModal');
    if (modal) {
        modal.classList.remove('show');
    }
    selectedDate = null;
}

function handleEventTypeChange() {
    // The spaced repetition is now handled by a separate checkbox
    // This function can be used for other event type specific logic if needed
}

function handleSpacedRepetitionChange() {
    const spacedRepetitionCheckbox = document.getElementById('spacedRepetition');
    const spacedRepetitionDetails = document.getElementById('spacedRepetitionDetails');
    
    if (!spacedRepetitionCheckbox || !spacedRepetitionDetails) return;
    
    if (spacedRepetitionCheckbox.checked) {
        spacedRepetitionDetails.style.display = 'block';
    } else {
        spacedRepetitionDetails.style.display = 'none';
    }
}

function handleEventSubmit(e) {
    e.preventDefault();
    
    const formData = {
        topic: document.getElementById('eventTitle').value,
        date: document.getElementById('eventDate').value,
        time: document.getElementById('eventTime').value,
        type: document.getElementById('eventType').value,
        subject: document.getElementById('eventSubject').value,
        description: document.getElementById('eventDescription').value,
        spacedRepetition: document.getElementById('spacedRepetition').checked
    };
    
    if (!formData.topic || !formData.date || !formData.time || !formData.type) {
        showNotification('Please fill in all required fields');
        return;
    }
    
    try {
        // Add the main event
        const eventId = dataManager.addCalendarEvent(formData);
        
        // If spaced repetition is enabled, create additional reminder events
        if (formData.spacedRepetition) {
            createSpacedRepetitionEvents(formData);
        }
        
        closeAddEventModal();
        renderCalendar();
        updateCalendarStats();
        
        const message = formData.spacedRepetition 
            ? 'Event added with spaced repetition reminders!' 
            : 'Event added successfully!';
        showNotification(message);
    } catch (error) {
        showNotification('Error adding event: ' + error.message);
        console.error('Error adding event:', error);
    }
}

function createSpacedRepetitionEvents(originalEvent) {
    const intervals = [3, 5, 11, 21]; // Days for spaced repetition
    const baseDate = new Date(originalEvent.date);
    
    intervals.forEach((days, index) => {
        const revisionDate = new Date(baseDate);
        revisionDate.setDate(baseDate.getDate() + days);
        
        const reviewType = ['First Review', 'Second Review', 'Third Review', 'Final Review'][index];
        
        const revisionEvent = {
            topic: `${reviewType}: ${originalEvent.topic}`,
            date: revisionDate.toISOString().split('T')[0],
            time: originalEvent.time,
            type: 'revision',
            subject: originalEvent.subject,
            description: `Spaced repetition ${reviewType.toLowerCase()} for: ${originalEvent.topic}`,
            spacedRepetition: false // Don't create repetitions for repetitions
        };
        
        try {
            dataManager.addCalendarEvent(revisionEvent);
        } catch (error) {
            console.error('Error creating spaced repetition event:', error);
        }
    });
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
