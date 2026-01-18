import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Users,
  GraduationCap,
  ClipboardCheck,
  Calendar,
  TrendingUp,
  ArrowRight,
  Plus,
  Bell,
  BookOpen,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { academyApi, batchApi, studentApi, eventsApi, announcementsApi, syllabusApi } from '@/lib/api';
import { format } from 'date-fns';

const mockChartData = [
  { name: 'Mon', attendance: 85, performance: 78 },
  { name: 'Tue', attendance: 90, performance: 82 },
  { name: 'Wed', attendance: 88, performance: 80 },
  { name: 'Thu', attendance: 92, performance: 85 },
  { name: 'Fri', attendance: 87, performance: 79 },
  { name: 'Sat', attendance: 75, performance: 76 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBatches: 0,
    totalAcademies: 0,
    todayAttendance: 0,
  });
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [academiesRes, batchesRes, studentsRes, eventsRes, announcementsRes, syllabusRes] = await Promise.all([
        academyApi.getAll(),
        batchApi.getAll(),
        studentApi.getAll(),
        eventsApi.getAll({ startDate: new Date().toISOString(), endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() }),
        announcementsApi.getAll(),
        syllabusApi.getAll(),
      ]);

      setStats({
        totalStudents: studentsRes.data.length,
        totalBatches: batchesRes.data.length,
        totalAcademies: academiesRes.data.length,
        todayAttendance: 85, // Placeholder
      });

      setUpcomingEvents(eventsRes.data.slice(0, 5));
      setSyllabus(syllabusRes.data.filter(t => !t.completed).slice(0, 5));
      setAnnouncements(announcementsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      description: 'Active students',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Total Batches',
      value: stats.totalBatches,
      icon: GraduationCap,
      description: 'Running batches',
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Academies',
      value: stats.totalAcademies,
      icon: TrendingUp,
      description: 'Active academies',
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: "Today's Attendance",
      value: `${stats.todayAttendance}%`,
      icon: ClipboardCheck,
      description: 'Overall attendance',
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  const eventTypeColors = {
    exam: 'bg-red-500',
    holiday: 'bg-green-500',
    meeting: 'bg-blue-500',
    deadline: 'bg-yellow-500',
    other: 'bg-gray-500',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's your academy overview.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild className="flex-1 sm:flex-none">
            <Link to="/students/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Weekly Attendance</CardTitle>
            <CardDescription>Attendance percentage over the week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockChartData}>
                  <defs>
                    <linearGradient id="colorAttendance" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="name" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="attendance"
                    stroke="#3b82f6"
                    fillOpacity={1}
                    fill="url(#colorAttendance)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Syllabus</CardTitle>
              <CardDescription>Topics to be covered</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/syllabus">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              {syllabus.length > 0 ? (
                <div className="space-y-3">
                  {syllabus.map((topic) => (
                    <div key={topic._id} className="flex items-center justify-between p-2 rounded-lg border">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{topic.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px] px-1 h-5">
                            {topic.subject}
                          </Badge>
                          {topic.dueDate && (
                            <span>Due: {format(new Date(topic.dueDate), 'MMM d')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <BookOpen className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">No pending topics</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Events and Announcements */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Upcoming Events</CardTitle>
              <CardDescription>Events in the next 7 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/calendar">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {upcomingEvents.length > 0 ? (
                <div className="space-y-3">
                  {upcomingEvents.map((event) => (
                    <div key={event._id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                      <div className={`w-2 h-2 rounded-full ${eventTypeColors[event.type] || eventTypeColors.other}`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(event.date), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">
                        {event.type}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Calendar className="h-8 w-8 mb-2" />
                  <p className="text-sm">No upcoming events</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Recent Announcements */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Announcements</CardTitle>
              <CardDescription>Latest updates</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/announcements">
                View all <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              {announcements.length > 0 ? (
                <div className="space-y-3">
                  {announcements.map((announcement) => (
                    <div key={announcement._id} className="p-3 rounded-lg border">
                      <div className="flex items-start gap-2">
                        <Bell className="h-4 w-4 text-primary mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{announcement.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {announcement.message}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {format(new Date(announcement.createdAt), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2" />
                  <p className="text-sm">No announcements</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks you might want to do</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 grid-cols-2 md:grid-cols-4">
            <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
              <Link to="/attendance">
                <ClipboardCheck className="h-5 w-5" />
                <span>Mark Attendance</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
              <Link to="/results">
                <TrendingUp className="h-5 w-5" />
                <span>Enter Results</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
              <Link to="/calendar">
                <Calendar className="h-5 w-5" />
                <span>Add Event</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="h-auto flex-col gap-2 py-4">
              <Link to="/announcements">
                <Bell className="h-5 w-5" />
                <span>New Announcement</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
