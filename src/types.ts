export type Screen = 
  | 'login'
  | 'change-password'
  | 'manager-dashboard'
  | 'home'
  | 'calendar'
  | 'profile'
  | 'history'
  | 'notifications'
  | 'manual-book'
  | 'leave-request'
  | 'print-overtime'
  | 'unplanned-job'
  | 'office-day'
  | 'job-detail'
  | 'on-the-way'
  | 'check-in'
  | 'work-status'
  | 'work-closing'
  | 'check-out'
  | 'overtime-request';

export type TodayMode =
  | 'Not Started'
  | 'Office / Standby'
  | 'Prepare Tools'
  | 'Office Check-in Submitted'
  | 'Direct To Site'
  | 'On The Way'
  | 'On Site'
  | 'Working'
  | 'Paused'
  | 'Pending'
  | 'Completed'
  | 'Annual Leave'
  | 'Sick Leave';

export interface ApiUser {
  id: string;
  employee_id: string;
  full_name: string;
  role: string;
  email?: string;
  phone?: string | null;
  avatar_url?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  must_change_password?: boolean;
  status?: string;
}

export interface TodayPayload {
  work_date: string;
  today_mode: string;
  office_check_in_today?: boolean;
  leave_request_today?: {
    status: string;
    leave_type: string;
  };
  user: ApiUser;
  technician: {
    team: string;
    region: string;
    branch: string;
  };
  operational_context?: {
    open_exceptions?: Array<{ label: string }>;
  };
  notifications_unread_count?: number;
}

export interface Job {
  apiId: string;
  id: string;
  customer: string;
  site: string;
  type: string;
  status: 'ASSIGNED' | 'EN ROUTE' | 'WORKING' | 'PENDING' | 'COMPLETED';
  time: string;
  priority: 'IMMEDIATE' | 'NORMAL';
  issue?: string;
  model?: string;
  equipment?: string;
  soStatus?: string;
  soNumber?: string | null;
  visitNo?: number;
  area?: string;
  brand?: string | null;
  scheduledStartAt?: string;
  scheduledEndAt?: string | null;
}

export const MOCK_JOBS: Job[] = [
  {
    apiId: '88888888-8888-8888-8888-888888888801',
    id: 'JC-2024-001',
    customer: 'Bank Mandiri',
    site: 'Sudirman Office, Tower B',
    type: 'Service Agreement',
    status: 'ASSIGNED',
    time: '09:00 AM',
    priority: 'IMMEDIATE',
    issue: 'Chiller High Pressure Trip',
    model: 'Carrier 30XA',
    equipment: 'HVAC'
  },
  {
    apiId: '88888888-8888-8888-8888-888888888802',
    id: 'JC-2024-002',
    customer: 'Telkomsel Smart Office',
    site: 'Gatot Subroto - Data Center',
    type: 'Repair',
    status: 'ASSIGNED',
    time: '01:30 PM',
    priority: 'NORMAL'
  },
  {
    apiId: '88888888-8888-8888-8888-888888888803',
    id: 'JC-2024-003',
    customer: 'Gojek HQ',
    site: 'Pasaraya Blok M - Server Room',
    type: 'Installation',
    status: 'EN ROUTE',
    time: '03:00 PM',
    priority: 'NORMAL'
  }
];
