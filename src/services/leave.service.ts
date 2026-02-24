import { apiClient } from './api-client';
import { LeaveRequest } from '@/types/models';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const leaveService = {
 getAll: () =>
  apiClient.get<PageResponse<LeaveRequest>>('/leaves/pending'),

  getByEmployee: (employeeId: string) =>
    apiClient.get<LeaveRequest[]>(`/leaves/employee/${employeeId}`),

apply: (
  employeeId: string,
  data: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn' | 'employeeId' | 'employeeName'>
) =>
  apiClient.post<LeaveRequest>(`/leaves/apply/${employeeId}`, data),

  updateStatus: (id: string, status: 'APPROVED' | 'REJECTED') =>
    apiClient.patch<LeaveRequest>(`/leaves/${id}/status`, { status }),
};
