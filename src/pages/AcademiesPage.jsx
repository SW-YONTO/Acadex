import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Pencil, Loader2, School, Users, Calendar } from 'lucide-react';
import { academyApi, batchApi } from '@/lib/api';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const academySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});

const batchSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  schedule: z.string().optional(),
  subjects: z.string().optional(),
});

export default function AcademiesPage() {
  const [academies, setAcademies] = useState([]);
  const [batches, setBatches] = useState({});
  const [loading, setLoading] = useState(true);
  const [isAcademyDialogOpen, setIsAcademyDialogOpen] = useState(false);
  const [isBatchDialogOpen, setIsBatchDialogOpen] = useState(false);
  const [editingAcademy, setEditingAcademy] = useState(null);
  const [selectedAcademyForBatch, setSelectedAcademyForBatch] = useState(null);
  const [editingBatch, setEditingBatch] = useState(null);
  const [saving, setSaving] = useState(false);

  const academyForm = useForm({
    resolver: zodResolver(academySchema),
    defaultValues: { name: '', description: '' },
  });

  const batchForm = useForm({
    resolver: zodResolver(batchSchema),
    defaultValues: { name: '', schedule: '', subjects: '' },
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const academiesRes = await academyApi.getAll();
      setAcademies(academiesRes.data);
      
      // Load batches for each academy
      const batchesMap = {};
      for (const academy of academiesRes.data) {
        const batchRes = await batchApi.getAll(academy._id);
        batchesMap[academy._id] = batchRes.data;
      }
      setBatches(batchesMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openAddAcademyDialog = () => {
    setEditingAcademy(null);
    academyForm.reset({ name: '', description: '' });
    setIsAcademyDialogOpen(true);
  };

  const openEditAcademyDialog = (academy) => {
    setEditingAcademy(academy);
    academyForm.reset({ name: academy.name, description: academy.description || '' });
    setIsAcademyDialogOpen(true);
  };

  const onAcademySubmit = async (data) => {
    setSaving(true);
    try {
      if (editingAcademy) {
        await academyApi.update(editingAcademy._id, data);
      } else {
        await academyApi.create(data);
      }
      setIsAcademyDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving academy:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAcademy = async (id) => {
    if (!confirm('This will delete all batches in this academy. Continue?')) return;
    try {
      await academyApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting academy:', error);
    }
  };

  const openAddBatchDialog = (academyId) => {
    setSelectedAcademyForBatch(academyId);
    setEditingBatch(null);
    batchForm.reset({ name: '', schedule: '', subjects: '' });
    setIsBatchDialogOpen(true);
  };

  const openEditBatchDialog = (batch, academyId) => {
    setSelectedAcademyForBatch(academyId);
    setEditingBatch(batch);
    batchForm.reset({
      name: batch.name,
      schedule: batch.schedule || '',
      subjects: batch.subjects?.join(', ') || '',
    });
    setIsBatchDialogOpen(true);
  };

  const onBatchSubmit = async (data) => {
    setSaving(true);
    try {
      const batchData = {
        ...data,
        academyId: selectedAcademyForBatch,
        subjects: data.subjects ? data.subjects.split(',').map(s => s.trim()) : [],
      };
      if (editingBatch) {
        await batchApi.update(editingBatch._id, batchData);
      } else {
        await batchApi.create(batchData);
      }
      setIsBatchDialogOpen(false);
      loadData();
    } catch (error) {
      console.error('Error saving batch:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBatch = async (id) => {
    if (!confirm('Are you sure you want to delete this batch?')) return;
    try {
      await batchApi.delete(id);
      loadData();
    } catch (error) {
      console.error('Error deleting batch:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Academies & Batches</h1>
          <p className="text-muted-foreground">Manage your academies and their batches</p>
        </div>
        <Button onClick={openAddAcademyDialog} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Academy
        </Button>
      </div>

      {academies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <School className="h-12 w-12 mb-4" />
            <p>No academies yet</p>
            <Button className="mt-4" onClick={openAddAcademyDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Academy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {academies.map((academy) => (
            <Card key={academy._id}>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <School className="h-5 w-5 text-primary" />
                      <CardTitle>{academy.name}</CardTitle>
                    </div>
                    {academy.description && (
                      <CardDescription className="mt-1">{academy.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => openAddBatchDialog(academy._id)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Batch
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openEditAcademyDialog(academy)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleDeleteAcademy(academy._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {batches[academy._id]?.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                    {batches[academy._id].map((batch) => (
                      <Link key={batch._id} to={`/batch/${batch._id}`} className="block">
                        <Card className="border-dashed hover:border-primary hover:shadow-md transition-all cursor-pointer">
                          <CardContent className="pt-4">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium">{batch.name}</p>
                                {batch.schedule && (
                                  <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                                    <Calendar className="h-3 w-3" />
                                    {batch.schedule}
                                  </div>
                                )}
                                {batch.subjects?.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {batch.subjects.map((subject) => (
                                      <Badge key={subject} variant="secondary" className="text-xs">
                                        {subject}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1" onClick={(e) => e.preventDefault()}>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openEditBatchDialog(batch, academy._id);
                                  }}
                                >
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDeleteBatch(batch._id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No batches yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Academy Dialog */}
      <Dialog open={isAcademyDialogOpen} onOpenChange={setIsAcademyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAcademy ? 'Edit Academy' : 'Add Academy'}</DialogTitle>
            <DialogDescription>
              {editingAcademy ? 'Update academy details' : 'Create a new academy'}
            </DialogDescription>
          </DialogHeader>
          <Form {...academyForm}>
            <form onSubmit={academyForm.handleSubmit(onAcademySubmit)} className="space-y-4">
              <FormField
                control={academyForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academy Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Science Academy" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={academyForm.control}
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
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAcademyDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingAcademy ? 'Save Changes' : 'Create Academy'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Batch Dialog */}
      <Dialog open={isBatchDialogOpen} onOpenChange={setIsBatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingBatch ? 'Edit Batch' : 'Add Batch'}</DialogTitle>
            <DialogDescription>
              {editingBatch ? 'Update batch details' : 'Create a new batch'}
            </DialogDescription>
          </DialogHeader>
          <Form {...batchForm}>
            <form onSubmit={batchForm.handleSubmit(onBatchSubmit)} className="space-y-4">
              <FormField
                control={batchForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Batch Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Batch 2024 - Morning" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={batchForm.control}
                name="schedule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Schedule</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Mon-Fri 9AM-12PM" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={batchForm.control}
                name="subjects"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subjects (comma-separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Math, Physics, Chemistry" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBatchDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingBatch ? 'Save Changes' : 'Create Batch'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
