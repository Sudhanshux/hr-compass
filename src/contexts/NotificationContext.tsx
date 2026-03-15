import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { notificationService, NotificationData } from '@/services/notification.service';

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

/** Convert a backend ISO datetime string to a human-readable relative time label. */
function relativeTime(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1)  return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24)  return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return 'Just now';
  }
}

function toNotification(d: NotificationData): Notification {
  return {
    id:      d.id,
    title:   d.title,
    message: d.message,
    type:    d.type,
    read:    d.read,
    time:    relativeTime(d.createdAt),
  };
}

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // ── Load from backend on mount ──────────────────────────────────────────
  useEffect(() => {
    notificationService.getAll()
      .then(data => setNotifications(data.map(toNotification)))
      .catch(() => {
        // Backend may not be reachable during dev; silently fall back to empty
        setNotifications([]);
      });
  }, []);

  // ── Actions ──────────────────────────────────────────────────────────────

  const addNotification = useCallback((n: Omit<Notification, 'id' | 'time' | 'read'>) => {
    // Optimistic: show immediately in UI
    const optimistic: Notification = {
      ...n,
      id:   `opt-${Date.now()}`,
      time: 'Just now',
      read: false,
    };
    setNotifications(prev => [optimistic, ...prev]);

    // Persist to backend and replace optimistic entry with real one
    notificationService.create({ title: n.title, message: n.message, type: n.type })
      .then(created => {
        setNotifications(prev =>
          prev.map(x => x.id === optimistic.id ? toNotification(created) : x)
        );
      })
      .catch(() => {
        // Keep optimistic entry if backend call fails so UI is not disrupted
      });
  }, []);

  const markRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    notificationService.markRead(id).catch(() => {});
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    notificationService.markAllRead().catch(() => {});
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    notificationService.clearAll().catch(() => {});
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
