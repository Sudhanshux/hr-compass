import { Employee, Department, LeaveRequest, PayslipData } from '@/types/models';

export const mockEmployees: Employee[] = [
  { id: '1', firstName: 'John', lastName: 'Smith', email: 'john.smith@hrms.com', phone: '+1 555-0101', department: 'Engineering', role: 'Senior Developer', dateOfJoining: '2021-03-15', status: 'active', salary: 95000 },
  { id: '2', firstName: 'Sarah', lastName: 'Johnson', email: 'sarah.j@hrms.com', phone: '+1 555-0102', department: 'Marketing', role: 'Marketing Manager', dateOfJoining: '2020-07-22', status: 'active', salary: 85000 },
  { id: '3', firstName: 'Michael', lastName: 'Chen', email: 'michael.c@hrms.com', phone: '+1 555-0103', department: 'Engineering', role: 'Tech Lead', dateOfJoining: '2019-11-01', status: 'active', salary: 120000 },
  { id: '4', firstName: 'Emily', lastName: 'Davis', email: 'emily.d@hrms.com', phone: '+1 555-0104', department: 'HR', role: 'HR Specialist', dateOfJoining: '2022-01-10', status: 'active', salary: 72000 },
  { id: '5', firstName: 'Robert', lastName: 'Wilson', email: 'robert.w@hrms.com', phone: '+1 555-0105', department: 'Finance', role: 'Financial Analyst', dateOfJoining: '2021-09-05', status: 'on-leave', salary: 78000 },
  { id: '6', firstName: 'Lisa', lastName: 'Anderson', email: 'lisa.a@hrms.com', phone: '+1 555-0106', department: 'Design', role: 'UI/UX Designer', dateOfJoining: '2022-06-18', status: 'active', salary: 82000 },
  { id: '7', firstName: 'David', lastName: 'Martinez', email: 'david.m@hrms.com', phone: '+1 555-0107', department: 'Engineering', role: 'Junior Developer', dateOfJoining: '2023-02-28', status: 'active', salary: 65000 },
  { id: '8', firstName: 'Jennifer', lastName: 'Taylor', email: 'jennifer.t@hrms.com', phone: '+1 555-0108', department: 'Sales', role: 'Sales Executive', dateOfJoining: '2020-12-14', status: 'inactive', salary: 70000 },
  { id: '9', firstName: 'James', lastName: 'Brown', email: 'james.b@hrms.com', phone: '+1 555-0109', department: 'Engineering', role: 'DevOps Engineer', dateOfJoining: '2021-05-20', status: 'active', salary: 98000 },
  { id: '10', firstName: 'Amanda', lastName: 'White', email: 'amanda.w@hrms.com', phone: '+1 555-0110', department: 'HR', role: 'HR Director', dateOfJoining: '2018-08-01', status: 'active', salary: 110000 },
];

export const mockDepartments: Department[] = [
  { id: '1', name: 'Engineering', head: 'Michael Chen', employeeCount: 24, description: 'Software development and technical operations' },
  { id: '2', name: 'Marketing', head: 'Sarah Johnson', employeeCount: 12, description: 'Brand management, campaigns, and market research' },
  { id: '3', name: 'HR', head: 'Amanda White', employeeCount: 8, description: 'Human resources and talent management' },
  { id: '4', name: 'Finance', head: 'Robert Wilson', employeeCount: 10, description: 'Financial planning, accounting, and budgeting' },
  { id: '5', name: 'Design', head: 'Lisa Anderson', employeeCount: 6, description: 'UI/UX design and creative services' },
  { id: '6', name: 'Sales', head: 'Jennifer Taylor', employeeCount: 15, description: 'Sales operations and client management' },
];

export const mockLeaveRequests: LeaveRequest[] = [
  { id: '1', employeeId: '1', employeeName: 'John Smith', type: 'annual', startDate: '2026-03-01', endDate: '2026-03-05', reason: 'Family vacation', status: 'approved', appliedOn: '2026-02-10' },
  { id: '2', employeeId: '5', employeeName: 'Robert Wilson', type: 'sick', startDate: '2026-02-18', endDate: '2026-02-20', reason: 'Flu', status: 'approved', appliedOn: '2026-02-17' },
  { id: '3', employeeId: '2', employeeName: 'Sarah Johnson', type: 'casual', startDate: '2026-02-25', endDate: '2026-02-25', reason: 'Personal errands', status: 'pending', appliedOn: '2026-02-19' },
  { id: '4', employeeId: '7', employeeName: 'David Martinez', type: 'annual', startDate: '2026-03-10', endDate: '2026-03-14', reason: 'Travel abroad', status: 'pending', appliedOn: '2026-02-18' },
  { id: '5', employeeId: '6', employeeName: 'Lisa Anderson', type: 'sick', startDate: '2026-02-15', endDate: '2026-02-16', reason: 'Medical appointment', status: 'rejected', appliedOn: '2026-02-14' },
];

export const mockPayslips: PayslipData[] = [
  { id: '1', employeeId: '1', employeeName: 'John Smith', month: 'February 2026', basicSalary: 7917, hra: 2375, transportAllowance: 500, medicalAllowance: 300, tax: 1650, providentFund: 950, netSalary: 8492 },
  { id: '2', employeeId: '2', employeeName: 'Sarah Johnson', month: 'February 2026', basicSalary: 7083, hra: 2125, transportAllowance: 500, medicalAllowance: 300, tax: 1400, providentFund: 850, netSalary: 7758 },
  { id: '3', employeeId: '3', employeeName: 'Michael Chen', month: 'February 2026', basicSalary: 10000, hra: 3000, transportAllowance: 500, medicalAllowance: 300, tax: 2200, providentFund: 1200, netSalary: 10400 },
];
