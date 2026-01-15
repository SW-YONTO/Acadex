import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Search, Filter, MoreHorizontal, Pencil, Trash2, Eye, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { studentApi, batchApi, studentExitsApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const studentSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  dob: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
  aadharNumber: z.string().optional(),
  batchIds: z.array(z.string()).optional(),
});

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [totalPages, setTotalPages] = useState(1);

  const search = searchParams.get('search') || '';
  const filterBatch = searchParams.get('batch') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const editId = searchParams.get('edit');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Exit tracking state
  const [isExitDialogOpen, setIsExitDialogOpen] = useState(false);
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [exitType, setExitType] = useState('left');
  const [exitReason, setExitReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const form = useForm({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      dob: '',
      guardianName: '',
      guardianPhone: '',
      address: '',
      aadharNumber: '',
      batchIds: [],
    },
  });


  useEffect(() => {
    loadData();
  }, [search, filterBatch, page]);

  useEffect(() => {
    if (editId) {
      loadStudentForEdit(editId);
    }
  }, [editId]);

  const loadStudentForEdit = async (id) => {
    try {
      // Check if already in list
      const existing = students.find(s => s._id === id);
      if (existing) {
        openEditDialog(existing);
        return;
      }
      
      // If not, fetch
      setLoading(true);
      const { data } = await studentApi.getOne(id);
      setLoading(false);
      if (data) openEditDialog(data);
    } catch (e) {
      console.error('Error loading student for edit:', e);
      setLoading(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, batchesRes] = await Promise.all([
        studentApi.getAll({ 
          page, 
          limit: 10, 
          search, 
          batchId: filterBatch || undefined 
        }),
        batchApi.getAll(),
      ]);
      setStudents(studentsRes.data);
      setTotalPages(studentsRes.totalPages || 1);
      setBatches(batchesRes.data);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  // No need to filter locally anymore
  const filteredStudents = students;

  const openAddDialog = () => {
    setEditingStudent(null);
    form.reset({
      name: '',
      email: '',
      phone: '',
      dob: '',
      guardianName: '',
      guardianPhone: '',
      address: '',
      aadharNumber: '',
      batchIds: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (student) => {
    setEditingStudent(student);
    form.reset({
      name: student.name,
      email: student.email || '',
      phone: student.phone || '',
      dob: student.dob ? student.dob.split('T')[0] : '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      address: student.address || '',
      aadharNumber: student.aadharNumber || '',
      batchIds: student.batchIds?.map(b => b._id || b) || [],
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editingStudent) {
        await studentApi.update(editingStudent._id, data);
      } else {
        await studentApi.create(data);
      }
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving student:', error);
    } finally {
      setSaving(false);
    }
  };

  const openExitDialog = (student) => {
    setDeletingStudent(student);
    setExitType('left');
    setExitReason('');
    setIsExitDialogOpen(true);
  };

  const handleDeleteWithExit = async () => {
    if (!deletingStudent) return;
    setDeleting(true);
    try {
      // Save exit record
      await studentExitsApi.create({
        studentId: deletingStudent._id,
        studentName: deletingStudent.name,
        exitType,
        reason: exitReason,
        batchIds: deletingStudent.batchIds?.map(b => b._id || b) || [],
      });
      
      // Delete student
      await studentApi.delete(deletingStudent._id);
      
      setIsExitDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error deleting student:', error);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Students</h1>
          <p className="text-muted-foreground">Manage your students</p>
        </div>
        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => {
                  const newSearch = e.target.value;
                  setSearchParams(prev => {
                    const next = new URLSearchParams(prev);
                    if (newSearch) next.set('search', newSearch);
                    else next.delete('search');
                    next.set('page', '1'); // Reset to page 1
                    return next;
                  });
                }}
                className="pl-10"
              />
            </div>
            <Select 
              value={filterBatch || '_all'} 
              onValueChange={(val) => {
                const newBatch = val === '_all' ? '' : val;
                setSearchParams(prev => {
                  const next = new URLSearchParams(prev);
                  if (newBatch) next.set('batch', newBatch);
                  else next.delete('batch');
                  next.set('page', '1'); // Reset to page 1
                  return next;
                });
              }}
            >
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Batches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All Batches</SelectItem>
                {Array.isArray(batches) && batches.filter(b => b && b._id).map((batch) => (
                  <SelectItem key={batch._id} value={batch._id}>
                    {batch.name || 'Unnamed Batch'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Students Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Batch</TableHead>
                <TableHead>Guardian</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No students found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow 
                    key={student._id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => window.location.href = `/students/${student._id}`}
                  >
                    <TableCell>
                      <Link 
                        to={`/students/${student._id}`} 
                        className="flex items-center gap-3"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Avatar>
                          <AvatarImage src={student.photo} />
                          <AvatarFallback>
                            {student.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium hover:text-primary transition-colors">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{student.phone || '-'}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {student.batchIds?.map((batch) => (
                          <Badge key={batch._id || batch} variant="outline">
                            {batch.name || 'Unknown'}
                          </Badge>
                        ))}
                        {(!student.batchIds || student.batchIds.length === 0) && (
                          <span className="text-muted-foreground text-sm">No batch</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm">{student.guardianName || '-'}</p>
                      <p className="text-xs text-muted-foreground">{student.guardianPhone}</p>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/students/${student._id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditDialog(student)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => openExitDialog(student)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Student
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('page', String(page - 1));
            return next;
          })}
          disabled={page <= 1 || loading}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <div className="text-sm font-medium">
          Page {page} of {totalPages}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.set('page', String(page + 1));
            return next;
          })}
          disabled={page >= totalPages || loading}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open && editId) {
          setSearchParams(prev => {
            const next = new URLSearchParams(prev);
            next.delete('edit');
            return next;
          });
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingStudent ? 'Edit Student' : 'Add Student'}</DialogTitle>
            <DialogDescription>
              {editingStudent ? 'Update student information' : 'Add a new student to your academy'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Student name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="student@email.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 XXXXX XXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Parent/Guardian name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="guardianPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guardian Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+91 XXXXX XXXXX" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input placeholder="Full address" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="aadharNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Aadhar Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="12 digit Aadhar" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="batchIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch</FormLabel>
                    <Select 
                      value={field.value?.[0] || ''} 
                      onValueChange={(value) => field.onChange(value ? [value] : [])}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a batch" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {batches.map((batch) => (
                          <SelectItem key={batch._id} value={batch._id}>
                            {batch.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingStudent ? 'Save Changes' : 'Add Student'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Exit Dialog */}
      <Dialog open={isExitDialogOpen} onOpenChange={setIsExitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Student</DialogTitle>
            <DialogDescription>
              Please specify why {deletingStudent?.name} is leaving
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Exit Type</Label>
              <Select value={exitType} onValueChange={setExitType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Left Voluntarily</SelectItem>
                  <SelectItem value="kicked">Kicked / Removed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reason</Label>
              <Input 
                placeholder="Enter reason for exit..." 
                value={exitReason} 
                onChange={(e) => setExitReason(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExitDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteWithExit} disabled={deleting}>
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Remove Student
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
