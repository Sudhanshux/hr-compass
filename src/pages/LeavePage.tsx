import React, { useState, useEffect,useMemo } from 'react';
import { Card, CardContent,CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Plus, CheckCircle, XCircle, CalendarDays, ListChecks, BarChart3 } from 'lucide-react';import { LeaveRequest } from '@/types/models';
import { leaveService } from '@/services/leave.service';
import { mockLeaveBalances, publicHolidays } from '@/data/leave-balance';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const [form, setForm] = useState({
    type: 'CASUAL' as LeaveRequest['leaveType'],
    startDate: '',
    endDate: '',
    reason: '',
  });

 // ✅ Fetch Leaves
const fetchLeaves = async () => {
  try {
    if (!user?.employeeId && !isManager) return;

    const res = isManager
      ? await leaveService.getAll()
      : await leaveService.getByEmployee(user!.employeeId);

    // 🔥 IMPORTANT FIX HERE
    // setLeaves(res?.data?.content ?? []);

  } catch (error) {
    console.error('Fetch leaves error:', error);
    toast.error('Failed to load leaves');
  }
};

  useEffect(() => {
    fetchLeaves();
  }, [user]);

  // ✅ Apply Leave
  const handleApply = async () => {
    if (!form.startDate || !form.endDate) {
      toast.error('Select dates');
      return;
    }

    if (!user?.employeeId) {
      toast.error('User not found');
      return;
    }

    try {
      await leaveService.apply(user.employeeId, {
        leaveType: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });

      toast.success('Leave applied successfully');
      setDialogOpen(false);

      setForm({
        type: 'CASUAL',
        startDate: '',
        endDate: '',
        reason: '',
      });

      await fetchLeaves();
    } catch (error) {
      console.error(error);
      toast.error('Failed to apply leave');
    }
  };

  // ✅ Approve / Reject
  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      await leaveService.updateStatus(id, status);
      toast.success(`Leave ${status.toLowerCase()}`);
      await fetchLeaves();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const statusStyle = (s: string) =>
    s === 'APPROVED'
      ? 'bg-success/10 text-success'
      : s === 'REJECTED'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-warning/10 text-warning';


  // ✅ Calendar modifiers
 const holidayDates = useMemo(() => {
  return publicHolidays.map(h => {
    const [year, month, day] = h.date.split('-').map(Number);
    return new Date(year, month - 1, day);
  });
}, []);

  const approvedDates = useMemo(() => {
    const dates: Date[] = [];
    leaves.filter(l => l.status === 'APPROVED').forEach(l => {
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
    leaves.filter(l => l.status === 'PENDING').forEach(l => {
      const start = new Date(l.startDate + 'T00:00:00');
      const end = new Date(l.endDate + 'T00:00:00');
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(new Date(d));
      }
    });
    return dates;
  }, [leaves]);

  const modifiers = {
    holiday: holidayDates,
    approved: approvedDates,
    pending: pendingDates,
  };

  const modifiersStyles = {
    holiday: { backgroundColor: '#fee2e2', color: '#dc2626', borderRadius: '50%' },
    approved: { backgroundColor: '#dcfce7', color: '#16a34a', borderRadius: '50%' },
    pending: { backgroundColor: '#fef9c3', color: '#ca8a04', borderRadius: '50%' },
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Leave Management</h1>
          <p className="text-sm text-muted-foreground">
            {leaves.filter(l => l.status === 'PENDING').length} pending requests
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus size={16} className="mr-2" /> Apply Leave
        </Button>
      </div>

      {/* Tabs */}
   <Tabs defaultValue="requests" className="space-y-4">
  <TabsList>
    <TabsTrigger value="requests" className="gap-2">
      <ListChecks size={16} /> Requests
    </TabsTrigger>
    <TabsTrigger value="balance" className="gap-2">
      <BarChart3 size={16} /> Leave Balance
    </TabsTrigger>
    <TabsTrigger value="calendar" className="gap-2">
      <CalendarDays size={16} /> Calendar
    </TabsTrigger>
  </TabsList>

  {/* Requests Tab */}
  <TabsContent value="requests">
    {/* your table card here */}
  </TabsContent>

  {/* Leave Balance Tab */}
  <TabsContent value="balance">
    {/* your balance cards here */}
  </TabsContent>

  {/* Calendar Tab */}
  <TabsContent value="calendar">
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
      
      {/* Calendar */}
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

      {/* Right Panel */}
      <div className="space-y-4">
        
        {/* Legend */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Legend</h3>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-destructive/30" />
              Public Holiday
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-success/30" />
              Approved Leave
            </div>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-warning/30" />
              Pending Leave
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Holidays */}
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            <h3 className="text-sm font-semibold">Upcoming Holidays</h3>

            {publicHolidays
              .filter(h => new Date(h.date) >= new Date())
              .slice(0, 5)
              .map(h => (
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

      {/* Apply Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply Leave</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <Select
              value={form.type}
              onValueChange={v => setForm(f => ({ ...f, type: v as any }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['SICK', 'CASUAL', 'ANNUAL', 'MATERNITY', 'UNPAID', 'PATERNITY', 'OTHER']
                  .map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input type="date" value={form.startDate}
              onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />

            <Input type="date" value={form.endDate}
              onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />

            <Textarea
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>Submit</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default LeavePage;
