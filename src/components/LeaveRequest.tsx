import { useEffect, useMemo, useState } from 'react';
import { BriefcaseMedical, CalendarDays, ShieldPlus } from 'lucide-react';
import type { ApiLeaveRequest, TechnicianLeaveSummary, TodayPayload } from '../services/api';
import { getTechnicianLeaveRequests } from '../services/api';
import Layout from './Layout';

interface LeaveRequestProps {
  today: TodayPayload | null;
  onBack: () => void;
  onSubmit: (payload: {
    leave_type: 'annual_leave' | 'sick_leave';
    start_date: string;
    end_date: string;
    reason: string;
    medical_note?: string;
  }) => Promise<void>;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

function titleCase(value: string) {
  return value.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function statusTone(status: string) {
  if (status === 'approved') return 'bg-emerald-50 text-emerald-700';
  if (status === 'submitted') return 'bg-amber-50 text-amber-700';
  if (status === 'rejected') return 'bg-red-50 text-red-700';
  return 'bg-slate-100 text-slate-700';
}

export default function LeaveRequest({ today, onBack, onSubmit, onTabChange }: LeaveRequestProps) {
  const workDate = today?.work_date || new Date().toISOString().slice(0, 10);
  const [leaveType, setLeaveType] = useState<'annual_leave' | 'sick_leave'>('annual_leave');
  const [startDate, setStartDate] = useState(workDate);
  const [endDate, setEndDate] = useState(workDate);
  const [reason, setReason] = useState('');
  const [medicalNote, setMedicalNote] = useState('');
  const [summary, setSummary] = useState<TechnicianLeaveSummary | null>(null);
  const [rows, setRows] = useState<ApiLeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitBusy, setSubmitBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const totalDays = useMemo(() => {
    const start = new Date(`${startDate}T00:00:00+07:00`).getTime();
    const end = new Date(`${endDate}T00:00:00+07:00`).getTime();
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return 0;
    return Math.floor((end - start) / 86400000) + 1;
  }, [endDate, startDate]);

  const loadLeaveData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getTechnicianLeaveRequests();
      setSummary(response.summary);
      setRows(response.rows);
    } catch (loadError) {
      console.warn('Leave request data failed to load', loadError);
      setError('Data leave belum berhasil dimuat. Coba refresh halaman ini.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadLeaveData();
  }, []);

  const submitLeave = async () => {
    if (!reason.trim()) {
      setError('Reason wajib diisi.');
      return;
    }
    if (endDate < startDate) {
      setError('Tanggal akhir harus sama atau setelah tanggal mulai.');
      return;
    }
    try {
      setSubmitBusy(true);
      setError('');
      setSuccess('');
      await onSubmit({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason: reason.trim(),
        medical_note: medicalNote.trim() || undefined,
      });
      setSuccess('Leave request berhasil dikirim dan menunggu approval.');
      setReason('');
      setMedicalNote('');
      setStartDate(workDate);
      setEndDate(workDate);
      setLeaveType('annual_leave');
      await loadLeaveData();
    } catch (submitError) {
      console.warn('Leave request submit failed', submitError);
      setError('Leave request belum berhasil dikirim. Cek tanggal atau request yang overlap.');
    } finally {
      setSubmitBusy(false);
    }
  };

  return (
    <Layout title="Leave & Attendance" onBack={onBack} activeTab="profile" onTabChange={onTabChange}>
      <div className="space-y-5 p-4 pb-28">
        <section className="rounded-[2rem] bg-primary-container p-5 text-on-primary">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20">
              <BriefcaseMedical className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-white/80">Leave Request</p>
              <h2 className="mt-1 font-headline text-xl font-extrabold">Annual Leave / Sick Leave</h2>
              <p className="mt-1 text-xs text-white/80">Submit izin tidak masuk kerja dan monitor status approval dari atasan.</p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Annual Balance</p>
            <p className="mt-2 font-headline text-2xl font-extrabold text-primary">{loading ? '...' : `${summary?.annual_remaining_days ?? 0}`}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">{summary?.annual_used_days ?? 0} used / {summary?.annual_pending_days ?? 0} pending</p>
          </div>
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Sick Leave YTD</p>
            <p className="mt-2 font-headline text-2xl font-extrabold text-primary">{loading ? '...' : `${summary?.sick_days ?? 0}`}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">{summary?.pending_requests ?? 0} request pending</p>
          </div>
        </section>

        {summary?.today_request && (
          <section className={`rounded-[1.5rem] p-4 ${summary.today_request.status === 'approved' ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Today Status</p>
            <h3 className="mt-1 font-headline text-base font-extrabold text-on-surface">
              {titleCase(summary.today_request.leave_type)} / {titleCase(summary.today_request.status)}
            </h3>
            <p className="mt-1 text-xs text-on-surface-variant">{summary.today_request.reason}</p>
          </section>
        )}

        <section className="rounded-[2rem] bg-surface-container-low p-5 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldPlus className="h-5 w-5 text-primary" />
            <h3 className="font-headline font-extrabold text-on-surface">Submit New Request</h3>
          </div>

          {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
          {success && <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{success}</div>}

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setLeaveType('annual_leave')}
              className={`rounded-2xl p-4 text-left ${leaveType === 'annual_leave' ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface'}`}
            >
              <div className="text-sm font-bold">Annual Leave</div>
              <div className="mt-1 text-[10px] font-medium opacity-80">Cuti tahunan</div>
            </button>
            <button
              type="button"
              onClick={() => setLeaveType('sick_leave')}
              className={`rounded-2xl p-4 text-left ${leaveType === 'sick_leave' ? 'bg-primary text-white' : 'bg-surface-container-lowest text-on-surface'}`}
            >
              <div className="text-sm font-bold">Sick Leave</div>
              <div className="mt-1 text-[10px] font-medium opacity-80">Izin sakit</div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Start Date</span>
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="h-12 w-full rounded-2xl bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface outline-none" />
            </label>
            <label className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-outline">End Date</span>
              <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="h-12 w-full rounded-2xl bg-surface-container-lowest px-4 text-sm font-semibold text-on-surface outline-none" />
            </label>
          </div>

          <div className="rounded-2xl bg-surface-container-lowest px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Total Days</p>
            <p className="mt-1 text-lg font-extrabold text-primary">{totalDays} day{totalDays === 1 ? '' : 's'}</p>
          </div>

          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Reason</span>
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={4} className="w-full rounded-[1.5rem] bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface outline-none" placeholder="Contoh: annual leave keluarga / demam dan perlu istirahat." />
          </label>

          <label className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-outline">Medical Note</span>
            <textarea value={medicalNote} onChange={(event) => setMedicalNote(event.target.value)} rows={2} className="w-full rounded-[1.5rem] bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface outline-none" placeholder="Optional untuk catatan dokter atau detail tambahan." />
          </label>

          <button
            type="button"
            onClick={() => void submitLeave()}
            disabled={submitBusy}
            className="h-12 w-full rounded-2xl bg-primary text-sm font-bold text-white disabled:opacity-60"
          >
            {submitBusy ? 'Submitting...' : 'Submit Leave Request'}
          </button>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" />
            <h3 className="font-headline font-extrabold text-on-surface">Request History</h3>
          </div>

          {loading ? (
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 text-sm font-semibold text-on-surface-variant">Loading leave history...</div>
          ) : rows.length ? (
            rows.map((row) => (
              <div key={row.id} className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-extrabold text-on-surface">{titleCase(row.leave_type)}</p>
                    <p className="mt-1 text-xs font-semibold text-on-surface-variant">{row.start_date} to {row.end_date} / {row.total_days} day{row.total_days === 1 ? '' : 's'}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${statusTone(row.status)}`}>
                    {titleCase(row.status)}
                  </span>
                </div>
                <p className="mt-3 text-sm font-semibold text-on-surface">{row.reason}</p>
                {row.rejection_note && <p className="mt-2 text-xs font-semibold text-red-700">Note: {row.rejection_note}</p>}
              </div>
            ))
          ) : (
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 text-sm font-semibold text-on-surface-variant">Belum ada leave request.</div>
          )}
        </section>
      </div>
    </Layout>
  );
}
