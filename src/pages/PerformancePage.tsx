import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Target, MessageSquare, BookOpen, Plus, Calendar, Star, CheckCircle2, Clock, TrendingUp } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  progress: number;
  dueDate: string;
  status: 'on-track' | 'at-risk' | 'completed';
}

interface Feedback {
  id: string;
  date: string;
  from: string;
  type: 'appraisal' | '1-on-1' | 'peer';
  rating?: number;
  summary: string;
}

interface Course {
  id: string;
  title: string;
  category: 'mandatory' | 'optional';
  duration: string;
  progress: number;
  deadline?: string;
}

const mockGoals: Goal[] = [
  { id: '1', title: 'Complete Q1 Sprint Goals', description: 'Deliver all assigned sprint items for Q1', progress: 75, dueDate: '2026-03-31', status: 'on-track' },
  { id: '2', title: 'Improve Test Coverage to 80%', description: 'Write unit and integration tests for core modules', progress: 60, dueDate: '2026-04-15', status: 'at-risk' },
  { id: '3', title: 'Lead Design System Migration', description: 'Migrate all components to new design tokens', progress: 100, dueDate: '2026-02-28', status: 'completed' },
  { id: '4', title: 'Complete AWS Certification', description: 'Pass AWS Solutions Architect Associate exam', progress: 40, dueDate: '2026-06-30', status: 'on-track' },
];

const mockFeedback: Feedback[] = [
  { id: '1', date: '2026-02-15', from: 'Michael Chen', type: 'appraisal', rating: 4.2, summary: 'Excellent technical skills and teamwork. Consistently delivers high-quality work. Areas for growth: presentation skills and cross-team collaboration.' },
  { id: '2', date: '2026-02-01', from: 'Sarah Johnson', type: '1-on-1', summary: 'Discussed career goals and upcoming project assignments. Agreed on taking the lead for the new dashboard initiative.' },
  { id: '3', date: '2026-01-20', from: 'David Martinez', type: 'peer', rating: 4.5, summary: 'Great mentor and always willing to help with code reviews. Very knowledgeable about system architecture.' },
  { id: '4', date: '2026-01-10', from: 'Michael Chen', type: '1-on-1', summary: 'Mid-cycle review: on track for all goals. Should focus on documentation improvements next quarter.' },
];

const mockCourses: Course[] = [
  { id: '1', title: 'Data Privacy & GDPR Compliance', category: 'mandatory', duration: '2h', progress: 100, deadline: '2026-03-01' },
  { id: '2', title: 'Workplace Safety Training', category: 'mandatory', duration: '1h', progress: 50, deadline: '2026-03-15' },
  { id: '3', title: 'Advanced React Patterns', category: 'optional', duration: '8h', progress: 30 },
  { id: '4', title: 'Leadership Essentials', category: 'optional', duration: '4h', progress: 0 },
  { id: '5', title: 'Anti-Harassment Policy', category: 'mandatory', duration: '45m', progress: 100, deadline: '2026-02-28' },
  { id: '6', title: 'Cloud Architecture Fundamentals', category: 'optional', duration: '12h', progress: 15 },
];

const statusColor = (s: Goal['status']) =>
  s === 'completed' ? 'bg-success/10 text-success' : s === 'at-risk' ? 'bg-destructive/10 text-destructive' : 'bg-info/10 text-info';

const feedbackTypeColor = (t: Feedback['type']) =>
  t === 'appraisal' ? 'bg-primary/10 text-primary' : t === '1-on-1' ? 'bg-info/10 text-info' : 'bg-accent/10 text-accent';

const PerformancePage: React.FC = () => {
  const [goals, setGoals] = useState(mockGoals);
  const [goalDialog, setGoalDialog] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', description: '', dueDate: '' });

  const addGoal = () => {
    if (!newGoal.title) return;
    setGoals(prev => [...prev, { id: Date.now().toString(), ...newGoal, progress: 0, status: 'on-track' as const }]);
    setGoalDialog(false);
    setNewGoal({ title: '', description: '', dueDate: '' });
  };

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const avgProgress = Math.round(goals.reduce((a, g) => a + g.progress, 0) / goals.length);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Performance & Growth</h1>
        <p className="text-sm text-muted-foreground">Track goals, feedback, and learning progress</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Goals Completed', value: `${completedGoals}/${goals.length}`, icon: Target, accent: 'bg-success/10 text-success' },
          { label: 'Avg Progress', value: `${avgProgress}%`, icon: TrendingUp, accent: 'bg-primary/10 text-primary' },
          { label: 'Courses Done', value: `${mockCourses.filter(c => c.progress === 100).length}/${mockCourses.length}`, icon: BookOpen, accent: 'bg-info/10 text-info' },
        ].map(s => (
          <Card key={s.label} className="shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.accent}`}>
                <s.icon size={22} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="goals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="goals" className="gap-2"><Target size={16} /> Goals / OKRs</TabsTrigger>
          <TabsTrigger value="feedback" className="gap-2"><MessageSquare size={16} /> Feedback</TabsTrigger>
          <TabsTrigger value="learning" className="gap-2"><BookOpen size={16} /> Learning (LMS)</TabsTrigger>
        </TabsList>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <div className="flex justify-end mb-4">
            <Button onClick={() => setGoalDialog(true)} className="gap-2"><Plus size={16} /> Add Goal</Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {goals.map(g => (
              <Card key={g.id} className="shadow-sm">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-sm">{g.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{g.description}</p>
                    </div>
                    <Badge className={`border-0 text-xs ${statusColor(g.status)}`}>{g.status}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{g.progress}%</span>
                    </div>
                    <Progress value={g.progress} className="h-2" />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar size={12} />
                    <span>Due: {g.dueDate}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback">
          <div className="space-y-4">
            {mockFeedback.map(f => (
              <Card key={f.id} className="shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted font-semibold text-sm">
                        {f.from.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{f.from}</p>
                        <p className="text-xs text-muted-foreground">{f.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {f.rating && (
                        <div className="flex items-center gap-1 text-sm font-medium text-warning">
                          <Star size={14} className="fill-current" />
                          {f.rating}
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
        </TabsContent>

        {/* Learning Tab */}
        <TabsContent value="learning">
          <div className="space-y-6">
            {/* Mandatory */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-destructive" /> Mandatory Training
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mockCourses.filter(c => c.category === 'mandatory').map(c => (
                  <Card key={c.id} className="shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm leading-tight">{c.title}</h4>
                        <Badge className={`border-0 text-xs shrink-0 ml-2 ${c.progress === 100 ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                          {c.progress === 100 ? 'Done' : 'In Progress'}
                        </Badge>
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

            {/* Optional */}
            <div>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <BookOpen size={16} className="text-primary" /> Optional / Upskilling
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {mockCourses.filter(c => c.category === 'optional').map(c => (
                  <Card key={c.id} className="shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <h4 className="font-medium text-sm">{c.title}</h4>
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
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Goal Dialog */}
      <Dialog open={goalDialog} onOpenChange={setGoalDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Goal</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Goal Title *</label>
              <Input value={newGoal.title} onChange={e => setNewGoal(g => ({ ...g, title: e.target.value }))} placeholder="e.g. Complete Q2 deliverables" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={newGoal.description} onChange={e => setNewGoal(g => ({ ...g, description: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={newGoal.dueDate} onChange={e => setNewGoal(g => ({ ...g, dueDate: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGoalDialog(false)}>Cancel</Button>
            <Button onClick={addGoal}>Add Goal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PerformancePage;
