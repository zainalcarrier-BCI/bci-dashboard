import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, Bell, BookOpen, Briefcase, CheckCircle2, Clock, HeartPulse, MapPin, RefreshCw, RotateCcw } from 'lucide-react';
import Layout from './Layout';
import { ApiNotification, getNotifications, markAllNotificationsRead, markNotificationRead } from '../services/api';

interface NotificationsProps {
  onBack: () => void;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

export default function Notifications({ onBack, onTabChange }: NotificationsProps) {
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'jobs' | 'approval' | 'gps' | 'manual'>('all');

  const loadNotifications = useCallback(() => {
    let isMounted = true;
    setLoading(true);
    setError('');
    getNotifications()
      .then((payload) => {
        if (isMounted) setNotifications(payload.rows);
      })
      .catch(() => {
        if (isMounted) {
          setNotifications([]);
          setError('Notification belum bisa dimuat. Cek koneksi lalu retry.');
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => loadNotifications(), [loadNotifications]);

  const categoryFor = (item: ApiNotification) => {
    if (item.type.startsWith('job_')) return 'jobs';
    if (item.type.includes('overtime') || item.type.startsWith('leave_request')) return 'approval';
    if (item.type === 'gps_exception') return 'gps';
    if (item.type === 'manual_document_uploaded') return 'manual';
    return 'all';
  };
  const unreadCount = notifications.filter((item) => !item.read_at).length;
  const filteredRows = notifications.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !item.read_at;
    return categoryFor(item) === filter;
  });

  const markRead = async (notificationId: string) => {
    try {
      const row = await markNotificationRead(notificationId);
      setNotifications((current) => current.map((item) => item.id === notificationId ? row : item));
    } catch (markError) {
      console.warn('Notification mark read failed', markError);
    }
  };

  const markAllRead = async () => {
    try {
      const response = await markAllNotificationsRead();
      const readById = new Map(response.rows.map((row) => [row.id, row]));
      setNotifications((current) => current.map((item) => readById.get(item.id) ?? item));
    } catch (markError) {
      console.warn('Notification mark all read failed', markError);
    }
  };

  const filterOptions: Array<{ value: typeof filter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'unread', label: `Unread ${unreadCount}` },
    { value: 'jobs', label: 'Jobs' },
    { value: 'approval', label: 'Approval' },
    { value: 'gps', label: 'GPS' },
    { value: 'manual', label: 'Manual' },
  ];

  return (
    <Layout title="Notifications" onBack={onBack} activeTab="home" onTabChange={onTabChange}>
      <div className="p-4 space-y-5 pb-28">
        <section className="bg-primary text-white rounded-[2rem] p-6 relative overflow-hidden">
          <Bell className="absolute -right-4 -bottom-5 w-32 h-32 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-fixed">In-App Notification</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold">Updates Hari Ini</h2>
          <p className="mt-2 text-sm text-white/85">Job assignment, approval overtime, GPS exception, manual book, dan perubahan jadwal.</p>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
            {filterOptions.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${filter === value ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface-variant'}`}
              >
                {label}
              </button>
            ))}
            </div>
            <button
              type="button"
              onClick={() => void markAllRead()}
              disabled={!unreadCount}
              className="shrink-0 rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase text-white disabled:bg-outline/30 disabled:text-on-surface-variant"
            >
              Mark All Read
            </button>
          </div>
          {loading && (
            <p className="rounded-[1.5rem] bg-surface-container-lowest p-5 text-sm font-semibold text-on-surface-variant">Loading notifications...</p>
          )}
          {error && (
            <div className="rounded-[1.5rem] bg-error-container p-5 text-sm font-semibold text-on-error-container">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
              <button type="button" onClick={() => loadNotifications()} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-bold">
                <RefreshCw className="h-4 w-4" />
                Retry
              </button>
            </div>
          )}
          {!loading && !error && filteredRows.length === 0 && (
            <p className="rounded-[1.5rem] bg-surface-container-lowest p-5 text-sm font-semibold text-on-surface-variant">Belum ada notification baru.</p>
          )}
          {!loading && filteredRows.map((item) => {
            const Icon =
              item.type === 'job_assigned' ? Briefcase
                : item.type === 'job_changed' ? RotateCcw
                  : item.type === 'manual_document_uploaded' ? BookOpen
                    : item.type.startsWith('leave_request') ? HeartPulse
                      : item.type === 'gps_exception' ? MapPin
                        : CheckCircle2;
            const time = new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit' }).format(new Date(item.created_at));
            const category = categoryFor(item);
            const actionLabel = category === 'jobs' ? 'Open Jobs' : category === 'manual' ? 'Open Profile' : category === 'approval' ? 'Open History' : 'Open Home';
            const actionTab = category === 'jobs' ? 'jobs' : category === 'manual' ? 'profile' : category === 'approval' ? 'history' : 'home';
            return (
              <article key={item.id} className={`rounded-[1.5rem] p-5 shadow-sm ${item.read_at ? 'bg-surface-container-low' : 'bg-surface-container-lowest'}`}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-headline text-base font-extrabold text-on-surface">{item.title}</h3>
                      <span className="text-[10px] font-bold uppercase text-outline shrink-0">{time}</span>
                    </div>
                    <p className="mt-1 text-sm text-on-surface-variant">{item.message}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase text-primary">
                        <span className="rounded-full bg-primary/10 px-2 py-1">{category}</span>
                        <Clock className="w-3 h-3" />
                        {item.read_at ? 'Read' : 'Unread'}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                      <button type="button" onClick={() => onTabChange(actionTab)} className="rounded-full bg-surface-container-high px-3 py-1 text-[10px] font-bold uppercase text-on-surface-variant">
                        {actionLabel}
                      </button>
                      {!item.read_at && (
                        <button type="button" onClick={() => void markRead(item.id)} className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase text-white">
                          Mark Read
                        </button>
                      )}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </Layout>
  );
}
