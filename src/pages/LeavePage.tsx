import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Plus, CheckCircle, XCircle, CalendarDays, ListChecks, BarChart3 } from 'lucide-react';
import { LeaveRequest } from '@/types/models';
import { mockLeaveRequests } from '@/data/mock-data';
import { mockLeaveBalances, publicHolidays } from '@/data/leave-balance';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';

const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const [leaves, setLeaves] = useState<LeaveRequest[]>(mockLeaveRequests);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ type: 'casual' as LeaveRequest['type'], startDate: '', endDate: '', reason: '' });
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const handleApply = () => {
    if (!form.startDate || !form.endDate) { toast.error('Select dates'); return; }
    const newLeave: LeaveRequest = {
      id: Date.now().toString(), employeeId: user?.id || '', employeeName: user?.name || '',
      ...form, status: 'pending', appliedOn: new Date().toISOString().split('T')[0],
    };
    setLeaves(prev => [newLeave, ...prev]);
    toast.success('Leave applied');
    setDialogOpen(false);
    setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
  };

  const updateStatus = (id: string, status: 'approved' | 'rejected') => {
    const leave = leaves.find(l => l.id === id);
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    const msg = `${leave?.employeeName}'s ${leave?.type} leave (${leave?.startDate} to ${leave?.endDate}) has been ${status}.`;
    toast.success(`Leave ${status}`, { description: msg, duration: 6000 });
    addNotification({
      title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: msg,
      type: status === 'approved' ? 'success' : 'warning',
    });
  };

  const statusStyle = (s: string) =>
    s === 'approved' ? 'bg-success/10 text-success' : s === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning';

  // Calendar modifiers
  const holidayDates = useMemo(() => publicHolidays.map(h => new Date(h.date + 'T00:00:00')), []);
  const approvedDates = useMemo(() => {
    const dates: Date[] = [];
    leaves.filter(l => l.status === 'approved').forEach(l => {
      const start = new Date(l.startDate + 'T00:00:00');
      const end = new Date(l.endDate + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    });
    return dates;
  }, [leaves]);
  const pendingDates = useMemo(() => {
    const dates: Date[] = [];
    leaves.filter(l => l.status === 'pending').forEach(l => {
      const start = new Date(l.startDate + 'T00:00:00');
      const end = new Date(l.endDate + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    });
    return dates;
  }, [leaves]);

  const modifiers = { holiday: holidayDates, approved: approvedDates, pending: pendingDates };
  const modifiersStyles = {
    holiday: { backgroundColor: 'hsl(var(--destructive) / 0.15)', color: 'hsl(var(--destructive))', fontWeight: 600, borderRadius: '50%' },
    approved: { backgroundColor: 'hsl(var(--success) / 0.15)', color: 'hsl(var(--success))', fontWeight: 600, borderRadius: '50%' },
    pending: { backgroundColor: 'hsl(var(--warning) / 0.15)', color: 'hsl(var(--warning))', fontWeight: 600, borderRadius: '50%' },
  };

  const getHolidayName = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return publicHolidays.find(h => h.date === ds)?.name;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-sm text-muted-foreground">{leaves.filter(l => l.status === 'pending').length} pending requests</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus size={16} className="mr-2" /> Apply Leave</Button>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="gap-2"><ListChecks size={16} /> Requests</TabsTrigger>
          <TabsTrigger value="balance" className="gap-2"><BarChart3 size={16} /> Leave Balance</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2"><CalendarDays size={16} /> Calendar</TabsTrigger>
        </TabsList>

        {/* Requests Tab */}
        <TabsContent value="requests">
          <Card className="shadow-sm">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {isManager && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.employeeName}</TableCell>
                      <TableCell className="capitalize">{l.type}</TableCell>
                      <TableCell>{l.startDate}</TableCell>
                      <TableCell>{l.endDate}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.reason}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(l.status)}`}>{l.status}</span></TableCell>
                      {isManager && (
                        <TableCell className="text-right space-x-1">
                          {l.status === 'pending' && <>
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(l.id, 'approved')}><CheckCircle size={16} className="text-success" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => updateStatus(l.id, 'rejected')}><XCircle size={16} className="text-destructive" /></Button>
                          </>}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Leave Balance Tab */}
        <TabsContent value="balance">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockLeaveBalances.map(lb => (
              <Card key={lb.type} className="shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{lb.type}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-end justify-between">
                    <span className="text-3xl font-bold">{lb.remaining}</span>
                    <span className="text-sm text-muted-foreground">of {lb.total}</span>
                  </div>
                  <Progress value={(lb.used / lb.total) * 100} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Used: {lb.used}</span>
                    <span>Remaining: {lb.remaining}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Calendar Tab */}
        <TabsContent value="calendar">
          <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
            <Card className="shadow-sm">
              <CardContent className="p-4 flex justify-center">
                <Calendar
                  mode="single"
                  month={calendarMonth}
                  onMonthChange={setCalendarMonth}
                  modifiers={modifiers}
                  modifiersStyles={modifiersStyles}
                  className="w-full"
                />
              </CardContent>
            </Card>
            <div className="space-y-4">
              <Card className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Legend</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-destructive/30" /> Public Holiday</div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-success/30" /> Approved Leave</div>
                  <div className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-warning/30" /> Pending Leave</div>
                </CardContent>
              </Card>
              <Card className="shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Upcoming Holidays</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {publicHolidays.filter(h => new Date(h.date) >= new Date()).slice(0, 5).map(h => (
                    <div key={h.date} className="flex justify-between text-sm">
                      <span>{h.name}</span>
                      <span className="text-muted-foreground">{h.date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Apply Leave Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Apply for Leave</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Leave Type</Label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as LeaveRequest['type'] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['sick', 'casual', 'annual', 'maternity', 'other'].map(t => <SelectItem key={t} value={t} className="capitalize">{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1"><Label>Start Date *</Label><Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} /></div>
              <div className="space-y-1"><Label>End Date *</Label><Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} /></div>
            </div>
            <div className="space-y-1"><Label>Reason</Label><Textarea value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} rows={3} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApply}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeavePage;
