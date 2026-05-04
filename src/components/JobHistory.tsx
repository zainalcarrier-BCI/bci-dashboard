import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, MapPin, RefreshCw } from 'lucide-react';
import Layout from './Layout';
import { TechnicianHistoryRow, getTechnicianHistory } from '../services/api';

interface JobHistoryProps {
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

function title(value: string) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function time(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default function JobHistory({ onTabChange }: JobHistoryProps) {
  const [rows, setRows] = useState<TechnicianHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadHistory = useCallback(() => {
    let active = true;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const payload = await getTechnicianHistory();
        if (active) setRows(payload.rows);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'History gagal dimuat');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => loadHistory(), [loadHistory]);

  return (
    <Layout title="Job History" activeTab="history" onTabChange={onTabChange}>
      <div className="p-4 space-y-4 pb-28">
        <section className="bg-surface-container-low rounded-[2rem] p-5">
          <h2 className="font-headline text-xl font-extrabold text-on-surface">Recent Work</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Riwayat pekerjaan yang sudah selesai dari data backend.</p>
        </section>

        {loading && (
          <section className="rounded-[1.5rem] bg-surface-container-lowest p-5 text-sm font-semibold text-on-surface-variant">
            Loading history...
          </section>
        )}

        {error && (
          <section className="rounded-[1.5rem] bg-error/10 p-5 text-sm font-semibold text-error">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
            <button type="button" onClick={() => loadHistory()} className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-xs font-bold">
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </section>
        )}

        {!loading && !error && rows.length === 0 && (
          <section className="rounded-[1.5rem] bg-surface-container-lowest p-5 text-sm font-semibold text-on-surface-variant">
            Belum ada job completed di history.
          </section>
        )}

        {rows.map((job) => (
          <section key={job.id} className="bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{job.job_no}</p>
                <h3 className="font-headline text-lg font-extrabold truncate">{job.customer}</h3>
                <p className="text-xs font-semibold text-on-surface-variant">{title(job.job_type)}</p>
              </div>
              <span className="rounded-full bg-primary-fixed px-3 py-1 text-[10px] font-bold uppercase text-on-primary-fixed">
                {title(job.status)}
              </span>
            </div>
            <div className="mt-4 space-y-2 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary" />
                <span>{job.site}, {job.area}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span>Completed {time(job.completed_at)}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
                <span>{job.timeline.length} timeline event{job.overtime_request ? ` / OT ${title(job.overtime_request.status)}` : ''}</span>
              </div>
            </div>
          </section>
        ))}
      </div>
    </Layout>
  );
}
