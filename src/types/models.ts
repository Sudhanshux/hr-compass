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
  organizationName?: string;
  organizationId?: string;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  departmentName: string;
  departmentId: string;
  role: string;
  designation?: string;
  dateOfJoining: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ONLEAVE';
  avatar?: string;
  salary?: number;
  reportingManagerId?: string;
  reportingManagerName?: string;
}

export interface OrgNode {
  employeeId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  designation?: string;
  email: string;
  profilePhotoUrl?: string;
  departmentId?: string;
  departmentName?: string;
  role?: string;
  reportingManagerId?: string;
  directReports: OrgNode[];
  totalSubordinates: number;
  hierarchyLevel: number;
}

export interface Department {
  id: string;
  name: string;
  managerId?: string;
  managerName?: string;
  head?: string;         // legacy alias — equals managerName when present
  employeeCount: number;
  description: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  leaveType: "SICK" | "CASUAL" | "ANNUAL" | "MATERNITY" | "PATERNITY" | "UNPAID" | "EMERGENCY";
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
  designation?: string;
  department?: string;
  month: string;
  paidDays?: number;
  lopDays?: number;
  // Earnings
  basicSalary: number;
  hra: number;
  da: number;
  transportAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  grossSalary: number;
  // Deductions
  providentFund: number;
  esi: number;
  professionalTax: number;
  incomeTax: number;
  totalDeductions: number;
  netSalary: number;
  createdAt?: string;
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


