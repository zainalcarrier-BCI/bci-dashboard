export const JOB_TYPE_OPTIONS_V2 = [
  { code: 'SA', label: 'Service Agreement' },
  { code: 'SR', label: 'Service Repair' },
  { code: 'FM', label: 'Free Maintenance' },
  { code: 'FI', label: 'Free Inspection' },
  { code: 'WAR', label: 'Warranty' },
  { code: 'TC', label: 'Test & Commissioning' },
  { code: 'TRN', label: 'Training' },
  { code: 'EMG', label: 'Emergency Call' },
] as const;

export const TRAVEL_MODE_OPTIONS_V2 = [
  { code: 'OPR_CAR', label: 'Mobil Operational' },
  { code: 'PRIVATE_CAR', label: 'Mobil Pribadi' },
  { code: 'MOTORCYCLE', label: 'Motor' },
  { code: 'RIDE_HAILING', label: 'Taxi / Ride Hailing' },
  { code: 'OTHER', label: 'Lainnya' },
] as const;

export const DAY_SESSION_STATUS_V2 = [
  'not_started',
  'office_checked_in',
  'office_standby',
  'prepare_tools',
  'direct_to_site',
  'active_job',
  'between_jobs',
  'returning_to_office',
  'returned_to_office',
  'day_closed_from_office',
  'day_closed_from_site',
  'auto_closed_with_exception',
] as const;

export const JOB_CYCLE_STATUS_V2 = [
  'planned',
  'unplanned',
  'pending_dispatch_link',
  'on_the_way',
  'site_checked_in',
  'working',
  'paused',
  'pending',
  'finished',
  'cancelled_before_arrival',
  'cancelled_on_site',
  'forced_closed',
] as const;

export const PRIMARY_ACTION_KEYS_V2 = [
  'check_in_office',
  'direct_to_site',
  'open_office_day',
  'end_day_office',
  'start_trip_to_site',
  'resume_trip',
  'open_work_status',
  'open_job_detail',
  'go_to_next_job',
  'open_history',
  'complete_open_work',
] as const;

export type JobTypeCodeV2 = typeof JOB_TYPE_OPTIONS_V2[number]['code'];
export type TravelModeCodeV2 = typeof TRAVEL_MODE_OPTIONS_V2[number]['code'];
export type DaySessionStatusV2 = typeof DAY_SESSION_STATUS_V2[number];
export type JobCycleStatusV2 = typeof JOB_CYCLE_STATUS_V2[number];
export type PrimaryActionKeyV2 = typeof PRIMARY_ACTION_KEYS_V2[number];
