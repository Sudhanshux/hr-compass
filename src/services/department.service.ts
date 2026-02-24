import { apiClient } from './api-client';
import { Department } from '@/types/models';

export interface ApiResponse<T> {
  timestamp: string;
  status: number;
  message: string;
  data: T;
}

export const departmentService = {
  getAll: () =>
    apiClient.get<Department[]>('/departments'),

  getById: (id: string) =>
    apiClient.get<Department>(`/departments/${id}`),

  create: (data: Omit<Department, 'id' | 'employeeCount'>) =>
    apiClient.post<Department>('/departments', data),

  update: (id: string, data: Partial<Department>) =>
    apiClient.put<Department>(`/departments/${id}`, data),

  delete: (id: string) =>
    apiClient.delete<void>(`/departments/${id}`),
};