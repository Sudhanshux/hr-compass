import { apiClient } from './api-client';
import { Employee } from '@/types/models';

export const employeeService = {
  getAll: (params?: { page?: number; size?: number; search?: string }) =>
    apiClient.get<Employee[]>('/employees', { params: params as Record<string, string | number> }),

  getById: (id: string) =>
    apiClient.get<Employee>(`/employees/${id}`),

  create: (data: Omit<Employee, 'id'>) =>
    apiClient.post<Employee>('/employees', data),

  update: (id: string, data: Partial<Employee>) =>
    apiClient.put<Employee>(`/employees/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/employees/${id}`),
};
