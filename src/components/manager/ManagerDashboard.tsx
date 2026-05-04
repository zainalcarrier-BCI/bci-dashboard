import { Suspense, lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { AlertCircle, Bell, CircleHelp, LogOut, RefreshCw, Search, UserCircle } from 'lucide-react';
import {
  ApiJob,
  ApiManualDocument,
  ApiNotification,
  ApiOvertimeRow,
  ApiTechnician,
  ApiUser,
  AuditLogRow,
  ManagerAccessUser,
  ManagerAnomalyRow,
  ManagerDailyOperationRow,
  ManagerGpsExceptionRow,
  ManagerJobDetail,
  ManagerKpiReport,
  ManagerLeaveRequestRow,
  ManagerLiveStatusRow,
  ManagerLocationCaptureRequest,
  ManagerLocationsPayload,
  ManagerMasterData,
  ManagerSiteLocation,
  approveManagerLeaveRequest,
  approveManagerLocationCapture,
  approveManagerOvertime,
  createManagerOfficeLocation,
  createManagerSchedule,
  createManagerSite,
  createManagerUser,
  createManualDocument,
  deleteManagerManualDocument,
  getCurrentMonthBounds,
  getManualDocumentUrl,
  getManualDocuments,
  getNotifications,
  getManagerAnomalies,
  getManagerAuditLogs,
  getManagerDailyOperations,
  getManagerGpsExceptions,
  getManagerJobs,
  getManagerKpiReport,
  getManagerLeaveRequests,
  getManagerLiveStatus,
  getManagerLocations,
  getManagerMasterData,
  getManagerOvertimeRequests,
  getManagerSchedule,
  getManagerTechnicians,
  getManagerUsers,
  rejectManagerLeaveRequest,
  rejectManagerLocationCapture,
  rejectManagerOvertime,
  resetManagerPilotData,
  resetManagerUserPassword,
  runManagerDummyDataCleanup,
  requestManualUploadUrl,
  uploadManualPdfToSignedUrl,
  updateManagerOfficeLocation,
  updateManagerJobSo,
  updateManagerSiteLocation,
  updateManagerUserStatus,
  updateManagerUserTeamScope,
  getWorkDateString,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/api';
import {
  ManagerDashboardContext,
  type ConfirmActionState,
  type DispatchForm,
  type ManagerUserForm,
  type ManualForm,
  type OfficeForm,
  type OfficeGpsForm,
  type SiteForm,
  type SiteGpsForm,
  type SoModalState,
  type TechnicianUserForm,
} from './manager-context';
import { Detail, Field, InlineError, Modal, TabLoadingState, date, emailPattern, inputClass, isBlank, rupiah, tabs, title, type ManagerTab } from './shared';

const tabLoaders = {
  live: () => import('./tabs/LiveStatusTab'),
  schedule: () => import('./tabs/SchedulingTab'),
  jobs: () => import('./tabs/JobsTab'),
  reports: () => import('./tabs/ReportsTab'),
  locations: () => import('./tabs/LocationsTab'),
  anomalies: () => import('./tabs/AnomaliesTab'),
  technicians: () => import('./tabs/TechniciansTab'),
  overtime: () => import('./tabs/OvertimeTab'),
  leave: () => import('./tabs/LeaveTab'),
  manuals: () => import('./tabs/ManualsTab'),
  audit: () => import('./tabs/AuditTab'),
  users: () => import('./tabs/UsersTab'),
};

const tabComponents = {
  live: lazy(tabLoaders.live),
  schedule: lazy(tabLoaders.schedule),
  jobs: lazy(tabLoaders.jobs),
  reports: lazy(tabLoaders.reports),
  locations: lazy(tabLoaders.locations),
  anomalies: lazy(tabLoaders.anomalies),
  technicians: lazy(tabLoaders.technicians),
  overtime: lazy(tabLoaders.overtime),
  leave: lazy(tabLoaders.leave),
  manuals: lazy(tabLoaders.manuals),
  audit: lazy(tabLoaders.audit),
  users: lazy(tabLoaders.users),
};

interface ManagerDashboardProps {
  user: ApiUser;
  onLogout: () => void;
}

const operationalRoles = ['engineer', 'product_specialist', 'assistant_manager', 'manager', 'senior_manager', 'admin'];
const globalUserRoles = ['assistant_manager', 'manager', 'senior_manager', 'admin'];
const manualUploadRoles = ['product_specialist', 'assistant_manager', 'manager', 'senior_manager', 'admin'];
const currentMonth = getCurrentMonthBounds();
const defaultWorkDate = getWorkDateString();
const nextHourIso = () => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + 1);
  return start.toISOString().slice(0, 16);
};
const plusHoursIso = (hours: number) => {
  const start = new Date();
  start.setMinutes(0, 0, 0);
  start.setHours(start.getHours() + hours);
  return start.toISOString().slice(0, 16);
};

