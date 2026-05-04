import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  BookOpen,
  Building2,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock3,
  Download,
  FileClock,
  MapPinned,
  RefreshCw,
  Route,
  UserRoundCheck,
} from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';
import { TodayPayload } from '../services/api';
import {
  getActiveTechnicianSimulation,
  getTechnicianSimulationNow,
  TECHNICIAN_SIMULATION_EVENT,
} from '../services/technician-simulation';
import {
  buildTechnicianTimeline,
  deriveDayType,
  deriveLastSubmittedEvent,
  derivePrimaryAction,
} from '../utils/technician-flow';

interface HomeProps {
  todayMode: string;
  today: TodayPayload | null;
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onOfficeCheckIn: () => void;
  onPrepareTools: () => void;
  onStandby: () => void;
  onDirectToSite: () => void;
  onStartTripToSite: () => void;
  onOpenOfficeDay: () => void;
  onResumeTrip: () => void;
  onOpenWorkStatus: () => void;
  onOpenHistory: () => void;
  onEmergencyJob: () => void;
  onLeaveRequest: () => void;
  onManualBook: () => void;
  onNotifications: () => void;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

function formatClock(value: Date) {
  return new Intl.DateTimeFormat('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(value);
}

function formatLongDate(value: string | null | undefined) {
  if (!value) {
    return new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      timeZone: 'Asia/Jakarta',
    }).format(new Date());
  }
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Jakarta',
  }).format(new Date(value));
}

function deriveGreeting(hour: number) {
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 19) return 'Selamat Sore';
  return 'Selamat Malam';
}

function deriveStatusSummary(params: {
  todayMode: string;
  officeCheckedIn: boolean;
  nextJob: Job | null;
  leaveApproved: boolean;
  completedJobs: number;
}) {
  const { todayMode, officeCheckedIn, nextJob, leaveApproved, completedJobs } = params;

  if (leaveApproved) {
    return 'Leave hari ini sudah disetujui dan attendance tidak perlu dijalankan.';
  }
  if (todayMode === 'On The Way') {
    return nextJob
      ? `Sedang menuju ${nextJob.site}. Lanjutkan dengan submit check in site saat tiba.`
      : 'Perjalanan ke site sedang berjalan.';
  }
  if (todayMode === 'On Site' || todayMode === 'Working' || todayMode === 'Paused' || todayMode === 'Pending') {
    return nextJob
      ? `Job ${nextJob.id} sedang aktif di ${nextJob.site}.`
      : 'Status pekerjaan aktif sudah berjalan.';
  }
  if (officeCheckedIn && nextJob) {
    return `Attendance office sudah masuk. ${nextJob.id} siap diberangkatkan ke site.`;
  }
  if (officeCheckedIn) {
    return 'Attendance office sudah masuk. Kalau tidak ada pekerjaan, teknisi bisa check out dari office.';
  }
  if (completedJobs > 0) {
    return 'Assignment aktif hari ini sudah selesai. History bisa dibuka untuk review.';
  }
  if (nextJob) {
    return `${nextJob.id} sudah terjadwal. Mulai dari office atau direct ke site sesuai kebutuhan.`;
  }
  return 'Belum ada aktivitas hari ini. Mulai dari office untuk standby atau prepare tools.';
}

