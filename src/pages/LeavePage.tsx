import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Plus, CheckCircle, XCircle } from 'lucide-react';
import { LeaveRequest } from '@/types/models';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { leaveService } from '@/services/leave.service';

const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'admin' || user?.role === 'manager';

  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({
    type: 'CASUAL' as LeaveRequest['leaveType'],
    startDate: '',
    endDate: '',
    reason: '',
  });

  // ✅ Fetch leaves from backend
  useEffect(() => {
    const fetchLeaves = async () => {
      try {
        const res = await leaveService.getAll();
        setLeaves(res?.content ?? []);
      } catch (error) {
        console.error(error);
        toast.error('Failed to load leaves');
      }
    };

    fetchLeaves();
  }, []);

  // ✅ Apply Leave (Backend)
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
      leaveType: form.type, // must match LeaveRequest['type']
      startDate: form.startDate,
      endDate: form.endDate,
      reason: form.reason,
    });

    toast.success('Leave applied successfully');
    setDialogOpen(false);

    // refetch
    const res = await leaveService.getByEmployee(user.employeeId);
    setLeaves(res);

  } catch (error) {
    console.error(error);
    toast.error('Failed to apply leave');
  }
};

  // ✅ Approve / Reject
  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const res = await leaveService.updateStatus(id, status);
      setLeaves(prev =>
        prev.map(l => (l.id === id ? res : l))
      );
      toast.success(`Leave ${status.toLowerCase()}`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update status');
    }
  };

  const formatLeaveType = (type?: string) => {
  if (!type) return '—';

  return type.charAt(0) + type.slice(1).toLowerCase();
};

  const statusStyle = (s: string) =>
    s === 'APPROVED'
      ? 'bg-success/10 text-success'
      : s === 'REJECTED'
      ? 'bg-destructive/10 text-destructive'
      : 'bg-warning/10 text-warning';

      

  return (
    <div className="space-y-6">

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
                  <TableCell>{formatLeaveType(l.leaveType)}</TableCell>
                  <TableCell>{l.startDate}</TableCell>
                  <TableCell>{l.endDate}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{l.reason}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle(l.status)}`}>
                      {l.status}
                    </span>
                  </TableCell>

                  {isManager && l.status === 'PENDING' && (
                    <TableCell className="text-right space-x-1">
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
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Apply Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Leave Type</Label>
              <Select
                value={form.type}
                onValueChange={v =>
                  setForm(f => ({ ...f, type: v as LeaveRequest['leaveType'] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['SICK', 'CASUAL', 'ANNUAL', 'MATERNITY','UNPAID','PATERNITY', 'OTHER'].map(t => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Start Date *</Label>
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={e =>
                    setForm(f => ({ ...f, startDate: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label>End Date *</Label>
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={e =>
                    setForm(f => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Reason</Label>
              <Textarea
                value={form.reason}
                onChange={e =>
                  setForm(f => ({ ...f, reason: e.target.value }))
                }
                rows={3}
              />
            </div>
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