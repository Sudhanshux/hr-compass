import { apiClient } from './api-client';

export interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  read: boolean;
  createdAt: string; // ISO datetime string from backend
}

export const notificationService = {
  /** Fetch all notifications for the current user */
  getAll: (): Promise<NotificationData[]> =>
    apiClient.get<NotificationData[]>('/notifications'),

  /** Create a self-notification (for UI-triggered actions) */
  create: (payload: { title: string; message: string; type: string }): Promise<NotificationData> =>
    apiClient.post<NotificationData>('/notifications', payload),

  /** Mark a single notification as read */
  markRead: (id: string): Promise<void> =>
    apiClient.put<void>(`/notifications/${id}/read`),

  /** Mark all notifications as read */
  markAllRead: (): Promise<void> =>
    apiClient.put<void>('/notifications/read-all'),

  /** Delete all notifications for the current user */
  clearAll: (): Promise<void> =>
    apiClient.delete<void>('/notifications'),
};
