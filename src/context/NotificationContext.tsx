/**
 * Reusable Multi-Channel Notification Module & Context
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { createContext, useContext, useState } from 'react';
import { NotificationItem, NotificationChannel } from '../types';
import { initialNotifications } from '../lib/supabase';

interface ToastAlert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  toasts: ToastAlert[];
  sendNotification: (
    userId: string,
    title: string,
    message: string,
    channel?: NotificationChannel,
    metadata?: Record<string, any>
  ) => void;
  addNotification: (
    notifObjOrUserId: any,
    title?: string,
    message?: string,
    channel?: NotificationChannel,
    metadata?: Record<string, any>
  ) => void;
  addToast: (
    titleOrObj: string | { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' },
    message?: string,
    type?: 'info' | 'success' | 'warning' | 'error'
  ) => void;
  showToast: (title: string, message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  deleteNotification: (id: string) => void;
  removeToast: (id: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

let notifSequence = 0;

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [toasts, setToasts] = useState<ToastAlert[]>([]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const showToast = (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const toastId = `toast-${Date.now()}-${++notifSequence}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastAlert = { id: toastId, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(toastId);
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const sendNotification = (
    userId: string,
    title: string,
    message: string,
    channel: NotificationChannel = 'in_app',
    metadata?: Record<string, any>
  ) => {
    const uniqueId = `notif-${Date.now()}-${++notifSequence}-${Math.random().toString(36).substring(2, 8)}`;
    const newNotif: NotificationItem = {
      id: uniqueId,
      userId,
      title,
      message,
      channel,
      isRead: false,
      metadata,
      createdAt: new Date().toISOString()
    };

    setNotifications((prev) => [newNotif, ...prev]);
    showToast(`[${channel.toUpperCase()}] ${title}`, message, 'info');
  };

  const addNotification = (
    notifObjOrUserId: any,
    title?: string,
    message?: string,
    channel: NotificationChannel = 'in_app',
    metadata?: Record<string, any>
  ) => {
    if (typeof notifObjOrUserId === 'object' && notifObjOrUserId !== null) {
      sendNotification(
        notifObjOrUserId.userId || 'usr-customer-01',
        notifObjOrUserId.title || 'নোটিফিকেশন',
        notifObjOrUserId.message || '',
        notifObjOrUserId.channel || 'in_app',
        notifObjOrUserId.metadata
      );
    } else {
      sendNotification(
        notifObjOrUserId || 'usr-customer-01',
        title || 'নোটিফিকেশন',
        message || '',
        channel,
        metadata
      );
    }
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const addToastHandler = (
    titleOrObj: string | { title: string; message: string; type?: 'info' | 'success' | 'warning' | 'error' },
    message = '',
    type: 'info' | 'success' | 'warning' | 'error' = 'info'
  ) => {
    if (typeof titleOrObj === 'string') {
      showToast(titleOrObj, message, type);
    } else if (titleOrObj && typeof titleOrObj === 'object') {
      showToast(titleOrObj.title, titleOrObj.message, titleOrObj.type || 'info');
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        toasts,
        sendNotification,
        addNotification,
        addToast: addToastHandler,
        showToast,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        removeToast
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
