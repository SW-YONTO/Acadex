# Acadex - Academy Management Dashboard

A comprehensive academy/coaching management dashboard built with React, Vite, and Supabase. Manage students, attendance, results, syllabus, and more with a beautiful, responsive UI.

![Acadex Dashboard](https://via.placeholder.com/800x400?text=Acadex+Dashboard)

## 🚀 Features

### Student Management

- **Student List** - Paginated, searchable student directory with batch filtering
- **Student Profiles** - Detailed student information with contact, guardian details
- **Multi-Select & Bulk Delete** - Select multiple students for batch operations
- **CSV Export** - Download student data as CSV
- **Attendance History** - Per-student attendance calendar with editing

### Attendance System

- **Daily Attendance** - Mark attendance for entire batches
- **Holiday Management** - Add/remove holidays with auto-detection
- **Editable Calendar** - Click to edit attendance status (Present/Absent/Late)
- **Attendance Statistics** - Visual charts and percentages

### Academic Management

- **Syllabus Tracking** - Create topics per subject with progress tracking
- **Reorderable Topics** - Move topics up/down to change order
- **Results & Grades** - Record test results with marks
- **Leaderboard** - Student rankings by performance

### Organization

- **Academies** - Manage multiple academies
- **Batches** - Create batches within academies
- **Batch Dashboard** - Per-batch statistics and quick actions

### Communication

- **Announcements** - Create announcements with priority levels
- **Notes** - Rich text notes with bullet/numbered lists
- **Documents** - Upload and manage documents

### Planning & Events

- **Calendar** - Visual calendar with events
- **Events** - Schedule meetings, exams, classes
- **Weekly Plans** - Plan weekly activities
- **To-Do Lists** - Task management

### Analytics & Reports

- **Analytics Dashboard** - Student attendance analytics
- **Filtering & Sorting** - Filter by batch, attendance level
- **CSV Export** - Export analytics data

### Settings

- **Theme Customization** - 6 color presets (Default, Forest, Purple, Blue, Rose, Orange)
- **Dark/Light Mode** - Toggle between themes
- **Profile Editing** - Edit user profile
- **Notification Preferences** - Email, browser, attendance alerts
- **Data Export** - Export settings as JSON

## 📱 Pages

| Page            | Route            | Description                         |
| --------------- | ---------------- | ----------------------------------- |
| Dashboard       | `/`              | Overview with stats, to-dos, charts |
| Students        | `/students`      | Student list with filters           |
| Student Detail  | `/students/:id`  | Individual student profile          |
| Attendance      | `/attendance`    | Mark daily attendance               |
| Syllabus        | `/syllabus`      | Track syllabus progress             |
| Calendar        | `/calendar`      | Events calendar                     |
| Results         | `/results`       | Test results & grades               |
| Academies       | `/academies`     | Manage academies & batches          |
| Batch Dashboard | `/batch/:id`     | Per-batch overview                  |
| Announcements   | `/announcements` | Create announcements                |
| Notes           | `/notes`         | Rich text notes                     |
| Documents       | `/documents`     | Document management                 |
| Analytics       | `/analytics`     | Student analytics                   |
| Settings        | `/settings`      | App settings & themes               |
| Login           | `/login`         | User authentication                 |
| Register        | `/register`      | New user registration               |

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod
- **Rich Text**: Tiptap Editor
- **Icons**: Lucide React
- **Date Handling**: date-fns

## 🗃️ Database Schema

| Table           | Description                     |
| --------------- | ------------------------------- |
| `users`         | User accounts (teachers/admins) |
| `academies`     | Academy organizations           |
| `batches`       | Student batches/classes         |
| `students`      | Student records                 |
| `attendance`    | Daily attendance records        |
| `test_results`  | Test scores                     |
| `syllabus`      | Syllabus topics                 |
| `notes`         | Teacher notes                   |
| `announcements` | Announcements                   |
| `events`        | Calendar events                 |
| `documents`     | Document metadata               |
| `todos`         | To-do items                     |
| `weekly_plans`  | Weekly plans                    |
| `student_exits` | Exit tracking                   |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/your-repo/acadex.git
cd acadex

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### Build for Production

```bash
npm run build
npm run preview
```

### Build Android APK (Capacitor)

```bash
npm run build
npx cap sync
cd android
./gradlew assembleDebug
```

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/        # Dashboard layout, sidebar
│   └── ui/            # shadcn/ui components
├── context/           # React contexts (Auth)
├── lib/
│   ├── api.js         # Supabase API functions
│   ├── supabase.js    # Supabase client
│   └── utils.js       # Utility functions
├── pages/             # Page components
├── index.css          # Global styles + themes
├── App.jsx            # Routes
└── main.jsx           # Entry point
```

## 🎨 Theming

The app supports 6 color themes with both light and dark variants:

- **Default** - Neutral gray
- **Forest Green** - Nature-inspired
- **Purple** - Elegant violet
- **Ocean Blue** - Professional blue
- **Rose** - Warm pink
- **Orange** - Energetic orange

Themes persist across sessions via localStorage.

## 📝 License

MIT License - feel free to use for personal or commercial projects.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines.

---

Made with ❤️ for educators
