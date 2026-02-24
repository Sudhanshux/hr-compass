import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Building2, CalendarDays, TrendingUp, TrendingDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { employeeService } from '@/services/employee.service';
import { departmentService } from '@/services/department.service';
import { leaveService } from '@/services/leave.service';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
  LineChart, Line
} from 'recharts';

const barData = [
  { month: 'Sep', hires: 5 },
  { month: 'Oct', hires: 8 },
  { month: 'Nov', hires: 3 },
  { month: 'Dec', hires: 6 },
  { month: 'Jan', hires: 4 },
  { month: 'Feb', hires: 7 },
];

const COLORS = [
  'hsl(232,54%,48%)',
  'hsl(187,100%,38%)',
  'hsl(340,82%,56%)',
  'hsl(142,71%,45%)',
  'hsl(38,92%,50%)',
  'hsl(270,60%,55%)'
];

const attendanceData = [
  { day: 'Mon', present: 92 },
  { day: 'Tue', present: 88 },
  { day: 'Wed', present: 95 },
  { day: 'Thu', present: 90 },
  { day: 'Fri', present: 85 },
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [employees, setEmployees] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);

  useEffect(() => {
  const fetchDashboardData = async () => {
    try {
      const [empRes, deptRes, leaveRes] = await Promise.all([
        employeeService.getAll(),
        departmentService.getAll(),
        leaveService.getAll()
      ]);

      setEmployees(empRes?.content ?? []);
      setDepartments(deptRes ?? []);
      setLeaveRequests(leaveRes?.content ?? []);

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  fetchDashboardData();
}, []);

  const deptData = departments.map(d => ({
    name: d.name,
    value: d.employeeCount,
  }));

  const stats = [
    {
      title: 'Total Employees',
      value: employees.length,
      icon: Users,
      change: '+12%',
      up: true,
    },
    {
      title: 'Active',
      value: employees.filter(e => e.status === 'active').length,
      icon: UserCheck,
      change: '+5%',
      up: true,
    },
    {
      title: 'Departments',
      value: departments.length,
      icon: Building2,
      change: '0%',
      up: true,
    },
    {
      title: 'Pending Leaves',
      value: leaveRequests.filter(l => l.status === 'pending').length,
      icon: CalendarDays,
      change: '-8%',
      up: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {user?.name} 👋
        </h1>
        <p className="text-muted-foreground">
          Here's what's happening today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ title, value, icon: Icon, change, up }) => (
          <Card key={title}>
            <CardContent className="flex items-center justify-between p-5">
              <div>
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-3xl font-bold mt-1">{value}</p>
                <div className="flex items-center gap-1 mt-1 text-xs">
                  {up ? (
                    <TrendingUp size={14} />
                  ) : (
                    <TrendingDown size={14} />
                  )}
                  <span>{change}</span>
                </div>
              </div>
              <Icon size={22} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts remain same as before */}
    </div>
  );
};

export default DashboardPage;