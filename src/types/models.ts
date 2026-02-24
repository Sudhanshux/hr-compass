export type UserRole = 'admin' | 'manager' | 'employee';

export interface User {
  id: string;
  employeeId: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
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
  status: 'active' | 'inactive' | 'on-leave';
  avatar?: string;
  salary?: number;
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
