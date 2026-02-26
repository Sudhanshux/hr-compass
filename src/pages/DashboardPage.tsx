import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Building2, CalendarDays, TrendingUp, TrendingDown, Clock, DollarSign } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { mockEmployees, mockDepartments, mockLeaveRequests, mockPayslips } from '@/data/mock-data';
import { mockLeaveBalances } from '@/data/leave-balance';
import { Progress } from '@/components/ui/progress';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import Announcements from '@/components/dashboard/Announcements';
import TodoList from '@/components/dashboard/TodoList';

const barData = [
  { month: 'Sep', hires: 5 }, { month: 'Oct', hires: 8 }, { month: 'Nov', hires: 3 },
  { month: 'Dec', hires: 6 }, { month: 'Jan', hires: 4 }, { month: 'Feb', hires: 7 },
];

const deptData = mockDepartments.map(d => ({ name: d.name, value: d.employeeCount }));
const COLORS = ['hsl(232,54%,48%)', 'hsl(187,100%,38%)', 'hsl(340,82%,56%)', 'hsl(142,71%,45%)', 'hsl(38,92%,50%)', 'hsl(270,60%,55%)'];

const attendanceData = [
  { day: 'Mon', present: 92 }, { day: 'Tue', present: 88 }, { day: 'Wed', present: 95 },
  { day: 'Thu', present: 90 }, { day: 'Fri', present: 85 },
];

const adminStats = [
  { title: 'Total Employees', value: mockEmployees.length, icon: Users, change: '+12%', up: true },
  { title: 'Active', value: mockEmployees.filter(e => e.status === 'active').length, icon: UserCheck, change: '+5%', up: true },
  { title: 'Departments', value: mockDepartments.length, icon: Building2, change: '0%', up: true },
  { title: 'Pending Leaves', value: mockLeaveRequests.filter(l => l.status === 'pending').length, icon: CalendarDays, change: '-8%', up: false },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const isEmployee = user?.role === 'employee';

  if (isEmployee) {
    return <EmployeeDashboard userName={user?.name || 'User'} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {user?.name} 👋</h1>
        <p className="text-muted-foreground">Here's what's happening today.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {adminStats.map(({ title, value, icon: Icon, change, up }) => (
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
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="hires" fill="hsl(232,54%,48%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle className="text-base">Department Distribution</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={deptData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {deptData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Weekly Attendance Rate (%)</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="present" stroke="hsl(187,100%,38%)" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Recent leaves */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">Recent Leave Requests</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockLeaveRequests.slice(0, 4).map(lr => (
              <div key={lr.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-medium text-sm">{lr.employeeName}</p>
                  <p className="text-xs text-muted-foreground">{lr.type} · {lr.startDate} to {lr.endDate}</p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  lr.status === 'approved' ? 'bg-success/10 text-success' :
                  lr.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                  'bg-warning/10 text-warning'
                }`}>{lr.status}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/* ── Employee-specific Dashboard ── */
const EmployeeDashboard: React.FC<{ userName: string }> = ({ userName }) => {
  const myPayslip = mockPayslips[0];
  const myLeaves = mockLeaveRequests.filter(l => l.employeeId === '3' || l.status === 'pending').slice(0, 3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {userName} 👋</h1>
        <p className="text-muted-foreground">Your personal dashboard overview.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { title: 'Today', value: 'Present', icon: Clock, desc: 'Attendance status', accent: 'bg-success/10 text-success' },
          { title: 'Pending Leaves', value: myLeaves.filter(l => l.status === 'pending').length.toString(), icon: CalendarDays, desc: 'Awaiting approval', accent: 'bg-warning/10 text-warning' },
          { title: 'Leave Balance', value: mockLeaveBalances.reduce((a, b) => a + b.remaining, 0).toString(), icon: CalendarDays, desc: 'Days remaining', accent: 'bg-info/10 text-info' },
          { title: 'Net Salary', value: `$${myPayslip.netSalary.toLocaleString()}`, icon: DollarSign, desc: myPayslip.month, accent: 'bg-primary/10 text-primary' },
        ].map(s => (
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mockLeaveBalances.map(lb => (
              <div key={lb.type} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{lb.type}</span>
                  <span className="text-muted-foreground">{lb.remaining}/{lb.total}</span>
                </div>
                <Progress value={(lb.used / lb.total) * 100} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Leave Requests */}
      <Card className="shadow-sm">
        <CardHeader><CardTitle className="text-base">My Recent Leave Requests</CardTitle></CardHeader>
        <CardContent>
          {myLeaves.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No leave requests.</p>
          ) : (
            <div className="space-y-3">
              {myLeaves.map(lr => (
                <div key={lr.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="font-medium text-sm capitalize">{lr.type} Leave</p>
                    <p className="text-xs text-muted-foreground">{lr.startDate} to {lr.endDate}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    lr.status === 'approved' ? 'bg-success/10 text-success' :
                    lr.status === 'rejected' ? 'bg-destructive/10 text-destructive' :
                    'bg-warning/10 text-warning'
                  }`}>{lr.status}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardPage;
