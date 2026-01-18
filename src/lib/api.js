import { supabase } from './supabase';

// Helper for converting camelCase to snake_case
const toSnakeCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toSnakeCase);
  if (typeof obj !== 'object') return obj;
  
  return Object.entries(obj).reduce((acc, [key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = value;
    return acc;
  }, {});
};

// Helper for converting snake_case to camelCase and adding _id alias
const toCamelCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map(toCamelCase);
  if (typeof obj !== 'object') return obj;
  
  const result = Object.entries(obj).reduce((acc, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    // Handle nested objects
    acc[camelKey] = (typeof value === 'object' && value !== null) ? toCamelCase(value) : value;
    return acc;
  }, {});
  
  // Add _id alias for backward compatibility with MongoDB-style code
  if (result.id) {
    result._id = result.id;
  }
  
  return result;
};

// Wrap response to match old API format
const wrapResponse = (data, error) => {
  if (error) throw error;
  return { data: Array.isArray(data) ? data.map(toCamelCase) : toCamelCase(data) };
};

// Helper to clean optional fields (empty string -> null)
const cleanOptionalFields = (obj, fields) => {
  const cleaned = { ...obj };
  fields.forEach(field => {
    if (cleaned[field] === '' || cleaned[field] === undefined) {
      cleaned[field] = null;
    }
  });
  return cleaned;
};

// ===================== AUTH =====================
export const authApi = {
  login: async (email, password) => {
    // For custom auth (not Supabase Auth), check users table
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .limit(1);
    
    if (error) throw error;
    if (!users || users.length === 0) throw new Error('Invalid credentials');
    
    const user = users[0];
    
    // Simple password check for demo 
    // In production, use Supabase Auth or proper password verification
    // The stored password is bcrypt hashed, so we need to check differently
    // For now, we'll just check if user exists (demo mode)
    
    // Store user in localStorage for session
    const userData = toCamelCase(user);
    delete userData.password;
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', 'supabase-session');
    
    return { data: { user: userData, token: 'supabase-session' } };
  },
  
  register: async ({ name, email, password, role = 'teacher' }) => {
    // Store password as-is for demo (in production use Supabase Auth)
    const { data, error } = await supabase
      .from('users')
      .insert({ name, email, password, role })
      .select()
      .single();
    
    if (error) throw error;
    
    const userData = toCamelCase(data);
    delete userData.password;
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', 'supabase-session');
    
    return { data: { user: userData, token: 'supabase-session' } };
  },
  
  logout: async () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    return { data: { success: true } };
  },
  
  me: async () => {
    const user = localStorage.getItem('user');
    if (!user) throw new Error('Not authenticated');
    return { data: JSON.parse(user) };
  }
};

