import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Users, UserCheck, Building2, CalendarDays,
  TrendingUp, TrendingDown, Clock, DollarSign, Loader2,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { employeeService } from '@/services/employee.service';
import { departmentService } from '@/services/department.service';
import { leaveService } from '@/services/leave.service';
import { attendanceService } from '@/services/attendance.service';
import { payrollService } from '@/services/payroll.service';
import { onboardingService } from '@/services/onboarding.service';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Announcements from '@/components/dashboard/Announcements';
import TodoList from '@/components/dashboard/TodoList';

const COLORS = [
  'hsl(232,54%,48%)',
  'hsl(187,100%,38%)',
  'hsl(340,82%,56%)',
  'hsl(142,71%,45%)',
  'hsl(38,92%,50%)',
  'hsl(270,60%,55%)',
];

const PageLoader: React.FC = () => (
  <div className="flex h-64 items-center justify-center">
    <Loader2 className="animate-spin text-muted-foreground" size={32} />
  </div>
);

interface QuickStat {
  title:  string;
  value:  string | number;
  icon:   LucideIcon;
  desc:   string;
  accent: string;
}

/** Returns the last 5 weekdays as { iso: 'YYYY-MM-DD', label: 'Mon' } */
function getLastFiveWeekdays(): { iso: string; label: string }[] {
  const result: { iso: string; label: string }[] = [];
  const labels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date();
  while (result.length < 5) {
    if (d.getDay() !== 0 && d.getDay() !== 6) {
      const iso = d.toISOString().split('T')[0];
      result.unshift({ iso, label: labels[d.getDay()] });
    }
    d.setDate(d.getDate() - 1);
  }
  return result;
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD
   ══════════════════════════════════════════════════════════════════ */
const AdminDashboard: React.FC<{ userName: string }> = ({ userName }) => {
  const [employees,      setEmployees]      = useState<any[]>([]);
  const [departments,    setDepartments]    = useState<any[]>([]);
  const [leaveRequests,  setLeaveRequests]  = useState<any[]>([]);
  const [monthlyHires,   setMonthlyHires]   = useState<{ month: string; hires: number }[]>([]);
  const [attendanceWeek, setAttendanceWeek] = useState<{ day: string; present: number }[]>([]);
  const [loading,        setLoading]        = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [empRes, deptRes, leaveRes, onboardingRes] = await Promise.all([
          employeeService.getAll({ size: 500 }).catch(() => ({ content: [] })),
          departmentService.getAll().catch(() => []),
          leaveService.getAll().catch(() => ({ content: [] })),
          onboardingService.getAll().catch(() => []),
        ]);

        const emps       = Array.isArray(empRes)       ? empRes       : (empRes?.content  ?? []);
        const depts      = Array.isArray(deptRes)      ? deptRes      : (deptRes          ?? []);
        const leaves     = Array.isArray(leaveRes)     ? leaveRes     : (leaveRes?.content ?? []);
        const onboarding = Array.isArray(onboardingRes) ? onboardingRes : [];

        setEmployees(emps);
        setDepartments(depts);
        setLeaveRequests(leaves);

        // Monthly hires — from completed onboarding records using dateOfJoining
        const hireMap: Record<string, number> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          hireMap[d.toLocaleString('default', { month: 'short' })] = 0;
        }
        onboarding
          .filter((o: any) => o.completionPercent === 100 || o.status === 'completed')
          .forEach((o: any) => {
            const raw = o.dateOfJoining ?? o.createdAt;
            if (raw) {
              const key = new Date(raw).toLocaleString('default', { month: 'short' });
              if (key in hireMap) hireMap[key]++;
            }
          });
        setMonthlyHires(Object.entries(hireMap).map(([month, hires]) => ({ month, hires })));

        // Weekly attendance — count employees who actually punched in each weekday
        try {
          const weekdays = getLastFiveWeekdays();
          const attResults = await Promise.all(
            weekdays.map(d => attendanceService.getByDate(d.iso).catch(() => ({ content: [] })))
          );
          const weeklyData = weekdays.map((d, i) => {
            const res: any   = attResults[i];
            const records: any[] = res?.content ?? (Array.isArray(res) ? res : []);
            // Count employees who punched in (punchInTime present) that day
            const punchedIn = records.filter((r: any) => r.punchInTime != null).length;
            const rate = emps.length > 0 ? Math.round((punchedIn / emps.length) * 100) : 0;
            return { day: d.label, present: rate };
          });
          setAttendanceWeek(weeklyData);
        } catch {
          setAttendanceWeek([]);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <PageLoader />;

  const activeCount = employees.filter((e: any) =>
    e.status === 'ACTIVE' || e.status === 'active'
  ).length;

  const stats = [
    { title: 'Total Employees', value: employees.length,   icon: Users,        change: '+12%', up: true  },
    { title: 'Active',          value: activeCount,         icon: UserCheck,    change: '+5%',  up: true  },
    { title: 'Departments',     value: departments.length,  icon: Building2,    change: '0%',   up: true  },
    { title: 'Pending Leaves',  value: leaveRequests.length, icon: CalendarDays, change: '-8%', up: false },
  ];

  const deptData = departments
    .map((d: any) => ({ name: d.name, value: d.employeeCount ?? d.headCount ?? 0 }))
    .filter(d => d.value > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {userName} 👋</h1>
        <p className="text-muted-foreground">Here's what's happening today.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, change, up }) => (
          <Card key={title} className="shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {up ? <TrendingUp size={14} className="text-success" /> : <TrendingDown size={14} className="text-destructive" />}
                  <span className={up ? 'text-success' : 'text-destructive'}>{change}</span>
                </div>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-primary text-white">
                <Icon size={22} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Announcements & Todo */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Announcements />
        <TodoList />
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Monthly Hires</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyHires}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="hires" fill="hsl(232,54%,48%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Department Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            {deptData.length === 0 ? (
              <p className="text-sm text-muted-foreground py-10">No department data</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                    {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Weekly Attendance Rate (%)</CardTitle></CardHeader>
          <CardContent>
            {attendanceWeek.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">No attendance data</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={attendanceWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis domain={[0, 100]} unit="%" />
                  <Tooltip formatter={(v: any) => `${v}%`} />
                  <Line type="monotone" dataKey="present" stroke="hsl(187,100%,38%)" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   EMPLOYEE DASHBOARD
   ══════════════════════════════════════════════════════════════════ */
const EmployeeDashboard: React.FC<{ userName: string; employeeId: string }> = ({
  userName,
  employeeId,
}) => {
  const [todayRecord,   setTodayRecord]   = useState<any | null>(null);
  const [leaveBalance,  setLeaveBalance]  = useState<any | null>(null);
  const [myLeaves,      setMyLeaves]      = useState<any[]>([]);
  const [latestPayslip, setLatestPayslip] = useState<any | null>(null);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [todayRes, balanceRes, leavesRes, payslips] = await Promise.all([
          attendanceService.getToday(employeeId).catch(() => null),
          leaveService.getBalance(employeeId).catch(() => null),
          leaveService.getByEmployee(employeeId).catch(() => ({ content: [] })),
          payrollService.getMine().catch(() => []),
        ]);

        setTodayRecord(todayRes);
        setLeaveBalance(balanceRes);

        const raw = leavesRes as any;
        setMyLeaves(Array.isArray(raw) ? raw : (raw?.content ?? []));

        // Latest payslip is first (sorted by month desc from backend)
        setLatestPayslip(Array.isArray(payslips) && payslips.length > 0 ? payslips[0] : null);
      } catch (err) {
        console.error('Employee dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [employeeId]);

  if (loading) return <PageLoader />;

  const attendanceStatus = todayRecord?.punchInTime
    ? todayRecord.punchOutTime ? 'Complete' : 'Present'
    : 'Not Punched In';

  const pendingLeaveCount = myLeaves.filter(
    (l: any) => l.status === 'PENDING' || l.status === 'pending',
  ).length;

  const totalLeaveRemaining = leaveBalance
    ? Object.values(leaveBalance.balances ?? {}).reduce(
        (sum: number, b: any) => sum + (b.remaining ?? 0), 0,
      )
    : 0;

  const netSalary: string = latestPayslip?.netSalary != null
    ? `₹${Number(latestPayslip.netSalary).toLocaleString()}`
    : '—';

  const salaryMonth: string = latestPayslip?.month ?? latestPayslip?.payPeriod ?? '—';

  const leaveTypeRows: { type: string; used: number; total: number; remaining: number }[] =
    leaveBalance
      ? Object.entries(leaveBalance.balances ?? {}).map(([type, b]: [string, any]) => ({
          type:      type.charAt(0).toUpperCase() + type.slice(1).toLowerCase(),
          used:      b.used      ?? 0,
          total:     b.allocated ?? 0,
          remaining: b.remaining ?? 0,
        }))
      : [];

  const quickStats: QuickStat[] = [
    { title: 'Today',          value: attendanceStatus,              icon: Clock,        desc: 'Attendance status', accent: 'bg-success/10 text-success'   },
    { title: 'Pending Leaves', value: pendingLeaveCount,             icon: CalendarDays, desc: 'Awaiting approval', accent: 'bg-warning/10 text-warning'   },
    { title: 'Leave Balance',  value: `${totalLeaveRemaining} days`, icon: CalendarDays, desc: 'Days remaining',    accent: 'bg-info/10 text-info'         },
    { title: 'Net Salary',     value: netSalary,                     icon: DollarSign,   desc: salaryMonth,         accent: 'bg-primary/10 text-primary'   },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {userName} 👋</h1>
        <p className="text-muted-foreground">Your personal dashboard overview.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {quickStats.map(s => (
          <Card key={s.title} className="shadow-sm">
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{s.title}</p>
                <p className="text-2xl font-bold mt-1">{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.accent}`}>
                <s.icon size={22} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Announcements & Todo */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Announcements />
        <TodoList />
      </div>

      {/* Leave Balance */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Leave Balance</CardTitle></CardHeader>
        <CardContent>
          {leaveTypeRows.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No leave balance data available.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {leaveTypeRows.map(lb => (
                <div key={lb.type} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{lb.type}</span>
                    <span className="text-muted-foreground">{lb.remaining}/{lb.total}</span>
                  </div>
                  <Progress value={lb.total > 0 ? (lb.used / lb.total) * 100 : 0} className="h-2" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent leave requests */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">My Recent Leave Requests</CardTitle></CardHeader>
        <CardContent>
          {myLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No leave requests.</p>
          ) : (
            <div className="space-y-3">
              {myLeaves.slice(0, 5).map((lr: any) => {
                const status   = (lr.status ?? '').toLowerCase();
                const badgeCls =
                  status === 'approved' ? 'bg-success/10 text-success'         :
                  status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                                          'bg-warning/10 text-warning';
                const type  = lr.leaveType ?? lr.type ?? 'Leave';
                const start = lr.startDate ?? lr.fromDate ?? '—';
                const end   = lr.endDate   ?? lr.toDate   ?? '—';
                return (
                  <div key={lr.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="font-medium text-sm">
                        {String(type).charAt(0).toUpperCase() + String(type).slice(1).toLowerCase()} Leave
                      </p>
                      <p className="text-xs text-muted-foreground">{start} → {end}</p>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${badgeCls}`}>
                      {status}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ROOT PAGE
   ══════════════════════════════════════════════════════════════════ */
const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const role       = (user?.role ?? '').toLowerCase();
  const isEmployee = role === 'employee';
  const userName   = user?.name ?? 'User';
  const employeeId = user?.employeeId?.toString() ?? '';

  if (isEmployee) {
    return <EmployeeDashboard userName={userName} employeeId={employeeId} />;
  }

  return <AdminDashboard userName={userName} />;
};

export default DashboardPage;
