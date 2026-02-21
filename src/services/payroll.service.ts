import { apiClient } from './api-client';
import { PayslipData } from '@/types/models';

export const payrollService = {
  getAll: () =>
    apiClient.get<PayslipData[]>('/payroll'),

  getByEmployee: (employeeId: string) =>
    apiClient.get<PayslipData[]>(`/payroll/employee/${employeeId}`),

  generate: (employeeId: string, month: string) =>
    apiClient.post<PayslipData>('/payroll/generate', { employeeId, month }),
};
