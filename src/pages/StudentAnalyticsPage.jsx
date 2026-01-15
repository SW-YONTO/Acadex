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
} from 'lucide-react';
import { studentApi, batchApi, attendanceApi } from '@/lib/api';
import { format, subDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export default function StudentAnalyticsPage() {
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
      const [studentsRes, batchesRes] = await Promise.all([
        studentApi.getAll({}),
        batchApi.getAll(),
      ]);
      
      const studentsData = studentsRes.data || [];
      
      // Fetch attendance for each student (last 30 days)
      const studentsWithAttendance = await Promise.all(
        studentsData.map(async (student) => {
          try {
            const attendanceRes = await attendanceApi.getByStudent(student._id);
            const records = attendanceRes.data || [];
            const totalRecords = records.length;
            const present = records.filter(r => r.status === 'present' || r.status === 'late').length;
            const attendancePercent = totalRecords > 0 ? Math.round((present / totalRecords) * 100) : null;
            return { ...student, attendancePercent, totalRecords };
          } catch {
            return { ...student, attendancePercent: null, totalRecords: 0 };
          }
        })
      );
      
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
      result = result.filter(s => s.batchIds?.includes(filterBatch));
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
    return batchIds.map(id => batches.find(b => b._id === id)?.name || 'Unknown').join(', ');
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
        <span className="ml-2 text-muted-foreground">Loading student analytics...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Student Analytics</h1>
          <p className="text-muted-foreground">Comprehensive view of all student data</p>
        </div>
        <Button onClick={downloadCSV} disabled={filteredStudents.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV ({filteredStudents.length})
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Enrolled in system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Attendance</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.highAttendance}</div>
            <p className="text-xs text-muted-foreground">80%+ attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Attendance</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.lowAttendance}</div>
            <p className="text-xs text-muted-foreground">Below 60%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Attendance Data</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.noAttendance}</div>
            <p className="text-xs text-muted-foreground">New or inactive</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search name, email, phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterBatch} onValueChange={setFilterBatch}>
              <SelectTrigger>
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Batches</SelectItem>
                {batches.map(batch => (
                  <SelectItem key={batch._id} value={batch._id}>{batch.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterAttendance} onValueChange={setFilterAttendance}>
              <SelectTrigger>
                <SelectValue placeholder="All Attendance" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Attendance</SelectItem>
                <SelectItem value="high">High (80%+)</SelectItem>
                <SelectItem value="medium">Medium (60-79%)</SelectItem>
                <SelectItem value="low">Low (&lt;60%)</SelectItem>
                <SelectItem value="none">No Data</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => { setSearch(''); setFilterBatch(''); setFilterAttendance(''); }}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Database ({filteredStudents.length})</CardTitle>
          <CardDescription>Click headers to sort • Click row to view details</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => toggleSort('name')}>
                    <div className="flex items-center gap-1">Student <SortIcon field="name" /></div>
                  </TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted" onClick={() => toggleSort('attendancePercent')}>
                    <div className="flex items-center gap-1">Attendance <SortIcon field="attendancePercent" /></div>
                  </TableHead>
                  <TableHead>Guardian</TableHead>
                  <TableHead>Address</TableHead>
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
                          {student.email && <p>{student.email}</p>}
                          {student.phone && <p className="text-muted-foreground">{student.phone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[150px] truncate">{getBatchNames(student.batchIds)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getAttendanceBadge(student.attendancePercent)}
                          <span className="text-xs text-muted-foreground">({student.totalRecords} classes)</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {student.guardianName && <p>{student.guardianName}</p>}
                          {student.guardianPhone && <p className="text-muted-foreground">{student.guardianPhone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
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
