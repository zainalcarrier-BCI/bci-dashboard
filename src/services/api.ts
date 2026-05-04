import { Job, MOCK_JOBS } from '../types';
import { buildTechnicianSimulationHeaders, getTechnicianSimulationNow } from './technician-simulation';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
const ACCESS_TOKEN_KEY = 'bci_access_token';
const REFRESH_TOKEN_KEY = 'bci_refresh_token';
const EMPLOYEE_ID_KEY = 'bci_employee_id';
const SESSION_EXPIRES_AT_KEY = 'bci_session_expires_at';
const APP_TIME_ZONE = 'Asia/Jakarta';

function getAppNow() {
  const employeeId = localStorage.getItem(EMPLOYEE_ID_KEY);
  return getTechnicianSimulationNow(employeeId) ?? new Date();
}

function zonedDateParts(date = new Date(), timeZone = APP_TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    year: values.year,
    month: values.month,
    day: values.day,
  };
}

export function getWorkDateString(date = getAppNow(), timeZone = APP_TIME_ZONE) {
  const { year, month, day } = zonedDateParts(date, timeZone);
  return `${year}-${month}-${day}`;
}

export function getCurrentMonthBounds(date = getAppNow(), timeZone = APP_TIME_ZONE) {
  const { year, month } = zonedDateParts(date, timeZone);
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  return {
    start: `${year}-${month}-01`,
    end: `${year}-${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

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

export interface LoginResponse {
  session: {
    access_token: string;
    refresh_token?: string;
    expires_at: string;
  };
  user: ApiUser;
  landing: 'technician' | 'manager';
}

export interface AuthSessionResponse {
  user: ApiUser;
  landing: 'technician' | 'manager';
}

export interface ApiTechnician {
  id: string;
  user_id: string;
  branch_id?: string;
  team_id?: string;
  branch: string;
  region: string;
  team: string;
  level: string;
  active_date: string;
  kpi_effective_start: string;
  skill_tags: string[];
  user?: ApiUser;
}

export interface ApiJob {
  id: string;
  job_no: string;
  visit_no: number;
  so_status: string;
  so_number: string | null;
  customer: string;
  site: string;
  area: string;
  site_latitude?: number | null;
  site_longitude?: number | null;
  site_radius_meters?: number | null;
  site_maps_url?: string | null;
  job_type: string;
  priority: string;
  brand: string | null;
  product_category: string | null;
  equipment_name: string | null;
  scheduled_start_at: string;
  scheduled_end_at: string | null;
  status: string;
  dispatch_note: string;
}

export interface TechnicianUnplannedJobPayload {
  customer: string;
  site: string;
  area?: string;
  job_type: string;
  priority: 'normal' | 'high' | 'emergency';
  note?: string;
  start_mode: 'direct_to_site' | 'from_office';
  equipment_name?: string;
  product_category?: string;
  brand?: string;
}

export interface ManagerJobTechnician {
  id: string;
  employee_id: string;
  full_name: string;
  level: string;
  team: string;
  assignment_role: string;
}

export interface ManagerJobTimelineEvent {
  id: string;
  job_id: string;
  technician_id: string;
  technician_name: string;
  technician_employee_id?: string;
  event_type: string;
  server_timestamp: string;
  note: string | null;
  reason: string | null;
  geofence_status: string | null;
  distance_meters: number | null;
  latitude: number | null;
  longitude: number | null;
  accuracy_meters: number | null;
}

export interface ManagerJobDetail extends ApiJob {
  team_id?: string | null;
  team?: string;
  branch?: string;
  lead_technician_id?: string | null;
  support_technician_ids?: string[];
  assigned_technicians: ManagerJobTechnician[];
  operational_summary?: ManagerJobOperationalSummaryRow[];
  timeline: ManagerJobTimelineEvent[];
  latest_event: ManagerJobTimelineEvent | null;
  service_reports?: ApiServiceReport[];
}

export interface ManagerJobOperationalSummaryRow {
  technician_id: string;
  technician_name: string;
  technician_employee_id: string;
  office_check_in_at: string | null;
  office_check_out_at: string | null;
  trip_start_at: string | null;
  site_check_in_at: string | null;
  work_started_at: string | null;
  finish_work_at: string | null;
  site_check_out_at: string | null;
  travel_minutes: number;
  work_minutes: number;
  last_status: string;
}

export interface ManagerKpiReport {
  summary: {
    period_start: string;
    period_end: string;
    active_technicians: number;
    total_jobs: number;
    completed_jobs: number;
    working_jobs: number;
    so_pending_jobs: number;
    gps_exceptions: number;
    submission_rate: number;
    attendance_valid_rate: number;
    on_time_rate: number;
    overtime_hours: number;
    overtime_amount: number;
    average_score: number;
  };
  technicians: Array<{
    technician_id: string;
    employee_id: string;
    full_name: string;
    level: string;
    team_id: string;
    team: string;
    active_date: string;
    kpi_effective_start: string;
    kpi_days: number;
    assigned_jobs: number;
    completed_jobs: number;
    pending_jobs: number;
    so_pending_jobs: number;
    submitted_jobs: number;
    submission_rate: number;
    on_time_rate: number;
    attendance_rate: number;
    gps_exceptions: number;
    overtime_hours: number;
    overtime_amount: number;
    score: number;
  }>;
  teams: Array<{
    team_id: string;
    team_name: string;
    technician_count: number;
    total_jobs: number;
    completed_jobs: number;
    so_pending_jobs: number;
    submission_rate: number;
    attendance_rate: number;
    gps_exceptions: number;
    overtime_hours: number;
    average_score: number;
  }>;
}

export interface ManagerOfficeLocation {
  id: string;
  branch_id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
  is_active: boolean;
  address: string | null;
  maps_url: string | null;
  coordinate_source: string;
  verification_status: string;
  verified_at: string | null;
  branch?: {
    id: string;
    name: string;
    city: string;
  };
}

export interface ManagerSiteLocation {
  id: string;
  customer_id: string;
  name: string;
  address: string | null;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  radius_meters: number;
  maps_url: string | null;
  coordinate_source: string;
  verification_status: string;
  verified_at: string | null;
  customer?: {
    id: string;
    name: string;
    segment: string | null;
  };
}

export interface ManagerLocationCaptureRequest {
  id: string;
  target_type: string;
  site_id: string | null;
  office_location_id: string | null;
  job_id: string | null;
  technician_id: string;
  captured_at: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  distance_meters: number | null;
  suggested_radius_meters: number;
  maps_url: string | null;
  status: string;
  review_note: string | null;
  site?: {
    id: string;
    name: string;
    area: string | null;
    customer?: {
      name: string;
    };
  } | null;
  office_location?: {
    id: string;
    name: string;
  } | null;
  technician?: {
    id: string;
    team_id: string;
    user?: {
      full_name: string;
      employee_id: string;
    };
  } | null;
}

export interface ManagerLocationsPayload {
  offices: ManagerOfficeLocation[];
  sites: ManagerSiteLocation[];
  capture_requests: ManagerLocationCaptureRequest[];
}

export interface ManagerGpsExceptionRow {
  id: string;
  source: string;
  event_at: string;
  status: string;
  distance_meters: number | null;
  accuracy_meters: number | null;
  reason: string | null;
  technician_name: string;
  location_name: string | null;
  job_id: string | null;
  technician_id: string;
}

export interface ManagerAccessUser extends ApiUser {
  has_technician_profile: boolean;
  operational_position?: string | null;
  branch_name?: string | null;
  region_name?: string | null;
  team_name?: string | null;
  direct_supervisor_name?: string | null;
  direct_supervisor_role?: string | null;
  reporting_line?: Array<{
    role: string;
    name: string;
    employee_id?: string | null;
  }>;
  team_scope: Array<{
    id: string;
    name: string;
    role_level: string;
    region_name?: string | null;
    branch_name?: string | null;
  }>;
}

export interface TodayPayload {
  work_date: string;
  user: ApiUser;
  technician: ApiTechnician;
  operational_context?: OperationalContext;
  day_session: {
    id: string;
    technician_id: string;
    work_date: string;
    day_mode: string;
    planned_first_job_id: string | null;
    day_started_at: string;
    day_closed_at?: string | null;
    note: string;
  } | null;
  today_mode: string;
  jobs: ApiJob[];
  notifications_unread_count: number;
  team_line: Array<{ role: string; name: string }>;
  leave_request_today?: ApiLeaveRequest | null;
  active_office_location?: ManagerOfficeLocation | null;
  office_check_in_today?: {
    id: string;
    technician_id: string;
    office_location_id: string | null;
    event_type: string;
    server_timestamp: string;
    latitude: number | null;
    longitude: number | null;
    accuracy_meters: number | null;
    distance_meters: number | null;
    geofence_status: string | null;
    note: string | null;
  } | null;
}

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read_at: string | null;
  target_type?: string | null;
  target_id?: string | null;
}

export interface ApiLeaveRequest {
  id: string;
  technician_id: string;
  user_id: string;
  team_id: string;
  leave_type: 'annual_leave' | 'sick_leave';
  start_date: string;
  end_date: string;
  total_days: number;
  reason: string;
  medical_note?: string | null;
  status: 'submitted' | 'approved' | 'rejected' | 'cancelled';
  submitted_at: string;
  approved_at?: string | null;
  approved_by?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
  rejection_note?: string | null;
  cancelled_at?: string | null;
  cancelled_by?: string | null;
  created_at?: string;
  updated_at?: string;
  technician_name?: string;
  technician_employee_id?: string;
  team_name?: string;
}

export interface TechnicianLeaveSummary {
  annual_entitlement_days: number;
  annual_used_days: number;
  annual_pending_days: number;
  annual_remaining_days: number;
  sick_days: number;
  pending_requests: number;
  today_request: ApiLeaveRequest | null;
}

export interface TechnicianProfileSummary {
  period_start: string;
  period_end: string;
  user: ApiUser;
  technician: ApiTechnician;
  team_line: Array<{ role: string; name: string }>;
  kpi: {
    kpi_effective_start: string;
    kpi_days: number;
    assigned_jobs: number;
    completed_jobs: number;
    pending_jobs: number;
    so_pending_jobs: number;
    submitted_jobs: number;
    submission_rate: number;
    on_time_rate: number;
    attendance_rate: number;
    gps_exceptions: number;
    overtime_hours: number;
    overtime_amount: number;
    score: number;
  };
  leave: TechnicianLeaveSummary;
  recent_leave_requests: ApiLeaveRequest[];
}

export interface TechnicianProfilePayload {
  user: ApiUser;
  technician: ApiTechnician;
  team_line: Array<{ role: string; name: string }>;
}

export interface ApiServiceReport {
  id: string;
  job_id: string;
  technician_id: string;
  user_id: string;
  final_status: string;
  closing_note: string;
  work_performed: string;
  findings: string;
  recommendation?: string | null;
  customer_contact?: string | null;
  parts_used: string[];
  submitted_at: string;
}

export interface ApiManualDocument {
  id: string;
  title: string;
  document_type: string;
  brand: string;
  product_line: string;
  model_keyword: string | null;
  version: string;
  file_url: string;
  is_active: boolean;
  uploaded_at?: string;
}

export interface OperationalExceptionItem {
  code: string;
  label: string;
  severity: 'high' | 'medium' | 'low';
}

export interface OperationalContext {
  day_type: string;
  day_type_label: string;
  holiday_name: string | null;
  calendar_source: string;
  overtime_policy: string;
  overtime_policy_label: string;
  travel_rule_label: string;
  office_attendance_submitted: boolean;
  active_job_count: number;
  completed_job_count: number;
  multi_job_day: boolean;
  status_source: string;
  open_exceptions: OperationalExceptionItem[];
}

export interface ApiOvertimeRow {
  id: string;
  job_id: string;
  job_no: string;
  technician_id: string;
  technician_name: string;
  customer: string;
  site: string;
  visit_no: number;
  so_number: string | null;
  job_type: string;
  area: string;
  equipment_name: string | null;
  overtime_date: string;
  overtime_start_at: string;
  overtime_end_at: string;
  calculated_duration_minutes: number;
  day_type: string;
  ov1_hours: number;
  ov2_hours: number;
  ov3_hours: number;
  ov4_hours: number;
  total_overtime_value: number;
  rate_per_hour_snapshot: number;
  rate_salary_snapshot: number;
  nominal_overtime: number;
  meal_allowance: number;
  total_amount: number;
  status: string;
}

export interface ManagerLiveStatusRow {
  technician: ApiTechnician;
  user: ApiUser;
  active_job: ApiJob | null;
  current_status: string;
  operational_context?: OperationalContext;
  latest_event: {
    id: string;
    job_id: string;
    technician_id: string;
    event_type: string;
    server_timestamp: string;
    note: string | null;
    geofence_status?: string | null;
    distance_meters?: number | null;
    latitude?: number | null;
    longitude?: number | null;
    accuracy_meters?: number | null;
  } | null;
  map_position?: {
    latitude: number;
    longitude: number;
    label: string;
    source: string;
    status: string;
    job_no: string | null;
    site: string | null;
    distance_meters: number | null;
    accuracy_meters: number | null;
    geofence_status: string | null;
  } | null;
}

export interface ManagerDailyOperationRow {
  technician_id: string;
  technician_name: string;
  technician_employee_id: string;
  team: string;
  branch: string;
  current_status: string;
  day_type_label: string;
  open_item_count: number;
  job_id: string | null;
  job_no: string | null;
  customer: string | null;
  site: string | null;
  job_type: string | null;
  so_status: string | null;
  office_check_in_at: string | null;
  office_check_out_at: string | null;
  trip_start_at: string | null;
  site_check_in_at: string | null;
  work_started_at: string | null;
  finish_work_at: string | null;
  site_check_out_at: string | null;
  travel_minutes: number;
  work_minutes: number;
  last_status: string;
}

export interface ManagerLeaveRequestRow extends ApiLeaveRequest {
  technician_name: string;
  technician_employee_id: string;
  team_name: string;
  impacted_jobs?: Array<{
    id: string;
    job_no: string;
    customer: string;
    site: string;
    scheduled_start_at: string;
    status: string;
  }>;
}

export interface ManagerAnomalyRow {
  id: string;
  anomaly_type: string;
  severity: 'high' | 'medium' | 'low';
  technician_name: string;
  technician_employee_id: string;
  team_name: string;
  job_no?: string | null;
  summary: string;
  event_at: string;
  detail?: string | null;
}

export interface AuditLogRow {
  id: string;
  actor_user_id?: string | null;
  actor_type: string;
  actor_role?: string | null;
  entity_type: string;
  entity_id?: string | null;
  action: string;
  summary: string;
  metadata: Record<string, unknown>;
  created_at: string;
  actor_name?: string | null;
}

export interface TechnicianHistoryRow extends ApiJob {
  assignment_status: string | null;
  completed_at: string | null;
  latest_event: {
    id: string;
    job_id: string;
    event_type: string;
    server_timestamp: string;
    note: string | null;
    geofence_status: string | null;
    distance_meters: number | null;
    accuracy_meters: number | null;
  } | null;
  timeline: Array<{
    id: string;
    job_id: string;
    event_type: string;
    server_timestamp: string;
    note: string | null;
    geofence_status: string | null;
    distance_meters: number | null;
    accuracy_meters: number | null;
  }>;
  overtime_request: {
    id: string;
    job_id: string;
    status: string;
    calculated_duration_minutes: number;
    total_amount: number;
    created_at: string;
  } | null;
}

export interface ManagerTeam {
  id: string;
  name: string;
  region?: {
    id: string;
    name: string;
    branch_id: string;
  };
}

export interface ManagerBranch {
  id: string;
  name: string;
  city: string;
  timezone: string;
}

export interface ManagerRegion {
  id: string;
  name: string;
  branch_id: string;
}

export interface ManagerMasterData {
  branches: ManagerBranch[];
  regions?: ManagerRegion[];
  teams: ManagerTeam[];
  technicians: ApiTechnician[];
}

export interface GpsEvidencePayload {
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  exception_reason?: string;
  note?: string;
  capture_as_site_location?: boolean;
  suggested_radius_meters?: number;
}

export interface CheckOutResponse {
  event_id: string;
  job_id: string;
  check_out_time: string;
  overtime_required: boolean;
  day_type?: string;
  day_type_label?: string;
  holiday_name?: string | null;
  overtime_policy?: string;
  overtime_policy_label?: string;
  overtime_reason?: string;
  normal_end_time: string;
  calculated_duration_minutes: number;
  note: string;
}

type EvidenceOwnerType = 'attendance_event' | 'job_event' | 'overtime_request' | 'overtime_print_batch';
type EvidenceFileType = 'selfie' | 'site_photo' | 'closing_photo' | 'overtime_evidence' | 'overtime_pdf';

interface ApiRequestOptions extends RequestInit {
  auth?: boolean;
}

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(message: string, status: number, detail?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.detail = detail;
  }
}

function clearStoredSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EMPLOYEE_ID_KEY);
  localStorage.removeItem(SESSION_EXPIRES_AT_KEY);
}

function sessionExpired(expiresAt?: string | null) {
  if (!expiresAt) return false;
  const timestamp = new Date(expiresAt).getTime();
  if (!Number.isFinite(timestamp)) return true;
  return timestamp <= Date.now();
}

function readStoredSession(options: { allowExpired?: boolean } = {}) {
  const { allowExpired = false } = options;
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
  const employeeId = localStorage.getItem(EMPLOYEE_ID_KEY);
  const expiresAt = localStorage.getItem(SESSION_EXPIRES_AT_KEY);
  if (!accessToken || !employeeId) return null;
  if (!allowExpired && sessionExpired(expiresAt)) {
    return null;
  }
  return {
    accessToken,
    refreshToken,
    employeeId,
    expiresAt,
  };
}

function storeSession(response: LoginResponse) {
  localStorage.setItem(ACCESS_TOKEN_KEY, response.session.access_token);
  if (response.session.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, response.session.refresh_token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
  localStorage.setItem(EMPLOYEE_ID_KEY, response.user.employee_id);
  localStorage.setItem(SESSION_EXPIRES_AT_KEY, response.session.expires_at);
}

let refreshRequest: Promise<LoginResponse | null> | null = null;

async function refreshStoredSession(): Promise<LoginResponse | null> {
  const session = readStoredSession({ allowExpired: true });
  if (!session?.refreshToken) {
    clearStoredSession();
    return null;
  }
  if (!refreshRequest) {
    refreshRequest = (async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refresh_token: session.refreshToken }),
        });
        if (!response.ok) {
          clearStoredSession();
          return null;
        }
        const payload = (await response.json()) as LoginResponse;
        storeSession(payload);
        return payload;
      } catch {
        clearStoredSession();
        return null;
      } finally {
        refreshRequest = null;
      }
    })();
  }
  return refreshRequest;
}

async function request<T>(path: string, options: ApiRequestOptions = {}, retryAuth = true): Promise<T> {
  const { auth = true, headers, ...fetchOptions } = options;
  let session = readStoredSession();
  if (auth && !session) {
    await refreshStoredSession();
    session = readStoredSession();
  }
  if (auth && !session) {
    throw new ApiError('Session missing or expired', 401, path);
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(auth && session?.accessToken ? { Authorization: `Bearer ${session.accessToken}` } : {}),
      ...(auth && session?.employeeId ? { 'X-Employee-Id': session.employeeId } : {}),
      ...(auth ? buildTechnicianSimulationHeaders(session?.employeeId) : {}),
      ...headers,
    },
    ...fetchOptions,
  });

  if (!response.ok) {
    let detail = '';
    try {
      const payload = await response.json();
      detail = payload?.detail || payload?.error || '';
    } catch {
      detail = response.statusText;
    }
    if (auth && response.status === 401 && retryAuth && path !== '/auth/refresh') {
      const refreshed = await refreshStoredSession();
      if (refreshed) {
        return request<T>(path, options, false);
      }
    }
    if (auth && response.status === 401) {
      clearStoredSession();
    }
    throw new ApiError(`API request failed: ${response.status} ${path}`, response.status, detail);
  }

  return response.json() as Promise<T>;
}

export function apiJobToJob(job: ApiJob): Job {
  const time = new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(job.scheduled_start_at));
  const completedStatuses = new Set(['checked_out', 'completed', 'cancelled']);
  const status = completedStatuses.has(job.status)
    ? 'COMPLETED'
    : job.status === 'on_the_way'
      ? 'EN ROUTE'
      : job.status === 'working' || job.status === 'on_site' || job.status === 'closing_submitted'
        ? 'WORKING'
        : job.status === 'pending' || job.status === 'paused'
          ? 'PENDING'
          : 'ASSIGNED';

  return {
    apiId: job.id,
    id: job.job_no,
    customer: job.customer,
    site: job.site,
    type: job.job_type.replaceAll('_', ' '),
    status,
    time,
    priority: job.priority === 'emergency' || job.priority === 'urgent' ? 'IMMEDIATE' : 'NORMAL',
    issue: job.dispatch_note,
    model: job.product_category ?? undefined,
    equipment: job.equipment_name ?? undefined,
    soStatus: job.so_status,
    soNumber: job.so_number,
    visitNo: job.visit_no,
    area: job.area,
    brand: job.brand,
    scheduledStartAt: job.scheduled_start_at,
    scheduledEndAt: job.scheduled_end_at,
  };
}

export async function getToday(): Promise<TodayPayload> {
  return request<TodayPayload>('/technician/today');
}

export async function getTechnicianProfileSummary(periodStart = getCurrentMonthBounds().start, periodEnd = getCurrentMonthBounds().end) {
  const params = new URLSearchParams({ period_start: periodStart, period_end: periodEnd });
  return request<TechnicianProfileSummary>(`/technician/profile-summary?${params.toString()}`);
}

export async function getTechnicianLeaveRequests() {
  return request<{ summary: TechnicianLeaveSummary; rows: ApiLeaveRequest[] }>('/technician/leave-requests');
}

export async function submitTechnicianLeaveRequest(payload: {
  leave_type: 'annual_leave' | 'sick_leave';
  start_date: string;
  end_date: string;
  reason: string;
  medical_note?: string;
}) {
  return request<ApiLeaveRequest>('/technician/leave-requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTechnicianHistory(limit = 30) {
  return request<{ rows: TechnicianHistoryRow[] }>(`/technician/history?limit=${limit}`);
}

export async function login(employeeId: string, password: string): Promise<LoginResponse> {
  const response = await request<LoginResponse>('/auth/login', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ employee_id: employeeId.trim(), password }),
  });
  storeSession(response);
  return response;
}

export async function requestPasswordReset(employeeId: string) {
  return request<{ ok: boolean; message: string }>('/auth/forgot-password', {
    auth: false,
    method: 'POST',
    body: JSON.stringify({ employee_id: employeeId.trim() }),
  });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  return request<{ user: ApiUser; landing: 'technician' | 'manager' }>('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  });
}

export async function getAuthSession() {
  return request<AuthSessionResponse>('/auth/session');
}

export function hasStoredSession() {
  return Boolean(readStoredSession({ allowExpired: true }));
}

export async function getNotifications() {
  return request<{ rows: ApiNotification[] }>('/notifications');
}

export async function markNotificationRead(notificationId: string) {
  return request<ApiNotification>(`/notifications/${notificationId}/read`, {
    method: 'PATCH',
  });
}

export async function markAllNotificationsRead() {
  return request<{ rows: ApiNotification[]; read_at: string; count: number }>('/notifications/read-all', {
    method: 'PATCH',
  });
}

export async function getManualDocuments(query = '') {
  const search = query ? `?q=${encodeURIComponent(query)}` : '';
  return request<{ rows: ApiManualDocument[] }>(`/manual-documents${search}`);
}

export async function getManualDocumentUrl(documentId: string) {
  return request<{ url: string; expires_in: number | null }>(`/manual-documents/${documentId}/signed-url`);
}

export async function getPrintableOvertime(periodStart = getCurrentMonthBounds().start, periodEnd = getCurrentMonthBounds().end) {
  const params = new URLSearchParams({ period_start: periodStart, period_end: periodEnd });
  return request<{ period_start: string; period_end: string; technician_name: string; technician_id: string; rows: ApiOvertimeRow[] }>(`/overtime-requests/printable?${params.toString()}`);
}

export async function createOvertimePrintBatch(payload: {
  period_start: string;
  period_end: string;
  overtime_request_ids: string[];
}) {
  return request<{ batch: { id: string; total_rows: number; grand_total: number }; items: unknown[] }>('/overtime-requests/print-batches', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createDaySession(dayMode: string, plannedFirstJobId?: string | null) {
  return request('/technician/day-sessions', {
    method: 'POST',
    body: JSON.stringify({
      work_date: getWorkDateString(),
      day_mode: dayMode,
      planned_first_job_id: plannedFirstJobId ?? null,
    }),
  });
}

export async function createTechnicianUnplannedJob(payload: TechnicianUnplannedJobPayload) {
  return request<ApiJob>('/jobs/unplanned', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getTechnicianProfile() {
  return request<TechnicianProfilePayload>('/technician/profile');
}

export async function updateTechnicianProfile(payload: {
  phone?: string | null;
  emergency_contact_name?: string | null;
  emergency_contact_phone?: string | null;
  avatar_url?: string | null;
}) {
  return request<TechnicianProfilePayload>('/technician/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function requestProfileAvatarUploadUrl(fileName: string) {
  return request<{ bucket: string; path: string; signed_upload_url: string; token: string }>('/technician/profile/avatar-upload-url', {
    method: 'POST',
    body: JSON.stringify({ file_name: fileName }),
  });
}

export async function uploadFileToSignedUrl(signedUploadUrl: string, file: File, contentType = file.type || 'application/octet-stream') {
  const response = await fetch(signedUploadUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
    },
    body: file,
  });
  if (!response.ok) {
    throw new Error(`File upload failed: ${response.status}`);
  }
}

async function uploadEvidenceFile(ownerType: EvidenceOwnerType, ownerId: string, fileType: EvidenceFileType, file: File) {
  const bucket = ownerType === 'attendance_event' ? 'attendance-selfies' : 'job-evidence';
  const upload = await request<{ bucket: string; path: string; signed_upload_url: string; token: string }>('/evidence-files/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      bucket,
      file_name: file.name || `${fileType}.jpg`,
      mime_type: file.type || 'image/jpeg',
    }),
  });
  if (!upload.signed_upload_url.startsWith('data:')) {
    const uploadResponse = await fetch(upload.signed_upload_url, {
      method: 'PUT',
      headers: {
        'Content-Type': file.type || 'image/jpeg',
      },
      body: file,
    });
    if (!uploadResponse.ok) {
      throw new Error(`Evidence upload failed: ${uploadResponse.status}`);
    }
  }
  return request('/evidence-files', {
    method: 'POST',
    body: JSON.stringify({
      owner_type: ownerType,
      owner_id: ownerId,
      file_type: fileType,
      bucket: upload.bucket,
      path: upload.path,
      mime_type: file.type || 'image/jpeg',
      original_file_name: file.name || `${fileType}.jpg`,
    }),
  });
}

export async function submitServiceReport(jobId: string, payload: {
  final_status: string;
  closing_note: string;
  work_performed: string;
  findings: string;
  recommendation?: string;
  customer_contact?: string;
  parts_used?: string[];
}) {
  return request<ApiServiceReport>(`/jobs/${jobId}/service-report`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitOfficeCheckIn(gps?: GpsEvidencePayload, note = 'Office attendance submitted from technician web', selfieFile?: File | null) {
  const event = await request<{ id: string }>('/attendance/office-check-in', {
    method: 'POST',
    body: JSON.stringify({
      latitude: gps?.latitude ?? -6.14691,
      longitude: gps?.longitude ?? 106.84491,
      accuracy_meters: gps?.accuracy_meters ?? 12,
      exception_reason: gps?.exception_reason,
      note,
    }),
  });
  if (selfieFile) {
    await uploadEvidenceFile('attendance_event', event.id, 'selfie', selfieFile);
  }
  return event;
}

export async function submitOfficeArrival(gps?: GpsEvidencePayload, note = 'Returned to office from technician web') {
  return request<{ id: string }>('/attendance/office-arrival', {
    method: 'POST',
    body: JSON.stringify({
      latitude: gps?.latitude ?? -6.14691,
      longitude: gps?.longitude ?? 106.84491,
      accuracy_meters: gps?.accuracy_meters ?? 12,
      exception_reason: gps?.exception_reason,
      note,
    }),
  });
}

export async function submitEndDay(payload: {
  mode: 'office' | 'site';
  note?: string;
  latitude?: number;
  longitude?: number;
  accuracy_meters?: number;
  exception_reason?: string;
}) {
  return request<{ id: string; event_type: string; server_timestamp: string }>('/attendance/end-day', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function submitOnTheWay(jobId: string, directToSite = false) {
  return request(`/jobs/${jobId}/${directToSite ? 'direct-to-site' : 'on-the-way'}`, {
    method: 'POST',
    body: JSON.stringify({
      note: directToSite ? 'Direct to site from technician web' : 'On the way from technician web',
    }),
  });
}

export async function submitWorkEvent(jobId: string, eventType: string, reason?: string, gps?: GpsEvidencePayload, metadata?: Record<string, unknown>, evidenceFile?: File | null) {
  const event = await request<{ id: string }>(`/jobs/${jobId}/work-events`, {
    method: 'POST',
    body: JSON.stringify({
      event_type: eventType,
      reason,
      note: gps?.note ?? reason ?? eventType,
      latitude: gps?.latitude,
      longitude: gps?.longitude,
      accuracy_meters: gps?.accuracy_meters,
      exception_reason: gps?.exception_reason,
      capture_as_site_location: gps?.capture_as_site_location,
      suggested_radius_meters: gps?.suggested_radius_meters,
      metadata,
    }),
  });
  if (evidenceFile) {
    const fileType: EvidenceFileType =
      eventType === 'site_check_in'
        ? 'selfie'
        : eventType === 'work_closing_submitted'
          ? 'closing_photo'
          : 'site_photo';
    await uploadEvidenceFile('job_event', event.id, fileType, evidenceFile);
  }
  return event;
}

export async function submitSiteLocationCapture(jobId: string, gps: GpsEvidencePayload) {
  return request(`/jobs/${jobId}/site-location-captures`, {
    method: 'POST',
    body: JSON.stringify(gps),
  });
}

export async function submitCheckOut(jobId: string) {
  return request<CheckOutResponse>(`/jobs/${jobId}/check-out`, {
    method: 'POST',
    body: JSON.stringify({
      note: 'Check-out submitted from technician web',
    }),
  });
}

export async function submitOvertimeRequest(jobId: string, payload: {
  reason?: string;
  normal_end_time?: string;
  check_out_time?: string;
  calculated_duration_minutes?: number;
} = {}) {
  return request('/overtime-requests', {
    method: 'POST',
    body: JSON.stringify({
      job_id: jobId,
      reason: payload.reason ?? 'Testing setelah repair',
      normal_end_time: payload.normal_end_time,
      check_out_time: payload.check_out_time,
      calculated_duration_minutes: payload.calculated_duration_minutes,
    }),
  });
}

export async function getManagerLiveStatus() {
  return request<{ work_date: string; rows: ManagerLiveStatusRow[] }>('/manager/live-status');
}

export async function getManagerDailyOperations(workDate?: string) {
  const params = workDate ? `?work_date=${encodeURIComponent(workDate)}` : '';
  return request<{ work_date: string; rows: ManagerDailyOperationRow[] }>(`/manager/daily-operations${params}`);
}

export async function getManagerMasterData() {
  return request<ManagerMasterData>('/manager/master-data');
}

export async function getManagerSchedule() {
  return request<{ rows: ApiJob[] }>('/manager/schedule');
}

export async function getManagerJobs() {
  return request<{ rows: ManagerJobDetail[] }>('/manager/jobs');
}

export async function getManagerKpiReport(periodStart = getCurrentMonthBounds().start, periodEnd = getCurrentMonthBounds().end, teamId = '') {
  const params = new URLSearchParams({ period_start: periodStart, period_end: periodEnd });
  if (teamId) params.set('team_id', teamId);
  return request<ManagerKpiReport>(`/manager/reports/kpi?${params.toString()}`);
}

export async function getManagerLocations() {
  return request<ManagerLocationsPayload>('/manager/locations');
}

export async function getManagerGpsExceptions() {
  return request<{ rows: ManagerGpsExceptionRow[] }>('/manager/gps-exceptions');
}

export async function getManagerUsers() {
  return request<{ rows: ManagerAccessUser[] }>('/manager/users');
}

export async function getManagerTechnicians() {
  return request<{ rows: ApiTechnician[] }>('/manager/technicians');
}

export async function getManagerOvertimeRequests() {
  return request<{ rows: ApiOvertimeRow[] }>('/manager/overtime-requests');
}

export async function getManagerLeaveRequests() {
  return request<{ rows: ManagerLeaveRequestRow[] }>('/manager/leave-requests');
}

export async function getManagerAnomalies() {
  return request<{ rows: ManagerAnomalyRow[] }>('/manager/anomalies');
}

export async function getManagerAuditLogs(limit = 50) {
  return request<{ rows: AuditLogRow[] }>(`/manager/audit-logs?limit=${limit}`);
}

export async function createManagerSchedule(payload: {
  customer: string;
  site: string;
  area: string;
  team: string;
  job_type: string;
  priority: string;
  so_status: string;
  so_number?: string | null;
  scheduled_start_at: string;
  scheduled_end_at?: string | null;
  lead_technician_id: string;
  support_technician_ids: string[];
  dispatch_note?: string;
}) {
  return request<ApiJob>('/manager/schedule', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateManagerJobSo(jobId: string, soNumber: string) {
  return request(`/manager/schedule/${jobId}/so`, {
    method: 'PATCH',
    body: JSON.stringify({ so_number: soNumber }),
  });
}

export async function updateManagerJobAssignments(jobId: string, payload: {
  lead_technician_id: string;
  support_technician_ids: string[];
}) {
  return request<{ job: { id: string; job_no: string }; assignments: Array<{ technician_id: string; assignment_role: string; status: string }> }>(`/manager/schedule/${jobId}/assignments`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function createManagerSite(payload: {
  customer: string;
  name: string;
  area?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number;
  maps_url?: string;
}) {
  return request<ManagerSiteLocation>('/manager/sites', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function createManagerOfficeLocation(payload: {
  branch_id: string;
  name: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number;
  maps_url?: string;
  is_active?: boolean;
}) {
  return request<ManagerOfficeLocation>('/manager/offices', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateManagerOfficeLocation(officeId: string, payload: {
  name?: string;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number;
  maps_url?: string;
  is_active?: boolean;
}) {
  return request<ManagerOfficeLocation>(`/manager/offices/${officeId}/location`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateManagerSiteLocation(siteId: string, payload: {
  latitude?: number | null;
  longitude?: number | null;
  radius_meters?: number;
  maps_url?: string;
}) {
  return request<ManagerSiteLocation>(`/manager/sites/${siteId}/location`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function updateManagerUserStatus(userId: string, status: 'active' | 'inactive' | 'suspended') {
  return request<{ user: ApiUser }>(`/manager/users/${userId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export async function resetManagerUserPassword(userId: string, temporaryPassword = 'Password') {
  return request<{ user: ApiUser; temporary_password: string }>(`/manager/users/${userId}/reset-password`, {
    method: 'POST',
    body: JSON.stringify({ temporary_password: temporaryPassword }),
  });
}

export async function updateManagerUserTeamScope(userId: string, teamIds: string[]) {
  return request<{ user_id: string; role: string; team_assignments: Array<{ team_id: string; role_level: string }> }>(`/manager/users/${userId}/team-scope`, {
    method: 'PATCH',
    body: JSON.stringify({ team_ids: teamIds }),
  });
}

export async function resetManagerPilotData(employeeId: string, workDate = getWorkDateString()) {
  return request<{
    ok: boolean;
    employee_id: string;
    technician_id: string;
    work_date: string;
    deleted: {
      day_sessions: number;
      attendance_events: number;
      job_events: number;
    };
  }>('/manager/pilot-reset', {
    method: 'POST',
    body: JSON.stringify({ employee_id: employeeId, work_date: workDate }),
  });
}

export async function createManagerUser(payload: {
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  temporary_password?: string;
  team_ids?: string[];
  team?: string;
  level?: string;
  skill_tags?: string[];
  join_date?: string;
  active_date?: string;
}) {
  return request<{ user: ApiUser; technician?: ApiTechnician; team_assignments?: unknown[]; temporary_password: string }>('/manager/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function approveManagerOvertime(requestId: string, decisionNote = 'Approved from manager dashboard') {
  return request<ApiOvertimeRow>(`/manager/overtime-requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ decision_note: decisionNote }),
  });
}

export async function rejectManagerOvertime(requestId: string, decisionNote = 'Rejected from manager dashboard') {
  return request<ApiOvertimeRow>(`/manager/overtime-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ decision_note: decisionNote }),
  });
}

export async function approveManagerLeaveRequest(requestId: string, decisionNote = 'Approved from manager dashboard') {
  return request<ApiLeaveRequest>(`/manager/leave-requests/${requestId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ decision_note: decisionNote }),
  });
}

export async function rejectManagerLeaveRequest(requestId: string, decisionNote = 'Rejected from manager dashboard') {
  return request<ApiLeaveRequest>(`/manager/leave-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ decision_note: decisionNote }),
  });
}

