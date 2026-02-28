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
import { Plus, CheckCircle, XCircle, CalendarDays, ListChecks, BarChart3 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { LeaveRequest } from '@/types/models';
import { leaveService } from '@/services/leave.service';
import { mockLeaveBalances, publicHolidays } from '@/data/leave-balance';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePermissions } from '@/hooks/usePermissions';

const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const { canApproveLeave } = usePermissions();
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
    if (!user) return;

    let res;

    // ✅ If Admin or Manager → get all leaves
    if (user.role === 'admin' || user.role === 'manager') {
      res = await leaveService.getAll();
    } 
    // ✅ If Employee → get only their leaves
    else {
      if (!user.employeeId) {
        toast.error("Employee ID not found");
        return;
      }
      res = await leaveService.getByEmployee(user.employeeId);
    }


    // ✅ Spring Page response
  setLeaves(res.content ?? []);

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
    if (status === 'APPROVED') {
      await leaveService.approve(id);
    } else {
      await leaveService.reject(id);
    }
  const leave = leaves.find(l => l.id === id);
  const msg = `${leave?.employeeName}'s ${leave?.leaveType} leave (${leave?.startDate} to ${leave?.endDate}) has been ${status}.`;
    toast.success(`Leave ${status.toLowerCase()}`);
    await fetchLeaves();
    addNotification({
      title: `Leave ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: msg,
      type: status === 'APPROVED' ? 'success' : 'warning',
    });

  } catch (error) {
    console.error(error);
    toast.error('Failed to update status');
  }
  };

 

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

  const statusStyle = (s: string) => {
  switch (s) {
    case 'APPROVED':
      return 'bg-success/10 text-success';
    case 'REJECTED':
      return 'bg-destructive/10 text-destructive';
    case 'PENDING':
      return 'bg-warning/10 text-warning';
    default:
      return 'bg-blue-900/10 text-blue-900'; // 🔥 Navy Blue
  }
};

  

  const getHolidayName = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return publicHolidays.find(h => h.date === ds)?.name;
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
                    {canApproveLeave && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map(l => (
                    <TableRow key={l.id}>
                      <TableCell className="font-medium">{l.employeeName}</TableCell>
                      <TableCell className="capitalize">{l.leaveType}</TableCell>
                      <TableCell>{l.startDate}</TableCell>
                      <TableCell>{l.endDate}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{l.reason}</TableCell>
                      <TableCell><span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(l.status)}`}>{l.status}</span></TableCell>
                      {canApproveLeave && (
                        <TableCell className="text-right space-x-1">
                          {l.status === 'PENDING' && <>
                            {isManager && l.status === 'PENDING' && (
                                      <>
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => updateStatus(l.id, 'APPROVED')}
                                        >
                                          <CheckCircle size={16} className="text-success" />
                                        </Button>

                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => updateStatus(l.id, 'REJECTED')}
                                        >
                                          <XCircle size={16} className="text-destructive" />
                                        </Button>
                                      </>
                                    )}
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