export default function Home({
  todayMode,
  today,
  jobs,
  onSelectJob,
  onOfficeCheckIn,
  onPrepareTools,
  onStandby,
  onDirectToSite,
  onStartTripToSite,
  onOpenOfficeDay,
  onResumeTrip,
  onOpenWorkStatus,
  onOpenHistory,
  onEmergencyJob,
  onLeaveRequest,
  onManualBook,
  onNotifications,
  onTabChange,
}: HomeProps) {
  const [installAvailable, setInstallAvailable] = useState(
    typeof window !== 'undefined' && Boolean(window.__bciInstallPromptEvent),
  );
  const [refreshingApp, setRefreshingApp] = useState(false);
  const [simulationSummary, setSimulationSummary] = useState(() => getActiveTechnicianSimulation(today?.user.employee_id));
  const [displayNow, setDisplayNow] = useState<Date>(() => getTechnicianSimulationNow(today?.user.employee_id) ?? new Date());

  const activeJobs = useMemo(() => jobs.filter((job) => job.status !== 'COMPLETED'), [jobs]);
  const completedJobs = useMemo(() => jobs.filter((job) => job.status === 'COMPLETED'), [jobs]);
  const nextJob = activeJobs[0] ?? null;
  const leaveApproved = today?.leave_request_today?.status === 'approved';
  const officeAlreadyCheckedIn = Boolean(today?.office_check_in_today);
  const userName = today?.user.full_name.split(' ')[0] ?? 'Technician';
  const unreadCount = today?.notifications_unread_count ?? 0;
  const teamLabel = today ? `${today.technician.team} / ${today.technician.region}` : 'Team / Region';
  const branch = today?.technician.branch ?? 'Branch';
  const displayDate = formatLongDate(today?.work_date);
  const operationalContext = today?.operational_context;
  const dayType = operationalContext?.day_type_label ?? deriveDayType(today?.work_date);
  const primaryAction = derivePrimaryAction({
    todayMode,
    today,
    jobs,
    officeCheckedIn: officeAlreadyCheckedIn,
  });
  const lastEvent = deriveLastSubmittedEvent(today, jobs);
  const timeline = buildTechnicianTimeline(today, jobs);
  const greeting = deriveGreeting(displayNow.getHours());
  const statusSummary = deriveStatusSummary({
    todayMode,
    officeCheckedIn: officeAlreadyCheckedIn,
    nextJob,
    leaveApproved,
    completedJobs: completedJobs.length,
  });

  const operationalOpenItems = operationalContext?.open_exceptions?.map((item) => item.label) ?? [];
  const openItems = [
    officeAlreadyCheckedIn && !nextJob ? 'Attendance office sudah masuk dan belum ada job aktif.' : '',
    nextJob && !officeAlreadyCheckedIn ? `Job ${nextJob.id} menunggu start day atau direct to site.` : '',
    nextJob && officeAlreadyCheckedIn ? `${nextJob.id} siap untuk start trip ke ${nextJob.site}.` : '',
    todayMode === 'Paused' || todayMode === 'Pending' ? 'Ada pekerjaan yang perlu dilanjutkan atau diputuskan statusnya.' : '',
    completedJobs.length ? `${completedJobs.length} job selesai sudah siap dicek di history.` : '',
    ...operationalOpenItems,
  ].filter(Boolean);

  useEffect(() => {
    const syncInstall = () => setInstallAvailable(Boolean(window.__bciInstallPromptEvent));
    window.addEventListener('bci-install-available', syncInstall);
    window.addEventListener('bci-install-installed', syncInstall);
    return () => {
      window.removeEventListener('bci-install-available', syncInstall);
      window.removeEventListener('bci-install-installed', syncInstall);
    };
  }, []);

  useEffect(() => {
    const syncSimulation = () => setSimulationSummary(getActiveTechnicianSimulation(today?.user.employee_id));
    syncSimulation();
    window.addEventListener(TECHNICIAN_SIMULATION_EVENT, syncSimulation);
    return () => {
      window.removeEventListener(TECHNICIAN_SIMULATION_EVENT, syncSimulation);
    };
  }, [today?.user.employee_id]);

  useEffect(() => {
    const simulationBase = getTechnicianSimulationNow(today?.user.employee_id);
    const baseNow = simulationBase ?? new Date();
    const startRealMs = Date.now();

    setDisplayNow(baseNow);
    const interval = window.setInterval(() => {
      if (simulationBase) {
        setDisplayNow(new Date(baseNow.getTime() + (Date.now() - startRealMs)));
        return;
      }
      setDisplayNow(new Date());
    }, 1000);

    return () => window.clearInterval(interval);
  }, [today?.user.employee_id, simulationSummary?.simulated_now]);

  const promptInstall = async () => {
    const prompt = window.__bciInstallPromptEvent;
    if (!prompt) return;
    await prompt.prompt();
    await prompt.userChoice;
    window.__bciInstallPromptEvent = undefined;
    setInstallAvailable(false);
  };

  const refreshApp = async () => {
    setRefreshingApp(true);
    try {
      if (!window.__bciRefreshApp) {
        window.location.reload();
        return;
      }
      await window.__bciRefreshApp();
    } finally {
      setRefreshingApp(false);
    }
  };

  const runPrimaryAction = () => {
    switch (primaryAction.key) {
      case 'check_in_office':
        onOfficeCheckIn();
        break;
      case 'end_day_office':
        onOpenOfficeDay();
        break;
      case 'start_trip_to_site':
        onStartTripToSite();
        break;
      case 'resume_trip':
        onResumeTrip();
        break;
      case 'open_work_status':
        onOpenWorkStatus();
        break;
      case 'open_history':
        onOpenHistory();
        break;
      default:
        break;
    }
  };

  const contextualActions = [
    officeAlreadyCheckedIn && !nextJob
      ? {
          key: 'standby',
          label: 'Standby Office',
          note: 'Tetap di kantor sambil menunggu dispatch baru.',
          onClick: onStandby,
          icon: Building2,
          disabled: false,
        }
      : null,
    officeAlreadyCheckedIn
      ? {
          key: 'prepare',
          label: 'Prepare Tools',
          note: 'Masuk mode persiapan dokumen, alat, atau mobil operasional.',
          onClick: onPrepareTools,
          icon: ClipboardList,
          disabled: false,
        }
      : null,
    nextJob && officeAlreadyCheckedIn
      ? {
          key: 'trip',
          label: 'Start Trip',
          note: `Berangkat ke ${nextJob.site}.`,
          onClick: onStartTripToSite,
          icon: Route,
          disabled: false,
        }
      : null,
    (todayMode === 'On The Way' || todayMode === 'On Site' || todayMode === 'Working' || todayMode === 'Paused' || todayMode === 'Pending')
      ? {
          key: 'resume',
          label: todayMode === 'On The Way' ? 'Resume Trip' : 'Open Work Flow',
          note: todayMode === 'On The Way' ? 'Lanjutkan perjalanan sampai tiba di site.' : 'Buka flow kerja aktif untuk update status.',
          onClick: todayMode === 'On The Way' ? onResumeTrip : onOpenWorkStatus,
          icon: todayMode === 'On The Way' ? Route : FileClock,
          disabled: false,
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    note: string;
    onClick: () => void;
    icon: typeof Building2;
    disabled: boolean;
  }>;

  const quickActions = [
    {
      key: 'check_in_office',
      label: 'Check In Office',
      note: officeAlreadyCheckedIn ? 'Sudah masuk office hari ini.' : 'Mulai attendance dari kantor.',
      onClick: onOfficeCheckIn,
      icon: Building2,
      disabled: officeAlreadyCheckedIn || leaveApproved,
    },
    {
      key: 'direct_to_site',
      label: 'Direct To Site',
      note: nextJob ? 'Langsung ke customer/site sesuai schedule.' : 'Perlu assignment aktif terlebih dahulu.',
      onClick: onDirectToSite,
      icon: Route,
      disabled: !nextJob || leaveApproved,
    },
    {
      key: 'leave',
      label: 'Leave Request',
      note: 'Annual leave atau sick leave.',
      onClick: onLeaveRequest,
      icon: UserRoundCheck,
      disabled: false,
    },
    {
      key: 'emergency',
      label: 'Emergency Job',
      note: 'Buat pekerjaan mendadak tanpa menunggu dispatch engineer.',
      onClick: onEmergencyJob,
      icon: FileClock,
      disabled: leaveApproved,
    },
    {
      key: 'manual',
      label: 'Manual Book',
      note: 'IOM, wiring diagram, dan dokumen PDF.',
      onClick: onManualBook,
      icon: BookOpen,
      disabled: false,
    },
  ];

  return (
    <Layout activeTab="home" onTabChange={onTabChange}>
      <div className="space-y-5 p-4 pb-10">
        <header className="mt-2 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface-variant">{greeting}, {userName}</p>
            <h2 className="mt-1 font-headline text-[2rem] font-extrabold leading-none text-on-surface">{branch}</h2>
            <p className="mt-2 text-xs font-semibold text-on-surface-variant">{displayDate}</p>
          </div>
          <div className="flex shrink-0 items-start gap-2">
            <div className="rounded-[1.25rem] bg-surface-container-lowest px-3 py-2 text-right shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">{dayType}</p>
              <p className="mt-1 font-headline text-base font-extrabold text-on-surface">{formatClock(displayNow)}</p>
              <p className="text-[10px] font-semibold text-on-surface-variant">WIB</p>
            </div>
            <button
              onClick={() => void refreshApp()}
              aria-label="Refresh app"
              className="grid h-11 w-11 place-items-center rounded-2xl bg-surface-container-lowest shadow-sm transition-transform active:scale-95"
            >
              <RefreshCw className={`h-5 w-5 text-primary ${refreshingApp ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onNotifications}
              aria-label="Open notifications"
              className="relative grid h-11 w-11 place-items-center rounded-2xl bg-surface-container-lowest shadow-sm transition-transform active:scale-95"
            >
              <Bell className="h-5 w-5 text-primary" />
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-error px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            </button>
          </div>
        </header>

        {simulationSummary && (
          <section className="rounded-[1.5rem] border border-tertiary/20 bg-tertiary/10 p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">Simulation Lab Active</p>
                <p className="mt-2 text-sm font-extrabold text-on-surface">
                  {simulationSummary.location_label}
                </p>
                <p className="mt-1 text-xs font-semibold text-on-surface-variant">
                  {formatShortDateTime(simulationSummary.simulated_now)} / GPS {simulationSummary.latitude}, {simulationSummary.longitude}
                </p>
              </div>
              <div className="rounded-full bg-white/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-tertiary">
                {simulationSummary.day_type_mode === 'auto' ? 'Auto Calendar' : simulationSummary.day_type_mode.replaceAll('_', ' ')}
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[2rem] bg-primary p-5 text-white shadow-[0px_10px_28px_rgba(0,102,110,0.22)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary-fixed">Status Hari Ini</p>
              <h3 className="mt-2 font-headline text-2xl font-extrabold">{todayMode}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/85">{statusSummary}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/12 px-3 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Team</p>
              <p className="mt-1 text-sm font-extrabold text-white">{teamLabel}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-[1.25rem] bg-white/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Last Event</p>
              <p className="mt-2 text-base font-extrabold text-white">{lastEvent.label}</p>
              <p className="mt-1 text-xs font-semibold text-white/80">{lastEvent.note}</p>
              <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70">{lastEvent.timeLabel}</p>
            </div>
            <div className="rounded-[1.25rem] bg-white/10 p-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">Attendance</p>
              <p className="mt-2 text-base font-extrabold text-white">
                {officeAlreadyCheckedIn ? 'Office Sudah Masuk' : 'Belum Check In'}
              </p>
              <p className="mt-1 text-xs font-semibold text-white/80">
                {today?.active_office_location?.name || 'Jam kerja normal 08:00 - 17:00 WIB'}
              </p>
              <p className="mt-2 text-[11px] font-semibold text-white/70">
                {operationalContext?.overtime_policy_label || 'Rule lembur mengikuti tipe hari kerja.'}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className={`grid h-11 w-11 place-items-center rounded-2xl ${
              primaryAction.tone === 'success' ? 'bg-emerald-50 text-emerald-700' : 'bg-primary text-white'
            }`}>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Langkah Berikutnya</p>
              <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">{primaryAction.label}</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-on-surface-variant">{primaryAction.description}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={runPrimaryAction}
            disabled={primaryAction.disabled}
            className={`mt-4 h-14 w-full rounded-full font-headline text-lg font-extrabold transition-transform active:scale-95 ${
              primaryAction.tone === 'success'
                ? 'bg-emerald-600 text-white'
                : 'bg-primary text-white'
            } disabled:cursor-not-allowed disabled:opacity-60`}
          >
            {primaryAction.label}
          </button>

          {contextualActions.length > 0 && (
            <div className="mt-4 grid gap-3">
              {contextualActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.key}
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className="flex items-center gap-3 rounded-[1.25rem] bg-surface-container-low px-4 py-3 text-left transition-transform active:scale-[0.98] disabled:opacity-50"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-extrabold text-on-surface">{action.label}</p>
                      <p className="mt-0.5 text-xs font-semibold text-on-surface-variant">{action.note}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-primary" />
                  </button>
                );
              })}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Akses Cepat</p>
              <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">Menu Utama Teknisi</h3>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.key}
                  type="button"
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className="min-h-28 rounded-[1.5rem] bg-surface-container-lowest p-4 text-left shadow-sm transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-55"
                >
                  <Icon className="h-6 w-6 text-primary" />
                  <p className="mt-3 font-headline text-base font-extrabold text-on-surface">{action.label}</p>
                  <p className="mt-1 text-[11px] font-semibold leading-relaxed text-on-surface-variant">{action.note}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-[2rem] bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Job Aktif</p>
              <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">
                {nextJob ? nextJob.id : 'Belum Ada Assignment'}
              </h3>
            </div>
            <div className="rounded-full bg-primary-fixed/60 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
              {nextJob ? nextJob.status : 'Standby'}
            </div>
          </div>

          {nextJob ? (
            <button
              type="button"
              onClick={() => onSelectJob(nextJob)}
              className="mt-4 w-full rounded-[1.5rem] bg-surface-container-low p-4 text-left transition-transform active:scale-[0.98]"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-headline text-lg font-extrabold text-on-surface">{nextJob.customer}</p>
                  <p className="mt-1 text-sm font-semibold text-on-surface-variant">{nextJob.site}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-primary" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-outline">Job Type</p>
                  <p className="mt-1 font-semibold text-on-surface">{nextJob.type}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-outline">Schedule</p>
                  <p className="mt-1 font-semibold text-on-surface">{nextJob.time}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-outline">SO Status</p>
                  <p className="mt-1 font-semibold text-on-surface">{nextJob.soStatus || 'Pending'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-outline">Priority</p>
                  <p className="mt-1 font-semibold text-on-surface">{nextJob.priority}</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="mt-4 rounded-[1.5rem] bg-surface-container-low p-4">
              <p className="text-sm font-semibold leading-relaxed text-on-surface-variant">
                Belum ada schedule aktif. Teknisi tetap bisa check in office untuk standby, prepare tools, atau menunggu dispatch mendadak.
              </p>
            </div>
          )}
        </section>

        {openItems.length > 0 && (
          <section className="rounded-[2rem] bg-surface-container-lowest p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Perlu Perhatian</p>
                <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">Open Items</h3>
              </div>
              <Clock3 className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-4 space-y-3">
              {openItems.slice(0, 4).map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-[1.25rem] bg-surface-container-low px-4 py-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p className="text-sm font-semibold leading-relaxed text-on-surface-variant">{item}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-[2rem] bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Timeline Hari Ini</p>
              <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">Jejak Aktivitas</h3>
            </div>
            <CalendarClock className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-4 space-y-4">
            {timeline.length ? timeline.map((item, index) => (
              <div key={item.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className={`grid h-9 w-9 place-items-center rounded-2xl ${
                    item.tone === 'success'
                      ? 'bg-emerald-50 text-emerald-700'
                      : item.tone === 'warning'
                        ? 'bg-amber-50 text-amber-700'
                        : item.tone === 'primary'
                          ? 'bg-primary text-white'
                          : 'bg-surface-container-high text-primary'
                  }`}>
                    {item.label.toLowerCase().includes('office') ? (
                      <Building2 className="h-4 w-4" />
                    ) : item.label.toLowerCase().includes('job') ? (
                      <ClipboardList className="h-4 w-4" />
                    ) : (
                      <MapPinned className="h-4 w-4" />
                    )}
                  </div>
                  {index < timeline.length - 1 && <div className="mt-1 h-full w-px bg-outline/25" />}
                </div>
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-extrabold text-on-surface">{item.label}</p>
                    <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">{item.timeLabel}</span>
                  </div>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-on-surface-variant">{item.note}</p>
                </div>
              </div>
            )) : (
              <div className="rounded-[1.25rem] bg-surface-container-low p-4 text-sm font-semibold text-on-surface-variant">
                Belum ada event hari ini. Mulai dari Check In Office atau Direct To Site.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Schedule Hari Ini</p>
              <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">Semua Assignment</h3>
            </div>
            <button type="button" onClick={() => onTabChange('jobs')} className="text-xs font-bold text-primary">
              Open Schedule
            </button>
          </div>
          {jobs.length ? jobs.map((job) => (
            <button
              type="button"
              key={job.id}
              onClick={() => onSelectJob(job)}
              className="flex w-full items-start justify-between gap-3 rounded-[1.5rem] bg-surface-container-lowest p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-outline">{job.id}</span>
                  <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${
                    job.status === 'COMPLETED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : job.status === 'WORKING' || job.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700'
                        : 'bg-primary-fixed/60 text-primary'
                  }`}>
                    {job.status}
                  </span>
                </div>
                <p className="mt-2 font-headline text-base font-extrabold text-on-surface">{job.customer}</p>
                <p className="mt-1 text-xs font-semibold text-on-surface-variant">{job.site}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-extrabold text-on-surface">{job.time}</p>
                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-outline">{job.type}</p>
              </div>
            </button>
          )) : (
            <div className="rounded-[1.5rem] bg-surface-container-low p-4 text-sm font-semibold text-on-surface-variant">
              Belum ada assignment aktif hari ini.
            </div>
          )}
        </section>

        {installAvailable && (
          <section className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-headline text-base font-extrabold text-on-surface">Install BCI Web App</p>
                <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                  Simpan ke home screen supaya akses camera, GPS, dan review job lebih cepat dari HP.
                </p>
                <button type="button" onClick={() => void promptInstall()} className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">
                  Install Sekarang
                </button>
              </div>
            </div>
          </section>
        )}

        <section className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <ClipboardList className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-headline text-base font-extrabold text-on-surface">Review History</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Buka history untuk lihat pekerjaan yang sudah selesai, overtime, dan jejak aktivitas sebelumnya.
              </p>
              <button type="button" onClick={onOpenHistory} className="mt-3 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white">
                Open History
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
