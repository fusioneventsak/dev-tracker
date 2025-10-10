'use client';

import { useState, useEffect } from 'react';
import { Bell, Check, CheckCheck, X, Settings } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

export default function NotificationCenter() {
  const {
    notifications,
    unreadCount,
    loading,
    permission,
    requestPermission,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const [isOpen, setIsOpen] = useState(false);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  useEffect(() => {
    // Show permission prompt if notifications are denied or default
    if (permission === 'default' || permission === 'denied') {
      setShowPermissionPrompt(true);
    }
  }, [permission]);

  const handleNotificationClick = async (notification: typeof notifications[0]) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }
    if (notification.link) {
      setIsOpen(false);
      window.location.href = notification.link;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'chat_message':
        return '💬';
      case 'task_assigned':
        return '📋';
      case 'task_updated':
        return '✏️';
      case 'comment_added':
        return '💭';
      default:
        return '🔔';
    }
  };

  const handleRequestPermission = async () => {
    const result = await requestPermission();
    if (result === 'granted') {
      setShowPermissionPrompt(false);
    }
  };

  return (
    <div className="relative">
      {/* Bell Icon with Badge */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 z-50 overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
              <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            {/* Permission Prompt */}
            {showPermissionPrompt && permission !== 'granted' && (
              <div className="p-4 bg-blue-50 border-b border-blue-100">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Enable Browser Notifications
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Get notified about new messages and task updates
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={handleRequestPermission}
                        className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700"
                      >
                        Enable
                      </button>
                      <button
                        onClick={() => setShowPermissionPrompt(false)}
                        className="text-xs px-3 py-1.5 text-gray-600 hover:text-gray-900"
                      >
                        Not now
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-sm">Loading notifications...</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                  <p className="text-sm">No notifications yet</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50/50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-2xl flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {notification.title}
                            </p>
                            {!notification.read && (
                              <span className="flex-shrink-0 w-2 h-2 bg-blue-600 rounded-full mt-1.5"></span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-400">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                              })}
                            </p>
                            <div className="flex gap-1">
                              {!notification.read && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notification.id);
                                  }}
                                  className="p-1 text-gray-400 hover:text-blue-600 rounded"
                                  title="Mark as read"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteNotification(notification.id);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 rounded"
                                title="Delete"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t border-gray-200 bg-gray-50">
                <Link
                  href="/notifications"
                  className="text-sm text-blue-600 hover:text-blue-700 text-center block"
                  onClick={() => setIsOpen(false)}
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
