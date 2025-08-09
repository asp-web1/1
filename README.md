# 🌿 SAGE - Study Assistance & Guidance Engine

## 🎯 Project Overview

**SAGE** is a comprehensive web dashboard designed specifically for ESE (Electrical Engineering) exam preparation. It provides an intelligent companion for tracking study progress, managing subjects and subtopics, scheduling revisions, analyzing preparation statistics, and achieving study goals through advanced analytics and milestone tracking.

**Target Exam Date:** February 5, 2026  
**Login Credentials:** `asp` / `ese`  
**Developed with 💖 by Asp🧠**

## 🚀 Features

### ✅ Core Features Implemented

#### **🔐 Enhanced Authentication System**
- Secure login with credentials: `asp` / `ese`
- Session management with 30-day expiration
- Auto-redirect based on authentication status
- Periodic session validation

#### **🏠 Smart Home Dashboard**
- **Live Countdown Timer** to exam date (editable)
- **Study Streak Tracker** (consecutive study days)
- **Quick Stats Overview** (total hours, progress, active subjects)
- **Weekly & Monthly Targets** with progress tracking
- **Today's Events** from calendar integration
- **Recent Activity Feed** with pagination
- **Quick Actions** for common tasks
- **Dark Mode** toggle for eye-friendly study

#### **📝 Advanced Daily Progress Management**
- **Complete CRUD Operations** for study entries
- **Data Fields:** Date, Hours Studied, Subject, Type (theory/lecture/numerical/notes/revision), Current Affairs (Y/N), Remarks
- **Smart Analytics:** Automatic progress calculations and learning curve analysis
- **Table Format** with edit/delete functionality and pagination
- **Real-time Updates** across all pages

#### **📚 Intelligent Subject Management System**
- **Subject CRUD Operations** (Create, Read, Update, Delete)
- **Subtopic Management** with hierarchical structure
- **Progress Tracking System:** Each subtopic tracked across:
  - ✅ Lecture completion
  - ✅ Theory understanding
  - ✅ Notes completion
  - ✅ 4 Test Series attempts
  - ✅ Previous Year Questions (PYQ)
  - ✅ Workbook completion
- **Real-time Progress Calculation** (individual & overall subject preparedness)
- **Seamless Form Experience** with optimized UI

#### **📅 Smart Calendar System**
- **Event Scheduling** for exam preparation
- **🔥 Spaced Repetition Feature:** Auto-schedule revisions on 3rd, 7th, 15th, 21st days
- **Event Types:** Study sessions, tests, breaks, revisions
- **Dashboard Integration:** Events display on home dashboard
- **Date Selection:** Click dates to add events

#### **🎯 Targets & Milestones System**
- **Weekly/Monthly Targets:** Set study hour goals and track completion
- **Subject-wise Milestones:** Define completion targets for each subject
- **Progress Tracking:** Real-time progress against targets
- **Status Indicators:** On track, behind schedule, completed
- **Target History:** Visual charts showing target vs actual performance

#### **📊 Advanced Statistics & Analytics**
- **Subject Progress Charts** with individual subject preparedness graphs
- **Monthly Progress Tracking** with daily study hours organized by month
- **Daily Progress Visualization** (last 30 days)
- **📄 Export Functionality:** Monthly progress reports
- **Real-time Analytics** with cross-page data synchronization
- **Performance Trends:** Long-term performance analysis

#### **🔍 Advanced Analytics & Insights**
- **Learning Curve Analysis:** Track how quickly you're improving in each subject
- **Study Efficiency Metrics:** Time spent vs progress made ratio
- **Study Pattern Analysis:** Identify optimal study times and patterns
- **Exam Readiness Reports:** Detailed readiness assessment
- **Performance Analytics:** Comprehensive performance insights

#### **⚙️ Settings & Customization**
- **Dark Mode:** Eye-friendly study mode
- **Data Export/Import:** Backup and restore functionality
- **Anki Integration:** Ready for Anki account integration
- **Customizable Targets:** Flexible goal setting

