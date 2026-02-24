import { apiClient } from './api-client';

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  punchInLocation: { latitude: number; longitude: number } | null;
  punchOutLocation: { latitude: number; longitude: number } | null;
  status: 'present' | 'absent' | 'half-day' | 'on-leave';
  totalHours: number | null;
}

export interface PunchRequest {
  latitude: number;
  longitude: number;
}

export const attendanceService = {
  getToday: () => apiClient.get<AttendanceRecord>('/attendance/today'),
  punchIn: (employeeId: string,data: PunchRequest) => apiClient.post<AttendanceRecord>(`/attendance/punch-in/${employeeId}`, data),
  punchOut: (employeeId: string,data: PunchRequest) => apiClient.post<AttendanceRecord>(`/attendance/punch-out/${employeeId}`, data),
  getHistory: (params?: { page?: number; size?: number; month?: string }) =>
    apiClient.get<AttendanceRecord[]>('/attendance/history', { params: params as Record<string, string | number | boolean> }),
  getByEmployee: (employeeId: string) =>
    apiClient.get<AttendanceRecord[]>(`/attendance/employee/${employeeId}`),
};
