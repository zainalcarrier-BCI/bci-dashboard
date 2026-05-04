import { ArrowRight, Building2, CheckCircle2, Home, LogIn, Navigation, Play, MapPin, Send } from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';
import { CheckOutResponse } from '../services/api';

interface CheckOutProps {
  onBack: () => void;
  onSubmit: () => void;
  onGoToNextJob: () => void;
  onReturnToOffice: () => void;
  onEndDayFromSite: () => void;
  job: Job;
  summary: CheckOutResponse | null;
  hasNextJob: boolean;
  resolutionBusy?: boolean;
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
  if (safeMinutes <= 0) return 'Calculated after submit';
  const hours = Math.floor(safeMinutes / 60);
  const remainder = safeMinutes % 60;
  if (!hours) return `${remainder}m`;
  if (!remainder) return `${hours}h`;
  return `${hours}h ${remainder}m`;
}

export default function CheckOut({
  onBack,
  onSubmit,
  onGoToNextJob,
  onReturnToOffice,
  onEndDayFromSite,
  job,
  summary,
  hasNextJob,
  resolutionBusy = false,
}: CheckOutProps) {
  const scheduledStart = timeLabel(job.scheduledStartAt);
  const normalEnd = timeLabel(summary?.normal_end_time || job.scheduledEndAt);
  const checkOutTime = timeLabel(summary?.check_out_time);
  const submitted = Boolean(summary);
  return (
    <Layout title="Check-out Summary" onBack={onBack} hideBottomNav>
      <div className="p-4 space-y-6 pb-24">
        {/* Job Context Card */}
        <section className="bg-surface-container-low p-6 rounded-[2rem] shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-secondary">Job #{job.id}</span>
              <h2 className="text-2xl font-extrabold text-on-surface leading-tight mt-1">Check-out Summary</h2>
            </div>
            <div className="bg-primary/10 px-3 py-1 rounded-xl">
              <span className="text-primary font-bold text-xs">FINAL STEP</span>
            </div>
          </div>
        </section>

        {/* Time Summary Bento Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-surface-container-lowest p-5 rounded-[2rem] shadow-[0px_4px_12px_rgba(28,27,31,0.04)] col-span-1">
            <LogIn className="text-primary w-6 h-6 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Scheduled Start</p>
            <p className="text-xl font-extrabold text-on-surface">{scheduledStart}</p>
          </div>
          <div className="bg-surface-container-lowest p-5 rounded-[2rem] shadow-[0px_4px_12px_rgba(28,27,31,0.04)] col-span-1">
            <Play className="text-primary w-6 h-6 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Normal End</p>
            <p className="text-xl font-extrabold text-on-surface">{normalEnd}</p>
          </div>
          <div className="bg-surface-container-high p-5 rounded-[2rem] col-span-2 flex items-center justify-between border-l-4 border-primary">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Check-out Time</p>
              <p className="text-2xl font-extrabold text-primary">{checkOutTime === '--:--' ? 'Submit to Record' : checkOutTime}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Duration</p>
              <p className="text-sm font-bold text-on-surface">{durationLabel(summary?.calculated_duration_minutes)}</p>
            </div>
          </div>
        </div>

        <section className="rounded-[2rem] bg-surface-container-lowest p-5 shadow-[0px_4px_12px_rgba(28,27,31,0.04)]">
          <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Overtime Rule</p>
          <p className="mt-2 text-base font-extrabold text-on-surface">
            {summary?.overtime_policy_label || 'Server akan menentukan policy lembur setelah submit.'}
          </p>
          <p className="mt-1 text-xs font-semibold text-on-surface-variant">
            {summary?.holiday_name
              ? `${summary.holiday_name} / ${summary.day_type_label || summary.day_type || 'Holiday'}`
              : summary?.day_type_label || summary?.day_type || 'Weekday'}
          </p>
        </section>

        {/* Verification Status */}
        <section className="space-y-3">
          <h3 className="text-sm font-bold uppercase tracking-widest text-outline px-1">Verification Status</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-[2rem]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <MapPin className="text-emerald-600 w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">GPS Valid</p>
                  <p className="text-[11px] text-outline">GPS akan divalidasi server pada saat submit check-out.</p>
                </div>
              </div>
              <CheckCircle2 className="text-emerald-600 w-6 h-6" />
            </div>
            <div className="flex items-center justify-between bg-surface-container-lowest p-4 rounded-[2rem]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Navigation className="text-emerald-600 w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">Geofence Valid</p>
                  <p className="text-[11px] text-outline">Status overtime dan geofence dihitung otomatis oleh server.</p>
                </div>
              </div>
              <CheckCircle2 className="text-emerald-600 w-6 h-6" />
            </div>
          </div>
        </section>

        {/* Location Map Visual */}
        <div className="relative w-full rounded-[2rem] overflow-hidden bg-surface-container-highest p-5">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Current Site</p>
              <p className="text-base font-extrabold text-on-surface">{job.site}</p>
              <p className="text-xs text-outline">{job.customer}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-white/70 px-4 py-3 text-[11px] font-semibold text-primary">
            Server akan menyimpan timestamp check-out, validasi GPS, status geofence, dan kebutuhan overtime saat tombol submit ditekan.
          </div>
        </div>

        {!submitted ? (
          <div className="pt-4 pb-8">
            <button 
              onClick={onSubmit}
              className="w-full h-16 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-bold text-lg shadow-[0px_8px_24px_rgba(0,105,113,0.2)] active:scale-95 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <span>Submit Check-out</span>
              <Send className="w-6 h-6" />
            </button>
            <p className="text-center text-[11px] text-outline mt-4 px-8">
              By submitting, you confirm that all work logs are accurate and the site has been secured per protocol.
            </p>
          </div>
        ) : (
          <section className="space-y-4 pb-8 pt-2">
            <div className="rounded-[2rem] bg-primary-fixed/45 p-5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Next Step</p>
              <p className="mt-2 text-base font-extrabold text-on-surface">
                Pilih langkah berikutnya setelah pekerjaan site selesai.
              </p>
              <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                Sistem sudah menyimpan check-out. Sekarang teknisi bisa lanjut ke job berikutnya, kembali ke office, atau tutup hari dari site.
              </p>
            </div>

            {hasNextJob && (
              <button
                onClick={onGoToNextJob}
                disabled={resolutionBusy}
                className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-container text-lg font-bold text-white shadow-[0px_8px_24px_rgba(0,105,113,0.2)] transition-all duration-200 active:scale-95 disabled:opacity-60"
              >
                <ArrowRight className="h-5 w-5" />
                Go To Next Job
              </button>
            )}

            <button
              onClick={onReturnToOffice}
              disabled={resolutionBusy}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-surface-container-high text-lg font-bold text-on-surface shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-60"
            >
              <Building2 className="h-5 w-5 text-primary" />
              Return To Office
            </button>

            <button
              onClick={onEndDayFromSite}
              disabled={resolutionBusy}
              className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-secondary-fixed text-lg font-bold text-on-secondary-fixed shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-60"
            >
              <Home className="h-5 w-5" />
              End Day From Site
            </button>
          </section>
        )}
      </div>
    </Layout>
  );
}