## 🏗️ Technical Architecture

### **File Structure**
```
sage/
├── index.html                 # Login portal
├── dashboard/
│   ├── home.html             # Main dashboard
│   ├── daily-progress.html   # Study tracking
│   ├── subjects.html         # Subject management
│   ├── calendar.html         # Smart scheduling
│   ├── statistics.html       # Analytics & reports
│   ├── targets.html          # Targets & milestones
│   ├── analytics.html        # Advanced analytics
│   └── settings.html         # Settings & preferences
├── assets/
│   ├── css/
│   │   ├── style.css         # Global styling system
│   │   └── sections.css      # Component-specific styles
│   └── js/
│       ├── auth.js           # Enhanced authentication logic
│       ├── storage.js        # Optimized data management
│       ├── app.js           # Home dashboard functionality
│       ├── daily-progress.js # Progress CRUD operations
│       ├── subjects.js       # Subject management
│       ├── calendar.js       # Calendar & spaced repetition
│       ├── statistics.js     # Analytics engine
│       ├── targets.js        # Targets & milestones
│       ├── analytics.js      # Advanced analytics
│       └── settings.js       # Settings management
└── README.md                 # This file
```

### **Data Management System**
- **Storage:** Browser localStorage with JSON structure
- **Real-time Sync:** Cross-page data updates via custom events
- **Scalable Architecture:** Optimized for large datasets
- **Data Persistence:** Year-round tracking capability
- **Performance Optimization:** Chunked data processing for large datasets

### **Data Structure**
```javascript
sageData = {
  examDate: "2026-02-05T09:00:00",
  dailyProgress: [/* Study entries with full CRUD */],
  subjects: [/* Hierarchical subject-subtopic structure */],
  calendar: [/* Events with spaced repetition logic */],
  targets: {
    weekly: { hours: 0, days: 0 },
    monthly: { hours: 0, days: 0 }
  },
  milestones: {/* Subject-specific milestones */},
  analytics: {
    learningCurves: {},
    efficiencyMetrics: {},
    studyPatterns: {},
    examReadiness: {}
  },
  settings: { 
    createdAt: "...",
    darkMode: false,
    ankiIntegration: false,
    dataVersion: "2.0"
  }
}
```

## 🚀 Quick Start

### **Local Development**
1. **Clone or download** the project files
2. **Start a local server:**
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Using PHP
   php -S localhost:8000
   ```
3. **Open browser** and navigate to `http://localhost:8000`
4. **Login** with credentials: `asp` / `ese`

### **GitHub Pages Deployment**
1. **Upload** all files to a GitHub repository
2. **Enable GitHub Pages** in repository settings
3. **Set source** to main branch
4. **Access** via `https://username.github.io/repository-name`

## 📱 Responsive Design

- **Mobile-First Approach:** Optimized for all screen sizes
- **Breakpoints:** 480px, 768px, 1200px
- **Touch-Friendly:** Mobile gesture support
- **Cross-Platform:** Works on desktop, tablet, and mobile
- **Dark Mode:** Eye-friendly study mode

## 🎯 Usage Guide

### **Getting Started**
1. **Login** with `asp` / `ese`
2. **Set Targets** in the Targets & Milestones section
3. **Add Subjects** in the Subjects section
4. **Create Subtopics** for each subject
5. **Track Daily Progress** in the Daily Progress section
6. **Monitor Statistics** in the Statistics section
7. **Schedule Events** in the Calendar section

### **Targets & Milestones**
1. **Set Weekly/Monthly Targets:** Define study hour and day goals
2. **Create Subject Milestones:** Set specific progress targets for subjects
3. **Track Progress:** Monitor real-time progress against targets
4. **View History:** Analyze target vs actual performance

### **Subject Management**
1. **Add Subject:** Click "Add Subject" button
2. **Add Subtopics:** Click "Add Subtopic" within each subject
3. **Track Progress:** Use checkboxes to mark completed tasks:
   - Lecture, Theory, Notes
   - Test Series (4 attempts)
   - PYQ (Previous Year Questions)
   - Workbook

