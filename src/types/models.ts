export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  employeeId: string;
  email: string;
  name: string;
  role: UserRole;
  roleName: string;
  avatar?: string;
  firstName: string;
  lastName: string;
  phone: string;
  departmentName: string;
  active : boolean;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentName: string;
  role: string;
  dateOfJoining: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ONLEAVE';
  avatar?: string;
  salary?: number;
  departmentId: string;
}

export interface Department {
  id: string;
  name: string;
  head: string;
  employeeCount: number;
  description: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "SICK" | "CASUAL" | "ANNUAL" | "MATERNITY" | "PATERNITY" | "UNPAID" | "OTHER";
  startDate: string;
  endDate: string;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  appliedOn: string;
}

export interface PayslipData {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  basicSalary: number;
  hra: number;
  transportAllowance: number;
  medicalAllowance: number;
  tax: number;
  providentFund: number;
  netSalary: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  permissionCount: number;
  active: boolean;
  lastModifiedBy: string;
  createdAt: string;
  updatedAt: string;
  assignedUserCount: number;
}


