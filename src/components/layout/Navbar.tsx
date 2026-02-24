import React from 'react';
import { Bell, Moon, Sun, ChevronRight } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { UserRole } from '@/types/models';

const routeLabels: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/employees': 'Employees',
  '/departments': 'Departments',
  '/leave': 'Leave Management',
  '/payroll': 'Payroll',
};

const Navbar: React.FC = () => {
  const { user, logout, switchRole } = useAuth();
  const { isDark, toggle } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();


  const pageTitle = Object.entries(routeLabels).find(([path]) =>
    location.pathname.startsWith(path)
  )?.[1] || 'HRMS';

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">Home</span>
        <ChevronRight size={14} className="text-muted-foreground" />
        <span className="font-medium">{pageTitle}</span>
      </div>

      <div className="flex items-center gap-3">
        {/* Role badge */}
        <Badge variant="outline" className="capitalize hidden sm:inline-flex">
          {user?.role}
        </Badge>

        {/* Dark mode */}
        <button onClick={toggle} className="rounded-lg p-2 hover:bg-muted transition-colors">
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 hover:bg-muted transition-colors">
          <Bell size={18} />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-accent" />
        </button>

        {/* Profile dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 hover:bg-muted transition-colors">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>My Profile</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Switch Role</DropdownMenuLabel>
            {(['admin', 'manager', 'employee'] as UserRole[]).map(role => (
              <DropdownMenuItem key={role} onClick={() => switchRole(role)} className="capitalize">
                {role} {user?.role === role && '✓'}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};

export default Navbar;
