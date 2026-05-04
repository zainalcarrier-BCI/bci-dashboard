import type { Key, ReactNode } from 'react';
import {
  BarChart3,
  BookOpen,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Gauge,
  HeartPulse,
  LoaderCircle,
  Plus,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type ManagerTab = 'live' | 'schedule' | 'jobs' | 'reports' | 'locations' | 'anomalies' | 'technicians' | 'overtime' | 'leave' | 'manuals' | 'audit' | 'users';

export const tabs: Array<{ id: ManagerTab; label: string; Icon: LucideIcon }> = [
  { id: 'live', label: 'Live Dashboard', Icon: Gauge },
  { id: 'schedule', label: 'Scheduling & Dispatch', Icon: CalendarClock },
  { id: 'jobs', label: 'Jobs', Icon: BriefcaseBusiness },
  { id: 'technicians', label: 'Technicians', Icon: Users },
  { id: 'locations', label: 'Locations & GPS', Icon: ShieldAlert },
  { id: 'anomalies', label: 'Attendance Anomalies', Icon: ShieldAlert },
  { id: 'overtime', label: 'Overtime Approval', Icon: CheckCircle2 },
  { id: 'leave', label: 'Leave Approval', Icon: HeartPulse },
  { id: 'manuals', label: 'Manual Book', Icon: BookOpen },
  { id: 'reports', label: 'Reports', Icon: BarChart3 },
  { id: 'audit', label: 'Audit Trail', Icon: BookOpen },
  { id: 'users', label: 'User Access', Icon: Plus },
];

export function title(value?: string | null) {
  return String(value || '-')
    .replaceAll('_', ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function time(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

export function date(value?: string | null) {
  if (!value) return '-';
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
}

export function rupiah(value?: number | null) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

export function numberValue(value?: number | null) {
  return new Intl.NumberFormat('id-ID').format(Number(value || 0));
}

export function percent(value?: number | null) {
  return `${Math.round(Number(value || 0))}%`;
}

export function coordinate(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return Number(value).toFixed(6);
}

export function googleMapsUrl(latitude?: number | null, longitude?: number | null) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) return '';
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export function statusTone(status?: string | null) {
  const normalized = String(status || '').toLowerCase();
  if (['working', 'approved', 'active', 'completed', 'verified'].includes(normalized)) return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (['on_the_way', 'assigned', 'submitted', 'checked_out'].includes(normalized)) return 'bg-cyan-50 text-cyan-700 border-cyan-100';
  if (['pending', 'so_pending', 'paused', 'pending_review'].includes(normalized)) return 'bg-yellow-50 text-yellow-700 border-yellow-100';
  if (['rejected', 'emergency', 'cancelled', 'inactive'].includes(normalized)) return 'bg-red-50 text-red-700 border-red-100';
  return 'bg-neutral-50 text-neutral-700 border-neutral-200';
}

export function scoreTone(score?: number | null) {
  const value = Number(score || 0);
  if (value >= 80) return 'text-emerald-700';
  if (value >= 60) return 'text-cyan-700';
  if (value >= 40) return 'text-yellow-700';
  return 'text-red-700';
}

export function isBlank(value?: string | null) {
  return !String(value || '').trim();
}

export const inputClass = 'h-10 w-full rounded-md border-0 bg-[#e6e8eb] px-3 text-sm font-semibold text-[#191c1e] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#00639a]/20';
export const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Pill({ value }: { value?: string | null }) {
  return <span className={`inline-flex rounded-md px-2.5 py-1 text-xs font-extrabold ${statusTone(value)}`}>{title(value)}</span>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-1 text-sm font-semibold text-[#17201d]">
      <span className="block text-xs font-bold text-[#5d6b66]">{label}</span>
      {children}
    </label>
  );
}

export function Panel({ title: panelTitle, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-white p-5 shadow-sm shadow-blue-900/5">
      <h3 className="mb-4 font-headline text-lg font-extrabold text-[#002f63]">{panelTitle}</h3>
      {children}
    </section>
  );
}

export function InlineError({ message, className = '' }: { message: string; className?: string }) {
  return (
    <div className={`rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm font-semibold text-red-700 ${className}`}>
      {message}
    </div>
  );
}

export function Modal({
  title: modalTitle,
  description,
  children,
  actions,
  onClose,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#17201d]/35 px-4">
      <div className="w-full max-w-md rounded-lg bg-white/95 p-5 shadow-2xl shadow-blue-950/10 backdrop-blur-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="font-headline text-lg font-extrabold text-[#17201d]">{modalTitle}</h3>
            {description && <p className="mt-1 text-sm font-semibold text-[#5d6b66]">{description}</p>}
          </div>
          <button onClick={onClose} className="text-sm font-bold text-[#5d6b66]">Close</button>
        </div>
        <div className="mt-4">{children}</div>
        <div className="mt-5 flex justify-end gap-3">{actions}</div>
      </div>
    </div>
  );
}

export function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-md bg-[#f2f4f7] px-3 py-2">
      <p className="text-xs font-extrabold text-[#657181]">{label}</p>
      <p className="mt-1 font-bold text-[#191c1e]">{value}</p>
    </div>
  );
}

export function StatCard({ label, value, tone = 'text-[#17201d]' }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm shadow-blue-900/5">
      <p className={`text-2xl font-extrabold ${tone}`}>{value}</p>
      <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-[#657181]">{label}</p>
    </div>
  );
}

export function TableHeader({ columns }: { columns: string[] }) {
  return (
    <div className="grid bg-[#e6e8eb] px-4 py-3 text-xs font-extrabold uppercase tracking-[0.12em] text-[#424751]" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
      {columns.map((column) => <div key={column}>{column}</div>)}
    </div>
  );
}

export function Row({ values }: { key?: Key; values: ReactNode[] }) {
  return (
    <div className="grid items-center px-4 py-3 text-sm odd:bg-white even:bg-[#f7f9fc]" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
      {values.map((value, index) => <div key={index} className="pr-3">{value}</div>)}
    </div>
  );
}

export function TabLoadingState({ label }: { label: string }) {
  return (
    <div className="rounded-lg bg-white px-5 py-10 text-center shadow-sm shadow-blue-900/5">
      <LoaderCircle className="mx-auto h-6 w-6 animate-spin text-[#00639a]" />
      <p className="mt-3 text-sm font-semibold text-[#657181]">Memuat tab {label}...</p>
    </div>
  );
}