export default function ManagerDashboard({ user, onLogout }: ManagerDashboardProps) {
  const [activeTab, setActiveTab] = useState<ManagerTab>('live');
  const [liveRows, setLiveRows] = useState<ManagerLiveStatusRow[]>([]);
  const [dailyOperationRows, setDailyOperationRows] = useState<ManagerDailyOperationRow[]>([]);
  const [scheduleRows, setScheduleRows] = useState<ApiJob[]>([]);
  const [jobRows, setJobRows] = useState<ManagerJobDetail[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [report, setReport] = useState<ManagerKpiReport | null>(null);
  const [locations, setLocations] = useState<ManagerLocationsPayload | null>(null);
  const [gpsExceptions, setGpsExceptions] = useState<ManagerGpsExceptionRow[]>([]);
  const [anomalyRows, setAnomalyRows] = useState<ManagerAnomalyRow[]>([]);
  const [auditRows, setAuditRows] = useState<AuditLogRow[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [accessUsers, setAccessUsers] = useState<ManagerAccessUser[]>([]);
  const [selectedAccessUserId, setSelectedAccessUserId] = useState('');
  const [manualDocuments, setManualDocuments] = useState([] as Awaited<ReturnType<typeof getManualDocuments>>['rows']);
  const [manualUploadBusy, setManualUploadBusy] = useState(false);
  const [technicians, setTechnicians] = useState<ApiTechnician[]>([]);
  const [overtimeRows, setOvertimeRows] = useState<ApiOvertimeRow[]>([]);
  const [leaveRows, setLeaveRows] = useState<ManagerLeaveRequestRow[]>([]);
  const [master, setMaster] = useState<ManagerMasterData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [reportFilters, setReportFilters] = useState({ period_start: currentMonth.start, period_end: currentMonth.end, team_id: '' });
  const [dispatchForm, setDispatchForm] = useState<DispatchForm>({ customer: '', site: '', area: 'Jakarta', team: '', job_type: 'repair', priority: 'normal', so_status: 'so_pending', so_number: '', scheduled_start_at: nextHourIso(), scheduled_end_at: plusHoursIso(5), lead_technician_id: '', support_technician_ids: [] });
  const [managerUserForm, setManagerUserForm] = useState<ManagerUserForm>({ employee_id: '', full_name: '', email: '', role: 'engineer', team_ids: [], temporary_password: 'Password' });
  const [technicianUserForm, setTechnicianUserForm] = useState<TechnicianUserForm>({ employee_id: '', full_name: '', email: '', team: '', level: 'technician_l1', active_date: defaultWorkDate, temporary_password: 'Password' });
  const [manualForm, setManualForm] = useState<ManualForm>({ title: '', file_name: 'manual.pdf', document_type: 'iom', brand: 'carrier', product_line: 'chiller', model_keyword: '', version: 'v2026.04' });
  const [manualFile, setManualFile] = useState<File | null>(null);
  const [siteForm, setSiteForm] = useState<SiteForm>({ customer: '', name: '', area: 'Jakarta', address: 'Jakarta', latitude: '', longitude: '', radius_meters: '200', maps_url: '' });
  const [officeForm, setOfficeForm] = useState<OfficeForm>({ branch_id: '', name: '', address: '', latitude: '', longitude: '', radius_meters: '150', maps_url: '' });
  const [siteGpsForm, setSiteGpsForm] = useState<SiteGpsForm>({ latitude: '', longitude: '', radius_meters: '200', maps_url: '' });
  const [officeGpsForm, setOfficeGpsForm] = useState<OfficeGpsForm>({ name: '', address: '', latitude: '', longitude: '', radius_meters: '150', maps_url: '', is_active: true });
  const [teamScopeDrafts, setTeamScopeDrafts] = useState<Record<string, string[]>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [soModal, setSoModal] = useState<SoModalState | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmActionState | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [confirmNote, setConfirmNote] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState('');
  const [notificationRows, setNotificationRows] = useState<ApiNotification[]>([]);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationBusy, setNotificationBusy] = useState(false);

  const permissions = useMemo(() => ({
    canManageSchedule: operationalRoles.includes(user.role),
    canManageLocations: operationalRoles.includes(user.role),
    canReviewGpsCaptures: operationalRoles.includes(user.role),
    canApproveOvertime: operationalRoles.includes(user.role),
    canApproveLeave: operationalRoles.includes(user.role),
    canUploadManuals: manualUploadRoles.includes(user.role),
    canManageGlobalUsers: globalUserRoles.includes(user.role),
    canCreateTechnicianUsers: operationalRoles.includes(user.role),
    canResetPilotData: ['admin', 'senior_manager'].includes(user.role),
  }), [user.role]);

  const activeJobs = useMemo(() => liveRows.filter((row) => row.active_job).length, [liveRows]);
  const pendingOt = useMemo(() => overtimeRows.filter((row) => row.status === 'submitted').length, [overtimeRows]);
  const pendingLeave = useMemo(() => leaveRows.filter((row) => row.status === 'submitted').length, [leaveRows]);
  const soPending = useMemo(() => scheduleRows.filter((row) => row.so_status === 'so_pending').length, [scheduleRows]);
  const selectedJob = useMemo(() => jobRows.find((job) => job.id === selectedJobId) || jobRows[0] || null, [jobRows, selectedJobId]);
  const selectedSite = useMemo(() => locations?.sites.find((site) => site.id === selectedSiteId) || locations?.sites[0] || null, [locations, selectedSiteId]);
  const selectedOffice = useMemo(() => locations?.offices.find((office) => office.id === selectedOfficeId) || locations?.offices[0] || null, [locations, selectedOfficeId]);
  const selectedAccessUser = useMemo(() => accessUsers.find((row) => row.id === selectedAccessUserId) || accessUsers[0] || null, [accessUsers, selectedAccessUserId]);
  const pendingCaptures = useMemo(() => locations?.capture_requests.filter((request) => request.status === 'pending_review') || [], [locations]);
  const unverifiedSites = useMemo(() => locations?.sites.filter((site) => site.verification_status !== 'verified') || [], [locations]);
  const activeUsers = useMemo(() => accessUsers.filter((row) => row.status === 'active').length, [accessUsers]);
  const technicianL1Count = useMemo(() => technicians.filter((row) => row.level === 'technician_l1').length, [technicians]);
  const technicianL2Count = useMemo(() => technicians.filter((row) => row.level === 'technician_l2').length, [technicians]);
  const seniorTechnicianCount = useMemo(() => technicians.filter((row) => String(row.level).startsWith('senior_')).length, [technicians]);
  const productSpecialistCount = useMemo(() => technicians.filter((row) => row.level === 'product_specialist').length, [technicians]);
  const unreadNotificationCount = useMemo(() => notificationRows.filter((row) => !row.read_at).length, [notificationRows]);

  const visibleTabs = useMemo(() => (
    tabs.filter((tab) => {
      if (tab.id === 'users') return permissions.canManageGlobalUsers || permissions.canCreateTechnicianUsers;
      if (tab.id === 'audit') return permissions.canManageGlobalUsers;
      if (tab.id === 'locations') return permissions.canManageLocations;
      if (tab.id === 'anomalies') return permissions.canApproveOvertime || permissions.canReviewGpsCaptures;
      return true;
    })
  ), [permissions.canApproveOvertime, permissions.canCreateTechnicianUsers, permissions.canManageGlobalUsers, permissions.canManageLocations, permissions.canReviewGpsCaptures]);

  useEffect(() => {
    if (!visibleTabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(visibleTabs[0]?.id || 'live');
    }
  }, [activeTab, visibleTabs]);

  const setFieldError = (key: string, value = '') => {
    setFormErrors((current) => ({ ...current, [key]: value }));
  };

  const clearFieldError = (key: string) => {
    setFormErrors((current) => {
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setMessage('');
    try {
      const [live, dailyOps, schedule, jobs, kpiReport, locationData, gpsExceptionData, anomalyData, auditData, users, manuals, techs, overtime, leaveRequests, notifications, masterData] = await Promise.all([
        getManagerLiveStatus(),
        getManagerDailyOperations(),
        getManagerSchedule(),
        getManagerJobs(),
        getManagerKpiReport(reportFilters.period_start, reportFilters.period_end, reportFilters.team_id),
        getManagerLocations(),
        getManagerGpsExceptions(),
        getManagerAnomalies(),
        permissions.canManageGlobalUsers ? getManagerAuditLogs() : Promise.resolve({ rows: [] }),
        getManagerUsers(),
        getManualDocuments(),
        getManagerTechnicians(),
        getManagerOvertimeRequests(),
        getManagerLeaveRequests(),
        getNotifications(),
        getManagerMasterData(),
      ]);
      setLiveRows(live.rows);
      setDailyOperationRows(dailyOps.rows);
      setScheduleRows(schedule.rows);
      setJobRows(jobs.rows);
      setSelectedJobId((current) => (jobs.rows.some((job) => job.id === current) ? current : jobs.rows[0]?.id || ''));
      setReport(kpiReport);
      setLocations(locationData);
      setGpsExceptions(gpsExceptionData.rows);
      setAnomalyRows(anomalyData.rows);
      setAuditRows(auditData.rows);
      setAccessUsers(users.rows);
      setManualDocuments(manuals.rows);
      setSelectedAccessUserId((current) => (users.rows.some((row) => row.id === current) ? current : users.rows[0]?.id || ''));
      setTeamScopeDrafts((current) => {
        const nextDrafts: Record<string, string[]> = {};
        users.rows.forEach((row) => {
          nextDrafts[row.id] = current[row.id]?.length && current[row.id].every((teamId) => row.team_scope?.some((team) => team.id === teamId))
            ? current[row.id]
            : row.team_scope?.map((team) => team.id) || [];
        });
        return nextDrafts;
      });
      setSelectedSiteId((current) => (locationData.sites.some((site) => site.id === current) ? current : locationData.sites[0]?.id || ''));
      setSelectedOfficeId((current) => (locationData.offices.some((office) => office.id === current) ? current : locationData.offices[0]?.id || ''));
      setSiteGpsForm((current) => {
        if (current.latitude || current.longitude || current.maps_url) return current;
        const firstSite = locationData.sites[0];
        return firstSite
          ? {
              latitude: firstSite.latitude === null ? '' : String(firstSite.latitude),
              longitude: firstSite.longitude === null ? '' : String(firstSite.longitude),
              radius_meters: String(firstSite.radius_meters || 200),
              maps_url: firstSite.maps_url || '',
            }
          : current;
      });
      setOfficeGpsForm((current) => {
        if (current.name || current.latitude || current.longitude || current.maps_url) return current;
        const firstOffice = locationData.offices[0];
        return firstOffice
          ? {
              name: firstOffice.name || '',
              address: firstOffice.address || '',
              latitude: String(firstOffice.latitude ?? ''),
              longitude: String(firstOffice.longitude ?? ''),
              radius_meters: String(firstOffice.radius_meters || 150),
              maps_url: firstOffice.maps_url || '',
              is_active: firstOffice.is_active ?? true,
            }
          : current;
      });
      setTechnicians(techs.rows);
      setOvertimeRows(overtime.rows);
      setLeaveRows(leaveRequests.rows);
      setNotificationRows(notifications.rows);
      setMaster(masterData);
      setOfficeForm((current) => ({
        ...current,
        branch_id: current.branch_id || masterData.branches[0]?.id || '',
      }));
      setDispatchForm((current) => ({
        ...current,
        team: current.team || masterData.teams[0]?.name || '',
        lead_technician_id: current.lead_technician_id || masterData.technicians[0]?.id || '',
        support_technician_ids: current.support_technician_ids.length ? current.support_technician_ids : (masterData.technicians[1]?.id ? [masterData.technicians[1].id] : []),
      }));
      setManagerUserForm((current) => ({
        ...current,
        team_ids: current.team_ids.length ? current.team_ids : (masterData.teams[0]?.id ? [masterData.teams[0].id] : []),
      }));
      setTechnicianUserForm((current) => ({
        ...current,
        team: current.team || masterData.teams[0]?.name || '',
      }));
    } catch (error) {
      console.warn(error);
      setMessage('Dashboard data belum bisa dimuat. Cek API dan role login.');
    } finally {
      setIsLoading(false);
    }
  }, [permissions.canManageGlobalUsers, reportFilters.period_end, reportFilters.period_start, reportFilters.team_id]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const openManagerNotifications = async () => {
    setNotificationOpen(true);
    setNotificationBusy(true);
    try {
      const response = await getNotifications();
      setNotificationRows(response.rows);
    } finally {
      setNotificationBusy(false);
    }
  };

  const markManagerNotificationRead = async (notificationId: string) => {
    const row = await markNotificationRead(notificationId);
    setNotificationRows((current) => current.map((item) => item.id === notificationId ? row : item));
  };

  const markManagerNotificationsAllRead = async () => {
    const response = await markAllNotificationsRead();
    const readById = new Map(response.rows.map((row) => [row.id, row]));
    setNotificationRows((current) => current.map((item) => readById.get(item.id) ?? item));
  };

  const validateDispatchForm = () => {
    if (isBlank(dispatchForm.customer)) return 'Customer wajib diisi.';
    if (isBlank(dispatchForm.site)) return 'Site wajib diisi.';
    if (isBlank(dispatchForm.team)) return 'Team wajib dipilih.';
    if (isBlank(dispatchForm.lead_technician_id)) return 'Lead technician wajib dipilih.';
    if (!dispatchForm.scheduled_start_at || !dispatchForm.scheduled_end_at) return 'Schedule start dan end wajib diisi.';
    if (new Date(dispatchForm.scheduled_end_at).getTime() <= new Date(dispatchForm.scheduled_start_at).getTime()) return 'Schedule end harus lebih besar dari start.';
    if (dispatchForm.support_technician_ids.includes(dispatchForm.lead_technician_id)) return 'Lead technician tidak boleh dobel di support technician.';
    if (dispatchForm.so_status === 'so_available' && isBlank(dispatchForm.so_number)) return 'SO Number wajib diisi jika status SO Available.';
    return '';
  };

  const validateManagerUserForm = () => {
    if (isBlank(managerUserForm.full_name)) return 'Full name wajib diisi.';
    if (!isBlank(managerUserForm.email) && !emailPattern.test(managerUserForm.email.trim())) return 'Format email tidak valid.';
    if (managerUserForm.temporary_password.trim().length < 8) return 'Temporary password minimal 8 karakter.';
    if (['engineer', 'product_specialist'].includes(managerUserForm.role) && !managerUserForm.team_ids.length) return 'Team scope wajib dipilih untuk engineer atau product specialist.';
    return '';
  };

  const validateTechnicianUserForm = () => {
    if (isBlank(technicianUserForm.full_name)) return 'Nama technician wajib diisi.';
    if (!isBlank(technicianUserForm.email) && !emailPattern.test(technicianUserForm.email.trim())) return 'Format email technician tidak valid.';
    if (isBlank(technicianUserForm.team)) return 'Team technician wajib dipilih.';
    if (isBlank(technicianUserForm.active_date)) return 'Active date wajib diisi.';
    if (technicianUserForm.temporary_password.trim().length < 8) return 'Temporary password minimal 8 karakter.';
    return '';
  };

  const validateSiteCreateForm = () => {
    if (isBlank(siteForm.customer)) return 'Customer site wajib diisi.';
    if (isBlank(siteForm.name)) return 'Site name wajib diisi.';
    if (!isBlank(siteForm.latitude) !== !isBlank(siteForm.longitude)) return 'Latitude dan longitude harus diisi berpasangan.';
    if (Number(siteForm.radius_meters || 0) <= 0) return 'Radius harus lebih besar dari 0.';
    if (isBlank(siteForm.maps_url) && isBlank(siteForm.latitude) && isBlank(siteForm.longitude)) return 'Isi Google Maps link atau koordinat manual.';
    return '';
  };

  const validateSiteGpsForm = () => {
    if (!selectedSite) return 'Pilih site dulu.';
    if (!isBlank(siteGpsForm.latitude) !== !isBlank(siteGpsForm.longitude)) return 'Latitude dan longitude harus diisi berpasangan.';
    if (Number(siteGpsForm.radius_meters || 0) <= 0) return 'Radius harus lebih besar dari 0.';
    if (isBlank(siteGpsForm.maps_url) && isBlank(siteGpsForm.latitude) && isBlank(siteGpsForm.longitude)) return 'Isi Google Maps link atau koordinat manual.';
    return '';
  };

  const validateOfficeCreateForm = () => {
    if (isBlank(officeForm.branch_id)) return 'Branch office wajib dipilih.';
    if (isBlank(officeForm.name)) return 'Nama office point wajib diisi.';
    if (!isBlank(officeForm.latitude) !== !isBlank(officeForm.longitude)) return 'Latitude dan longitude harus diisi berpasangan.';
    if (Number(officeForm.radius_meters || 0) <= 0) return 'Radius office harus lebih besar dari 0.';
    if (isBlank(officeForm.maps_url) && isBlank(officeForm.latitude) && isBlank(officeForm.longitude)) return 'Isi Google Maps link atau koordinat manual untuk office.';
    return '';
  };

  const validateOfficeGpsForm = () => {
    if (!selectedOffice) return 'Pilih office point dulu.';
    if (isBlank(officeGpsForm.name)) return 'Nama office point wajib diisi.';
    if (!isBlank(officeGpsForm.latitude) !== !isBlank(officeGpsForm.longitude)) return 'Latitude dan longitude harus diisi berpasangan.';
    if (Number(officeGpsForm.radius_meters || 0) <= 0) return 'Radius office harus lebih besar dari 0.';
    if (isBlank(officeGpsForm.maps_url) && isBlank(officeGpsForm.latitude) && isBlank(officeGpsForm.longitude)) return 'Isi Google Maps link atau koordinat manual untuk office.';
    return '';
  };

  const validateManualForm = () => {
    if (!(manualFile instanceof File) || !manualFile.name.toLowerCase().endsWith('.pdf')) return 'Upload manual book hanya menerima file PDF.';
    if (isBlank(manualForm.title)) return 'Title manual wajib diisi.';
    if (isBlank(manualForm.version)) return 'Versi manual wajib diisi.';
    return '';
  };

  const createDispatch = async () => {
    const validationError = validateDispatchForm();
    if (validationError) {
      setFieldError('dispatch', validationError);
      return;
    }
    clearFieldError('dispatch');
    await createManagerSchedule({
      ...dispatchForm,
      scheduled_start_at: `${dispatchForm.scheduled_start_at}:00+07:00`,
      scheduled_end_at: `${dispatchForm.scheduled_end_at}:00+07:00`,
      so_number: dispatchForm.so_status === 'so_available' ? dispatchForm.so_number.trim() : null,
      support_technician_ids: dispatchForm.support_technician_ids.filter((id) => id && id !== dispatchForm.lead_technician_id),
      dispatch_note: 'Created from React manager dashboard',
    });
    setMessage('Schedule berhasil dibuat dan notifikasi dikirim ke teknisi.');
    await loadDashboard();
  };

  const openSoModal = (job: ApiJob) => {
    setSoModal({
      jobId: job.id,
      jobNo: job.job_no,
      currentSo: job.so_number || '',
      value: job.so_number || '',
    });
    clearFieldError('update_so');
  };

  const submitSoUpdate = async () => {
    if (!soModal) return;
    if (isBlank(soModal.value)) {
      setFieldError('update_so', 'Nomor SO wajib diisi.');
      return;
    }
    clearFieldError('update_so');
    await updateManagerJobSo(soModal.jobId, soModal.value.trim());
    setMessage('Nomor SO berhasil diperbarui.');
    setSoModal(null);
    await loadDashboard();
  };

  const numericOrNull = (value: string) => {
    const trimmed = value.trim();
    return trimmed ? Number(trimmed) : null;
  };

  const createSite = async () => {
    const validationError = validateSiteCreateForm();
    if (validationError) {
      setFieldError('site_create', validationError);
      return;
    }
    clearFieldError('site_create');
    const site = await createManagerSite({
      customer: siteForm.customer,
      name: siteForm.name,
      area: siteForm.area,
      address: siteForm.address,
      latitude: numericOrNull(siteForm.latitude),
      longitude: numericOrNull(siteForm.longitude),
      radius_meters: Number(siteForm.radius_meters || 200),
      maps_url: siteForm.maps_url,
    });
    setMessage(`Site ${site.name} berhasil dibuat dengan status ${title(site.verification_status)}.`);
    setSelectedSiteId(site.id);
    await loadDashboard();
  };

  const createOffice = async () => {
    const validationError = validateOfficeCreateForm();
    if (validationError) {
      setFieldError('office_create', validationError);
      return;
    }
    clearFieldError('office_create');
    const office = await createManagerOfficeLocation({
      branch_id: officeForm.branch_id,
      name: officeForm.name,
      address: officeForm.address,
      latitude: numericOrNull(officeForm.latitude),
      longitude: numericOrNull(officeForm.longitude),
      radius_meters: Number(officeForm.radius_meters || 150),
      maps_url: officeForm.maps_url,
      is_active: true,
    });
    setMessage(`Office point ${office.name} berhasil dibuat untuk ${office.branch?.name || 'branch'}.`);
    setSelectedOfficeId(office.id);
    await loadDashboard();
  };

  const editSiteGps = (site: ManagerSiteLocation) => {
    setSelectedSiteId(site.id);
    setSiteGpsForm({
      latitude: site.latitude === null ? '' : String(site.latitude),
      longitude: site.longitude === null ? '' : String(site.longitude),
      radius_meters: String(site.radius_meters || 200),
      maps_url: site.maps_url || '',
    });
  };

  const editOfficeGps = (office: Awaited<ReturnType<typeof getManagerLocations>>['offices'][number]) => {
    setSelectedOfficeId(office.id);
    setOfficeGpsForm({
      name: office.name || '',
      address: office.address || '',
      latitude: String(office.latitude ?? ''),
      longitude: String(office.longitude ?? ''),
      radius_meters: String(office.radius_meters || 150),
      maps_url: office.maps_url || '',
      is_active: office.is_active ?? true,
    });
  };

  const updateSiteGps = async () => {
    const validationError = validateSiteGpsForm();
    if (validationError) {
      setFieldError('site_update', validationError);
      return;
    }
    clearFieldError('site_update');
    if (!selectedSite) return;
    const updated = await updateManagerSiteLocation(selectedSite.id, {
      latitude: numericOrNull(siteGpsForm.latitude),
      longitude: numericOrNull(siteGpsForm.longitude),
      radius_meters: Number(siteGpsForm.radius_meters || 200),
      maps_url: siteGpsForm.maps_url,
    });
    setMessage(`GPS site ${updated.name} berhasil diverifikasi.`);
    await loadDashboard();
  };

  const updateOfficeGps = async () => {
    const validationError = validateOfficeGpsForm();
    if (validationError) {
      setFieldError('office_update', validationError);
      return;
    }
    clearFieldError('office_update');
    if (!selectedOffice) return;
    const updated = await updateManagerOfficeLocation(selectedOffice.id, {
      name: officeGpsForm.name,
      address: officeGpsForm.address,
      latitude: numericOrNull(officeGpsForm.latitude),
      longitude: numericOrNull(officeGpsForm.longitude),
      radius_meters: Number(officeGpsForm.radius_meters || 150),
      maps_url: officeGpsForm.maps_url,
      is_active: officeGpsForm.is_active,
    });
    setMessage(`Office point ${updated.name} berhasil diperbarui.`);
    await loadDashboard();
  };

  const closeConfirmModal = () => {
    if (confirmBusy) return;
    setConfirmAction(null);
    setConfirmNote('');
    clearFieldError('confirm_action');
  };

  const decideCapture = async (capture: ManagerLocationCaptureRequest, decision: 'approve' | 'reject', decisionNote?: string) => {
    if (decision === 'approve') {
      await approveManagerLocationCapture(capture.id, capture.suggested_radius_meters || 200, decisionNote || 'Approved as official GPS point');
      setMessage('Capture GPS disetujui sebagai titik resmi.');
    } else {
      await rejectManagerLocationCapture(capture.id, decisionNote || 'Rejected from manager dashboard');
      setMessage('Capture GPS ditolak.');
    }
    await loadDashboard();
  };

  const toggleTeamSelection = (teamId: string) => {
    setManagerUserForm((current) => ({
      ...current,
      team_ids: current.team_ids.includes(teamId) ? current.team_ids.filter((id) => id !== teamId) : [...current.team_ids, teamId],
    }));
  };

  const updateScopeDraft = (userId: string, teamId: string) => {
    setTeamScopeDrafts((current) => {
      const row = current[userId] || [];
      return {
        ...current,
        [userId]: row.includes(teamId) ? row.filter((id) => id !== teamId) : [...row, teamId],
      };
    });
  };

  const createManagerAccount = async () => {
    const validationError = validateManagerUserForm();
    if (validationError) {
      setFieldError('manager_user', validationError);
      return;
    }
    clearFieldError('manager_user');
    const suffix = Date.now().toString().slice(-6);
    const rolePrefix = managerUserForm.role === 'admin' ? 'ADM' : managerUserForm.role === 'assistant_manager' ? 'ASM' : managerUserForm.role === 'manager' ? 'MGR' : managerUserForm.role === 'senior_manager' ? 'SRM' : managerUserForm.role === 'product_specialist' ? 'PS' : 'ENG';
    const employeeId = managerUserForm.employee_id || `${rolePrefix}-${suffix}`;
    const created = await createManagerUser({
      employee_id: employeeId,
      full_name: managerUserForm.full_name || `New ${title(managerUserForm.role)} ${suffix}`,
      email: managerUserForm.email || `${employeeId.toLowerCase()}@bci.local`,
      role: managerUserForm.role,
      team_ids: managerUserForm.team_ids,
      temporary_password: managerUserForm.temporary_password || 'Password',
      join_date: defaultWorkDate,
    });
    setMessage(`User ${created.user.employee_id} dibuat. Temporary password: ${created.temporary_password}`);
    await loadDashboard();
  };

  const createTechnicianAccount = async () => {
    const validationError = validateTechnicianUserForm();
    if (validationError) {
      setFieldError('technician_user', validationError);
      return;
    }
    clearFieldError('technician_user');
    const suffix = Date.now().toString().slice(-6);
    const employeeId = technicianUserForm.employee_id || `TCH-${suffix}`;
    const created = await createManagerUser({
      employee_id: employeeId,
      full_name: technicianUserForm.full_name || `New Technician ${suffix}`,
      email: technicianUserForm.email || `${employeeId.toLowerCase()}@bci.local`,
      role: 'technician',
      team: technicianUserForm.team,
      level: technicianUserForm.level,
      active_date: technicianUserForm.active_date,
      join_date: technicianUserForm.active_date,
      skill_tags: ['chiller'],
      temporary_password: technicianUserForm.temporary_password || 'Password',
    });
    setMessage(`Technician ${created.user.employee_id} dibuat. KPI mulai ${created.technician?.active_date || technicianUserForm.active_date}. Temporary password: ${created.temporary_password}`);
    await loadDashboard();
  };

  const resetUserPassword = async (userId: string) => {
    const response = await resetManagerUserPassword(userId, 'Password');
    setMessage(`Password ${response.user.employee_id} di-reset. Temporary password: ${response.temporary_password}`);
    await loadDashboard();
  };

  const requestResetUserPassword = (accessUser: ManagerAccessUser) => {
    setConfirmAction({
      type: 'user_reset_password',
      title: 'Reset Password User',
      description: `Reset password untuk ${accessUser.employee_id} (${accessUser.full_name}) ke temporary password default dan paksa ganti saat login berikutnya.`,
      confirmLabel: 'Reset Password',
      confirmTone: 'danger',
      userId: accessUser.id,
    });
  };

  const toggleUserStatus = async (accessUser: ManagerAccessUser) => {
    const nextStatus = accessUser.status === 'active' ? 'inactive' : 'active';
    await updateManagerUserStatus(accessUser.id, nextStatus);
    setMessage(`Status ${accessUser.employee_id} berubah menjadi ${title(nextStatus)}.`);
    await loadDashboard();
  };

  const requestToggleUserStatus = (accessUser: ManagerAccessUser) => {
    const nextStatus = accessUser.status === 'active' ? 'inactive' : 'active';
    setConfirmAction({
      type: 'user_toggle_status',
      title: `${nextStatus === 'active' ? 'Activate' : 'Deactivate'} User`,
      description: `Ubah status ${accessUser.employee_id} (${accessUser.full_name}) menjadi ${title(nextStatus)}.`,
      confirmLabel: nextStatus === 'active' ? 'Activate User' : 'Deactivate User',
      confirmTone: nextStatus === 'active' ? 'neutral' : 'danger',
      accessUser,
    });
  };

  const saveUserTeamScope = async (accessUser: ManagerAccessUser) => {
    const teamIds = teamScopeDrafts[accessUser.id] || [];
    if (['engineer', 'product_specialist'].includes(accessUser.role) && !teamIds.length) {
      setFieldError('team_scope', 'Engineer atau product specialist minimal punya 1 team scope.');
      return;
    }
    clearFieldError('team_scope');
    await updateManagerUserTeamScope(accessUser.id, teamIds);
    setMessage(`Team scope ${accessUser.employee_id} berhasil diperbarui.`);
    await loadDashboard();
  };

  const resetPilotData = async (employeeId: string) => {
    const targetEmployeeId = employeeId.trim();
    if (!targetEmployeeId) {
      setFieldError('pilot_reset', 'Employee ID teknisi wajib diisi.');
      return;
    }
    clearFieldError('pilot_reset');
    const result = await resetManagerPilotData(targetEmployeeId, defaultWorkDate);
    setMessage(`Pilot data ${result.employee_id} untuk ${result.work_date} sudah direset. Attendance: ${result.deleted.attendance_events}, job events: ${result.deleted.job_events}.`);
    await loadDashboard();
  };

  const runDummyCleanup = async (employeeId: string, workDate: string, categories: Array<'activity_today' | 'notifications' | 'overtime' | 'leave'>) => {
    const targetEmployeeId = employeeId.trim().toUpperCase();
    if (!targetEmployeeId) {
      setFieldError('dummy_cleanup', 'Employee ID teknisi wajib diisi.');
      return;
    }
    if (!workDate.trim()) {
      setFieldError('dummy_cleanup', 'Work date wajib diisi.');
      return;
    }
    if (!categories.length) {
      setFieldError('dummy_cleanup', 'Pilih minimal 1 kategori cleanup.');
      return;
    }
    clearFieldError('dummy_cleanup');
    const confirmed = window.confirm(`Jalankan dummy data cleanup untuk ${targetEmployeeId}?\nKategori: ${categories.join(', ')}\nWork date: ${workDate}`);
    if (!confirmed) return;
    const result = await runManagerDummyDataCleanup({
      employee_id: targetEmployeeId,
      work_date: workDate,
      categories,
    });
    const summaryParts = [
      `attendance ${result.deleted.attendance_events}`,
      `job events ${result.deleted.job_events}`,
      `notif ${result.deleted.notifications}`,
      `OT ${result.deleted.overtime_requests}`,
      `leave ${result.deleted.leave_requests}`,
    ];
    setMessage(`Dummy cleanup ${result.employee_id} selesai untuk ${result.work_date}: ${summaryParts.join(', ')}.`);
    await loadDashboard();
  };

  const saveManual = async () => {
    const validationError = validateManualForm();
    if (validationError) {
      setFieldError('manual', validationError);
      return;
    }
    clearFieldError('manual');
    if (!(manualFile instanceof File)) return;
    setManualUploadBusy(true);
    try {
      setMessage('Menyiapkan signed upload URL...');
      const upload = await requestManualUploadUrl({
        file_name: manualFile.name,
        brand: manualForm.brand,
        product_line: manualForm.product_line,
      });
      setMessage('Uploading PDF ke private storage...');
      await uploadManualPdfToSignedUrl(upload.signed_upload_url, manualFile);
      setMessage('Menyimpan metadata manual dan notifikasi...');
      const document = await createManualDocument({
        title: manualForm.title || manualFile.name,
        document_type: manualForm.document_type,
        brand: manualForm.brand,
        product_line: manualForm.product_line,
        model_keyword: manualForm.model_keyword,
        version: manualForm.version,
        file_url: `storage://manual-documents/${upload.path}`,
      });
      setManualFile(null);
      setManualForm((current) => ({ ...current, title: '', file_name: 'manual.pdf', model_keyword: '' }));
      setMessage(`Manual ${document.title} berhasil di-upload dan notifikasi teknisi dibuat.`);
      await loadDashboard();
    } finally {
      setManualUploadBusy(false);
    }
  };

  const viewManualDocument = async (documentId: string) => {
    const response = await getManualDocumentUrl(documentId);
    window.open(response.url, '_blank', 'noopener');
  };

  const downloadManualDocument = async (documentId: string, titleValue: string) => {
    const response = await getManualDocumentUrl(documentId);
    const link = document.createElement('a');
    link.href = response.url;
    link.download = `${titleValue || 'manual'}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const deleteManualDocument = async (manual: ApiManualDocument) => {
    const confirmed = window.confirm(`Delete PDF manual "${manual.title}"?\nFile akan dihapus dari daftar manual dan private storage.`);
    if (!confirmed) return;
    const result = await deleteManagerManualDocument(manual.id);
    setMessage(`Manual ${result.title} berhasil dihapus dari daftar aktif.`);
    await loadDashboard();
  };

  const decideOvertime = async (row: ApiOvertimeRow, decision: 'approve' | 'reject', decisionNote?: string) => {
    if (decision === 'approve') {
      await approveManagerOvertime(row.id, decisionNote || 'Approved from manager dashboard');
      setMessage('Overtime berhasil di-approve dan notifikasi dikirim.');
    } else {
      await rejectManagerOvertime(row.id, decisionNote || 'Rejected from manager dashboard');
      setMessage('Overtime berhasil di-reject dan notifikasi dikirim.');
    }
    await loadDashboard();
  };

  const decideLeave = async (row: ManagerLeaveRequestRow, decision: 'approve' | 'reject', decisionNote?: string) => {
    if (decision === 'approve') {
      await approveManagerLeaveRequest(row.id, decisionNote || 'Approved from manager dashboard');
      setMessage('Leave request berhasil di-approve dan notifikasi dikirim.');
    } else {
      await rejectManagerLeaveRequest(row.id, decisionNote || 'Rejected from manager dashboard');
      setMessage('Leave request berhasil di-reject dan notifikasi dikirim.');
    }
    await loadDashboard();
  };

  const requestCaptureDecision = (capture: ManagerLocationCaptureRequest, decision: 'approve' | 'reject') => {
    const targetName = capture.site?.name || capture.office_location?.name || 'selected location';
    setConfirmNote(decision === 'approve' ? `Approved GPS capture for ${targetName}.` : `Rejected GPS capture for ${targetName}.`);
    clearFieldError('confirm_action');
    setConfirmAction({
      type: 'capture_decision',
      title: `${decision === 'approve' ? 'Approve' : 'Reject'} GPS Capture`,
      description: `${decision === 'approve' ? 'Jadikan' : 'Tolak'} GPS capture untuk ${targetName} dari ${capture.technician?.user?.full_name || 'technician'} sebagai referensi resmi.`,
      confirmLabel: decision === 'approve' ? 'Approve GPS' : 'Reject GPS',
      confirmTone: decision === 'approve' ? 'neutral' : 'danger',
      capture,
      decision,
    });
  };

  const requestOvertimeDecision = (row: ApiOvertimeRow, decision: 'approve' | 'reject') => {
    setConfirmNote(decision === 'approve' ? `Approved overtime ${row.job_no} for ${row.technician_name}.` : `Rejected overtime ${row.job_no} for ${row.technician_name}.`);
    clearFieldError('confirm_action');
    setConfirmAction({
      type: 'overtime_decision',
      title: `${decision === 'approve' ? 'Approve' : 'Reject'} Overtime`,
      description: `${decision === 'approve' ? 'Setujui' : 'Tolak'} overtime ${row.technician_name} untuk ${row.customer} dengan total ${rupiah(row.total_amount)}.`,
      confirmLabel: decision === 'approve' ? 'Approve Overtime' : 'Reject Overtime',
      confirmTone: decision === 'approve' ? 'neutral' : 'danger',
      overtime: row,
      decision,
    });
  };

  const requestLeaveDecision = (row: ManagerLeaveRequestRow, decision: 'approve' | 'reject') => {
    setConfirmNote(decision === 'approve' ? `Approved ${title(row.leave_type)} for ${row.technician_name}.` : `Rejected ${title(row.leave_type)} for ${row.technician_name}.`);
    clearFieldError('confirm_action');
    setConfirmAction({
      type: 'leave_decision',
      title: `${decision === 'approve' ? 'Approve' : 'Reject'} Leave Request`,
      description: `${decision === 'approve' ? 'Setujui' : 'Tolak'} ${row.technician_name} untuk ${title(row.leave_type)} ${row.start_date} sampai ${row.end_date}.`,
      confirmLabel: decision === 'approve' ? 'Approve Leave' : 'Reject Leave',
      confirmTone: decision === 'approve' ? 'neutral' : 'danger',
      leave: row,
      decision,
    });
  };

  const submitConfirmedAction = async () => {
    if (!confirmAction) return;
    if ('decision' in confirmAction && confirmAction.decision === 'reject' && isBlank(confirmNote)) {
      setFieldError('confirm_action', 'Catatan keputusan wajib diisi saat reject.');
      return;
    }
    clearFieldError('confirm_action');
    setConfirmBusy(true);
    try {
      if (confirmAction.type === 'user_reset_password') {
        await resetUserPassword(confirmAction.userId);
      } else if (confirmAction.type === 'user_toggle_status') {
        await toggleUserStatus(confirmAction.accessUser);
      } else if (confirmAction.type === 'capture_decision') {
        await decideCapture(confirmAction.capture, confirmAction.decision, confirmNote.trim());
      } else if (confirmAction.type === 'overtime_decision') {
        await decideOvertime(confirmAction.overtime, confirmAction.decision, confirmNote.trim());
      } else if (confirmAction.type === 'leave_decision') {
        await decideLeave(confirmAction.leave as ManagerLeaveRequestRow, confirmAction.decision, confirmNote.trim());
      }
      setConfirmAction(null);
      setConfirmNote('');
    } finally {
      setConfirmBusy(false);
    }
  };

  const renderConfirmActionBody = () => {
    if (!confirmAction) return null;

    if (confirmAction.type === 'overtime_decision') {
      const row = confirmAction.overtime;
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Technician" value={row.technician_name} />
            <Detail label="Job" value={`${row.job_no} / Visit ${row.visit_no}`} />
            <Detail label="Customer / Site" value={`${row.customer} / ${row.site}`} />
            <Detail label="OT Date" value={date(row.overtime_date)} />
            <Detail label="Duration" value={`${Math.round((row.calculated_duration_minutes / 60) * 10) / 10}h`} />
            <Detail label="Total Amount" value={rupiah(row.total_amount)} />
          </div>
          <Field label="Decision Note">
            <textarea
              className="min-h-[96px] w-full rounded-md border-0 bg-[#e6e8eb] px-3 py-3 text-sm font-semibold text-[#191c1e] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#00639a]/20"
              value={confirmNote}
              onChange={(event) => setConfirmNote(event.target.value)}
              placeholder="Tambahkan alasan approve atau reject overtime ini."
            />
          </Field>
          {formErrors.confirm_action && <InlineError message={formErrors.confirm_action} />}
          <div className="rounded-md bg-[#f7faf8] px-3 py-3 text-sm font-semibold text-[#42524c]">
            Action ini akan langsung mempengaruhi approval lembur dan notifikasi teknisi.
          </div>
        </div>
      );
    }

    if (confirmAction.type === 'leave_decision') {
      const row = confirmAction.leave as ManagerLeaveRequestRow;
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Technician" value={`${row.technician_name} / ${row.technician_employee_id}`} />
            <Detail label="Team" value={row.team_name} />
            <Detail label="Leave Type" value={title(row.leave_type)} />
            <Detail label="Period" value={`${row.start_date} - ${row.end_date}`} />
            <Detail label="Total Days" value={`${row.total_days} day${row.total_days === 1 ? '' : 's'}`} />
            <Detail label="Impacted Jobs" value={row.impacted_jobs?.length || 0} />
          </div>
          <div className="rounded-md bg-[#f2f4f7] px-3 py-3">
            <p className="text-xs font-extrabold text-[#657181]">Reason</p>
            <p className="mt-1 text-sm font-semibold text-[#191c1e]">{row.reason}</p>
            {!!row.impacted_jobs?.length && (
              <p className="mt-2 text-xs font-semibold text-[#657181]">
                Impacted job: {row.impacted_jobs.slice(0, 3).map((job) => `${job.job_no} / ${job.site}`).join(', ')}
              </p>
            )}
          </div>
          <Field label="Decision Note">
            <textarea
              className="min-h-[96px] w-full rounded-md border-0 bg-[#e6e8eb] px-3 py-3 text-sm font-semibold text-[#191c1e] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#00639a]/20"
              value={confirmNote}
              onChange={(event) => setConfirmNote(event.target.value)}
              placeholder="Tambahkan alasan approve atau reject leave request ini."
            />
          </Field>
          {formErrors.confirm_action && <InlineError message={formErrors.confirm_action} />}
          <div className="rounded-md bg-[#f7faf8] px-3 py-3 text-sm font-semibold text-[#42524c]">
            Approval leave akan mengunci flow attendance teknisi pada tanggal yang disetujui.
          </div>
        </div>
      );
    }

    if (confirmAction.type === 'capture_decision') {
      const capture = confirmAction.capture;
      return (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Detail label="Technician" value={capture.technician?.user?.full_name || '-'} />
            <Detail label="Target" value={capture.site?.name || capture.office_location?.name || '-'} />
            <Detail label="Source" value={title(capture.target_type)} />
            <Detail label="Suggested Radius" value={`${capture.suggested_radius_meters} m`} />
          </div>
          <Field label="Decision Note">
            <textarea
              className="min-h-[96px] w-full rounded-md border-0 bg-[#e6e8eb] px-3 py-3 text-sm font-semibold text-[#191c1e] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#00639a]/20"
              value={confirmNote}
              onChange={(event) => setConfirmNote(event.target.value)}
              placeholder="Tambahkan catatan review GPS capture ini."
            />
          </Field>
          {formErrors.confirm_action && <InlineError message={formErrors.confirm_action} />}
          <div className="rounded-md bg-[#f7faf8] px-3 py-3 text-sm font-semibold text-[#42524c]">
            Action ini akan memperbarui referensi titik GPS resmi untuk attendance atau site.
          </div>
        </div>
      );
    }

    return (
      <div className="rounded-md bg-[#f7faf8] px-3 py-3 text-sm font-semibold text-[#42524c]">
        Action ini akan langsung diproses ke data live dashboard.
      </div>
    );
  };

  const contextValue = {
    user,
    permissions,
    summary: {
      activeJobs,
      pendingOt,
      soPending,
      activeUsers,
      technicianL1Count,
      technicianL2Count,
      seniorTechnicianCount,
      productSpecialistCount,
      pendingCaptures,
      unverifiedSites,
      pendingLeave,
    },
    liveRows,
    dailyOperationRows,
    scheduleRows,
    jobRows,
    selectedJob,
    setSelectedJobId,
    report,
    reportFilters,
    setReportFilters,
    locations,
    gpsExceptions,
    anomalyRows,
    auditRows,
    selectedSite,
    selectedOffice,
    accessUsers,
    selectedAccessUser,
    setSelectedAccessUserId,
    manualDocuments,
    manualUploadBusy,
    technicians,
    overtimeRows,
    leaveRows,
    master,
    formErrors,
    dispatchForm,
    setDispatchForm,
    managerUserForm,
    setManagerUserForm,
    technicianUserForm,
    setTechnicianUserForm,
    manualForm,
    setManualForm,
    manualFile,
    setManualFile,
    siteForm,
    setSiteForm,
    officeForm,
    setOfficeForm,
    siteGpsForm,
    setSiteGpsForm,
    officeGpsForm,
    setOfficeGpsForm,
    teamScopeDrafts,
    loadDashboard,
    createDispatch,
    openSoModal,
    createSite,
    createOffice,
    editSiteGps,
    updateSiteGps,
    editOfficeGps,
    updateOfficeGps,
    requestCaptureDecision,
    toggleTeamSelection,
    updateScopeDraft,
    createManagerAccount,
    createTechnicianAccount,
    requestResetUserPassword,
      requestToggleUserStatus,
      saveUserTeamScope,
      resetPilotData,
      runDummyCleanup,
      saveManual,
      viewManualDocument,
      downloadManualDocument,
      deleteManualDocument,
    requestOvertimeDecision,
    requestLeaveDecision,
  };

  const activeTabLabel = visibleTabs.find((tab) => tab.id === activeTab)?.label || 'Dashboard';
  const ActiveTabComponent = tabComponents[activeTab];
  const roleLabel = user.role === 'engineer'
    ? 'Operation Engineer'
    : user.role === 'product_specialist'
      ? 'Product Specialist'
      : user.role === 'admin'
        ? 'Administrator'
        : title(user.role);
  const operatorInitial = (user.full_name || user.employee_id || 'BCI').slice(0, 1).toUpperCase();

  return (
    <ManagerDashboardContext.Provider value={contextValue}>
      <div className="h-screen bg-[#f7f9fc] font-sans text-[#191c1e]">
        <div className="grid h-screen grid-cols-[16rem_minmax(0,1fr)]">
          <aside className="flex h-screen flex-col overflow-y-auto bg-[#f2f4f7] px-5 py-6">
            <div className="px-2">
              <h1 className="font-headline text-lg font-extrabold uppercase tracking-[0.28em] text-[#002f63]">Berca Carrier</h1>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.24em] text-[#657181]">Enterprise Ops</p>
            </div>

            <nav className="mt-10 flex-1 space-y-2">
              {visibleTabs.map(({ id, label, Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  onMouseEnter={() => void tabLoaders[id]()}
                  onFocus={() => void tabLoaders[id]()}
                  className={`flex h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm font-semibold transition-all ${
                    activeTab === id
                      ? 'translate-x-1 bg-white text-[#00639a] shadow-sm shadow-blue-900/5'
                      : 'text-[#4b5563] hover:bg-white/70 hover:text-[#002f63]'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </button>
              ))}
            </nav>

            <div className="border-t border-[#dfe4ea] px-2 pt-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-md bg-[#002f63] text-sm font-extrabold text-white shadow-sm">
                  {operatorInitial}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-[#002f63]">{user.full_name}</p>
                  <p className="truncate text-xs font-semibold text-[#657181]">{roleLabel}</p>
                </div>
              </div>
              <button onClick={onLogout} className="mt-4 flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#e6e8eb] px-3 text-sm font-bold text-[#424751] transition hover:bg-[#d8dadd]">
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </aside>

          <main className="h-screen min-w-0 overflow-auto">
            <div className="min-w-[1120px]">
            <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-8 bg-white/90 px-8 shadow-sm shadow-blue-900/5 backdrop-blur">
              <div className="flex min-w-0 flex-1 items-center gap-6">
                <h2 className="shrink-0 font-headline text-xl font-extrabold tracking-tight text-[#002f63]">{activeTab === 'live' ? 'Operations Dashboard' : activeTabLabel}</h2>
                <div className="relative w-80">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#737782]" />
                  <input
                    className="h-10 w-full rounded-md border-0 bg-[#f2f4f7] pl-10 pr-4 text-sm font-semibold text-[#191c1e] outline-none transition focus:bg-white focus:ring-2 focus:ring-[#00639a]/20"
                    placeholder="Search technician, job, or site..."
                    type="search"
                  />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-5">
                <button onClick={() => void loadDashboard()} className="flex h-10 items-center gap-2 rounded-md bg-[#002f63] px-5 text-sm font-bold text-white shadow-sm transition hover:bg-[#00458c]">
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </button>
                <button onClick={() => void openManagerNotifications()} className="relative grid h-10 w-10 place-items-center rounded-md text-[#657181] transition hover:bg-[#f2f4f7] hover:text-[#002f63]" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                  {(unreadNotificationCount + pendingOt + pendingLeave + gpsExceptions.length + pendingCaptures.length + anomalyRows.length) > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#ba1a1a]" />}
                </button>
                <button className="grid h-10 w-10 place-items-center rounded-md text-[#657181] transition hover:bg-[#f2f4f7] hover:text-[#002f63]" aria-label="Help">
                  <CircleHelp className="h-5 w-5" />
                </button>
                <div className="hidden h-8 w-px bg-[#e6e8eb] md:block" />
                <div className="flex items-center gap-3">
                  <span className="hidden text-sm font-extrabold text-[#002f63] md:inline">{roleLabel}</span>
                  <div className="grid h-9 w-9 place-items-center rounded-md bg-[#d6e3ff] text-[#002f63]">
                    <UserCircle className="h-6 w-6" />
                  </div>
                </div>
              </div>
            </header>

            <div className="p-8">
              {message && (
                <section className="mb-5 flex items-center gap-3 rounded-md bg-white px-4 py-3 text-sm font-semibold shadow-sm shadow-blue-900/5">
                  <AlertCircle className="h-4 w-4 text-[#00639a]" />
                  {message}
                </section>
              )}

              {isLoading ? (
                <div className="rounded-lg bg-white px-6 py-12 text-center text-sm font-bold text-[#657181] shadow-sm shadow-blue-900/5">Loading dashboard data...</div>
              ) : (
                <Suspense fallback={<TabLoadingState label={activeTabLabel} />}>
                  <ActiveTabComponent />
                </Suspense>
              )}
            </div>
            </div>
          </main>
        </div>

        {soModal && (
          <Modal
            title="Update SO Number"
            description={`${soModal.jobNo} / current SO: ${soModal.currentSo || 'belum ada'}`}
            onClose={() => setSoModal(null)}
            actions={(
              <>
                <button onClick={() => setSoModal(null)} className="h-10 rounded-md border border-[#dbe5df] px-4 text-sm font-bold text-[#42524c]">Cancel</button>
                <button onClick={() => void submitSoUpdate()} className="h-10 rounded-md bg-[#007f73] px-4 text-sm font-bold text-white">Save SO</button>
              </>
            )}
          >
            <div className="space-y-3">
              {formErrors.update_so && <InlineError message={formErrors.update_so} />}
              <Field label="SO Number">
                <input className={inputClass} value={soModal.value} onChange={(event) => setSoModal((current) => (current ? { ...current, value: event.target.value } : current))} placeholder="2600287" />
              </Field>
            </div>
          </Modal>
        )}

        {notificationOpen && (
          <Modal
            title="Manager Notifications"
            description="Assignment, approval, manual book, dan GPS exception yang masuk ke akun ini."
            onClose={() => setNotificationOpen(false)}
            actions={(
              <>
                <button onClick={() => setNotificationOpen(false)} className="h-10 rounded-md border border-[#dbe5df] px-4 text-sm font-bold text-[#42524c]">Close</button>
                <button onClick={() => void markManagerNotificationsAllRead()} disabled={!unreadNotificationCount} className="h-10 rounded-md bg-[#007f73] px-4 text-sm font-bold text-white disabled:bg-[#d8dadd] disabled:text-[#657181]">
                  Mark All Read
                </button>
              </>
            )}
          >
            <div className="max-h-[420px] space-y-3 overflow-y-auto pr-1">
              {notificationBusy && <p className="rounded-md bg-[#f2f4f7] px-4 py-3 text-sm font-bold text-[#657181]">Loading notifications...</p>}
              {!notificationBusy && !notificationRows.length && <p className="rounded-md bg-[#f2f4f7] px-4 py-3 text-sm font-bold text-[#657181]">Belum ada notification untuk akun ini.</p>}
              {!notificationBusy && notificationRows.slice(0, 12).map((notification) => (
                <div key={notification.id} className={`rounded-md border px-4 py-3 ${notification.read_at ? 'border-[#e6e8eb] bg-[#f7f9fc]' : 'border-[#b7d6ff] bg-blue-50'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-[#002f63]">{notification.title}</p>
                      <p className="mt-1 text-xs font-semibold leading-relaxed text-[#42524c]">{notification.message}</p>
                    </div>
                    <span className="shrink-0 rounded-md bg-white px-2 py-1 text-[9px] font-black uppercase text-[#657181]">{title(notification.type)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-bold uppercase text-[#657181]">{date(notification.created_at)}</span>
                    {!notification.read_at && (
                      <button onClick={() => void markManagerNotificationRead(notification.id)} className="rounded-md bg-[#002f63] px-3 py-1 text-[10px] font-bold uppercase text-white">
                        Mark Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Modal>
        )}

        {confirmAction && (
          <Modal
            title={confirmAction.title}
            description={confirmAction.description}
            onClose={closeConfirmModal}
            actions={(
              <>
                <button onClick={closeConfirmModal} disabled={confirmBusy} className="h-10 rounded-md border border-[#dbe5df] px-4 text-sm font-bold text-[#42524c] disabled:cursor-not-allowed disabled:opacity-60">Cancel</button>
                <button onClick={() => void submitConfirmedAction()} disabled={confirmBusy} className={`h-10 rounded-md px-4 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60 ${confirmAction.confirmTone === 'danger' ? 'bg-red-700' : 'bg-[#007f73]'}`}>
                  {confirmBusy ? 'Processing...' : confirmAction.confirmLabel}
                </button>
              </>
            )}
          >
            {renderConfirmActionBody()}
          </Modal>
        )}
      </div>
    </ManagerDashboardContext.Provider>
  );
}
