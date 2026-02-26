import React, { createContext, useContext, useState, useCallback } from 'react';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  time: string;
  read: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (n: Omit<Notification, 'id' | 'time' | 'read'>) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const initialNotifications: Notification[] = [
  { id: '1', title: 'Leave Approved', message: "John Smith's annual leave (Mar 1-5) has been approved.", type: 'success', time: '2 hours ago', read: false },
  { id: '2', title: 'New Leave Request', message: 'Sarah Johnson has applied for casual leave on Feb 25.', type: 'info', time: '5 hours ago', read: false },
  { id: '3', title: 'Payslip Generated', message: 'February 2026 payslips are now available.', type: 'info', time: '1 day ago', read: true },
];

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'read'>) => {
    const newNotif: Notification = {
      ...n,
      id: Date.now().toString(),
      time: 'Just now',
      read: false,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, addNotification, markRead, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationProvider');
  return ctx;
};
