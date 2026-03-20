import React from 'react';
import type { NotificationItem } from '../../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  notifications: NotificationItem[];
  onMarkRead: (id: string) => void;
  onClose: () => void;
}

export default function NotificationDropdown({ notifications, onMarkRead, onClose }: Props) {
  return (
    <div style={{
      position: 'absolute', top: 50, right: 0,
      width: 320, maxHeight: 400, overflowY: 'auto',
      background: 'var(--bg-elevated)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4)',
      zIndex: 100
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>Notifications</h3>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18 }}>×</button>
      </div>
      
      {notifications.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
          No new notifications
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {notifications.map(n => (
            <div key={n.id} 
              style={{
                padding: '16px', borderBottom: '1px solid var(--border)',
                background: n.status === 'unread' ? 'rgba(79, 209, 197, 0.05)' : 'transparent',
                transition: 'background 0.2s',
                display: 'flex', gap: 12, alignItems: 'flex-start'
              }}
              onClick={() => n.status === 'unread' && onMarkRead(n.id)}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: n.status === 'unread' ? 'var(--color-teal)' : 'transparent',
                marginTop: 6, flexShrink: 0
              }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: '0 0 4px 0', fontSize: 14, color: 'var(--text-primary)', fontWeight: n.status === 'unread' ? 500 : 400 }}>
                  {n.message}
                </p>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
                
                {n.status === 'unread' && n.type !== 'upcoming' && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                    <button style={actionBtn}>Complete</button>
                    <button style={{ ...actionBtn, background: 'var(--bg-default)' }}>Snooze</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const actionBtn: React.CSSProperties = {
  padding: '6px 12px', fontSize: 12, borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)',
  cursor: 'pointer', fontWeight: 500
};
