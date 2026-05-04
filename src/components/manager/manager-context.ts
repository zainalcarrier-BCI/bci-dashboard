import { createContext, useContext, type Dispatch, type SetStateAction } from 'react';
import type {
  ApiManualDocument,
  ApiLeaveRequest,
  ApiJob,
  ApiOvertimeRow,
  AuditLogRow,
  ApiTechnician,
  ApiUser,
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
  ManagerOfficeLocation,
  ManagerSiteLocation,
} from '../../services/api';

export interface DispatchForm {
  customer: string;
  site: string;
  area: string;
  team: string;
  job_type: string;
  priority: string;
  so_status: string;
  so_number: string;
  scheduled_start_at: string;
  scheduled_end_at: string;
  lead_technician_id: string;
  support_technician_ids: string[];
}

export interface ManagerUserForm {
  employee_id: string;
  full_name: string;
  email: string;
  role: string;
  team_ids: string[];
  temporary_password: string;
}

export interface TechnicianUserForm {
  employee_id: string;
  full_name: string;
  email: string;
  team: string;
  level: string;
  active_date: string;
  temporary_password: string;
}

export interface ManualForm {
  title: string;
  file_name: string;
  document_type: string;
  brand: string;
  product_line: string;
  model_keyword: string;
  version: string;
}

export interface SiteForm {
  customer: string;
  name: string;
  area: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  maps_url: string;
}

export interface SiteGpsForm {
  latitude: string;
  longitude: string;
  radius_meters: string;
  maps_url: string;
}

export interface OfficeForm {
  branch_id: string;
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  maps_url: string;
}

export interface OfficeGpsForm {
  name: string;
  address: string;
  latitude: string;
  longitude: string;
  radius_meters: string;
  maps_url: string;
  is_active: boolean;
}

export type ConfirmActionState =
  | {
      type: 'user_reset_password';
      title: string;
      description: string;
      confirmLabel: string;
      confirmTone: 'neutral' | 'danger';
      userId: string;
    }
  | {
      type: 'user_toggle_status';
      title: string;
      description: string;
      confirmLabel: string;
      confirmTone: 'neutral' | 'danger';
      accessUser: ManagerAccessUser;
    }
  | {
      type: 'capture_decision';
      title: string;
      description: string;
      confirmLabel: string;
      confirmTone: 'neutral' | 'danger';
      capture: ManagerLocationCaptureRequest;
      decision: 'approve' | 'reject';
    }
  | {
      type: 'overtime_decision';
      title: string;
      description: string;
      confirmLabel: string;
      confirmTone: 'neutral' | 'danger';
      overtime: ApiOvertimeRow;
      decision: 'approve' | 'reject';
    }
  | {
      type: 'leave_decision';
      title: string;
      description: string;
      confirmLabel: string;
      confirmTone: 'neutral' | 'danger';
      leave: ApiLeaveRequest;
      decision: 'approve' | 'reject';
    };

export interface SoModalState {
  jobId: string;
  jobNo: string;
  currentSo: string;
  value: string;
}

export interface ManagerPermissions {
  canManageSchedule: boolean;
  canManageLocations: boolean;
  canReviewGpsCaptures: boolean;
  canApproveOvertime: boolean;
  canApproveLeave: boolean;
  canUploadManuals: boolean;
  canManageGlobalUsers: boolean;
  canCreateTechnicianUsers: boolean;
  canResetPilotData: boolean;
}

export interface ManagerSummary {
  activeJobs: number;
  pendingOt: number;
  soPending: number;
  activeUsers: number;
  technicianL1Count: number;
  technicianL2Count: number;
  seniorTechnicianCount: number;
  productSpecialistCount: number;
  pendingCaptures: ManagerLocationCaptureRequest[];
  unverifiedSites: ManagerSiteLocation[];
  pendingLeave: number;
}

