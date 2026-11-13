/**
 * Notification Bell Component with Unread Badge
 * Project: ঘরের বাজার বিডি (Ghorer Bazar BD)
 */

import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { Bell, CheckCheck, Trash2, X } from 'lucide-react';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification } = useNotifications();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-neutral-700 dark:text-neutral-200 hover:text-emerald-600 dark:hover:text-emerald-400 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-xl z-50 overflow-hidden">
          <div className="p-3 bg-neutral-50 dark:bg-neutral-800/80 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-600" />
              <h3 className="font-semibold text-sm text-neutral-900 dark:text-white">
                {t('notifications')} ({unreadCount})
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-emerald-600 hover:underline flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  {t('markAllAsRead')}
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-xs text-neutral-500 dark:text-neutral-400">
                {t('noNotifications')}
              </div>
            ) : (
              notifications.map((item, idx) => (
                <div
                  key={item.id ? `${item.id}-${idx}` : `notif-item-${idx}`}
                  className={`p-3 text-xs transition-colors flex items-start justify-between gap-2 ${
                    item.isRead
                      ? 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400'
                      : 'bg-emerald-50/50 dark:bg-emerald-950/20 text-neutral-900 dark:text-neutral-100 font-medium'
                  }`}
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-neutral-900 dark:text-white">{item.title}</span>
                      <span className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800">
                        {item.channel}
                      </span>
                    </div>
                    <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed">{item.message}</p>
                    <span className="text-[10px] text-neutral-400 block">
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 pt-0.5">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => markAsRead(item.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 rounded"
                        title="Mark as read"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => deleteNotification(item.id)}
                      className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
