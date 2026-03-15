import { apiClient } from './api-client';
import { PayslipData } from '@/types/models';

interface SpringPage<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export interface PayrollPayload {
  employeeId: string;
  month: string;
  paidDays?: number;
  lopDays?: number;
  basicSalary: number;
  hra: number;
  da: number;
  transportAllowance: number;
  medicalAllowance: number;
  specialAllowance: number;
  providentFund: number;
  esi: number;
  professionalTax: number;
  incomeTax: number;
}

export const payrollService = {
  /** Admin: fetch all payslips */
  getAll: async (): Promise<PayslipData[]> => {
    const res = await apiClient.get<SpringPage<PayslipData>>('/payroll', { params: { size: 100 } });
    return res.content ?? [];
  },

  /** Non-admin: fetch own payslips */
  getMine: async (): Promise<PayslipData[]> => {
    const res = await apiClient.get<SpringPage<PayslipData>>('/payroll/me', { params: { size: 100 } });
    return res.content ?? [];
  },

  /** Admin: generate a new payslip */
  generate: (payload: PayrollPayload): Promise<PayslipData> =>
    apiClient.post<PayslipData>('/payroll/generate', payload),

  /** Admin: update an existing payslip */
  update: (id: string, payload: PayrollPayload): Promise<PayslipData> =>
    apiClient.put<PayslipData>(`/payroll/${id}`, payload),
};
