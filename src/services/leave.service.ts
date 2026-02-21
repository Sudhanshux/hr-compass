import { apiClient } from './api-client';
import { LeaveRequest } from '@/types/models';

export const leaveService = {
  getAll: () =>
    apiClient.get<LeaveRequest[]>('/leaves'),

  getByEmployee: (employeeId: string) =>
    apiClient.get<LeaveRequest[]>(`/leaves/employee/${employeeId}`),

  apply: (data: Omit<LeaveRequest, 'id' | 'status' | 'appliedOn'>) =>
    apiClient.post<LeaveRequest>('/leaves', data),

  updateStatus: (id: string, status: 'approved' | 'rejected') =>
    apiClient.patch<LeaveRequest>(`/leaves/${id}/status`, { status }),
};
