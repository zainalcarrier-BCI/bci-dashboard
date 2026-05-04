import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileText, MapPin, Send, type LucideIcon } from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';
import { CheckOutResponse } from '../services/api';

interface OvertimeRequestProps {
  onBack: () => void;
  onSubmit: (reason: string) => void;
  onSkip: () => void;
  job: Job;
  summary: CheckOutResponse | null;
}

function timeLabel(value?: string | null) {
  if (!value) return '--:--';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

function durationLabel(minutes?: number | null) {
  const safeMinutes = Number(minutes || 0);
  if (safeMinutes <= 0) return '0m';
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export default function OvertimeRequest({ onBack, onSubmit, onSkip, job, summary }: OvertimeRequestProps) {
  const [reason, setReason] = useState('testing');
  const evidenceItems: Array<{ label: string; value: string; Icon: LucideIcon }> = [
    { label: 'Job activity', value: 'Available', Icon: FileText },
    { label: 'Closing note', value: 'Available', Icon: CheckCircle2 },
    { label: 'GPS check-out', value: 'Valid', Icon: MapPin },
  ];
  const overtimeDetected = Boolean(summary?.overtime_required && (summary?.calculated_duration_minutes ?? 0) > 0);
  const cards = useMemo(() => ({
    normalEnd: timeLabel(summary?.normal_end_time),
    checkOut: timeLabel(summary?.check_out_time),
    duration: durationLabel(summary?.calculated_duration_minutes),
  }), [summary?.calculated_duration_minutes, summary?.check_out_time, summary?.normal_end_time]);

  return (
    <Layout title="Overtime Request" onBack={onBack} hideBottomNav>
      <div className="p-4 space-y-5 pb-24">
        <section className={`rounded-[2rem] p-5 border-l-4 ${overtimeDetected ? 'bg-error-container border-error' : 'bg-surface-container-low border-primary'}`}>
          <div className="flex items-start gap-3">
            <AlertTriangle className={`w-6 h-6 shrink-0 ${overtimeDetected ? 'text-error' : 'text-primary'}`} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-error-container">{overtimeDetected ? 'Overtime Detected' : 'Review Required'}</p>
              <h2 className="font-headline text-xl font-extrabold text-on-error-container">
                {overtimeDetected ? 'Check-out melewati jam kerja normal' : 'Sistem tidak mendeteksi overtime aktif'}
              </h2>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm">
            <Clock className="w-5 h-5 text-outline mb-2" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Normal End</p>
            <p className="text-xl font-extrabold">{cards.normalEnd}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm">
            <Clock className="w-5 h-5 text-primary mb-2" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Check-out</p>
            <p className="text-xl font-extrabold text-primary">{cards.checkOut}</p>
          </div>
          <div className="col-span-2 bg-primary text-white rounded-[1.5rem] p-5">
            <p className="text-[10px] uppercase tracking-wider font-bold text-primary-fixed">System Calculated Duration</p>
            <p className="font-headline text-4xl font-extrabold">{cards.duration}</p>
            <p className="mt-1 text-xs text-white/80">Durasi dihitung sistem dan tidak bisa diedit manual.</p>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-[2rem] p-5 space-y-3">
          <label htmlFor="overtime-reason" className="block text-[10px] uppercase tracking-wider font-bold text-outline">
            Reason
          </label>
          <select
            id="overtime-reason"
            name="overtimeReason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="w-full h-14 rounded-2xl border-none bg-surface-container-lowest px-4 text-sm font-semibold focus:ring-2 focus:ring-primary"
          >
            <option value="testing">Testing setelah repair</option>
            <option value="emergency">Emergency repair belum selesai</option>
            <option value="customer">Menunggu konfirmasi customer</option>
            <option value="access">Menunggu akses area kerja</option>
          </select>
        </section>

        <section className="bg-surface-container-lowest rounded-[2rem] p-5 space-y-4 shadow-sm">
          <div>
            <p className="font-headline font-bold text-on-surface">{job.id}</p>
            <p className="text-sm text-on-surface-variant">{job.customer}</p>
          </div>
          {evidenceItems.map(({ label, value, Icon }) => (
            <div key={label} className="flex items-center justify-between border-t border-outline-variant/20 pt-3">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-primary" />
                <span className="text-sm font-semibold text-on-surface">{label}</span>
              </div>
              <span className="text-xs font-bold text-primary uppercase">{value}</span>
            </div>
          ))}
        </section>

        <div className="space-y-3 pt-2">
          <button
            onClick={() => onSubmit(reason)}
            disabled={!overtimeDetected}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-bold flex items-center justify-center gap-3 shadow-[0px_8px_24px_rgba(0,102,110,0.25)] active:scale-95 transition-transform"
          >
            <Send className="w-5 h-5" />
            Submit Overtime
          </button>
          <button
            onClick={onSkip}
            className="w-full h-12 bg-surface-container-low text-on-surface-variant rounded-2xl font-bold active:scale-95 transition-transform"
          >
            Skip
          </button>
        </div>
      </div>
    </Layout>
  );
}