export interface ManagerDashboardContextValue {
  user: ApiUser;
  permissions: ManagerPermissions;
  summary: ManagerSummary;
  liveRows: ManagerLiveStatusRow[];
  dailyOperationRows: ManagerDailyOperationRow[];
  scheduleRows: ApiJob[];
  jobRows: ManagerJobDetail[];
  selectedJob: ManagerJobDetail | null;
  setSelectedJobId: Dispatch<SetStateAction<string>>;
  report: ManagerKpiReport | null;
  reportFilters: { period_start: string; period_end: string; team_id: string };
  setReportFilters: Dispatch<SetStateAction<{ period_start: string; period_end: string; team_id: string }>>;
  locations: ManagerLocationsPayload | null;
  gpsExceptions: ManagerGpsExceptionRow[];
  anomalyRows: ManagerAnomalyRow[];
  auditRows: AuditLogRow[];
  selectedSite: ManagerSiteLocation | null;
  selectedOffice: ManagerOfficeLocation | null;
  accessUsers: ManagerAccessUser[];
  selectedAccessUser: ManagerAccessUser | null;
  setSelectedAccessUserId: Dispatch<SetStateAction<string>>;
  manualDocuments: ApiManualDocument[];
  manualUploadBusy: boolean;
  technicians: ApiTechnician[];
  overtimeRows: ApiOvertimeRow[];
  leaveRows: ManagerLeaveRequestRow[];
  master: ManagerMasterData | null;
  formErrors: Record<string, string>;
  dispatchForm: DispatchForm;
  setDispatchForm: Dispatch<SetStateAction<DispatchForm>>;
  managerUserForm: ManagerUserForm;
  setManagerUserForm: Dispatch<SetStateAction<ManagerUserForm>>;
  technicianUserForm: TechnicianUserForm;
  setTechnicianUserForm: Dispatch<SetStateAction<TechnicianUserForm>>;
  manualForm: ManualForm;
  setManualForm: Dispatch<SetStateAction<ManualForm>>;
  manualFile: File | null;
  setManualFile: Dispatch<SetStateAction<File | null>>;
  siteForm: SiteForm;
  setSiteForm: Dispatch<SetStateAction<SiteForm>>;
  officeForm: OfficeForm;
  setOfficeForm: Dispatch<SetStateAction<OfficeForm>>;
  siteGpsForm: SiteGpsForm;
  setSiteGpsForm: Dispatch<SetStateAction<SiteGpsForm>>;
  officeGpsForm: OfficeGpsForm;
  setOfficeGpsForm: Dispatch<SetStateAction<OfficeGpsForm>>;
  teamScopeDrafts: Record<string, string[]>;
  loadDashboard: () => Promise<void>;
  createDispatch: () => Promise<void>;
  openSoModal: (job: ApiJob) => void;
  createSite: () => Promise<void>;
  createOffice: () => Promise<void>;
  editSiteGps: (site: ManagerSiteLocation) => void;
  updateSiteGps: () => Promise<void>;
  editOfficeGps: (office: ManagerOfficeLocation) => void;
  updateOfficeGps: () => Promise<void>;
  requestCaptureDecision: (capture: ManagerLocationCaptureRequest, decision: 'approve' | 'reject') => void;
  toggleTeamSelection: (teamId: string) => void;
  updateScopeDraft: (userId: string, teamId: string) => void;
  createManagerAccount: () => Promise<void>;
  createTechnicianAccount: () => Promise<void>;
  requestResetUserPassword: (accessUser: ManagerAccessUser) => void;
  requestToggleUserStatus: (accessUser: ManagerAccessUser) => void;
  saveUserTeamScope: (accessUser: ManagerAccessUser) => Promise<void>;
  resetPilotData: (employeeId: string) => Promise<void>;
  runDummyCleanup: (employeeId: string, workDate: string, categories: Array<'activity_today' | 'notifications' | 'overtime' | 'leave'>) => Promise<void>;
  saveManual: () => Promise<void>;
  viewManualDocument: (documentId: string) => Promise<void>;
  downloadManualDocument: (documentId: string, titleValue: string) => Promise<void>;
  deleteManualDocument: (document: ApiManualDocument) => Promise<void>;
  requestOvertimeDecision: (row: ApiOvertimeRow, decision: 'approve' | 'reject') => void;
  requestLeaveDecision: (row: ManagerLeaveRequestRow, decision: 'approve' | 'reject') => void;
}

export const ManagerDashboardContext = createContext<ManagerDashboardContextValue | null>(null);

export function useManagerDashboardContext() {
  const context = useContext(ManagerDashboardContext);
  if (!context) throw new Error('Manager dashboard context is missing.');
  return context;
}