### **Daily Progress Tracking**
1. **Fill Form:** Date, hours, subject, type, current affairs, remarks
2. **Submit:** Data is automatically saved and analyzed
3. **Edit/Delete:** Use action buttons in the table
4. **View History:** All entries are displayed in chronological order

### **Calendar & Events**
1. **Add Events:** Study sessions, revisions, tests, breaks
2. **Spaced Repetition:** Enable automatic revision scheduling
3. **View on Dashboard:** Today's events appear on home page
4. **Navigate Calendar:** Use month navigation

### **Statistics & Analytics**
- **Overview Stats:** Total hours, average daily hours, study days, streak
- **Subject Charts:** Individual subject progress visualization
- **Monthly Progress:** Study hours by month
- **Daily Chart:** Last 30 days study pattern
- **Export Reports:** Download monthly progress reports
- **Advanced Analytics:** Learning curves, efficiency metrics, study patterns

## 🔧 Customization

### **Exam Date**
- **Edit:** Use the date picker on the home dashboard
- **Default:** February 5, 2026 at 9:00 AM

### **Subjects & Subtopics**
- **Add:** Use the subject management interface
- **Structure:** Hierarchical (Subject → Subtopics → Tasks)
- **Tasks:** 9 different completion types per subtopic
- **Limits:** Up to 50 subjects, 30 subtopics per subject

### **Study Types**
- Theory, Lecture, Numerical, Notes, Revision
- **Custom:** Can be extended in the code

### **Targets & Milestones**
- **Weekly Targets:** Study hours and days per week
- **Monthly Targets:** Study hours and days per month
- **Subject Milestones:** Specific progress targets with deadlines

## 🌟 Key Features

- **🔄 Real-time Updates:** All data syncs across pages instantly
- **📊 Smart Analytics:** Automatic progress calculations and insights
- **📱 Full Responsiveness:** Works across all devices
- **💾 Persistent Data:** Year-round preparation tracking
- **🎯 ESE-Specific:** Tailored for electrical engineering exam prep
- **📄 Export Capabilities:** Monthly PDF reports and data backup
- **🔒 Secure:** Enhanced authentication with session management
- **🌙 Dark Mode:** Eye-friendly study interface
- **🎯 Goal Tracking:** Comprehensive targets and milestones system
- **📈 Performance Insights:** Advanced analytics and learning curves
- **📅 Smart Scheduling:** Calendar with spaced repetition
- **⚡ Quick Actions:** Streamlined workflow

## 🚧 Development Status

### **✅ Completed (Phase 1 & 2)**
- ✅ Enhanced authentication and session management
- ✅ Responsive navigation system with SAGE branding
- ✅ Real-time countdown timer
- ✅ Cross-page data sharing system
- ✅ Subject management (CRUD operations)
- ✅ Daily progress tracking (CRUD operations)
- ✅ Statistics and analytics
- ✅ Export functionality
- ✅ Calendar system with spaced repetition
- ✅ Targets & milestones system
- ✅ Dark mode implementation
- ✅ Advanced analytics and insights
- ✅ Performance optimization for large datasets
- ✅ GitHub hosting compatibility

### **🎯 Future Enhancements (Phase 3)**
- 🎯 Anki integration for flashcard management
- 🎯 Advanced mobile features
- 🎯 Collaborative study features
- 🎯 AI-powered study recommendations
- 🎯 Integration with external study resources

## 🤝 Contributing

This is a personal project for ESE exam preparation. Feel free to:
- **Fork** the repository
- **Customize** for your own exam preparation
- **Share** improvements with the community
- **Report** bugs or suggest features

## 📄 License

This project is open source and available under the MIT License.

---

**Built with 💖 by Asp🧠 for ESE aspirants**  
**Target Exam:** February 5, 2026  
**Login:** `asp` / `ese`  
**Platform:** 🌿 SAGE - Study Assistance & Guidance Engine
