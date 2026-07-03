// src/components/NotificationBell.tsx
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Bell, X, Clock, AlertCircle, ShieldCheck, Handshake, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

const TYPE_STYLES: Record<string, { icon: React.ReactNode; bg: string; color: string }> = {
  verification: { icon: <ShieldCheck size={14} />, bg: '#E6F2ED', color: '#006B3F' },
  order:        { icon: <Handshake size={14} />, bg: '#FEF9EC', color: '#C8991A' },
  dispute:      { icon: <AlertCircle size={14} />, bg: '#FEF2F2', color: '#DC2626' },
  system:       { icon: <Clock size={14} />, bg: '#EFF6FF', color: '#2563EB' },
};

const MAX_MESSAGE_LENGTH = 80;

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const buttonRef = useRef<HTMLButtonElement>(null);

  const fetchNotifications = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Notification fetch error:', error);
    } else {
      const list = (data || []) as Notification[];
      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchNotifications();

    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev]);
        setUnreadCount(prev => prev + 1);
        toast(payload.new.title, { icon: '🔔', duration: 4000 });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.closest('[data-notification-panel]') || target.closest('[data-notification-bell]')) return;
      setOpen(false);
    };

    document.addEventListener('keydown', handleKey);
    document.addEventListener('mousedown', handleClick);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('mousedown', handleClick);
      document.body.style.overflow = '';
    };
  }, [open]);

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', session.user.id).eq('read', false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.read) markAsRead(n.id);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m`;
    if (hrs < 24) return `${hrs}h`;
    return `${days}d`;
  };

  const panel = (
    <>
      <div
        data-notification-panel
        onClick={() => setOpen(false)}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(3px)',
          zIndex: 9998,
        }}
      />

      <div
        data-notification-panel
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          maxWidth: 400,
          background: '#fff',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          fontFamily: 'Plus Jakarta Sans, system-ui, sans-serif',
          animation: 'slideInRight 0.25s cubic-bezier(.16,1,.3,1)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 20px',
            borderBottom: '1px solid #F0ECE8',
            background: '#fff',
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: 22,
              color: '#1C1917',
              margin: 0,
            }}
          >
            Notifications
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9B7A2A',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setOpen(false)}
              style={{
                background: '#F5F2EC',
                border: '1px solid #E2DDD6',
                borderRadius: 10,
                width: 34,
                height: 34,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <X size={16} color="#57534E" />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  border: '2px solid #E2DDD6',
                  borderTopColor: '#1A5C41',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px',
                }}
              />
              <p style={{ fontSize: 13, color: '#A8A29E' }}>Loading…</p>
            </div>
          ) : notifications.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '60px 24px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: 20,
                  background: '#F5F2EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Bell size={28} color="#A8A29E" />
              </div>
              <p
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: 17,
                  color: '#1C1917',
                  margin: '0 0 6px',
                }}
              >
                No notifications
              </p>
              <p style={{ fontSize: 13, color: '#A8A29E', margin: 0 }}>
                You're all caught up
              </p>
            </div>
          ) : (
            <div>
              {notifications.map(n => {
                const style = TYPE_STYLES[n.type] || TYPE_STYLES.system;
                const isExpanded = expandedIds.has(n.id);
                const isLong = n.message.length > MAX_MESSAGE_LENGTH;
                const displayMessage = isExpanded || !isLong ? n.message : n.message.slice(0, MAX_MESSAGE_LENGTH) + '…';

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      background: n.read ? '#fff' : '#FFFBF2',
                      border: 'none',
                      borderBottom: '1px solid #F5F2EC',
                      padding: '16px 20px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 14,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = n.read ? '#FAF9F7' : '#FFF8E8'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = n.read ? '#fff' : '#FFFBF2'; }}
                  >
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: 10,
                        background: style.bg,
                        color: style.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: 2,
                      }}
                    >
                      {style.icon}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <p
                          style={{
                            fontWeight: 700,
                            fontSize: 13.5,
                            color: '#1C1917',
                            margin: 0,
                            flex: 1,
                          }}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#C8991A',
                              flexShrink: 0,
                            }}
                          />
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          color: '#57534E',
                          margin: '0 0 6px',
                          lineHeight: 1.5,
                          wordBreak: 'break-word',
                        }}
                      >
                        {displayMessage}
                      </p>
                      {isLong && (
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleExpand(n.id); }}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#9B7A2A',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            marginBottom: 4,
                          }}
                        >
                          {isExpanded ? (
                            <>Show less <ChevronUp size={12} /></>
                          ) : (
                            <>Read more <ChevronDown size={12} /></>
                          )}
                        </button>
                      )}
                      <span style={{ fontSize: 11, color: '#A8A29E', fontWeight: 500 }}>
                        {timeAgo(n.created_at)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        data-notification-bell
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 8,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: open ? '#1A5C41' : '#78726A',
          transition: 'color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: 2,
              right: 2,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: '#EF4444',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
              border: '2px solid #fff',
              boxSizing: 'border-box',
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && createPortal(panel, document.body)}
    </div>
  );
}