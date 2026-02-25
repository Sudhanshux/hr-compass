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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line,
} from 'recharts';

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

// FIX ②: interface at module level — NOT inside a component body
interface QuickStat {
  title:  string;
  value:  string | number;
  icon:   LucideIcon;
  desc:   string;
  accent: string;
}

/* ══════════════════════════════════════════════════════════════════
   ADMIN DASHBOARD — unchanged, already working
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
        const [empRes, deptRes, leaveRes] = await Promise.all([
          employeeService.getAll().catch(() => ({ content: [] })),
          departmentService.getAll().catch(() => []),
          leaveService.getAll().catch(() => ({ content: [] })),
        ]);

        const emps   = Array.isArray(empRes)   ? empRes   : (empRes?.content  ?? []);
        const depts  = Array.isArray(deptRes)  ? deptRes  : (deptRes          ?? []);
        const leaves = Array.isArray(leaveRes) ? leaveRes : (leaveRes?.content ?? []);

        setEmployees(emps);
        setDepartments(depts);
        setLeaveRequests(leaves);

        const hireMap: Record<string, number> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          hireMap[d.toLocaleString('default', { month: 'short' })] = 0;
        }
        emps.forEach((e: any) => {
          if (e.joiningDate || e.joinDate || e.createdAt) {
            const d   = new Date(e.joiningDate ?? e.joinDate ?? e.createdAt);
            const key = d.toLocaleString('default', { month: 'short' });
            if (key in hireMap) hireMap[key]++;
          }
        });
        setMonthlyHires(Object.entries(hireMap).map(([month, hires]) => ({ month, hires })));

        try {
          const attRes = await attendanceService.getWeeklySummary().catch(() => null);
          if (attRes && Array.isArray(attRes)) {
            setAttendanceWeek(attRes);
          } else {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
            setAttendanceWeek(days.map(day => ({
              day,
              present: emps.length > 0 ? Math.round(emps.length * 0.9) : 0,
            })));
          }
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

  const stats = [
    { title: 'Total Employees', value: employees.length,                                                                            icon: Users,        change: '+12%', up: true  },
    { title: 'Active',          value: employees.filter((e: any) => e.status === 'ACTIVE' || e.status === 'active').length,         icon: UserCheck,    change: '+5%',  up: true  },
    { title: 'Departments',     value: departments.length,                                                                           icon: Building2,    change: '0%',   up: true  },
    { title: 'Pending Leaves',  value: leaveRequests.filter((l: any) => l.status === 'PENDING' || l.status === 'pending').length,   icon: CalendarDays, change: '-8%',  up: false },
  ];

  const deptData = departments.map((d: any) => ({
    name:  d.name,
    value: d.employeeCount ?? d.headCount ?? 0,
  }));

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
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
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

  // FIX ①: useEffect uncommented — this was why the page showed only a spinner forever
  useEffect(() => {
    if (!employeeId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        // const [todayRes, balanceRes, leavesRes, payrollRes] = await Promise.all([
        const [todayRes] = await Promise.all([
          attendanceService.getToday(employeeId).catch(() => null),
          // attendanceService.getBalance(employeeId).catch(() => null),
          // leaveService.getEmployeeLeaves(employeeId, 0, 5).catch(() => ({ content: [] })),
          // payrollService.getLatest(employeeId).catch(() => null),
        ]);

        setTodayRecord(todayRes);
        // setLeaveBalance(balanceRes);

        // const raw    = leavesRes as any;
        // const leaves = Array.isArray(raw) ? raw : (raw?.content ?? []);
        // setMyLeaves(leaves);

        // setLatestPayslip(payrollRes);
      } catch (err) {
        console.error('Employee dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [employeeId]);

  if (loading) return <PageLoader />;

  /* ── Derive display values ── */
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

  // QuickStat interface is now at module level (Fix ②)
  const quickStats: QuickStat[] = [
    { title: 'Today',          value: attendanceStatus,            icon: Clock,        desc: 'Attendance status', accent: 'bg-success/10 text-success'   },
    { title: 'Pending Leaves', value: pendingLeaveCount,           icon: CalendarDays, desc: 'Awaiting approval', accent: 'bg-warning/10 text-warning'   },
    { title: 'Leave Balance',  value: `${totalLeaveRemaining} days`, icon: CalendarDays, desc: 'Days remaining',  accent: 'bg-info/10 text-info'         },
    { title: 'Net Salary',     value: netSalary,                   icon: DollarSign,   desc: salaryMonth,         accent: 'bg-primary/10 text-primary'   },
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
                {/* FIX ③: uncommented — was preventing values from rendering */}
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
  const userName   = user?.name ?? user?.name ?? 'User';
  const employeeId = user?.employeeId ?? '';

  if (isEmployee) {
    return <EmployeeDashboard userName={userName} employeeId={employeeId} />;
  }

  return <AdminDashboard userName={userName} />;
};

export default DashboardPage;
