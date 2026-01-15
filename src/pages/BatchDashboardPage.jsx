import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  Trophy,
  Megaphone,
  Loader2,
  CheckCircle,
  Clock,
  AlertCircle,
  Plus,
  Save,
} from 'lucide-react';
import { batchApi, studentApi, syllabusApi, attendanceApi, announcementsApi, weeklyPlansApi } from '@/lib/api';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isToday } from 'date-fns';

export default function BatchDashboardPage() {
  const { id } = useParams();
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState({ present: 0, absent: 0, total: 0 });
  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [savingPlan, setSavingPlan] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadBatchData();
    }
  }, [id]);

  const loadBatchData = async () => {
    setLoading(true);
    try {
      const [batchRes, studentsRes, syllabusRes, announcementsRes, weeklyPlanRes] = await Promise.all([
        batchApi.getOne(id),
        studentApi.getAll({ batchId: id }),
        syllabusApi.getAll({ batchId: id }),
        announcementsApi.getAll(id),
        weeklyPlansApi.getCurrent(id),
      ]);

      setBatch(batchRes.data);
      setStudents(studentsRes.data || []);
      setSyllabus(syllabusRes.data || []);
      setAnnouncements(announcementsRes.data || []);
      setWeeklyPlan(weeklyPlanRes.data?.dayTopics || {});

      // Calculate attendance summary for today
      try {
        const today = format(new Date(), 'yyyy-MM-dd');
        const attendanceRes = await attendanceApi.get({ batchId: id, date: today });
        const records = attendanceRes.data || [];
        setAttendanceSummary({
          present: records.filter(r => r.status === 'present').length,
          absent: records.filter(r => r.status === 'absent').length,
          total: studentsRes.data?.length || 0,
        });
      } catch (e) {
        console.error('Error loading attendance:', e);
      }
    } catch (error) {
      console.error('Error loading batch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSyllabusComplete = async (topicId) => {
    try {
      await syllabusApi.toggle(topicId);
      setSyllabus(prev => 
        prev.map(item => 
          item._id === topicId ? { ...item, completed: !item.completed } : item
        )
      );
    } catch (error) {
      console.error('Error toggling syllabus:', error);
    }
  };

  const saveWeeklyPlan = async () => {
    setSavingPlan(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      await weeklyPlansApi.upsert(id, weekStartStr, { dayTopics: weeklyPlan });
    } catch (error) {
      console.error('Error saving weekly plan:', error);
    } finally {
      setSavingPlan(false);
    }
  };

  const syllabusProgress = syllabus.length > 0 
    ? Math.round((syllabus.filter(s => s.completed).length / syllabus.length) * 100)
    : 0;

  // Generate weekly plan (current week's dates)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p>Batch not found</p>
        <Button asChild className="mt-4">
          <Link to="/academies">Go to Academies</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/academies">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{batch.name}</h1>
          <p className="text-muted-foreground flex items-center gap-2">
            {batch.schedule && (
              <>
                <Calendar className="h-4 w-4" />
                {batch.schedule}
              </>
            )}
          </p>
        </div>
        {batch.subjects?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {batch.subjects.map((subject) => (
              <Badge key={subject} variant="secondary">
                {subject}
              </Badge>
            ))}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Students</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                <Link to={`/students?add=true&batch=${id}`}>
                  <Plus className="h-3 w-3" />
                </Link>
              </Button>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled in this batch</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                <Link to={`/attendance?batch=${id}`}>
                  <Plus className="h-3 w-3" />
                </Link>
              </Button>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {attendanceSummary.present}/{attendanceSummary.total}
            </div>
            <p className="text-xs text-muted-foreground">
              {attendanceSummary.absent} absent
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Syllabus Progress</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{syllabusProgress}%</div>
            <Progress value={syllabusProgress} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Announcements</CardTitle>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
                <Link to={`/announcements?add=true&batch=${id}`}>
                  <Plus className="h-3 w-3" />
                </Link>
              </Button>
              <Megaphone className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{announcements.length}</div>
            <p className="text-xs text-muted-foreground">Active announcements</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Weekly Plan */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Plan
                </CardTitle>
                <CardDescription>
                  {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
                </CardDescription>
              </div>
              <Button size="sm" onClick={saveWeeklyPlan} disabled={savingPlan}>
                {savingPlan ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Save
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {weekDays.map((day) => {
                const dayKey = format(day, 'EEE').toLowerCase();
                return (
                  <div
                    key={day.toISOString()}
                    className={`flex items-center gap-3 p-2 rounded-lg border ${
                      isToday(day) ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className={`w-12 text-center font-medium ${isToday(day) ? 'text-primary' : 'text-muted-foreground'}`}>
                      {format(day, 'EEE')}
                    </div>
                    <Input
                      placeholder={`Topic for ${format(day, 'EEEE')}`}
                      value={weeklyPlan[dayKey] || ''}
                      onChange={(e) => setWeeklyPlan(prev => ({ ...prev, [dayKey]: e.target.value }))}
                      className="flex-1"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Syllabus Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Syllabus
            </CardTitle>
            <CardDescription>
              {syllabus.filter(s => s.completed).length} of {syllabus.length} topics completed
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {syllabus.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No syllabus topics yet
                  </p>
                ) : (
                  syllabus.map((topic) => (
                    <div
                      key={topic._id}
                      className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={topic.completed}
                        onCheckedChange={() => toggleSyllabusComplete(topic._id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {topic.subject}
                          </Badge>
                          {topic.completed && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                        <p className={`font-medium mt-1 ${topic.completed ? 'line-through text-muted-foreground' : ''}`}>
                          {topic.title}
                        </p>
                        {topic.description && (
                          <p className="text-sm text-muted-foreground mt-1">{topic.description}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Students List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Students
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/students">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {students.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No students in this batch
                  </p>
                ) : (
                  students.slice(0, 8).map((student) => (
                    <Link
                      key={student._id}
                      to={`/students/${student._id}`}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={student.photo} />
                        <AvatarFallback>{student.name?.charAt(0).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        <p className="text-xs text-muted-foreground">{student.email || student.phone || 'No contact'}</p>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Announcements */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Megaphone className="h-5 w-5" />
                Announcements
              </CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/announcements">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[250px]">
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No announcements
                  </p>
                ) : (
                  announcements.slice(0, 5).map((announcement) => (
                    <div
                      key={announcement._id}
                      className="p-3 rounded-lg border bg-card"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <Badge
                          variant="outline"
                          className={
                            announcement.priority === 'high'
                              ? 'border-red-500 text-red-500'
                              : announcement.priority === 'medium'
                              ? 'border-yellow-500 text-yellow-500'
                              : ''
                          }
                        >
                          {announcement.priority}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(announcement.createdAt), 'MMM d')}
                        </span>
                      </div>
                      <p className="font-medium">{announcement.title}</p>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.message}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
