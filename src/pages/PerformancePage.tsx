import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Loader2, Target, MessageSquare, BookOpen, Plus, Calendar, Star,
  CheckCircle2, Clock, TrendingUp, Trash2, Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '@/contexts/NotificationContext';
import { performanceService, Goal, Feedback, Course } from '@/services/performance.service';
import { departmentService } from '@/services/department.service';
import { employeeService } from '@/services/employee.service';
import { Department, Employee } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';

/* ── Helpers ── */
const statusColor = (s: Goal['status']) =>
  s === 'completed'
    ? 'bg-success/10 text-success'
    : s === 'at-risk'
    ? 'bg-destructive/10 text-destructive'
    : 'bg-info/10 text-info';

const feedbackTypeColor = (t: Feedback['type']) =>
  t === 'appraisal'
    ? 'bg-primary/10 text-primary'
    : t === '1-on-1'
    ? 'bg-info/10 text-info'
    : 'bg-accent/10 text-accent';

const EmptyState: React.FC<{ icon: React.ElementType; message: string }> = ({ icon: Icon, message }) => (
  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
    <Icon size={36} className="opacity-30" />
    <p className="text-sm">{message}</p>
  </div>
);

/* ── Blank form states ── */
const blankGoal     = { title: '', description: '', dueDate: '', departmentId: '', employeeId: '' };
const blankFeedback = { employeeId: '', from: '', date: '', type: '', rating: '', summary: '' };
const blankCourse   = { title: '', departmentId: '', employeeId: '', category: '', duration: '', deadline: '' };

