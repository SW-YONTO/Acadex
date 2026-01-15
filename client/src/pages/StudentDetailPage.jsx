import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Users,
  ClipboardCheck,
  FileText,
  TrendingUp,
  TrendingDown,
  Loader2,
  AlertCircle,
  Pencil,
  Plus,
  Download,
} from 'lucide-react';
import { studentApi, attendanceApi, resultsApi, batchApi } from '@/lib/api';
import { format, subDays, eachDayOfInterval, isWeekend } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

export default function StudentDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [batches, setBatches] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Result Dialog state
  const [isAddResultOpen, setIsAddResultOpen] = useState(false);
  const [newResult, setNewResult] = useState({ testName: '', subject: '', marks: '', totalMarks: '' });
  const [savingResult, setSavingResult] = useState(false);

  useEffect(() => {
    if (id) {
      loadStudentData();
    }
  }, [id]);

  const loadStudentData = async () => {
    setLoading(true);
    try {
      const [studentRes, resultsRes] = await Promise.all([
        studentApi.getOne(id),
        resultsApi.getAll({ studentId: id }),
      ]);

      setStudent(studentRes.data);
      setResults(resultsRes.data || []);

      // Load batch names
      if (studentRes.data?.batchIds?.length > 0) {
        const batchPromises = studentRes.data.batchIds.map(async (batchId) => {
          try {
            const bId = typeof batchId === 'object' ? batchId._id : batchId;
            const res = await batchApi.getOne(bId);
            return res.data;
          } catch {
            return null;
          }
        });
        const batchData = await Promise.all(batchPromises);
        setBatches(batchData.filter(Boolean));
      }

      // Load attendance for last 30 days
      const endDate = new Date();
      const startDate = subDays(endDate, 30);
      
      if (studentRes.data?.batchIds?.length > 0) {
        const batchId = typeof studentRes.data.batchIds[0] === 'object' 
          ? studentRes.data.batchIds[0]._id 
          : studentRes.data.batchIds[0];
        
        try {
          const attendanceRes = await attendanceApi.get({
            studentId: id,
            batchId: batchId,
          });
          setAttendance(attendanceRes.data || []);
        } catch (e) {
          console.error('Error loading attendance:', e);
        }
      }
    } catch (error) {
      console.error('Error loading student data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance stats
  const attendanceStats = {
    present: attendance.filter(a => a.status === 'present').length,
    absent: attendance.filter(a => a.status === 'absent').length,
    late: attendance.filter(a => a.status === 'late').length,
  };
  const totalAttendance = attendanceStats.present + attendanceStats.absent + attendanceStats.late;
  const attendancePercentage = totalAttendance > 0 
    ? Math.round((attendanceStats.present / totalAttendance) * 100) 
    : 0;

  const attendancePieData = [
    { name: 'Present', value: attendanceStats.present },
    { name: 'Absent', value: attendanceStats.absent },
    { name: 'Late', value: attendanceStats.late },
  ];

  // Calculate test performance
  const testPerformance = results.map(r => ({
    name: r.testName || r.subject,
    score: Math.round((r.marks / r.totalMarks) * 100),
    marks: r.marks,
    total: r.totalMarks,
  }));

  const averageScore = testPerformance.length > 0
    ? Math.round(testPerformance.reduce((sum, t) => sum + t.score, 0) / testPerformance.length)
    : 0;

  // Generate last 30 days attendance calendar
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const getAttendanceForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const record = attendance.find(a => format(new Date(a.date), 'yyyy-MM-dd') === dateStr);
    return record?.status || null;
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'DOB', 'Guardian', 'Guardian Phone', 'Address', 'Attendance %'];
    const row = [
      student.name || '',
      student.email || '',
      student.phone || '',
      student.dob ? format(new Date(student.dob), 'yyyy-MM-dd') : '',
      student.guardianName || '',
      student.guardianPhone || '',
      student.address || '',
      `${attendancePercentage}%`,
    ];
    const csvContent = [headers.join(','), row.map(v => `"${v}"`).join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${student.name || 'student'}_data.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddResult = async () => {
    setSavingResult(true);
    try {
      await resultsApi.create({
        studentId: id,
        testName: newResult.testName,
        subject: newResult.subject,
        marks: parseInt(newResult.marks),
        totalMarks: parseInt(newResult.totalMarks),
      });
      setIsAddResultOpen(false);
      setNewResult({ testName: '', subject: '', marks: '', totalMarks: '' });
      loadStudentData();
    } catch (error) {
      console.error('Error adding result:', error);
    } finally {
      setSavingResult(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p>Student not found</p>
        <Button asChild className="mt-4">
          <Link to="/students">Go to Students</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
          <p className="text-muted-foreground">View student details and performance</p>
        </div>
        <Button variant="outline" onClick={downloadCSV}>
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
        <Button variant="outline" onClick={() => setIsAddResultOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Result
        </Button>
        <Button asChild>
          <Link to={`/students?edit=${id}`}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Student
          </Link>
        </Button>
      </div>

      {/* Profile Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24">
              <AvatarImage src={student.photo} />
              <AvatarFallback className="text-2xl">{student.name?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">{student.name}</h2>
                <div className="flex flex-wrap gap-2 mt-2">
                  {batches.map((batch) => (
                    <Badge key={batch._id} variant="secondary">
                      {batch.name}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {student.email && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{student.email}</span>
                  </div>
                )}
                {student.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{student.phone}</span>
                  </div>
                )}
                {student.dob && (
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>{format(new Date(student.dob), 'MMM d, yyyy')}</span>
                  </div>
                )}
                {student.address && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{student.address}</span>
                  </div>
                )}
              </div>
              {(student.guardianName || student.guardianPhone) && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Guardian</p>
                  <div className="flex items-center gap-4">
                    {student.guardianName && (
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{student.guardianName}</span>
                      </div>
                    )}
                    {student.guardianPhone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <span>{student.guardianPhone}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendancePercentage}%</div>
            <Progress value={attendancePercentage} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {attendanceStats.present} present, {attendanceStats.absent} absent, {attendanceStats.late} late
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Score</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">{averageScore}%</span>
              {averageScore >= 60 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on {results.length} test{results.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Taken</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{results.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {results.filter(r => (r.marks / r.totalMarks) >= 0.6).length} passed
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Attendance Calendar */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-5 w-5" />
              Attendance (Last 30 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                <div key={i} className="text-center text-xs text-muted-foreground font-medium py-1">
                  {day}
                </div>
              ))}
              {last30Days.map((date) => {
                const status = getAttendanceForDate(date);
                const weekend = isWeekend(date);
                return (
                  <div
                    key={date.toISOString()}
                    className={`aspect-square rounded-sm flex items-center justify-center text-xs ${
                      weekend
                        ? 'bg-muted/30 text-muted-foreground'
                        : status === 'present'
                        ? 'bg-green-500/20 text-green-600'
                        : status === 'absent'
                        ? 'bg-red-500/20 text-red-600'
                        : status === 'late'
                        ? 'bg-yellow-500/20 text-yellow-600'
                        : 'bg-muted/50 text-muted-foreground'
                    }`}
                    title={`${format(date, 'MMM d')}: ${status || (weekend ? 'Weekend' : 'No record')}`}
                  >
                    {format(date, 'd')}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center gap-4 mt-4 justify-center">
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-sm bg-green-500/20" />
                <span>Present</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-sm bg-red-500/20" />
                <span>Absent</span>
              </div>
              <div className="flex items-center gap-1 text-xs">
                <div className="w-3 h-3 rounded-sm bg-yellow-500/20" />
                <span>Late</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {totalAttendance > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={attendancePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {attendancePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                No attendance data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Test Results
          </CardTitle>
          <CardDescription>Performance across all tests</CardDescription>
        </CardHeader>
        <CardContent>
          {testPerformance.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={testPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis domain={[0, 100]} fontSize={12} />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-background border rounded-lg shadow-lg p-2 text-sm">
                            <p className="font-medium">{data.name}</p>
                            <p>Score: {data.marks}/{data.total} ({data.score}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="score" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <Table className="mt-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Test</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead className="text-right">Marks</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.map((result) => (
                    <TableRow key={result._id}>
                      <TableCell className="font-medium">{result.testName || 'Test'}</TableCell>
                      <TableCell>{result.subject}</TableCell>
                      <TableCell className="text-right">{result.marks}/{result.totalMarks}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant={((result.marks / result.totalMarks) * 100) >= 60 ? 'default' : 'destructive'}>
                          {Math.round((result.marks / result.totalMarks) * 100)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No test results yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Result Dialog */}
      <Dialog open={isAddResultOpen} onOpenChange={setIsAddResultOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test Result</DialogTitle>
            <DialogDescription>Add a new test result for {student.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Test Name *</Label>
              <Input
                placeholder="e.g., Math Midterm"
                value={newResult.testName}
                onChange={(e) => setNewResult(prev => ({ ...prev, testName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="e.g., Mathematics"
                value={newResult.subject}
                onChange={(e) => setNewResult(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marks Obtained *</Label>
                <Input
                  type="number"
                  placeholder="85"
                  value={newResult.marks}
                  onChange={(e) => setNewResult(prev => ({ ...prev, marks: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Total Marks *</Label>
                <Input
                  type="number"
                  placeholder="100"
                  value={newResult.totalMarks}
                  onChange={(e) => setNewResult(prev => ({ ...prev, totalMarks: e.target.value }))}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddResultOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddResult} 
              disabled={!newResult.testName || !newResult.subject || !newResult.marks || !newResult.totalMarks || savingResult}
            >
              {savingResult && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Result
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
