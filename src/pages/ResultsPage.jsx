import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, Trophy, Medal, Loader2, TrendingUp } from 'lucide-react';
import { resultsApi, batchApi, studentApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const resultSchema = z.object({
  studentId: z.string().min(1, 'Student is required'),
  subject: z.string().min(1, 'Subject is required'),
  testName: z.string().optional(),
  marks: z.number().min(0, 'Marks must be positive'),
  totalMarks: z.number().min(1, 'Total marks must be at least 1'),
});

export default function ResultsPage() {
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [results, setResults] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(resultSchema),
    defaultValues: {
      studentId: '',
      subject: '',
      testName: '',
      marks: 0,
      totalMarks: 100,
    },
  });

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      loadData();
    }
  }, [selectedBatch, selectedSubject]);

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

  const loadData = async () => {
    setLoading(true);
    try {
      const [studentsRes, resultsRes, leaderboardRes] = await Promise.all([
        studentApi.getAll(selectedBatch),
        resultsApi.getAll({ batchId: selectedBatch, subject: selectedSubject || undefined }),
        resultsApi.getLeaderboard(selectedBatch, selectedSubject || undefined),
      ]);
      setStudents(studentsRes.data);
      setResults(resultsRes.data);
      setLeaderboard(leaderboardRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    form.reset({
      studentId: '',
      subject: '',
      testName: '',
      marks: 0,
      totalMarks: 100,
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      await resultsApi.create({ ...data, batchId: selectedBatch });
      setIsDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving result:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this result?')) return;
    try {
      await resultsApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting result:', error);
    }
  };

  // Get unique subjects from results
  const subjects = [...new Set(results.map((r) => r.subject))];
  const selectedBatchData = batches.find((b) => b._id === selectedBatch);
  const allSubjects = [...new Set([...(selectedBatchData?.subjects || []), ...subjects])];

  // Chart data
  const chartData = leaderboard.slice(0, 10).map((entry) => ({
    name: entry.studentName?.split(' ')[0] || 'Unknown',
    percentage: parseFloat(entry.percentage?.toFixed(1) || 0),
  }));

  const getRankBadge = (rank) => {
    if (rank === 1) return <Medal className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-orange-600" />;
    return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Test Results</h1>
          <p className="text-muted-foreground">Manage and analyze student performance</p>
        </div>
        <Button onClick={openAddDialog} disabled={!selectedBatch}>
          <Plus className="mr-2 h-4 w-4" />
          Add Result
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row">
        <Select value={selectedBatch} onValueChange={setSelectedBatch}>
          <SelectTrigger className="w-full md:w-[200px]">
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
        <Select value={selectedSubject || '_all'} onValueChange={(val) => setSelectedSubject(val === '_all' ? '' : val)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <SelectValue placeholder="All Subjects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All Subjects</SelectItem>
            {Array.isArray(allSubjects) && allSubjects.filter(Boolean).map((subject) => (
              <SelectItem key={subject} value={subject}>
                {subject}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          {/* Leaderboard & Chart */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Leaderboard */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Leaderboard</CardTitle>
                </div>
                <CardDescription>Top performers in this batch</CardDescription>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No results yet
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <Link
                        key={entry._id}
                        to={`/students/${entry.studentId}`}
                        className="flex items-center gap-4 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="w-8 flex justify-center">
                          {getRankBadge(index + 1)}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {entry.studentName?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium hover:text-primary transition-colors">{entry.studentName}</p>
                          <p className="text-xs text-muted-foreground">
                            {entry.testCount} test{entry.testCount !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <Badge variant="outline" className="font-mono">
                          {entry.percentage?.toFixed(1)}%
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <CardTitle>Performance Overview</CardTitle>
                </div>
                <CardDescription>Top 10 students by percentage</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No data available
                  </div>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis type="number" domain={[0, 100]} className="text-xs" />
                        <YAxis type="category" dataKey="name" className="text-xs" width={60} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'hsl(var(--card))',
                            border: '1px solid hsl(var(--border))',
                            borderRadius: '8px',
                          }}
                        />
                        <Bar dataKey="percentage" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Results Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Results</CardTitle>
              <CardDescription>Individual test results</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Test</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Percentage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {results.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No results found
                      </TableCell>
                    </TableRow>
                  ) : (
                    results.map((result) => {
                      const percentage = ((result.marks / result.totalMarks) * 100).toFixed(1);
                      return (
                        <TableRow key={result._id}>
                          <TableCell>
                            <Link 
                              to={`/students/${result.studentId?._id}`}
                              className="flex items-center gap-2 hover:text-primary transition-colors"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {result.studentId?.name?.charAt(0) || '?'}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{result.studentId?.name || 'Unknown'}</span>
                            </Link>
                          </TableCell>
                          <TableCell>{result.subject}</TableCell>
                          <TableCell>{result.testName || '-'}</TableCell>
                          <TableCell>
                            {result.marks}/{result.totalMarks}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                parseFloat(percentage) >= 80
                                  ? 'bg-green-500/10 text-green-600'
                                  : parseFloat(percentage) >= 60
                                  ? 'bg-yellow-500/10 text-yellow-600'
                                  : 'bg-red-500/10 text-red-600'
                              }
                            >
                              {percentage}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-destructive"
                              onClick={() => handleDelete(result._id)}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      {/* Add Result Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Test Result</DialogTitle>
            <DialogDescription>Enter student test result</DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="studentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Student *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student._id} value={student._id}>
                            {student.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="subject"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mathematics" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="testName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Test Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mid-term Exam" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="marks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marks Obtained *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalMarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Marks *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Result
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
