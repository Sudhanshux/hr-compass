import { apiClient } from './api-client';

export interface AttendanceLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;   // stored by backend (GeoLocationDto.address)
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchInTime: string | null;
  punchOutTime: string | null;
  punchInLocation: AttendanceLocation | null;
  punchOutLocation: AttendanceLocation | null;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE';
  workingHours: number | string | null;
  workingMinutes?: number;
  remarks?: string;
}

export interface PunchRequest {
  latitude: number;
  longitude: number;
  address: string;
}

export const attendanceService = {
  getToday:   (employeeId: string) =>
    apiClient.get<AttendanceRecord>(`/attendance/today/${employeeId}`),

  punchIn:    (employeeId: string, data: PunchRequest) =>
    apiClient.post<AttendanceRecord>(`/attendance/punch-in/${employeeId}`, data),

  punchOut:   (employeeId: string, data: PunchRequest) =>
    apiClient.put<AttendanceRecord>(`/attendance/punch-out/${employeeId}`, data),

  getHistory: (employeeId: string, params?: { page?: number; size?: number; month?: string }) =>
    apiClient.get<AttendanceRecord[]>(`/attendance/employee/${employeeId}`, {
      params: params as Record<string, string | number | boolean>,
    }),

  getByEmployee: (employeeId: string) =>
    apiClient.get<AttendanceRecord[]>(`/attendance/employee/${employeeId}`),

  /** Admin: get all employees' attendance for a specific date (YYYY-MM-DD) */
  getByDate: (date: string) =>
    apiClient.get<{ content: AttendanceRecord[]; totalElements: number }>('/attendance/date', {
      params: { date, size: 500 },
    }),
};
