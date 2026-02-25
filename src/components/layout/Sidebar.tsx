import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, Building2, CalendarDays, DollarSign, Clock,
  ChevronLeft, ChevronRight, LogOut, Settings
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/employees', label: 'Employees', icon: Users, minRole: 'manager' as const },
  { to: '/departments', label: 'Departments', icon: Building2, minRole: 'manager' as const },
  { to: '/leave', label: 'Leave', icon: CalendarDays },
  { to: '/payroll', label: 'Payroll', icon: DollarSign },
  { to: '/attendance', label: 'Attendance', icon: Clock },
  { to: '/settings', label: 'Settings', icon: Settings, minRole: 'admin' as const },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const roleLevel = (r: string) => r === 'admin' ? 3 : r === 'manager' ? 2 : 1;
  const filteredNav = navItems.filter(item => {
    if (!item.minRole) return true;
    return roleLevel(user?.role || 'employee') >= roleLevel(item.minRole);
  });

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col transition-all duration-300 gradient-primary',
        collapsed ? 'w-[68px]' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4">
        {!collapsed && (
          <span className="text-xl font-bold text-sidebar-primary">HRMS</span>
        )}
        <button
          onClick={onToggle}
          className="rounded-md p-1.5 text-sidebar-foreground/80 hover:bg-sidebar-accent transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {filteredNav.map(({ to, label, icon: Icon }) => {
          const active = location.pathname.startsWith(to);
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground'
              )}
            >
              <Icon size={20} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 pb-4">
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 hover:bg-sidebar-accent/50 transition-colors"
        >
          <LogOut size={20} />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
