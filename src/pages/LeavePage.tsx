import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Plus, CheckCircle, XCircle, CalendarDays, ListChecks, BarChart3,
  ChevronLeft, ChevronRight, TrendingUp, Clock, AlertCircle, RefreshCw,
} from 'lucide-react';
import { LeaveRequest } from '@/types/models';
import { leaveService, LeaveBalanceResponse, LeaveTypeBalance } from '@/services/leave.service';
import { publicHolidays } from '@/data/leave-balance';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { usePermissions } from '@/hooks/usePermissions';

/* ─── helpers ───────────────────────────────────────────────────────────── */
const LEAVE_TYPE_LABELS: Record<string, string> = {
  ANNUAL: 'Annual Leave', SICK: 'Sick Leave', CASUAL: 'Casual Leave',
  MATERNITY: 'Maternity Leave', PATERNITY: 'Paternity Leave',
  UNPAID: 'Unpaid Leave', EMERGENCY: 'Emergency Leave',
};

const LEAVE_TYPE_COLORS: Record<string, { bg: string; text: string; bar: string }> = {
  ANNUAL:    { bg: 'bg-blue-50',    text: 'text-blue-700',    bar: 'bg-blue-500' },
  SICK:      { bg: 'bg-red-50',     text: 'text-red-700',     bar: 'bg-red-500' },
  CASUAL:    { bg: 'bg-amber-50',   text: 'text-amber-700',   bar: 'bg-amber-500' },
  MATERNITY: { bg: 'bg-pink-50',    text: 'text-pink-700',    bar: 'bg-pink-500' },
  PATERNITY: { bg: 'bg-purple-50',  text: 'text-purple-700',  bar: 'bg-purple-500' },
  UNPAID:    { bg: 'bg-slate-50',   text: 'text-slate-700',   bar: 'bg-slate-400' },
  EMERGENCY: { bg: 'bg-orange-50',  text: 'text-orange-700',  bar: 'bg-orange-500' },
};

const STATUS_STYLES: Record<string, string> = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border border-red-200',
  PENDING:  'bg-amber-50 text-amber-700 border border-amber-200',
};

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];
const WEEKDAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

/* ─── Mini calendar component ───────────────────────────────────────────── */
interface CalDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  approved: LeaveRequest | null;
  pending:  LeaveRequest | null;
  holiday:  string | null;
}

interface ImpressiveCalendarProps {
  leaves: LeaveRequest[];
  year: number;
  month: number; // 0-based
  onPrev: () => void;
  onNext: () => void;
}

