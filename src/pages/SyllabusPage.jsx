import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, GripVertical, Loader2, BookOpen } from 'lucide-react';
import { syllabusApi, batchApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { format } from 'date-fns';

const syllabusSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  dueDate: z.string().optional(),
});

export default function SyllabusPage() {
  const [batches, setBatches] = useState([]);
  const [syllabus, setSyllabus] = useState([]);
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [selectedBatch, setSelectedBatch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState(null);
  const [saving, setSaving] = useState(false);

  const form = useForm({
    resolver: zodResolver(syllabusSchema),
    defaultValues: {
      title: '',
      subject: '',
      description: '',
      dueDate: '',
    },
  });

  useEffect(() => {
    loadBatches();
  }, []);

  useEffect(() => {
    if (selectedBatch) {
      loadSyllabus();
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

  const loadSyllabus = async () => {
    setLoading(true);
    try {
      const [syllabusRes, progressRes] = await Promise.all([
        syllabusApi.getAll({ batchId: selectedBatch, subject: selectedSubject || undefined }),
        syllabusApi.getProgress(selectedBatch, selectedSubject || undefined),
      ]);
      setSyllabus(syllabusRes.data);
      setProgress(progressRes.data);
    } catch (error) {
      console.error('Error loading syllabus:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingTopic(null);
    form.reset({
      title: '',
      subject: '',
      description: '',
      dueDate: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (topic) => {
    setEditingTopic(topic);
    form.reset({
      title: topic.title,
      subject: topic.subject,
      description: topic.description || '',
      dueDate: topic.dueDate ? topic.dueDate.split('T')[0] : '',
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data) => {
    setSaving(true);
    try {
      if (editingTopic) {
        await syllabusApi.update(editingTopic._id, data);
      } else {
        await syllabusApi.create({ ...data, batchId: selectedBatch });
      }
      setIsDialogOpen(false);
      loadSyllabus();
    } catch (error) {
      console.error('Error saving topic:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (topicId) => {
    try {
      await syllabusApi.toggle(topicId);
      loadSyllabus();
    } catch (error) {
      console.error('Error toggling completion:', error);
    }
  };

  const handleDelete = async (topicId) => {
    if (!confirm('Are you sure you want to delete this topic?')) return;
    try {
      await syllabusApi.delete(topicId);
      loadSyllabus();
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  // Get unique subjects from syllabus
  const subjects = [...new Set(syllabus.map((s) => s.subject))];
  const selectedBatchData = batches.find((b) => b._id === selectedBatch);
  const allSubjects = [...new Set([...(selectedBatchData?.subjects || []), ...subjects])];

  // Group syllabus by subject
  const groupedSyllabus = syllabus.reduce((acc, topic) => {
    if (!acc[topic.subject]) acc[topic.subject] = [];
    acc[topic.subject].push(topic);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Syllabus</h1>
          <p className="text-muted-foreground">Track syllabus progress and topics</p>
        </div>
        <Button onClick={openAddDialog} disabled={!selectedBatch}>
          <Plus className="mr-2 h-4 w-4" />
          Add Topic
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

      {/* Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Overall Progress</CardTitle>
          <CardDescription>
            {progress.completed} of {progress.total} topics completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={parseFloat(progress.percentage)} className="h-3" />
          <p className="text-sm text-muted-foreground mt-2">
            {progress.percentage}% complete
          </p>
        </CardContent>
      </Card>

      {/* Syllabus List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : syllabus.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BookOpen className="h-12 w-12 mb-4" />
            <p>No syllabus topics yet</p>
            <Button className="mt-4" onClick={openAddDialog} disabled={!selectedBatch}>
              <Plus className="mr-2 h-4 w-4" />
              Add First Topic
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSyllabus).map(([subject, topics]) => (
            <Card key={subject}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{subject}</CardTitle>
                  <Badge variant="outline">
                    {topics.filter((t) => t.completed).length}/{topics.length} completed
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {topics.map((topic, index) => (
                    <div
                      key={topic._id}
                      className={`flex items-center gap-4 p-3 rounded-lg border ${
                        topic.completed ? 'bg-muted/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Checkbox
                          checked={topic.completed}
                          onCheckedChange={() => toggleComplete(topic._id)}
                        />
                        <div className="flex-1">
                          <p className={`font-medium ${topic.completed ? 'line-through text-muted-foreground' : ''}`}>
                            {topic.title}
                          </p>
                          {topic.description && (
                            <p className="text-sm text-muted-foreground">{topic.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {topic.dueDate && (
                          <Badge variant="outline" className="text-xs">
                            Due: {format(new Date(topic.dueDate), 'MMM d')}
                          </Badge>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(topic)}>
                          <GripVertical className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDelete(topic._id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Edit Topic' : 'Add Topic'}</DialogTitle>
            <DialogDescription>
              {editingTopic ? 'Update topic details' : 'Add a new topic to the syllabus'}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Introduction to Algebra" {...field} />
                    </FormControl>
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
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Optional description..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="dueDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Due Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
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
                  {editingTopic ? 'Save Changes' : 'Add Topic'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
