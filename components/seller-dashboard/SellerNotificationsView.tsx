import React from 'react';
import type { Notification } from '../../types';
import { View } from '../../types';
import SellerPremiumPanel, {
  sellerPremiumGhostBtnStyle,
  sellerPremiumPrimaryBtnStyle,
  sellerPremiumTableWrapStyle,
} from './SellerPremiumShell';

export const SellerNotificationsView: React.FC<{
  sellerNotifications: Notification[];
  unreadNotificationCount: number;
  onNavigate: (view: View) => void;
  onNotificationClick?: (notification: Notification) => void;
  onMarkNotificationsAsRead?: (ids: number[]) => void;
}> = ({
  sellerNotifications,
  unreadNotificationCount,
  onNavigate,
  onNotificationClick,
  onMarkNotificationsAsRead,
}) => (
  <SellerPremiumPanel
    eyebrow="Alerts"
    title="Notifications"
    description={`${sellerNotifications.length} total · ${unreadNotificationCount} unread`}
    actions={
      <>
        <button
          type="button"
          onClick={() => onNavigate(View.NOTIFICATIONS_CENTER)}
          className="rounded-xl px-3.5 py-2 text-sm font-semibold text-stone-700 transition hover:bg-white"
          style={sellerPremiumGhostBtnStyle}
        >
          Grouped view
        </button>
        {unreadNotificationCount > 0 && onMarkNotificationsAsRead ? (
          <button
            type="button"
            onClick={() => onMarkNotificationsAsRead(sellerNotifications.filter((n) => !n.isRead).map((n) => n.id))}
            className="rounded-xl px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            style={sellerPremiumPrimaryBtnStyle}
          >
            Mark all read
          </button>
        ) : null}
      </>
    }
  >
    {sellerNotifications.length === 0 ? (
      <p className="rounded-xl px-4 py-12 text-center text-sm text-stone-500" style={{ border: '1px dashed rgba(28,25,23,0.14)' }}>
        You&apos;re all caught up. New alerts will appear here.
      </p>
    ) : (
      <ul className="overflow-hidden rounded-xl" style={sellerPremiumTableWrapStyle}>
        {sellerNotifications.map((notification, index) => (
          <li key={notification.id} style={{ borderTop: index === 0 ? undefined : '1px solid rgba(28,25,23,0.06)' }}>
            <button
              type="button"
              onClick={() => {
                onNotificationClick?.(notification);
                if (!notification.isRead && onMarkNotificationsAsRead) {
                  onMarkNotificationsAsRead([notification.id]);
                }
              }}
              className={`w-full px-4 py-4 text-left transition-colors hover:bg-orange-50/50 ${
                !notification.isRead ? 'bg-orange-50/35' : 'bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className={`text-sm ${!notification.isRead ? 'font-bold text-stone-900' : 'font-medium text-stone-700'}`}>
                    {notification.targetType === 'conversation'
                      ? 'New message'
                      : notification.targetType === 'vehicle'
                        ? 'Vehicle update'
                        : 'Notification'}
                  </p>
                  <p className="mt-1 text-sm text-stone-600">{notification.message}</p>
                  <p className="mt-1 text-xs text-stone-400">{new Date(notification.timestamp).toLocaleString()}</p>
                </div>
                {!notification.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-reride-orange" />}
              </div>
            </button>
          </li>
        ))}
      </ul>
    )}
  </SellerPremiumPanel>
);
