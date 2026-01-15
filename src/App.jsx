import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import StudentsPage from '@/pages/StudentsPage';
import StudentDetailPage from '@/pages/StudentDetailPage';
import AttendancePage from '@/pages/AttendancePage';
import SyllabusPage from '@/pages/SyllabusPage';
import CalendarPage from '@/pages/CalendarPage';
import ResultsPage from '@/pages/ResultsPage';
import AcademiesPage from '@/pages/AcademiesPage';
import BatchDashboardPage from '@/pages/BatchDashboardPage';
import AnnouncementsPage from '@/pages/AnnouncementsPage';
import NotesPage from '@/pages/NotesPage';
import DocumentsPage from '@/pages/DocumentsPage';
import SettingsPage from '@/pages/SettingsPage';
import AnalyticsPage from '@/pages/AnalyticsPage';
import StudentAnalyticsPage from '@/pages/StudentAnalyticsPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/students/:id" element={<StudentDetailPage />} />
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/syllabus" element={<SyllabusPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/results" element={<ResultsPage />} />
            <Route path="/leaderboard" element={<ResultsPage />} />
            <Route path="/academies" element={<AcademiesPage />} />
            <Route path="/batch/:id" element={<BatchDashboardPage />} />
            <Route path="/announcements" element={<AnnouncementsPage />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route path="/student-analytics" element={<StudentAnalyticsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
