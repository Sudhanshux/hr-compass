import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/models';

// Central permission definitions per role
const rolePermissions: Record<UserRole, string[]> = {
  admin: [
    'view_dashboard', 'manage_employees', 'manage_departments',
    'manage_leave', 'approve_leave', 'view_payroll', 'manage_payroll',
    'view_attendance', 'manage_attendance', 'manage_settings',
    'view_performance', 'manage_onboarding', 'view_all_payslips',
  ],
  manager: [
    'view_dashboard', 'manage_employees', 'manage_departments',
    'approve_leave', 'view_payroll', 'view_attendance',
    'view_performance', 'manage_onboarding', 'view_all_payslips',
  ],
  employee: [
    'view_dashboard', 'manage_leave', 'view_attendance',
    'view_performance', 'view_own_payslip',
  ],
};

export const usePermissions = () => {
  const { user } = useAuth();
  const role = user?.role || 'employee';
  const permissions = rolePermissions[role] || [];

  const hasPermission = (perm: string) => permissions.includes(perm);
  const hasAnyPermission = (...perms: string[]) => perms.some(p => permissions.includes(p));
  const hasAllPermissions = (...perms: string[]) => perms.every(p => permissions.includes(p));

  const canViewAllPayslips = hasPermission('view_all_payslips');
  const canManageEmployees = hasPermission('manage_employees');
  const canApproveLeave = hasPermission('approve_leave');
  const canManageSettings = hasPermission('manage_settings');
  const canManageOnboarding = hasPermission('manage_onboarding');

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canViewAllPayslips,
    canManageEmployees,
    canApproveLeave,
    canManageSettings,
    canManageOnboarding,
  };
};