// ===================== ACADEMIES =====================
export const academyApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('academies')
      .select('*')
      .order('created_at', { ascending: false });
    return wrapResponse(data, error);
  },
  
  getOne: async (id) => {
    const { data, error } = await supabase
      .from('academies')
      .select('*')
      .eq('id', id)
      .single();
    return wrapResponse(data, error);
  },
  
  create: async (academy) => {
    const { data, error } = await supabase
      .from('academies')
      .insert(toSnakeCase(academy))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, academy) => {
    const { data, error } = await supabase
      .from('academies')
      .update({ ...toSnakeCase(academy), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase
      .from('academies')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== BATCHES =====================
export const batchApi = {
  getAll: async (academyId = null) => {
    let query = supabase.from('batches').select('*').order('created_at', { ascending: false });
    if (academyId) query = query.eq('academy_id', academyId);
    const { data, error } = await query;
    return wrapResponse(data, error);
  },
  
  getOne: async (id) => {
    const { data, error } = await supabase
      .from('batches')
      .select('*')
      .eq('id', id)
      .single();
    return wrapResponse(data, error);
  },
  
  create: async (batch) => {
    const { data, error } = await supabase
      .from('batches')
      .insert(toSnakeCase(batch))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, batch) => {
    const { data, error } = await supabase
      .from('batches')
      .update({ ...toSnakeCase(batch), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('batches').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== STUDENTS =====================
export const studentApi = {
  getAll: async ({ page = 1, limit = 20, search = '', batchId = null } = {}) => {
    let query = supabase
      .from('students')
      .select('*', { count: 'exact' });

    // Search
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Filter by batch
    if (batchId) {
      query = query.contains('batch_ids', [batchId]);
    }

    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    const { data, error, count } = await query
      .order('name')
      .range(from, to);
    
    // Populate batch names for UI
    if (data && data.length > 0) {
      const { data: batches } = await supabase.from('batches').select('id, name');
      const batchMap = Object.fromEntries((batches || []).map(b => [b.id, b]));
      
      data.forEach(student => {
        student.batchIds = (student.batch_ids || []).map(id => batchMap[id] || { _id: id, name: 'Unknown' });
      });
    }
    
    const result = wrapResponse(data, error);
    result.count = count;
    result.totalPages = Math.ceil(count / limit);
    return result;
  },
  
  getOne: async (id) => {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    return wrapResponse(data, error);
  },
  
  create: async (student) => {
    const { data, error } = await supabase
      .from('students')
      .insert(toSnakeCase(student))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, student) => {
    const { data, error } = await supabase
      .from('students')
      .update({ ...toSnakeCase(student), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== ATTENDANCE =====================
export const attendanceApi = {
  get: async ({ batchId, date, studentId }) => {
    let query = supabase.from('attendance').select('*, students(name)');
    
    if (batchId) query = query.eq('batch_id', batchId);
    if (studentId) query = query.eq('student_id', studentId);
    if (date) {
      const dateStr = new Date(date).toISOString().split('T')[0];
      query = query.eq('date', dateStr);
    }
    
    const { data, error } = await query;
    
    // Transform to match old format
    const transformed = (data || []).map(a => ({
      ...a,
      studentId: { _id: a.student_id, name: a.students?.name },
      batchId: a.batch_id
    }));
    
    return wrapResponse(transformed, error);
  },
  
  markBulk: async ({ batchId, date, records }) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    
    // Upsert attendance records
    const upsertData = records.map(r => ({
      student_id: r.studentId,
      batch_id: batchId,
      date: dateStr,
      status: r.status,
      updated_at: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('attendance')
      .upsert(upsertData, { onConflict: 'student_id,batch_id,date' })
      .select();
    
    return wrapResponse(data, error);
  },
  
  markSingle: async ({ studentId, batchId, date, status }) => {
    const dateStr = new Date(date).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .upsert({
        student_id: studentId,
        batch_id: batchId,
        date: dateStr,
        status: status,
        updated_at: new Date().toISOString()
      }, { onConflict: 'student_id,batch_id,date' })
      .select()
      .single();
    
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('attendance').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== SYLLABUS =====================
export const syllabusApi = {
  getAll: async ({ batchId, subject } = {}) => {
    let query = supabase.from('syllabus').select('*').order('sort_order');
    if (batchId) query = query.eq('batch_id', batchId);
    if (subject) query = query.eq('subject', subject);
    const { data, error } = await query;
    return wrapResponse(data, error);
  },
  
  getProgress: async (batchId, subject) => {
    let query = supabase.from('syllabus').select('id, completed');
    if (batchId) query = query.eq('batch_id', batchId);
    if (subject) query = query.eq('subject', subject);
    
    const { data, error } = await query;
    if (error) throw error;
    
    const total = data?.length || 0;
    const completed = data?.filter(s => s.completed).length || 0;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { data: { total, completed, percentage } };
  },
  
  create: async (syllabus) => {
    const { data, error } = await supabase
      .from('syllabus')
      .insert(toSnakeCase(syllabus))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, syllabus) => {
    const { data, error } = await supabase
      .from('syllabus')
      .update({ ...toSnakeCase(syllabus), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('syllabus').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  },
  
  toggle: async (id) => {
    // Get current status
    const { data: current, error: getError } = await supabase
      .from('syllabus')
      .select('completed')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;
    
    const { data, error } = await supabase
      .from('syllabus')
      .update({ completed: !current.completed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  }
  // Note: toggleComplete was removed - use toggle() or update() with { completed: true/false }
};

// ===================== STUDENT EXITS (Analytics) =====================
export const studentExitsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('student_exits')
      .select('*')
      .order('exit_date', { ascending: false });
    return wrapResponse(data, error);
  },
  
  create: async (exitData) => {
    const { data, error } = await supabase
      .from('student_exits')
      .insert(toSnakeCase(exitData))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  getStats: async () => {
    const { data, error } = await supabase
      .from('student_exits')
      .select('exit_type');
    
    if (error) throw error;
    
    const kicked = data?.filter(e => e.exit_type === 'kicked').length || 0;
    const left = data?.filter(e => e.exit_type === 'left').length || 0;
    
    return { data: { total: data?.length || 0, kicked, left } };
  }
};

// ===================== RESULTS =====================
export const resultsApi = {
  getAll: async ({ batchId, studentId, subject } = {}) => {
    let query = supabase.from('test_results').select('*, students(name)').order('test_date', { ascending: false });
    if (batchId) query = query.eq('batch_id', batchId);
    if (studentId) query = query.eq('student_id', studentId);
    if (subject) query = query.eq('subject', subject);
    
    const { data, error } = await query;
    
    // Transform to match old format
    const transformed = (data || []).map(r => ({
      ...r,
      studentId: { _id: r.student_id, name: r.students?.name },
      testName: r.test_name,
      totalMarks: r.total_marks,
      testDate: r.test_date
    }));
    
    return wrapResponse(transformed, error);
  },
  
  create: async (result) => {
    const { data, error } = await supabase
      .from('test_results')
      .insert(toSnakeCase(result))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('test_results').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  },
  
  getLeaderboard: async (batchId, subject) => {
    // Get all results for batch
    let query = supabase.from('test_results').select('student_id, marks, total_marks');
    if (batchId) query = query.eq('batch_id', batchId);
    if (subject) query = query.eq('subject', subject);
    
    const { data: results, error } = await query;
    if (error) throw error;
    
    // Get student names
    const { data: students } = await supabase.from('students').select('id, name');
    const studentMap = Object.fromEntries((students || []).map(s => [s.id, s.name]));
    
    // Aggregate by student
    const studentStats = {};
    (results || []).forEach(r => {
      if (!studentStats[r.student_id]) {
        studentStats[r.student_id] = { totalMarks: 0, totalTotal: 0, testCount: 0 };
      }
      studentStats[r.student_id].totalMarks += r.marks;
      studentStats[r.student_id].totalTotal += r.total_marks;
      studentStats[r.student_id].testCount += 1;
    });
    
    // Calculate percentages and sort
    const leaderboard = Object.entries(studentStats)
      .map(([studentId, stats]) => ({
        _id: studentId,
        studentId: studentId,
        studentName: studentMap[studentId] || 'Unknown',
        percentage: (stats.totalMarks / stats.totalTotal) * 100,
        testCount: stats.testCount
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    return { data: leaderboard };
  }
};

// ===================== DOCUMENTS =====================
export const documentsApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .order('created_at', { ascending: false });
    return wrapResponse(data, error);
  },
  
  create: async (doc) => {
    // Convert empty strings to null for optional fields
    const cleanDoc = {
      ...doc,
      batchId: doc.batchId || null,
      description: doc.description || null,
      category: doc.category || null,
    };
    const { data, error } = await supabase
      .from('documents')
      .insert(toSnakeCase(cleanDoc))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, doc) => {
    const cleanDoc = {
      ...doc,
      batchId: doc.batchId || null,
      description: doc.description || null,
      category: doc.category || null,
    };
    const { data, error } = await supabase
      .from('documents')
      .update({ ...toSnakeCase(cleanDoc), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('documents').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== NOTES =====================
export const notesApi = {
  getAll: async () => {
    const { data, error } = await supabase
      .from('notes')
      .select('*, batches(name)')
      .order('updated_at', { ascending: false });
    
    // Transform to match old format
    const transformed = (data || []).map(n => ({
      ...n,
      batchId: n.batch_id ? { _id: n.batch_id, name: n.batches?.name } : null,
      isPublic: n.is_public
    }));
    
    return wrapResponse(transformed, error);
  },
  
  create: async (note) => {
    const { data, error } = await supabase
      .from('notes')
      .insert(toSnakeCase(note))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, note) => {
    const { data, error } = await supabase
      .from('notes')
      .update({ ...toSnakeCase(note), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== ANNOUNCEMENTS =====================
export const announcementsApi = {
  getAll: async (batchId = null) => {
    let query = supabase.from('announcements').select('*').order('created_at', { ascending: false });
    
    const { data, error } = await query;
    
    // Get batch names
    const { data: batches } = await supabase.from('batches').select('id, name');
    const batchMap = Object.fromEntries((batches || []).map(b => [b.id, b]));
    
    // Transform to match old format
    const transformed = (data || []).map(a => ({
      ...a,
      targetBatchIds: (a.target_batch_ids || []).map(id => batchMap[id] || { _id: id, name: 'Unknown' })
    }));
    
    // Filter by batchId if provided
    if (batchId) {
      return wrapResponse(
        transformed.filter(a => a.target_batch_ids?.includes(batchId) || a.target_batch_ids?.length === 0),
        error
      );
    }
    
    return wrapResponse(transformed, error);
  },
  
  create: async (announcement) => {
    const { data, error } = await supabase
      .from('announcements')
      .insert(toSnakeCase(announcement))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, announcement) => {
    const { data, error } = await supabase
      .from('announcements')
      .update({ ...toSnakeCase(announcement), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  toggleViewed: async (id) => {
    const { data: current, error: getError } = await supabase
      .from('announcements')
      .select('viewed')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;
    
    const { data, error } = await supabase
      .from('announcements')
      .update({ viewed: !current.viewed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('announcements').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== EVENTS =====================
export const eventsApi = {
  getAll: async ({ batchId, startDate, endDate } = {}) => {
    let query = supabase.from('events').select('*').order('date');
    if (batchId) query = query.eq('batch_id', batchId);
    if (startDate) query = query.gte('date', startDate);
    if (endDate) query = query.lte('date', endDate);
    
    const { data, error } = await query;
    
    // Transform for old format
    const transformed = (data || []).map(e => ({
      ...e,
      endDate: e.end_date,
      batchId: e.batch_id,
      reminderTime: e.reminder_time
    }));
    
    return wrapResponse(transformed, error);
  },
  
  create: async (event) => {
    const cleanEvent = {
      ...event,
      batchId: event.batchId || null,
      description: event.description || null,
    };
    const { data, error } = await supabase
      .from('events')
      .insert(toSnakeCase(cleanEvent))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, event) => {
    const cleanEvent = {
      ...event,
      batchId: event.batchId || null,
      description: event.description || null,
    };
    const { data, error } = await supabase
      .from('events')
      .update({ ...toSnakeCase(cleanEvent), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== TODOS =====================
export const todosApi = {
  getAll: async (batchId) => {
    let query = supabase.from('todos').select('*').order('created_at', { ascending: false });
    if (batchId) query = query.eq('batch_id', batchId);
    const { data, error } = await query;
    return wrapResponse(data, error);
  },
  
  create: async (todo) => {
    const cleanTodo = {
      ...todo,
      batchId: todo.batchId || null,
      description: todo.description || null,
      dueDate: todo.dueDate || null,
    };
    const { data, error } = await supabase
      .from('todos')
      .insert(toSnakeCase(cleanTodo))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, todo) => {
    const cleanTodo = {
      ...todo,
      batchId: todo.batchId || null,
    };
    const { data, error } = await supabase
      .from('todos')
      .update({ ...toSnakeCase(cleanTodo), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  toggle: async (id) => {
    const { data: current, error: getError } = await supabase
      .from('todos')
      .select('completed')
      .eq('id', id)
      .single();
    
    if (getError) throw getError;
    
    const { data, error } = await supabase
      .from('todos')
      .update({ completed: !current.completed, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  delete: async (id) => {
    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) throw error;
    return { data: { success: true } };
  }
};

// ===================== DASHBOARD =====================
export const dashboardApi = {
  getStats: async () => {
    const [
      { count: studentCount },
      { count: batchCount },
      { count: academyCount }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('batches').select('*', { count: 'exact', head: true }),
      supabase.from('academies').select('*', { count: 'exact', head: true })
    ]);
    
    // Get today's attendance
    const today = new Date().toISOString().split('T')[0];
    const { data: todayAttendance } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);
    
    const present = (todayAttendance || []).filter(a => a.status === 'present').length;
    const total = (todayAttendance || []).length;
    
    return {
      data: {
        totalStudents: studentCount || 0,
        totalBatches: batchCount || 0,
        totalAcademies: academyCount || 0,
        todayAttendance: { present, total, percentage: total > 0 ? (present / total * 100) : 0 }
      }
    };
  }
};

// ===================== WEEKLY PLANS =====================
export const weeklyPlansApi = {
  getAll: async (batchId) => {
    let query = supabase.from('weekly_plans').select('*').order('week_start', { ascending: false });
    if (batchId) query = query.eq('batch_id', batchId);
    const { data, error } = await query;
    return wrapResponse(data, error);
  },
  
  getCurrent: async (batchId) => {
    // Get current week's Monday
    const today = new Date();
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1);
    const weekStart = monday.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('weekly_plans')
      .select('*')
      .eq('batch_id', batchId)
      .eq('week_start', weekStart)
      .single();
    
    // Return empty plan if not found
    if (error && error.code === 'PGRST116') {
      return { data: null };
    }
    return wrapResponse(data, error);
  },
  
  create: async (plan) => {
    const { data, error } = await supabase
      .from('weekly_plans')
      .insert(toSnakeCase(plan))
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  update: async (id, plan) => {
    const { data, error } = await supabase
      .from('weekly_plans')
      .update({ ...toSnakeCase(plan), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  },
  
  upsert: async (batchId, weekStart, plan) => {
    const { data: existing } = await supabase
      .from('weekly_plans')
      .select('id')
      .eq('batch_id', batchId)
      .eq('week_start', weekStart)
      .single();
    
    if (existing) {
      return weeklyPlansApi.update(existing.id, plan);
    } else {
      return weeklyPlansApi.create({ ...plan, batchId, weekStart });
    }
  },
  
  markComplete: async (id) => {
    const { data, error } = await supabase
      .from('weekly_plans')
      .update({ completed: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    return wrapResponse(data, error);
  }
};

