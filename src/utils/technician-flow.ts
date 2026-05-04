import type { TodayPayload } from '../services/api';
import type { Job } from '../types';
import type { PrimaryActionKeyV2 } from '../config/operational-v2';

export interface TechnicianPrimaryAction {
  key: PrimaryActionKeyV2;
  label: string;
  description: string;
  tone: 'primary' | 'secondary' | 'success';
  disabled?: boolean;
}

export interface TechnicianTimelineItem {
  id: string;
  label: string;
  note: string;
  timeLabel: string;
  sortValue: number;
  tone: 'primary' | 'neutral' | 'success' | 'warning';
}

function parseTimeValue(value?: string | null) {
  if (!value) return Number.NaN;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Number.NaN : parsed;
}

function formatTime(value?: string | null) {
  if (!value) return '--:--';
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function deriveDayType(workDate?: string | null) {
  if (!workDate) return 'Weekday';
  const date = new Date(`${workDate}T00:00:00+07:00`);
  const day = date.getUTCDay();
  return day === 0 || day === 6 ? 'Weekend' : 'Weekday';
}

export function deriveLastSubmittedEvent(today: TodayPayload | null, jobs: Job[]) {
  const dayClosedAt = parseTimeValue(today?.day_session?.day_closed_at);
  const officeCheckInTime = parseTimeValue(today?.office_check_in_today?.server_timestamp);
  const activeJob = jobs.find((job) => job.status !== 'COMPLETED');
  if (!Number.isNaN(dayClosedAt)) {
    return {
      label: 'Tutup Hari',
      note: 'Hari kerja sudah ditutup.',
      timeLabel: formatTime(today?.day_session?.day_closed_at),
    };
  }
  if (activeJob) {
    const labelByStatus: Record<Job['status'], string> = {
      ASSIGNED: 'Job terjadwal',
      'EN ROUTE': 'Perjalanan ke site',
      WORKING: 'Sedang bekerja',
      PENDING: 'Pending follow-up',
      COMPLETED: 'Job selesai',
    };
    return {
      label: labelByStatus[activeJob.status],
      note: `${activeJob.id} / ${activeJob.customer}`,
      timeLabel: activeJob.time,
    };
  }
  if (!Number.isNaN(officeCheckInTime)) {
    return {
      label: 'Check In Office',
      note: today?.active_office_location?.name || 'Office attendance recorded',
      timeLabel: formatTime(today?.office_check_in_today?.server_timestamp),
    };
  }
  if (jobs.some((job) => job.status === 'COMPLETED')) {
    const completedJob = jobs.find((job) => job.status === 'COMPLETED');
    return {
      label: 'Job selesai',
      note: `${completedJob?.id || '-'} / ${completedJob?.customer || '-'}`,
      timeLabel: completedJob?.time || '--:--',
    };
  }
  return {
    label: 'Belum ada event',
    note: 'Mulai hari kerja untuk membuat timeline',
    timeLabel: '--:--',
  };
}

export function buildTechnicianTimeline(today: TodayPayload | null, jobs: Job[]) {
  const items: TechnicianTimelineItem[] = [];

  if (today?.day_session?.day_started_at) {
    items.push({
      id: 'day-started',
      label: 'Mulai Hari',
      note: today.day_session.note || `Mode ${String(today.day_session.day_mode || 'standby').replaceAll('_', ' ')}`,
      timeLabel: formatTime(today.day_session.day_started_at),
      sortValue: parseTimeValue(today.day_session.day_started_at),
      tone: 'neutral',
    });
  }

  if (today?.day_session?.day_closed_at) {
    items.push({
      id: 'day-closed',
      label: 'Tutup Hari',
      note: 'Hari kerja ditutup dari office / site sesuai flow terakhir.',
      timeLabel: formatTime(today.day_session.day_closed_at),
      sortValue: parseTimeValue(today.day_session.day_closed_at),
      tone: 'success',
    });
  }

  if (today?.office_check_in_today?.server_timestamp) {
    items.push({
      id: 'office-check-in',
      label: 'Check In Office',
      note: today.active_office_location?.name || 'Office attendance recorded',
      timeLabel: formatTime(today.office_check_in_today.server_timestamp),
      sortValue: parseTimeValue(today.office_check_in_today.server_timestamp),
      tone: 'primary',
    });
  }

  jobs.forEach((job, index) => {
    const statusMeta: Record<Job['status'], { label: string; tone: TechnicianTimelineItem['tone'] }> = {
      ASSIGNED: { label: 'Job Terjadwal', tone: 'neutral' },
      'EN ROUTE': { label: 'Menuju Site', tone: 'primary' },
      WORKING: { label: 'Sedang Bekerja', tone: 'warning' },
      PENDING: { label: 'Pending Follow-up', tone: 'warning' },
      COMPLETED: { label: 'Job Selesai', tone: 'success' },
    };
    items.push({
      id: `job-${job.id}-${index}`,
      label: statusMeta[job.status].label,
      note: `${job.id} / ${job.customer} / ${job.site}`,
      timeLabel: job.time || '--:--',
      sortValue: parseTimeValue(job.scheduledStartAt) || (today?.work_date ? Date.parse(`${today.work_date}T00:00:00+07:00`) + index * 60000 : index),
      tone: statusMeta[job.status].tone,
    });
  });

  return items
    .sort((left, right) => left.sortValue - right.sortValue)
    .slice(0, 8);
}

export function derivePrimaryAction(params: {
  todayMode: string;
  today: TodayPayload | null;
  jobs: Job[];
  officeCheckedIn: boolean;
}) {
  const { todayMode, today, jobs, officeCheckedIn } = params;
  const leaveApproved = today?.leave_request_today?.status === 'approved';
  const activeJobs = jobs.filter((job) => job.status !== 'COMPLETED');
  const nextJob = activeJobs[0] ?? null;

  if (leaveApproved) {
    return {
      key: 'open_history',
      label: 'Leave Hari Ini',
      description: 'Annual leave atau sick leave sudah approved untuk hari ini.',
      tone: 'success',
      disabled: true,
    } satisfies TechnicianPrimaryAction;
  }

  if (todayMode === 'On The Way' || todayMode === 'Direct To Site') {
    return {
      key: 'resume_trip',
      label: 'Lanjut Check In Site',
      description: 'Perjalanan sudah dimulai. Lanjutkan sampai submit site check-in.',
      tone: 'primary',
    } satisfies TechnicianPrimaryAction;
  }

  if (todayMode === 'On Site' || todayMode === 'Working' || todayMode === 'Paused' || todayMode === 'Pending') {
    return {
      key: 'open_work_status',
      label: todayMode === 'On Site' ? 'Start Work' : todayMode === 'Working' ? 'Finish Work / Update Status' : 'Lanjutkan Pekerjaan',
      description: 'Buka flow kerja untuk start, pause, pending, resume, atau finish work.',
      tone: 'primary',
    } satisfies TechnicianPrimaryAction;
  }

  if (nextJob && officeCheckedIn) {
    return {
      key: 'start_trip_to_site',
      label: 'Start Trip To Site',
      description: `${nextJob.id} siap dijalankan. Mulai perjalanan ke ${nextJob.site}.`,
      tone: 'primary',
    } satisfies TechnicianPrimaryAction;
  }

  if (nextJob) {
    return {
      key: 'check_in_office',
      label: 'Check In Office',
      description: `Ada job ${nextJob.id} jam ${nextJob.time}. Check-in office dulu kalau perlu prepare tools atau dokumen.`,
      tone: 'primary',
    } satisfies TechnicianPrimaryAction;
  }

  if (officeCheckedIn) {
    return {
      key: 'end_day_office',
      label: 'Check Out Office',
      description: 'Attendance kantor sudah masuk dan tidak ada job aktif. Tutup hari kerja dari office.',
      tone: 'success',
    } satisfies TechnicianPrimaryAction;
  }

  if (jobs.some((job) => job.status === 'COMPLETED')) {
    return {
      key: 'open_history',
      label: 'Review History',
      description: 'Semua assignment aktif sudah selesai. Buka history untuk lihat ringkasan hari ini.',
      tone: 'success',
    } satisfies TechnicianPrimaryAction;
  }

  return {
    key: 'check_in_office',
    label: 'Check In Office',
    description: 'Belum ada dispatch aktif. Mulai hari kerja dari office untuk standby atau prepare tools.',
    tone: 'primary',
  } satisfies TechnicianPrimaryAction;
}
