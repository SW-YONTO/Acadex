import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  Users,
  Download,
  Search,
  Filter,
  Loader2,
  UserCheck,
  UserX,
  TrendingUp,
  GraduationCap,
  ChevronUp,
  ChevronDown,
  PieChart as PieIcon,
  BarChart as BarChartIcon
} from 'lucide-react';
import { studentApi, batchApi, attendanceApi } from '@/lib/api';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterBatch, setFilterBatch] = useState('');
  const [filterAttendance, setFilterAttendance] = useState('');
  
  // Sorting
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Stats
  const [stats, setStats] = useState({ total: 0, highAttendance: 0, lowAttendance: 0, noAttendance: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Students and Batches
      const [studentsRes, batchesRes] = await Promise.all([
        studentApi.getAll({ limit: 1000 }), // Get all for analytics
        batchApi.getAll(),
      ]);
      
      const studentsData = studentsRes.data || [];
      
      // 2. Fetch ALL Attendance (Optimized: Single query instead of N+1)
      let allAttendance = [];
      try {
        const attendanceRes = await attendanceApi.get({}); // Get all attendance
        allAttendance = attendanceRes.data || [];
      } catch (e) {
        console.error("Failed to load attendance", e);
      }
      
      // 3. Process Attendance in memory
      const studentsWithAttendance = studentsData.map(student => {
        const studentRecords = allAttendance.filter(r => r.studentId?._id === student._id || r.student_id === student._id);
        const totalRecords = studentRecords.length;
        const present = studentRecords.filter(r => r.status === 'present' || r.status === 'late').length;
        const attendancePercent = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : null;
        
        return { ...student, attendancePercent, totalRecords };
      });
      
      setStudents(studentsWithAttendance);
      setBatches(batchesRes.data || []);
      
      // Calculate stats
      const total = studentsWithAttendance.length;
      const highAttendance = studentsWithAttendance.filter(s => s.attendancePercent >= 80).length;
      const lowAttendance = studentsWithAttendance.filter(s => s.attendancePercent !== null && s.attendancePercent < 60).length;
      const noAttendance = studentsWithAttendance.filter(s => s.attendancePercent === null).length;
      setStats({ total, highAttendance, lowAttendance, noAttendance });
      
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtered and sorted students
  const filteredStudents = useMemo(() => {
    let result = [...students];
    
    // Search filter
    if (search) {
      const term = search.toLowerCase();
      result = result.filter(s => 
        s.name?.toLowerCase().includes(term) ||
        s.email?.toLowerCase().includes(term) ||
        s.phone?.includes(term)
      );
    }
    
    // Batch filter
    if (filterBatch) {
      result = result.filter(s => s.batchIds?.some(b => b._id === filterBatch));
    }
    
    // Attendance filter
    if (filterAttendance === 'high') {
      result = result.filter(s => s.attendancePercent >= 80);
    } else if (filterAttendance === 'medium') {
      result = result.filter(s => s.attendancePercent >= 60 && s.attendancePercent < 80);
    } else if (filterAttendance === 'low') {
      result = result.filter(s => s.attendancePercent !== null && s.attendancePercent < 60);
    } else if (filterAttendance === 'none') {
      result = result.filter(s => s.attendancePercent === null);
    }
    
    // Sorting
    result.sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      
      if (sortField === 'attendancePercent') {
        aVal = aVal ?? -1;
        bVal = bVal ?? -1;
      }
      
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = bVal?.toLowerCase() || '';
      }
      
      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
    
    return result;
  }, [students, search, filterBatch, filterAttendance, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />;
  };

  const downloadCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'DOB', 'Guardian', 'Guardian Phone', 'Address', 'Attendance %', 'Total Classes'];
    const rows = filteredStudents.map(s => [
      s.name || '',
      s.email || '',
      s.phone || '',
      s.dob ? format(new Date(s.dob), 'yyyy-MM-dd') : '',
      s.guardianName || '',
      s.guardianPhone || '',
      s.address || '',
      s.attendancePercent !== null ? `${s.attendancePercent}%` : 'N/A',
      s.totalRecords || 0,
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(v => `"${v}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_analytics_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getBatchNames = (batchIds) => {
    if (!batchIds?.length) return '-';
    // Handle both populated objects and ID strings
    return batchIds.map(b => b.name || batches.find(bt => bt._id === b)?.name || 'Unknown').join(', ');
  };

  const getAttendanceBadge = (percent) => {
    if (percent === null) return <Badge variant="outline">No data</Badge>;
    if (percent >= 80) return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">{percent}%</Badge>;
    if (percent >= 60) return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">{percent}%</Badge>;
    return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">{percent}%</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2 text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Comprehensive student data & performance</p>
        </div>
        <Button onClick={downloadCSV} disabled={filteredStudents.length === 0} className="w-full sm:w-auto">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">High Attd.</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-green-500">{stats.highAttendance}</div>
            <p className="text-xs text-muted-foreground">80%+</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">Low Attd.</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-red-500">{stats.lowAttendance}</div>
            <p className="text-xs text-muted-foreground">&lt;60%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4">
            <CardTitle className="text-sm font-medium">No Data</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{stats.noAttendance}</div>
            <p className="text-xs text-muted-foreground">Inactive/New</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="p-4 pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterBatch || '_all'} onValueChange={(val) => setFilterBatch(val === '_all' ? '' : val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Batches</SelectItem>
                {batches.map(batch => (
                  <SelectItem key={batch._id} value={batch._id}>{batch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAttendance || '_all'} onValueChange={(val) => setFilterAttendance(val === '_all' ? '' : val)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="All Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Attendance</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (60-79%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
                <SelectItem value="none">No Data</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setSearch(''); setFilterBatch(''); setFilterAttendance(''); }}>
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table - Overflow handling for Mobile */}
      <Card className="overflow-hidden">
        <CardHeader className="p-4">
          <CardTitle>Student Database ({filteredStudents.length})</CardTitle>
          <CardDescription>All student records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead className="cursor-pointer min-w-[200px]" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-1">Student <SortIcon field="name" /></div>
                  </TableHead>
                  <TableHead className="min-w-[150px]">Contact</TableHead>
                  <TableHead className="min-w-[150px]">Batches</TableHead>
                  <TableHead className="cursor-pointer min-w-[120px]" onClick={() => toggleSort('attendancePercent')}>
                    <div className="flex items-center gap-1">Attendance <SortIcon field="attendancePercent" /></div>
                  </TableHead>
                  <TableHead className="min-w-[150px]">Guardian</TableHead>
                  <TableHead className="min-w-[200px]">Address</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      No students match the current filters
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredStudents.map((student, index) => (
                    <TableRow 
                      key={student._id} 
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/students/${student._id}`)}
                    >
                      <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.photo} />
                            <AvatarFallback>{student.name?.charAt(0).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{student.name}</p>
                            {student.dob && <p className="text-xs text-muted-foreground">{format(new Date(student.dob), 'MMM d, yyyy')}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {student.email && <p className="truncate max-w-[150px]">{student.email}</p>}
                          {student.phone && <p className="text-muted-foreground">{student.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate" title={getBatchNames(student.batchIds)}>
                        {getBatchNames(student.batchIds)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAttendanceBadge(student.attendancePercent)}
                          <span className="text-xs text-muted-foreground">({student.totalRecords})</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {student.guardianName && <p>{student.guardianName}</p>}
                          {student.guardianPhone && <p className="text-muted-foreground">{student.guardianPhone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground" title={student.address}>
                        {student.address || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
