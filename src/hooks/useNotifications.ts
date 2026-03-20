import { useState, useEffect } from 'react';
import { apiNotifications } from '../api';
import { useAuth } from '../contexts/AuthContext';

export interface NotificationItem {
  id: string;
  type: 'upcoming' | 'due_now' | 'escalation';
  message: string;
  habitName: string;
  habitId: string;
  status: 'unread' | 'read' | 'dismissed' | 'acted';
  createdAt: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const { user } = useAuth();

  // 1. Load initial unread
  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }
    
    apiNotifications.list()
      .then(data => setNotifications(data))
      .catch(err => console.error('Failed to load notifications', err));
  }, [user]);

  // 2. Setup SSE Listener
  useEffect(() => {
    if (!user) return;

    let eventSource: EventSource | null = null;
    let retryTimeout: ReturnType<typeof setTimeout>;

    const connectSSE = () => {
      // The browser automatically sends cookies with EventSource
      eventSource = new EventSource('/api/notifications/stream', { withCredentials: true });

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'connected') {
            console.log('SSE connected');
          } else if (data.type === 'notification') {
            const newNotif = data.data as NotificationItem;
            setNotifications(prev => {
              // Deduplicate just in case
              if (prev.some(n => n.id === newNotif.id)) return prev;
              return [newNotif, ...prev];
            });
          }
        } catch (err) {
          console.error('SSE parsing error', err);
        }
      };

      eventSource.onerror = () => {
        console.log('SSE connection lost. Reconnecting...');
        eventSource?.close();
        retryTimeout = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      eventSource?.close();
      clearTimeout(retryTimeout);
    };
  }, [user]);

  const markRead = async (id: string) => {
    // Optimistic UI
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, status: 'read' } : n));
    try {
      await apiNotifications.markRead(id);
    } catch (err) {
      console.error('Failed to mark read', err);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => n.status === 'unread').length;

  return { notifications, unreadCount, markRead, clearAll };
}