/* ── Component ── */
const PerformancePage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isAdmin = user?.role === 'admin';

  /* ── Data ── */
  const [goals,       setGoals]       = useState<Goal[]>([]);
  const [feedback,    setFeedback]    = useState<Feedback[]>([]);
  const [courses,     setCourses]     = useState<Course[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees,   setEmployees]   = useState<Employee[]>([]);

  const [loadingGoals,    setLoadingGoals]    = useState(true);
  const [loadingFeedback, setLoadingFeedback] = useState(true);
  const [loadingCourses,  setLoadingCourses]  = useState(true);

  /* ── Goal dialog (add / edit) ── */
  const [goalDialog,     setGoalDialog]     = useState(false);
  const [editingGoal,    setEditingGoal]    = useState<Goal | null>(null);
  const [goalForm,       setGoalForm]       = useState(blankGoal);
  const [savingGoal,     setSavingGoal]     = useState(false);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [completingGoalId, setCompletingGoalId] = useState<string | null>(null);

  /* ── Feedback dialog ── */
  const [feedbackDialog, setFeedbackDialog] = useState(false);
  const [feedbackForm,   setFeedbackForm]   = useState(blankFeedback);
  const [savingFeedback, setSavingFeedback] = useState(false);

  /* ── Course dialog ── */
  const [courseDialog,     setCourseDialog]     = useState(false);
  const [courseForm,       setCourseForm]       = useState(blankCourse);
  const [savingCourse,     setSavingCourse]     = useState(false);
  const [deletingCourseId, setDeletingCourseId] = useState<string | null>(null);

  /* ── Load ── */
  useEffect(() => {
    performanceService.getGoals()
      .then(setGoals)
      .catch(err => console.warn('Goals unavailable:', err?.message))
      .finally(() => setLoadingGoals(false));

    performanceService.getFeedback()
      .then(setFeedback)
      .catch(err => console.warn('Feedback unavailable:', err?.message))
      .finally(() => setLoadingFeedback(false));

    performanceService.getCourses()
      .then(setCourses)
      .catch(err => console.warn('Courses unavailable:', err?.message))
      .finally(() => setLoadingCourses(false));

    // Load departments + employees for admin dialogs (and all for feedback/course)
    departmentService.getAll()
      .then(data => setDepartments(Array.isArray(data) ? data : (data as any).content ?? []))
      .catch(() => {});
    employeeService.getAll({ size: 200 })
      .then(res => setEmployees(res.content ?? []))
      .catch(() => {});
  }, []);

  /* ── Derived stats ── */
  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const avgProgress    = goals.length ? Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length) : 0;
  const doneCourses    = courses.filter(c => c.progress === 100).length;

  /* ── Goal: department name lookup ── */
  const deptName = (deptId?: string) =>
    departments.find(d => d.id === deptId)?.name ?? deptId ?? '';

  /* ── Goal handlers ── */
  const openAddGoal = () => {
    setEditingGoal(null);
    setGoalForm(blankGoal);
    setGoalDialog(true);
  };

  const openEditGoal = (g: Goal) => {
    setEditingGoal(g);
    setGoalForm({
      title:        g.title        ?? '',
      description:  g.description  ?? '',
      dueDate:      g.dueDate      ?? '',
      departmentId: g.departmentId ?? '',
      employeeId:   g.employeeId   ?? '',
    });
    setGoalDialog(true);
  };

  const handleSaveGoal = async () => {
    if (!goalForm.title.trim()) { toast.error('Goal title is required'); return; }
    if (isAdmin && !goalForm.departmentId) { toast.error('Department is required'); return; }
    setSavingGoal(true);
    try {
      if (editingGoal) {
        const updated = await performanceService.updateGoal(editingGoal.id, {
          title:       goalForm.title,
          description: goalForm.description,
          dueDate:     goalForm.dueDate,
        });
        setGoals(prev => prev.map(g => g.id === editingGoal.id ? { ...g, ...updated } : g));
        toast.success(`Goal "${goalForm.title}" updated`);
        addNotification({ title: 'Goal Updated', message: `Goal "${goalForm.title}" has been updated.`, type: 'info' });
      } else {
        const created = await performanceService.createGoal({
          title:        goalForm.title,
          description:  goalForm.description,
          dueDate:      goalForm.dueDate,
          departmentId: goalForm.departmentId,
          ...(goalForm.employeeId && { employeeId: goalForm.employeeId }),
        });
        setGoals(prev => [created, ...prev]);
        const assignedEmp = goalForm.employeeId ? employees.find(e => e.id === goalForm.employeeId) : null;
        const assignedTo = assignedEmp ? `${assignedEmp.firstName} ${assignedEmp.lastName}` : deptName(goalForm.departmentId);
        toast.success(`Goal "${goalForm.title}" created`);
        addNotification({ title: 'Goal Created', message: `Goal "${created.title}" has been assigned to ${assignedTo}.`, type: 'success' });
      }
      setGoalDialog(false);
    } catch {
      toast.error(editingGoal ? 'Failed to update goal' : 'Failed to create goal');
    } finally {
      setSavingGoal(false);
    }
  };

  const handleDeleteGoal = async (id: string) => {
    const goal = goals.find(g => g.id === id);
    setDeletingGoalId(id);
    try {
      await performanceService.deleteGoal(id);
      setGoals(prev => prev.filter(g => g.id !== id));
      toast.success(`Goal "${goal?.title}" deleted`);
      addNotification({ title: 'Goal Deleted', message: `Goal "${goal?.title}" has been deleted.`, type: 'warning' });
    } catch {
      toast.error('Failed to delete goal');
    } finally {
      setDeletingGoalId(null);
    }
  };

  const handleCompleteGoal = async (goal: Goal) => {
    setCompletingGoalId(goal.id);
    try {
      const updated = await performanceService.updateGoal(goal.id, { progress: 100, status: 'completed' });
      setGoals(prev => prev.map(g => g.id === goal.id ? { ...g, ...updated } : g));
      toast.success(`"${goal.title}" marked as complete`);
      addNotification({ title: 'Goal Completed', message: `${user?.name} completed goal "${goal.title}".`, type: 'success' });
    } catch {
      toast.error('Failed to update goal');
    } finally {
      setCompletingGoalId(null);
    }
  };

  /* ── Feedback handlers ── */
  const openFeedbackDialog = () => {
    setFeedbackForm({
      ...blankFeedback,
      from: user?.name ?? user?.email ?? '',
      date: new Date().toISOString().slice(0, 10),
    });
    setFeedbackDialog(true);
  };

  const handleAddFeedback = async () => {
    if (!feedbackForm.employeeId) { toast.error('Employee is required');    return; }
    if (!feedbackForm.from.trim()) { toast.error('Reviewer name required'); return; }
    if (!feedbackForm.type)        { toast.error('Feedback type required'); return; }
    if (!feedbackForm.summary.trim()) { toast.error('Summary is required'); return; }
    setSavingFeedback(true);
    try {
      const created = await performanceService.createFeedback({
        employeeId: feedbackForm.employeeId,
        from:       feedbackForm.from,
        date:       feedbackForm.date || new Date().toISOString().slice(0, 10),
        type:       feedbackForm.type,
        summary:    feedbackForm.summary,
        ...(feedbackForm.rating && { rating: parseFloat(feedbackForm.rating) }),
      });
      setFeedback(prev => [created, ...prev]);
      const fbEmp = employees.find(e => e.id === feedbackForm.employeeId);
      const fbEmpName = fbEmp ? `${fbEmp.firstName} ${fbEmp.lastName}` : 'Employee';
      toast.success(`Feedback added for ${fbEmpName}`);
      addNotification({ title: 'Feedback Added', message: `${feedbackForm.type} feedback from ${feedbackForm.from} for ${fbEmpName} has been recorded.`, type: 'info' });
      setFeedbackDialog(false);
    } catch {
      toast.error('Failed to add feedback');
    } finally {
      setSavingFeedback(false);
    }
  };

  /* ── Course handlers ── */
  const openCourseDialog = () => { setCourseForm(blankCourse); setCourseDialog(true); };

  const handleAddCourse = async () => {
    if (!courseForm.title.trim())        { toast.error('Course title is required'); return; }
    if (!courseForm.departmentId.trim()) { toast.error('Department is required');   return; }
    if (!courseForm.category)            { toast.error('Category is required');     return; }
    if (!courseForm.duration.trim())     { toast.error('Duration is required');     return; }
    setSavingCourse(true);
    try {
      const created = await performanceService.createCourse({
        title:        courseForm.title,
        departmentId: courseForm.departmentId,
        category:     courseForm.category,
        duration:     courseForm.duration,
        ...(courseForm.employeeId && { employeeId: courseForm.employeeId }),
        ...(courseForm.deadline   && { deadline:   courseForm.deadline }),
      });
      setCourses(prev => [created, ...prev]);
      const courseDept = departments.find(d => d.id === courseForm.departmentId);
      toast.success(`Course "${courseForm.title}" created`);
      addNotification({ title: 'Course Added', message: `Course "${created.title}" has been added for ${courseDept?.name ?? 'department'}.`, type: 'info' });
      setCourseDialog(false);
    } catch {
      toast.error('Failed to create course');
    } finally {
      setSavingCourse(false);
    }
  };

  const handleDeleteCourse = async (id: string) => {
    const course = courses.find(c => c.id === id);
    setDeletingCourseId(id);
    try {
      await performanceService.deleteCourse(id);
      setCourses(prev => prev.filter(c => c.id !== id));
      toast.success(`Course "${course?.title}" deleted`);
      addNotification({ title: 'Course Deleted', message: `Course "${course?.title}" has been deleted.`, type: 'warning' });
    } catch {
      toast.error('Failed to delete course');
    } finally {
      setDeletingCourseId(null);
    }
  };

  /* ════════════════════════════════════════════════════════════════════
     Render
  ════════════════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance & Growth</h1>
        <p className="text-sm text-muted-foreground">Track goals, feedback, and learning progress</p>
      </div>

      {/* ── Stats ── */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Goals Completed</p>
              <p className="text-2xl font-bold mt-1">{loadingGoals ? '—' : `${completedGoals}/${goals.length}`}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10 text-success"><Target size={22} /></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Avg Progress</p>
              <p className="text-2xl font-bold mt-1">{loadingGoals ? '—' : `${avgProgress}%`}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary"><TrendingUp size={22} /></div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent className="flex items-center justify-between p-5">
            <div>
              <p className="text-sm text-muted-foreground">Courses Done</p>
              <p className="text-2xl font-bold mt-1">{loadingCourses ? '—' : `${doneCourses}/${courses.length}`}</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10 text-info"><BookOpen size={22} /></div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="goals"    className="gap-2"><Target        size={16} /> Goals / OKRs</TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2"><MessageSquare size={16} /> Feedback</TabsTrigger>
          <TabsTrigger value="learning" className="gap-2"><BookOpen      size={16} /> Learning (LMS)</TabsTrigger>
        </TabsList>

        {/* ══════════════════════════ GOALS ══════════════════════════ */}
        <TabsContent value="goals">
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Button onClick={openAddGoal} className="gap-2"><Plus size={16} /> Add Goal</Button>
            </div>
          )}

          {loadingGoals ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" size={28} /></div>
          ) : goals.length === 0 ? (
            <Card className="shadow-sm"><CardContent><EmptyState icon={Target} message="No goals found for your department." /></CardContent></Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {goals.map(g => {
                const isAssigned = g.employeeId === user?.id;
                const canComplete = !isAdmin && g.status !== 'completed' && isAssigned;

                return (
                  <Card key={g.id} className="shadow-sm">
                    <CardContent className="p-5 space-y-3">
                      {/* Header row */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm">{g.title}</h3>
                          {g.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge className={`border-0 text-xs ${statusColor(g.status)}`}>{g.status}</Badge>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => openEditGoal(g)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                                title="Edit goal"
                              >
                                <Pencil size={13} />
                              </button>
                              <button
                                onClick={() => handleDeleteGoal(g.id)}
                                disabled={deletingGoalId === g.id}
                                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                title="Delete goal"
                              >
                                {deletingGoalId === g.id
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <Trash2 size={13} />}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Department badge */}
                      {g.departmentId && (
                        <div className="text-xs text-muted-foreground">
                          Dept: <span className="font-medium text-foreground">{deptName(g.departmentId)}</span>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Progress</span><span>{g.progress}%</span>
                        </div>
                        <Progress value={g.progress} className="h-2" />
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between">
                        {g.dueDate ? (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar size={12} /><span>Due: {g.dueDate}</span>
                          </div>
                        ) : <span />}

                        {canComplete && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs gap-1"
                            disabled={completingGoalId === g.id}
                            onClick={() => handleCompleteGoal(g)}
                          >
                            {completingGoalId === g.id
                              ? <Loader2 size={11} className="animate-spin" />
                              : <CheckCircle2 size={11} />}
                            Mark Complete
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════ FEEDBACK ══════════════════════════ */}
        <TabsContent value="feedback">
          <div className="flex justify-end mb-4">
            <Button onClick={openFeedbackDialog} className="gap-2"><Plus size={16} /> Add Feedback</Button>
          </div>

          {loadingFeedback ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" size={28} /></div>
          ) : feedback.length === 0 ? (
            <Card className="shadow-sm"><CardContent><EmptyState icon={MessageSquare} message="No feedback received yet." /></CardContent></Card>
          ) : (
            <div className="space-y-4">
              {feedback.map(f => (
                <Card key={f.id} className="shadow-sm">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold text-sm">
                          {f.from.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{f.from}</p>
                          <p className="text-xs text-muted-foreground">{f.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {f.rating && (
                          <div className="flex items-center gap-1 text-sm font-medium text-warning">
                            <Star size={14} className="fill-current" />{f.rating}
                          </div>
                        )}
                        <Badge className={`border-0 text-xs capitalize ${feedbackTypeColor(f.type)}`}>{f.type}</Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.summary}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ══════════════════════════ LEARNING ══════════════════════════ */}
        <TabsContent value="learning">
          {isAdmin && (
            <div className="flex justify-end mb-4">
              <Button onClick={openCourseDialog} className="gap-2"><Plus size={16} /> Add Course</Button>
            </div>
          )}

          {loadingCourses ? (
            <div className="flex justify-center py-16"><Loader2 className="animate-spin text-muted-foreground" size={28} /></div>
          ) : courses.length === 0 ? (
            <Card className="shadow-sm"><CardContent><EmptyState icon={BookOpen} message="No courses assigned to your department." /></CardContent></Card>
          ) : (
            <div className="space-y-6">
              {courses.some(c => c.category === 'mandatory') && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-destructive" /> Mandatory Training
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.filter(c => c.category === 'mandatory').map(c => (
                      <Card key={c.id} className="shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-medium text-sm leading-tight flex-1 min-w-0">{c.title}</h4>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Badge className={`border-0 text-xs ${c.progress === 100 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                                {c.progress === 100 ? 'Done' : 'In Progress'}
                              </Badge>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteCourse(c.id)}
                                  disabled={deletingCourseId === c.id}
                                  className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                  title="Delete course"
                                >
                                  {deletingCourseId === c.id
                                    ? <Loader2 size={13} className="animate-spin" />
                                    : <Trash2 size={13} />}
                                </button>
                              )}
                            </div>
                          </div>
                          <Progress value={c.progress} className="h-1.5" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={11} /> {c.duration}</span>
                            {c.deadline && <span>Due: {c.deadline}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {courses.some(c => c.category === 'optional') && (
                <div>
                  <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <BookOpen size={16} className="text-primary" /> Optional / Upskilling
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {courses.filter(c => c.category === 'optional').map(c => (
                      <Card key={c.id} className="shadow-sm">
                        <CardContent className="p-4 space-y-3">
                          <div className="flex items-start justify-between gap-1">
                            <h4 className="font-medium text-sm flex-1 min-w-0">{c.title}</h4>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteCourse(c.id)}
                                disabled={deletingCourseId === c.id}
                                className="text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50 shrink-0"
                                title="Delete course"
                              >
                                {deletingCourseId === c.id
                                  ? <Loader2 size={13} className="animate-spin" />
                                  : <Trash2 size={13} />}
                              </button>
                            )}
                          </div>
                          <Progress value={c.progress} className="h-1.5" />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock size={11} /> {c.duration}</span>
                            <span>{c.progress}%</span>
                          </div>
                          {c.progress === 0 && (
                            <Button size="sm" variant="outline" className="w-full text-xs h-8">Start Course</Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ════════════════ ADD / EDIT GOAL DIALOG ════════════════ */}
      <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingGoal ? 'Edit Goal' : 'Add New Goal'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Goal Title *</label>
              <Input
                value={goalForm.title}
                onChange={e => setGoalForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Complete Q2 deliverables"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={goalForm.description}
                onChange={e => setGoalForm(f => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
            {/* Department only editable on create by admin */}
            {!editingGoal && isAdmin && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Department *</label>
                <Select value={goalForm.departmentId} onValueChange={v => setGoalForm(f => ({ ...f, departmentId: v, employeeId: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            {!editingGoal && isAdmin && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Assign to Employee <span className="text-muted-foreground">(optional)</span></label>
                <Select value={goalForm.employeeId} onValueChange={v => setGoalForm(f => ({ ...f, employeeId: v }))}>
                  <SelectTrigger><SelectValue placeholder="All department members" /></SelectTrigger>
                  <SelectContent>
                    {employees
                      .filter(e => !goalForm.departmentId || e.departmentId === goalForm.departmentId)
                      .map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Due Date</label>
              <Input
                type="date"
                value={goalForm.dueDate}
                onChange={e => setGoalForm(f => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialog(false)} disabled={savingGoal}>Cancel</Button>
            <Button onClick={handleSaveGoal} disabled={savingGoal}>
              {savingGoal && <Loader2 size={14} className="mr-2 animate-spin" />}
              {editingGoal ? 'Save Changes' : 'Add Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ ADD FEEDBACK DIALOG ════════════════ */}
      <Dialog open={feedbackDialog} onOpenChange={setFeedbackDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Feedback</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Employee *</label>
              <Select value={feedbackForm.employeeId} onValueChange={v => setFeedbackForm(f => ({ ...f, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="Select employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Reviewer Name *</label>
              <Input
                value={feedbackForm.from}
                onChange={e => setFeedbackForm(f => ({ ...f, from: e.target.value }))}
                placeholder="Reviewer name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Feedback Type *</label>
                <Select value={feedbackForm.type} onValueChange={v => setFeedbackForm(f => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="appraisal">Appraisal</SelectItem>
                    <SelectItem value="1-on-1">1-on-1</SelectItem>
                    <SelectItem value="peer">Peer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Rating <span className="text-muted-foreground">(1–5)</span></label>
                <Input
                  type="number"
                  min={1} max={5} step={0.5}
                  value={feedbackForm.rating}
                  onChange={e => setFeedbackForm(f => ({ ...f, rating: e.target.value }))}
                  placeholder="e.g. 4.5"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={feedbackForm.date}
                onChange={e => setFeedbackForm(f => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Summary *</label>
              <Textarea
                value={feedbackForm.summary}
                onChange={e => setFeedbackForm(f => ({ ...f, summary: e.target.value }))}
                rows={3}
                placeholder="Key observations and feedback..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackDialog(false)} disabled={savingFeedback}>Cancel</Button>
            <Button onClick={handleAddFeedback} disabled={savingFeedback}>
              {savingFeedback && <Loader2 size={14} className="mr-2 animate-spin" />}Add Feedback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ════════════════ ADD COURSE DIALOG ════════════════ */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Learning Course</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Course Title *</label>
              <Input
                value={courseForm.title}
                onChange={e => setCourseForm(c => ({ ...c, title: e.target.value }))}
                placeholder="e.g. React Advanced Patterns"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Department *</label>
                <Select value={courseForm.departmentId} onValueChange={v => setCourseForm(c => ({ ...c, departmentId: v, employeeId: '' }))}>
                  <SelectTrigger><SelectValue placeholder="Select dept" /></SelectTrigger>
                  <SelectContent>
                    {departments.map(d => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Category *</label>
                <Select value={courseForm.category} onValueChange={v => setCourseForm(c => ({ ...c, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mandatory">Mandatory</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Duration *</label>
                <Input
                  value={courseForm.duration}
                  onChange={e => setCourseForm(c => ({ ...c, duration: e.target.value }))}
                  placeholder="e.g. 4h 30m"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Deadline</label>
                <Input
                  type="date"
                  value={courseForm.deadline}
                  onChange={e => setCourseForm(c => ({ ...c, deadline: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Assign to Employee <span className="text-muted-foreground">(optional)</span></label>
              <Select value={courseForm.employeeId} onValueChange={v => setCourseForm(c => ({ ...c, employeeId: v }))}>
                <SelectTrigger><SelectValue placeholder="All department members" /></SelectTrigger>
                <SelectContent>
                  {employees
                    .filter(e => !courseForm.departmentId || e.departmentId === courseForm.departmentId)
                    .map(e => <SelectItem key={e.id} value={e.id}>{e.firstName} {e.lastName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialog(false)} disabled={savingCourse}>Cancel</Button>
            <Button onClick={handleAddCourse} disabled={savingCourse}>
              {savingCourse && <Loader2 size={14} className="mr-2 animate-spin" />}Add Course
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformancePage;
