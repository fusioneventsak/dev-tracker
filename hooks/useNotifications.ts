'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Notification } from '@/lib/types';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  // Request browser notification permission
  const requestPermission = useCallback(async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    }
    return 'denied';
  }, []);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('/notification.wav');
      audio.volume = 0.5; // 50% volume
      audio.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    } catch (err) {
      console.log('Audio not supported:', err);
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, options?: NotificationOptions) => {
    // Play sound
    playNotificationSound();

    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        silent: true, // Don't use browser's default sound since we're playing our own
        ...options,
      });

      notification.onclick = () => {
        window.focus();
        if (options?.data?.link) {
          window.location.href = options.data.link;
        }
        notification.close();
      };
    }
  }, [playNotificationSound]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const notifs: Notification[] = (data || []).map(n => ({
        id: n.id,
        userId: n.user_id,
        type: n.type,
        title: n.title,
        message: n.message,
        link: n.link,
        read: n.read,
        metadata: n.metadata || {},
        createdAt: n.created_at,
        updatedAt: n.updated_at,
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }, []);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => {
        const deleted = prev.find(n => n.id === notificationId);
        if (deleted && !deleted.read) {
          setUnreadCount(count => Math.max(0, count - 1));
        }
        return prev.filter(n => n.id !== notificationId);
      });
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  }, []);

  // Setup real-time subscription
  useEffect(() => {
    const supabase = createClient();

    // Get current notification permission
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }

    // Initial fetch
    fetchNotifications();

    // Subscribe to real-time updates
    const setupSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newNotif: Notification = {
              id: payload.new.id,
              userId: payload.new.user_id,
              type: payload.new.type,
              title: payload.new.title,
              message: payload.new.message,
              link: payload.new.link,
              read: payload.new.read,
              metadata: payload.new.metadata || {},
              createdAt: payload.new.created_at,
              updatedAt: payload.new.updated_at,
            };

            setNotifications(prev => [newNotif, ...prev]);
            setUnreadCount(prev => prev + 1);

            // Show browser notification
            showBrowserNotification(newNotif.title, {
              body: newNotif.message,
              tag: newNotif.id,
              data: { link: newNotif.link },
            });
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotifications(prev =>
              prev.map(n =>
                n.id === payload.new.id
                  ? {
                      ...n,
                      read: payload.new.read,
                      updatedAt: payload.new.updated_at,
                    }
                  : n
              )
            );
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    };

    setupSubscription();
  }, [fetchNotifications, showBrowserNotification]);

  return {
    notifications,
    unreadCount,
    loading,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refresh: fetchNotifications,
  };
}