const ImpressiveCalendar: React.FC<ImpressiveCalendarProps> = ({ leaves, year, month, onPrev, onNext }) => {
  const [tooltip, setTooltip] = useState<{ day: CalDay; x: number; y: number } | null>(null);

  const holidayMap = useMemo(() => {
    const m: Record<string, string> = {};
    publicHolidays.forEach(h => { m[h.date] = h.name; });
    return m;
  }, []);

  const approvedMap = useMemo(() => {
    const m: Record<string, LeaveRequest> = {};
    leaves.filter(l => l.status === 'APPROVED').forEach(l => {
      const s = new Date(l.startDate + 'T00:00:00');
      const e = new Date(l.endDate + 'T00:00:00');
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        m[d.toISOString().split('T')[0]] = l;
      }
    });
    return m;
  }, [leaves]);

  const pendingMap = useMemo(() => {
    const m: Record<string, LeaveRequest> = {};
    leaves.filter(l => l.status === 'PENDING').forEach(l => {
      const s = new Date(l.startDate + 'T00:00:00');
      const e = new Date(l.endDate + 'T00:00:00');
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        m[d.toISOString().split('T')[0]] = l;
      }
    });
    return m;
  }, [leaves]);

  const days = useMemo((): CalDay[] => {
    const today = new Date();
    const first = new Date(year, month, 1);
    const last  = new Date(year, month + 1, 0);
    const result: CalDay[] = [];
    // Leading days from prev month
    for (let i = 0; i < first.getDay(); i++) {
      const d = new Date(year, month, -first.getDay() + i + 1);
      result.push({ date: d, isCurrentMonth: false, isToday: false, approved: null, pending: null, holiday: null });
    }
    // Days of current month
    for (let i = 1; i <= last.getDate(); i++) {
      const d = new Date(year, month, i);
      const key = d.toISOString().split('T')[0];
      result.push({
        date: d,
        isCurrentMonth: true,
        isToday: d.toDateString() === today.toDateString(),
        approved: approvedMap[key] ?? null,
        pending:  pendingMap[key] ?? null,
        holiday:  holidayMap[key] ?? null,
      });
    }
    // Trailing days
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      result.push({ date: d, isCurrentMonth: false, isToday: false, approved: null, pending: null, holiday: null });
    }
    return result;
  }, [year, month, approvedMap, pendingMap, holidayMap]);

  const approvedCount  = leaves.filter(l => l.status === 'APPROVED').length;
  const pendingCount   = leaves.filter(l => l.status === 'PENDING').length;
  const thisMonthLeaves = leaves.filter(l => {
    const d = new Date(l.startDate);
    return d.getFullYear() === year && d.getMonth() === month;
  });

  return (
    <div className="relative select-none">
      {/* Month navigation header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{MONTHS[month]}</h2>
          <p className="text-sm text-slate-400 font-medium">{year}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onPrev}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={() => {
              const now = new Date();
              // handled by parent reset
            }}
            className="px-3 h-8 text-xs font-semibold rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-600"
          >
            Today
          </button>
          <button
            onClick={onNext}
            className="h-8 w-8 flex items-center justify-center rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-slate-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {[
          { label: 'This Month', value: thisMonthLeaves.length, icon: <CalendarDays size={14} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Approved',   value: approvedCount,          icon: <CheckCircle  size={14} />, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Pending',    value: pendingCount,           icon: <Clock        size={14} />, color: 'text-amber-600 bg-amber-50' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border border-slate-100 bg-white p-3 flex flex-col gap-1 shadow-sm">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${s.color}`}>{s.icon}</div>
            <span className="text-xl font-bold text-slate-800 tabular-nums">{s.value}</span>
            <span className="text-xs text-slate-400">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(w => (
          <div key={w} className={`text-center text-[11px] font-semibold py-1.5 ${w === 'Sun' || w === 'Sat' ? 'text-rose-400' : 'text-slate-400'}`}>
            {w}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
        {days.map((day, i) => {
          const isWeekend = day.date.getDay() === 0 || day.date.getDay() === 6;
          const hasEvent  = day.approved || day.pending || day.holiday;
          return (
            <div
              key={i}
              className={[
                'relative min-h-[62px] p-1.5 flex flex-col cursor-pointer transition-colors group',
                day.isCurrentMonth ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/60',
                day.isToday ? 'ring-2 ring-inset ring-blue-500' : '',
              ].join(' ')}
              onMouseEnter={e => hasEvent && setTooltip({ day, x: e.clientX, y: e.clientY })}
              onMouseLeave={() => setTooltip(null)}
            >
              {/* Date number */}
              <span className={[
                'text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full',
                day.isToday
                  ? 'bg-blue-600 text-white'
                  : !day.isCurrentMonth
                  ? 'text-slate-300'
                  : isWeekend
                  ? 'text-rose-400'
                  : 'text-slate-700',
              ].join(' ')}>
                {day.date.getDate()}
              </span>

              {/* Event indicators */}
              <div className="mt-auto flex flex-col gap-px">
                {day.holiday && (
                  <div className="text-[9px] font-semibold rounded px-1 py-0.5 bg-red-100 text-red-600 truncate leading-tight">
                    🎉 Holiday
                  </div>
                )}
                {day.approved && (
                  <div className="text-[9px] font-semibold rounded px-1 py-0.5 bg-emerald-100 text-emerald-700 truncate leading-tight">
                    ✓ {LEAVE_TYPE_LABELS[day.approved.leaveType] ?? day.approved.leaveType}
                  </div>
                )}
                {day.pending && !day.approved && (
                  <div className="text-[9px] font-semibold rounded px-1 py-0.5 bg-amber-100 text-amber-700 truncate leading-tight">
                    ⏳ {LEAVE_TYPE_LABELS[day.pending.leaveType] ?? day.pending.leaveType}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="fixed z-50 pointer-events-none bg-white border border-slate-200 rounded-xl shadow-xl p-3 min-w-[180px] text-sm"
          style={{ top: tooltip.y + 12, left: tooltip.x + 8 }}
        >
          <p className="font-semibold text-slate-700 mb-1.5">
            {tooltip.day.date.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          {tooltip.day.holiday && (
            <p className="text-red-600 flex items-center gap-1.5 text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              {tooltip.day.holiday}
            </p>
          )}
          {tooltip.day.approved && (
            <p className="text-emerald-700 flex items-center gap-1.5 text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {LEAVE_TYPE_LABELS[tooltip.day.approved.leaveType]} — {tooltip.day.approved.employeeName || 'Approved'}
            </p>
          )}
          {tooltip.day.pending && !tooltip.day.approved && (
            <p className="text-amber-700 flex items-center gap-1.5 text-xs">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              {LEAVE_TYPE_LABELS[tooltip.day.pending.leaveType]} — Pending
            </p>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─────────────────────────────────────────────────────────── */
const LeavePage: React.FC = () => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const isManager = user?.role === 'admin' || user?.role === 'manager';
  const { canApproveLeave } = usePermissions();

  const [leaves,       setLeaves]      = useState<LeaveRequest[]>([]);
  const [balance,      setBalance]     = useState<LeaveBalanceResponse | null>(null);
  const [dialogOpen,   setDialogOpen]  = useState(false);
  const [initingAll,   setInitingAll]  = useState(false);

  const now = new Date();
  const [calYear,  setCalYear]  = useState(now.getFullYear());
  const [calMonth, setCalMonth] = useState(now.getMonth());

  const [form, setForm] = useState({
    type: 'CASUAL' as LeaveRequest['leaveType'],
    startDate: '',
    endDate: '',
    reason: '',
  });

  const employeeId = user?.id;

  /* ── fetch leaves ── */
  const fetchLeaves = async () => {
    if (!user) return;
    try {
      let res;
      if (user.role === 'admin' || user.role === 'manager') {
        res = await leaveService.getAll();
      } else {
        if (!employeeId) { toast.error('User ID not found'); return; }
        res = await leaveService.getByEmployee(employeeId);
      }
      setLeaves(res.content ?? []);
    } catch {
      toast.error('Failed to load leaves');
    }
  };

  /* ── fetch balance ── */
  const fetchBalance = async () => {
    if (!employeeId) return;
    try {
      const res = await leaveService.getBalance(employeeId);
      setBalance(res);
    } catch {
      // Balance not initialized yet — show empty state
      setBalance(null);
    }
  };

  useEffect(() => {
    fetchLeaves();
    fetchBalance();
  }, [user]);

  /* ── apply leave ── */
  const handleApply = async () => {
    if (!form.startDate || !form.endDate) { toast.error('Select dates'); return; }
    if (!employeeId) { toast.error('User not found'); return; }
    try {
      await leaveService.apply(employeeId, {
        leaveType: form.type,
        startDate: form.startDate,
        endDate: form.endDate,
        reason: form.reason,
      });
      toast.success('Leave applied successfully');
      addNotification({ title: 'Leave Applied', message: `${user?.name} applied for ${LEAVE_TYPE_LABELS[form.type]} from ${form.startDate} to ${form.endDate}.`, type: 'info' });
      setDialogOpen(false);
      setForm({ type: 'CASUAL', startDate: '', endDate: '', reason: '' });
      await Promise.all([fetchLeaves(), fetchBalance()]);
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply leave');
    }
  };

  /* ── approve / reject ── */
  const updateStatus = async (id: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      if (status === 'APPROVED') await leaveService.approve(id);
      else await leaveService.reject(id);
      const leave = leaves.find(l => l.id === id);
      const msg = `${leave?.employeeName}'s ${leave?.leaveType} leave has been ${status.toLowerCase()}.`;
      toast.success(`Leave ${status.toLowerCase()}`);
      addNotification({ title: `Leave ${status}`, message: msg, type: status === 'APPROVED' ? 'success' : 'warning' });
      await Promise.all([fetchLeaves(), fetchBalance()]);
    } catch {
      toast.error('Failed to update status');
    }
  };

  /* ── init all balances (admin) ── */
  const handleInitAllBalances = async () => {
    setInitingAll(true);
    try {
      const count = await leaveService.initAll(new Date().getFullYear());
      toast.success(`Leave balances initialised for ${count} employee(s)`);
      addNotification({ title: 'Leave Balances Initialized', message: `Leave balances for ${count} employee(s) have been initialized for ${new Date().getFullYear()}.`, type: 'success' });
      fetchBalance();
    } catch (err: any) {
      toast.error(err.message || 'Failed to initialise leave balances');
    } finally {
      setInitingAll(false);
    }
  };

  /* ── calendar nav ── */
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0);  setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  /* ── upcoming holidays ── */
  const upcomingHolidays = useMemo(() =>
    publicHolidays.filter(h => new Date(h.date) >= new Date()).slice(0, 6),
    []
  );

  /* ── leaves for current calendar month ── */
  const monthLeaves = useMemo(() =>
    leaves.filter(l => {
      const d = new Date(l.startDate);
      return d.getFullYear() === calYear && d.getMonth() === calMonth;
    }).slice(0, 5),
    [leaves, calYear, calMonth]
  );

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
        <div className="flex gap-2">
          {isManager && (
            <Button variant="outline" onClick={handleInitAllBalances} disabled={initingAll}>
              <RefreshCw size={16} className={`mr-2 ${initingAll ? 'animate-spin' : ''}`} />
              Init Balances
            </Button>
          )}
          <Button onClick={() => setDialogOpen(true)}>
            <Plus size={16} className="mr-2" /> Apply Leave
          </Button>
        </div>
      </div>

      <Tabs defaultValue="requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="requests" className="gap-2"><ListChecks size={16} /> Requests</TabsTrigger>
          <TabsTrigger value="balance"  className="gap-2"><BarChart3  size={16} /> Leave Balance</TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2"><CalendarDays size={16} /> Calendar</TabsTrigger>
        </TabsList>

        {/* ── Requests Tab ── */}
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
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {canApproveLeave && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canApproveLeave ? 8 : 7} className="text-center py-12 text-muted-foreground">
                        No leave requests found
                      </TableCell>
                    </TableRow>
                  ) : leaves.map(l => {
                    const days = l.startDate && l.endDate
                      ? Math.round((new Date(l.endDate).getTime() - new Date(l.startDate).getTime()) / 86400000) + 1
                      : '—';
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="font-medium">{l.employeeName || '—'}</TableCell>
                        <TableCell>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${LEAVE_TYPE_COLORS[l.leaveType]?.bg ?? 'bg-slate-100'} ${LEAVE_TYPE_COLORS[l.leaveType]?.text ?? 'text-slate-700'}`}>
                            {LEAVE_TYPE_LABELS[l.leaveType] ?? l.leaveType}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">{l.startDate}</TableCell>
                        <TableCell className="text-sm">{l.endDate}</TableCell>
                        <TableCell className="text-sm font-medium tabular-nums">{days}d</TableCell>
                        <TableCell className="max-w-[180px] truncate text-sm text-muted-foreground">{l.reason}</TableCell>
                        <TableCell>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[l.status] ?? ''}`}>
                            {l.status}
                          </span>
                        </TableCell>
                        {canApproveLeave && (
                          <TableCell className="text-right space-x-1">
                            {isManager && l.status === 'PENDING' && (
                              <>
                                <Button variant="ghost" size="icon" onClick={() => updateStatus(l.id, 'APPROVED')} title="Approve">
                                  <CheckCircle size={16} className="text-emerald-600" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => updateStatus(l.id, 'REJECTED')} title="Reject">
                                  <XCircle size={16} className="text-destructive" />
                                </Button>
                              </>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Leave Balance Tab ── */}
        <TabsContent value="balance">
          {balance ? (
            <>
              {/* Summary strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Allocated', value: balance.totalAllocated, icon: <TrendingUp size={16} />, color: 'text-blue-600 bg-blue-50' },
                  { label: 'Used',            value: balance.totalUsed,      icon: <CheckCircle  size={16} />, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Pending',         value: balance.totalPending,   icon: <Clock        size={16} />, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Remaining',       value: balance.totalRemaining, icon: <CalendarDays size={16} />, color: 'text-purple-600 bg-purple-50' },
                ].map(s => (
                  <Card key={s.label} className="shadow-sm">
                    <CardContent className="p-4 flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>{s.icon}</div>
                      <div>
                        <p className="text-2xl font-bold tabular-nums">{s.value}</p>
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Per-type cards */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Object.entries(balance.balances).map(([type, b]: [string, LeaveTypeBalance]) => {
                  const c = LEAVE_TYPE_COLORS[type] ?? LEAVE_TYPE_COLORS.UNPAID;
                  const usedPct = b.allocated > 0 ? Math.min(100, (b.used / b.allocated) * 100) : 0;
                  const pendingPct = b.allocated > 0 ? Math.min(100 - usedPct, (b.pending / b.allocated) * 100) : 0;
                  return (
                    <Card key={type} className="shadow-sm">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${c.bg} ${c.text}`}>
                            {LEAVE_TYPE_LABELS[type] ?? type}
                          </span>
                          <span className="text-xs text-muted-foreground">{b.remaining} left</span>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-end justify-between">
                          <span className="text-3xl font-bold tabular-nums">{b.remaining}</span>
                          <span className="text-sm text-muted-foreground">of {b.allocated}</span>
                        </div>
                        {/* Stacked progress: used + pending */}
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden flex">
                          <div className={`h-full ${c.bar} transition-all`} style={{ width: `${usedPct}%` }} />
                          <div className="h-full bg-amber-300 transition-all" style={{ width: `${pendingPct}%` }} />
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>Used: {b.used}</span>
                          {b.pending > 0 && <span className="text-amber-600">Pending: {b.pending}</span>}
                          <span>Remaining: {b.remaining}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          ) : (
            <Card className="shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center">
                  <AlertCircle size={24} className="text-slate-400" />
                </div>
                <p className="font-semibold text-slate-700">No leave balance found</p>
                <p className="text-sm text-muted-foreground">Your leave balance hasn't been initialized yet. Contact HR or Admin.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── Calendar Tab ── */}
        <TabsContent value="calendar">
          <div className="grid gap-5 lg:grid-cols-[1fr_280px]">

            {/* Calendar card */}
            <Card className="shadow-sm">
              <CardContent className="p-5">
                <ImpressiveCalendar
                  leaves={leaves}
                  year={calYear}
                  month={calMonth}
                  onPrev={prevMonth}
                  onNext={nextMonth}
                />
              </CardContent>
            </Card>

            {/* Right panel */}
            <div className="space-y-4">

              {/* Legend */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">Legend</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {[
                    { color: 'bg-red-400',     label: 'Public Holiday' },
                    { color: 'bg-emerald-500', label: 'Approved Leave' },
                    { color: 'bg-amber-400',   label: 'Pending Leave' },
                    { color: 'bg-blue-500',    label: 'Today' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2.5 text-sm text-slate-600">
                      <span className={`h-3 w-3 rounded-full shrink-0 ${item.color}`} />
                      {item.label}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Upcoming holidays */}
              <Card className="shadow-sm">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm">Upcoming Holidays</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  {upcomingHolidays.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No upcoming holidays</p>
                  ) : upcomingHolidays.map(h => (
                    <div key={h.date} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                        <span className="text-sm font-medium text-slate-700">{h.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{h.date}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Leaves this month */}
              {monthLeaves.length > 0 && (
                <Card className="shadow-sm">
                  <CardHeader className="pb-2 pt-4 px-4">
                    <CardTitle className="text-sm">{MONTHS[calMonth]} Leaves</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 space-y-2.5">
                    {monthLeaves.map(l => (
                      <div key={l.id} className="flex items-start gap-2">
                        <span className={`mt-0.5 w-2 h-2 rounded-full shrink-0 ${l.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{l.employeeName || 'You'}</p>
                          <p className="text-xs text-muted-foreground">
                            {LEAVE_TYPE_LABELS[l.leaveType] ?? l.leaveType} · {l.startDate}
                            {l.startDate !== l.endDate ? ` → ${l.endDate}` : ''}
                          </p>
                        </div>
                        <span className={`ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[l.status]}`}>
                          {l.status}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Apply Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply for Leave</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Leave Type</label>
              <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(LEAVE_TYPE_LABELS) as Array<keyof typeof LEAVE_TYPE_LABELS>).map(t => (
                    <SelectItem key={t} value={t}>{LEAVE_TYPE_LABELS[t]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
            {form.startDate && form.endDate && form.endDate >= form.startDate && (
              <p className="text-xs text-muted-foreground bg-slate-50 rounded-lg px-3 py-2">
                Duration: {Math.round((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1} day(s)
              </p>
            )}
            <div className="space-y-1">
              <label className="text-sm font-medium">Reason</label>
              <Textarea
                placeholder="Provide a brief reason for your leave..."
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleApply}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LeavePage;