export async function approveManagerLocationCapture(captureId: string, radiusMeters: number, reviewNote = 'Approved as official GPS point') {
  return request<ManagerLocationCaptureRequest>(`/manager/location-captures/${captureId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ radius_meters: radiusMeters, review_note: reviewNote }),
  });
}

export async function rejectManagerLocationCapture(captureId: string, reviewNote = 'Rejected from manager dashboard') {
  return request<ManagerLocationCaptureRequest>(`/manager/location-captures/${captureId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ review_note: reviewNote }),
  });
}

export async function requestManualUploadUrl(payload: { file_name: string; brand: string; product_line: string }) {
  return request<{ bucket: string; path: string; signed_upload_url: string; token: string }>('/manager/manual-documents/upload-url', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function uploadManualPdfToSignedUrl(signedUploadUrl: string, file: File) {
  await uploadFileToSignedUrl(signedUploadUrl, file, file.type || 'application/pdf');
}

export async function createManualDocument(payload: {
  title: string;
  document_type: string;
  brand: string;
  product_line: string;
  model_keyword?: string;
  version: string;
  file_url: string;
}) {
  return request<ApiManualDocument>('/manager/manual-documents', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function deleteManagerManualDocument(documentId: string) {
  return request<{ ok: boolean; document_id: string; title: string; is_active: boolean; storage_deleted: boolean }>(`/manager/manual-documents/${documentId}`, {
    method: 'DELETE',
  });
}

export async function runManagerDummyDataCleanup(payload: {
  employee_id: string;
  work_date: string;
  categories: Array<'activity_today' | 'notifications' | 'overtime' | 'leave'>;
}) {
  return request<{
    ok: boolean;
    employee_id: string;
    technician_id: string;
    work_date: string;
    categories: string[];
    deleted: {
      day_sessions: number;
      attendance_events: number;
      job_events: number;
      notifications: number;
      overtime_requests: number;
      overtime_print_batches: number;
      leave_requests: number;
      approvals: number;
      evidence_files: number;
    };
  }>('/manager/dummy-data-cleanup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function logout(scope: 'local' | 'global' = 'local') {
  try {
    const session = readStoredSession({ allowExpired: true });
    if (session?.accessToken) {
      await request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refresh_token: session.refreshToken, scope }),
      }, false);
    }
  } catch {
    // Local logout must always complete even if the server-side session is already gone.
  } finally {
    clearStoredSession();
  }
}

export function fallbackJobs() {
  return MOCK_JOBS;
}
