import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationDropdown from './NotificationDropdown';

export default function NotificationBell() {
  const { notifications, unreadCount, markRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div style={{ position: 'relative' }} ref={ref}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border)',
          width: 40, height: 40,
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer',
          position: 'relative'
        }}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <div style={{
            position: 'absolute', top: -2, right: -2,
            background: 'var(--color-red)', color: '#fff',
            fontSize: 10, fontWeight: 700,
            width: 18, height: 18, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: '2px solid var(--bg-default)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <NotificationDropdown 
          notifications={notifications} 
          onMarkRead={markRead}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
