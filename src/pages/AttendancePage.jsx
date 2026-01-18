import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Save, CheckCircle, XCircle, Clock, CalendarOff, Plus } from 'lucide-react';
import { attendanceApi, studentApi, batchApi } from '@/lib/api';
import { format, isWeekend, isSameDay } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const COLORS = ['#22c55e', '#ef4444', '#f59e0b'];

export default function AttendancePage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [holidays, setHolidays] = useState([]);
  const [isHolidayDialogOpen, setIsHolidayDialogOpen] = useState(false);
  const [holidayName, setHolidayName] = useState('');
  const [savingHoliday, setSavingHoliday] = useState(false);

  useEffect(() => {
    loadBatches();
    // Load holidays from localStorage for now (can be API later)
    const savedHolidays = localStorage.getItem('holidays');
    if (savedHolidays) {
      setHolidays(JSON.parse(savedHolidays));
    }
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      loadStudentsAndAttendance();
    }
  }, [selectedBatch, selectedDate]);

  const loadBatches = async () => {
    try {
      const res = await batchApi.getAll();
      setBatches(res.data);
      if (res.data.length > 0) {
        setSelectedBatch(res.data[0]._id);
      }
    } catch (error) {
      console.error('Error loading batches:', error);
    }
  };

  const loadStudentsAndAttendance = async () => {
    setLoading(true);
    try {
      const [studentsRes, attendanceRes] = await Promise.all([
        studentApi.getAll({ batchId: selectedBatch }),
        attendanceApi.get({ batchId: selectedBatch, date: selectedDate.toISOString() }),
      ]);

      setStudents(studentsRes.data);

      // Build attendance map
      const attendanceMap = {};
      attendanceRes.data.forEach((record) => {
        attendanceMap[record.studentId._id || record.studentId] = record.status;
      });

      // Initialize with existing attendance or default to present
      const initialAttendance = {};
      studentsRes.data.forEach((student) => {
        initialAttendance[student._id] = attendanceMap[student._id] || 'present';
      });
      setAttendance(initialAttendance);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleAttendance = (studentId) => {
    setAttendance((prev) => {
      const current = prev[studentId];
      const next = current === 'present' ? 'absent' : current === 'absent' ? 'late' : 'present';
      return { ...prev, [studentId]: next };
    });
  };

  const markAllPresent = () => {
    const allPresent = {};
    students.forEach((s) => (allPresent[s._id] = 'present'));
    setAttendance(allPresent);
  };

  const markAllAbsent = () => {
    const allAbsent = {};
    students.forEach((s) => (allAbsent[s._id] = 'absent'));
    setAttendance(allAbsent);
  };

  const saveAttendance = async () => {
    setSaving(true);
    try {
      const records = Object.entries(attendance).map(([studentId, status]) => ({
        studentId,
        status,
      }));

      await attendanceApi.markBulk({
        batchId: selectedBatch,
        date: selectedDate.toISOString(),
        records,
      });

      alert('Attendance saved successfully!');
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  const isHoliday = (date) => {
    // Check if weekend (Saturday or Sunday)
    if (isWeekend(date)) return true;
    // Check custom holidays
    return holidays.some(h => isSameDay(new Date(h.date), date));
  };

  const addHoliday = () => {
    if (!holidayName.trim()) return;
    setSavingHoliday(true);
    
    const newHoliday = {
      id: Date.now(),
      date: selectedDate.toISOString(),
      name: holidayName,
    };
    
    const updatedHolidays = [...holidays, newHoliday];
    setHolidays(updatedHolidays);
    localStorage.setItem('holidays', JSON.stringify(updatedHolidays));
    
    setHolidayName('');
    setIsHolidayDialogOpen(false);
    setSavingHoliday(false);
  };

  const removeHoliday = (holidayId) => {
    const updatedHolidays = holidays.filter(h => h.id !== holidayId);
    setHolidays(updatedHolidays);
    localStorage.setItem('holidays', JSON.stringify(updatedHolidays));
  };

  const getHolidayForDate = (date) => {
    if (isWeekend(date)) {
      return format(date, 'EEEE'); // Returns "Saturday" or "Sunday"
    }
    const holiday = holidays.find(h => isSameDay(new Date(h.date), date));
    return holiday?.name || null;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      present: 'bg-green-500/10 text-green-600 border-green-500/20',
      absent: 'bg-red-500/10 text-red-600 border-red-500/20',
      late: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    };
    return (
      <Badge variant="outline" className={variants[status]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const stats = {
    total: students.length,
    present: Object.values(attendance).filter((s) => s === 'present').length,
    absent: Object.values(attendance).filter((s) => s === 'absent').length,
    late: Object.values(attendance).filter((s) => s === 'late').length,
  };

  const pieData = [
    { name: 'Present', value: stats.present },
    { name: 'Absent', value: stats.absent },
    { name: 'Late', value: stats.late },
  ];

  const barData = [
    { name: 'Present', value: stats.present, fill: '#22c55e' },
    { name: 'Absent', value: stats.absent, fill: '#ef4444' },
    { name: 'Late', value: stats.late, fill: '#f59e0b' },
  ];

  const currentDayHoliday = getHolidayForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground">Mark and manage student attendance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsHolidayDialogOpen(true)}>
            <CalendarOff className="mr-2 h-4 w-4" />
            Mark Holiday
          </Button>
          <Button onClick={saveAttendance} disabled={saving || !selectedBatch || currentDayHoliday}>
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Attendance
          </Button>
        </div>
      </div>

      {/* Charts Section */}
      {stats.total > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Distribution</CardTitle>
              <CardDescription>Today's attendance breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attendance Summary</CardTitle>
              <CardDescription>Visual comparison</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[300px_1fr]">
        {/* Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Batch</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedBatch} onValueChange={setSelectedBatch}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a batch" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(batches) && batches.filter(b => b && b._id).map((batch) => (
                    <SelectItem key={batch._id} value={batch._id}>
                      {batch.name || 'Unnamed Batch'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Date</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                className="rounded-md"
                modifiers={{
                  holiday: (date) => isHoliday(date),
                }}
                modifiersStyles={{
                  holiday: { 
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                    opacity: 0.6,
                  }
                }}
              />
            </CardContent>
          </Card>

          {/* Holiday Notice */}
          {currentDayHoliday && (
            <Card className="border-yellow-500/50 bg-yellow-500/10">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-yellow-600">
                  <CalendarOff className="h-4 w-4" />
                  <span className="font-medium">Holiday: {currentDayHoliday}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Attendance marking is disabled for holidays
                </p>
              </CardContent>
            </Card>
          )}

          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
              <CardDescription>{format(selectedDate, 'MMMM d, yyyy')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Students</span>
                <span className="font-medium">{stats.total}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-green-600">Present</span>
                <span className="font-medium text-green-600">{stats.present}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-red-600">Absent</span>
                <span className="font-medium text-red-600">{stats.absent}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-yellow-600">Late</span>
                <span className="font-medium text-yellow-600">{stats.late}</span>
              </div>
              <div className="pt-2 border-t">
                <div className="flex justify-between text-sm font-medium">
                  <span>Attendance Rate</span>
                  <span>
                    {stats.total > 0
                      ? (((stats.present + stats.late) / stats.total) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Custom Holidays List */}
          {holidays.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Custom Holidays</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {holidays.slice(0, 5).map((holiday) => (
                  <div key={holiday.id} className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium">{holiday.name}</span>
                      <span className="text-muted-foreground ml-2">
                        {format(new Date(holiday.date), 'MMM d')}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 w-6 p-0 text-destructive"
                      onClick={() => removeHoliday(holiday.id)}
                    >
                      ×
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>
                {currentDayHoliday 
                  ? 'Attendance marking disabled for holidays'
                  : 'Click on a student to toggle their attendance status'
                }
              </CardDescription>
            </div>
            {!currentDayHoliday && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={markAllPresent}>
                  Mark All Present
                </Button>
                <Button variant="outline" size="sm" onClick={markAllAbsent}>
                  Mark All Absent
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {selectedBatch ? 'No students in this batch' : 'Select a batch to view students'}
              </div>
            ) : (
              <div className="grid gap-2">
                {students.map((student) => (
                  <div
                    key={student._id}
                    onClick={() => !currentDayHoliday && toggleAttendance(student._id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      currentDayHoliday 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-muted/50'
                    }`}
                  >
                    <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                      <AvatarImage src={student.photo} />
                      <AvatarFallback>{student.name.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{student.name}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{student.email || student.phone || '-'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(attendance[student._id])}
                      <span className="hidden sm:inline-block">
                        {getStatusBadge(attendance[student._id])}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Holiday Dialog */}
      <Dialog open={isHolidayDialogOpen} onOpenChange={setIsHolidayDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Holiday</DialogTitle>
            <DialogDescription>
              Add a custom holiday for {format(selectedDate, 'MMMM d, yyyy')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Holiday Name</label>
              <Input
                placeholder="e.g., Diwali, Christmas, etc."
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Note: Saturdays and Sundays are automatically marked as holidays.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsHolidayDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={addHoliday} disabled={!holidayName.trim() || savingHoliday}>
              {savingHoliday && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Holiday
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
