'use client';

import { ReactNode, createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Job, Screen, TodayMode, ApiUser } from '../types';
import {
  CheckOutResponse,
  GpsEvidencePayload,
  TodayPayload,
  hasStoredSession,
  getAuthSession,
  login,
  logout,
  requestPasswordReset,
  changePassword,
  getToday,
  createDaySession,
  submitOnTheWay,
  submitOfficeCheckIn,
  submitEndDay,
  submitCheckOut,
  submitWorkEvent,
  submitOvertimeRequest,
  createTechnicianUnplannedJob,
  submitTechnicianLeaveRequest,
} from '../services/api';
import type { LoginResponse } from '../services/api';

export interface AppContextType {
  // Auth state
  authenticatedUser: ApiUser | null;
  postPasswordLanding: 'technician' | 'manager';
  authReady: boolean;
  
  // Navigation
  currentScreen: Screen;
  direction: number;
  navigate: (screen: Screen, dir?: number) => void;
  navigateTab: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
  leaveBackTarget: Screen;
  
  // Today data
  todayMode: TodayMode;
  today: TodayPayload | null;
  jobs: Job[];
  selectedJob: Job;
  officeCheckedIn: boolean;
  refreshToday: () => Promise<void>;
  
  // Job management
  selectJob: (job: Job) => void;
  checkOutJob: Job | null;
  
  // Checkout & flow
  officeFlowMode: 'start' | 'return';
  lastCheckOutSummary: CheckOutResponse | null;
  resolutionBusy: boolean;
  overtimeHandled: boolean;
  
  // Actions
  login: (employeeId: string, password: string) => Promise<LoginResponse>;
  logout: () => Promise<void>;
  requestPasswordReset: (employeeId: string) => Promise<void>;
  changePassword: (current: string, newPassword: string) => Promise<LoginResponse>;
  
  // Workflow actions
  submitCheckIn: () => Promise<void>;
  submitEndOfDay: (mode: 'office' | 'site', note: string) => Promise<void>;
  submitCheckOut: (jobId: string, reason: string) => Promise<CheckOutResponse>;
  submitOvertime: (jobId: string, reason: string) => Promise<void>;
  
  // Job actions
  createUnplannedJob: (payload: any) => Promise<void>;
  submitLeaveRequest: (payload: any) => Promise<void>;
  submitOnTheWay: (jobId: string, direct?: boolean) => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [authenticatedUser, setAuthenticatedUser] = useState<ApiUser | null>(null);
  const [postPasswordLanding, setPostPasswordLanding] = useState<'technician' | 'manager'>('technician');
  const [authReady, setAuthReady] = useState(false);
  
  const [currentScreen, setCurrentScreen] = useState<Screen>('login');
  const [direction, setDirection] = useState(1);
  const [leaveBackTarget, setLeaveBackTarget] = useState<Screen>('home');
  
  const [todayMode, setTodayMode] = useState<TodayMode>('Not Started');
  const [today, setToday] = useState<TodayPayload | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [officeCheckedIn, setOfficeCheckedIn] = useState(false);
  
  const [checkOutJob, setCheckOutJob] = useState<Job | null>(null);
  const [officeFlowMode, setOfficeFlowMode] = useState<'start' | 'return'>('start');
  const [lastCheckOutSummary, setLastCheckOutSummary] = useState<CheckOutResponse | null>(null);
  const [resolutionBusy, setResolutionBusy] = useState(false);
  const [overtimeHandled, setOvertimeHandled] = useState(false);

  // --- Auth Actions ---
  const loginAction = useCallback(async (employeeId: string, password: string) => {
    const result = await login(employeeId, password);
    setAuthenticatedUser(result.user);
    setPostPasswordLanding(result.landing);
    return result;
  }, []);

  const logoutAction = useCallback(async () => {
    await logout();
    setAuthenticatedUser(null);
    setPostPasswordLanding('technician');
    setToday(null);
    setJobs([]);
    setSelectedJob(null);
    setTodayMode('Not Started');
    setOfficeCheckedIn(false);
    setLastCheckOutSummary(null);
    setCheckOutJob(null);
    setOfficeFlowMode('start');
    setResolutionBusy(false);
    setOvertimeHandled(false);
    setCurrentScreen('login');
    setDirection(-1);
  }, []);

  const requestPasswordReset = useCallback(async (employeeId: string) => {
    await requestPasswordReset(employeeId);
  }, []);

  const changePasswordAction = useCallback(async (current: string, newPassword: string) => {
    const result = await changePassword(current, newPassword);
    setAuthenticatedUser(result.user);
    setPostPasswordLanding(result.landing);
    return result;
  }, []);

  // --- Navigation Actions ---
  const navigate = useCallback((screen: Screen, dir: number = 1) => {
    setDirection(dir);
    setCurrentScreen(screen);
  }, []);

  const navigateTab = useCallback((tab: 'home' | 'jobs' | 'history' | 'profile') => {
    const tabScreens: Record<'home' | 'jobs' | 'history' | 'profile', Screen> = {
      home: 'home',
      jobs: 'calendar',
      history: 'history',
      profile: 'profile',
    };
    navigate(tabScreens[tab]);
  }, [navigate]);

  const selectJob = useCallback((job: Job) => {
    setSelectedJob(job);
    setCheckOutJob(null);
    setLastCheckOutSummary(null);
    setOvertimeHandled(false);
    navigate('job-detail');
  }, [navigate]);

  // --- Data Fetching ---
  const refreshToday = useCallback(async () => {
    try {
      const payload = await getToday();
      const mappedJobs = payload.jobs.map((apiJob) => {
        // Map API properties to component properties (handle name differences)
        return {
          apiId: apiJob.id,
          id: apiJob.job_no || apiJob.so_number || 'NO-JOB',
          customer: apiJob.customer || 'Unknown Customer',
          site: apiJob.site || 'Unknown Site',
          type: apiJob.job_type || 'Service',
          status: apiJob.status || 'ASSIGNED',
          time: (apiJob.scheduled_start_at || '--:--').substring(11, 16),
          priority: apiJob.priority || 'NORMAL',
          issue: (apiJob.issue || apiJob.description || apiJob.job_issue || '-'),
          model: apiJob.model || '-',
          equipment: '-',
          soStatus: apiJob.so_status || 'so_pending',
          soNumber: apiJob.so_number || null,
          visitNo: apiJob.visit_no || 0,
          area: apiJob.area || '-',
          brand: null,
          scheduledStartAt: apiJob.scheduled_start_at ? new Date(apiJob.scheduled_start_at) : undefined,
          scheduledEndAt: apiJob.scheduled_end_at ? new Date(apiJob.scheduled_end_at) : undefined,
        };
      });
      
      setToday(payload);
      setJobs(mappedJobs);
      setSelectedJob(
        mappedJobs.find((job) => job.status !== 'COMPLETED') ?? 
        mappedJobs[0] ?? 
        {
          apiId: '',
          id: 'NO-ACTIVE-JOB',
          customer: 'No Active Assignment',
          site: 'Standby / waiting dispatch',
          type: 'Standby',
          status: 'ASSIGNED',
          time: '--:--',
          priority: 'NORMAL',
          issue: 'Engineer belum assign job aktif untuk hari ini.',
          model: '-',
          equipment: '-',
          soStatus: 'so_pending',
          soNumber: null,
          visitNo: 0,
          area: '-',
          brand: null,
          scheduledStartAt: undefined,
          scheduledEndAt: undefined,
        }
      );
      setOfficeCheckedIn(Boolean(payload.office_check_in_today));
    } catch (error) {
      console.warn('Failed to refresh today data:', error);
    }
  }, []);

  const restoreSession = useCallback(async () => {
    if (!hasStoredSession()) {
      setAuthReady(true);
      return;
    }
    
    try {
      const session = await getAuthSession();
      setAuthenticatedUser(session.user);
      
      if (session.user.must_change_password) {
        setPostPasswordLanding(session.landing);
        setCurrentScreen('change-password');
        setDirection(1);
      } else {
        setCurrentScreen('home');
        await refreshToday();
      }
    } catch (error) {
      console.warn('Session restore failed:', error);
      await logout();
    } finally {
      setAuthReady(true);
    }
  }, [logout, refreshToday]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  // --- Workflow Actions ---
  const submitCheckIn = useCallback(async () => {
    setTodayMode('On Site');
    navigate('work-status');
  }, [navigate]);

  const submitOnTheWayAction = useCallback(async (jobId: string, direct?: boolean) => {
    await submitOnTheWay(jobId, direct);
    await refreshToday();
    setTodayMode('On The Way');
    navigate('on-the-way');
  }, [refreshToday, navigate]);

  const submitEndOfDay = useCallback(async (mode: 'office' | 'site', note: string) => {
    await submitEndDay({
      mode,
      note,
      exception_reason: null,
    });
    setLastCheckOutSummary(null);
    setCheckOutJob(null);
    setOvertimeHandled(false);
    await refreshToday();
    navigate('home');
    setTodayMode('Completed');
  }, [refreshToday, navigate]);

  const submitCheckOutAction = useCallback(async (jobId: string, reason: string) => {
    await submitCheckOut(jobId);
    await refreshToday();
    setCheckOutJob(jobs.find((j) => j.apiId === jobId) || null);
  }, [refreshToday, jobs]);

  const submitOvertime = useCallback(async (jobId: string, reason: string) => {
    await submitOvertimeRequest(jobId, { reason });
    setOvertimeHandled(true);
    await refreshToday();
    setTodayMode('Completed');
  }, [refreshToday]);

  const submitLeaveRequest = useCallback(async (payload: any) => {
    await submitTechnicianLeaveRequest(payload);
    await refreshToday();
  }, [refreshToday]);

  const submitWorkEvent = useCallback(async (jobId: string, eventType: string, reason: string) => {
    await submitWorkEvent(jobId, eventType, reason);
  }, []);

  const createUnplannedJob = useCallback(async (payload: any) => {
    const created = await createTechnicianUnplannedJob(payload);
    await refreshToday();
    setTodayMode('On The Way');
    navigate('on-the-way');
  }, [refreshToday, navigate]);

  const value = useMemo<AppContextType>(() => ({
    authenticatedUser,
    postPasswordLanding,
    authReady,
    
    currentScreen,
    direction,
    navigate,
    navigateTab,
    leaveBackTarget,
    
    todayMode,
    today,
    jobs,
    selectedJob: selectedJob || {
      apiId: '',
      id: 'NO-ACTIVE-JOB',
      customer: 'No Active Assignment',
      site: 'Standby / waiting dispatch',
      type: 'Standby',
      status: 'ASSIGNED',
      time: '--:--',
      priority: 'NORMAL',
      issue: 'Engineer belum assign job aktif untuk hari ini.',
      model: '-',
      equipment: '-',
      soStatus: 'so_pending',
      soNumber: null,
      visitNo: 0,
      area: '-',
      brand: null,
      scheduledStartAt: undefined,
      scheduledEndAt: undefined,
    },
    officeCheckedIn,
    refreshToday,
    
    selectJob,
    checkOutJob,
    
    officeFlowMode,
    lastCheckOutSummary,
    resolutionBusy,
    overtimeHandled,
    
    login,
    logout: logout as () => Promise<void>,
    requestPasswordReset,
    changePassword: changePasswordAction,
    
    submitCheckIn,
    submitEndOfDay,
    submitCheckOut: submitCheckOutAction,
    submitOvertime,
    
    createUnplannedJob,
    submitLeaveRequest,
    submitOnTheWay: submitOnTheWayAction,
  }), [
    authenticatedUser,
    postPasswordLanding,
    authReady,
    currentScreen,
    direction,
    navigate,
    navigateTab,
    leaveBackTarget,
    todayMode,
    today,
    jobs,
    selectedJob,
    officeCheckedIn,
    refreshToday,
    selectJob,
    checkOutJob,
    officeFlowMode,
    lastCheckOutSummary,
    resolutionBusy,
    overtimeHandled,
    login,
    logout,
    requestPasswordReset,
    changePasswordAction,
    submitCheckIn,
    submitEndOfDay,
    submitCheckOutAction,
    submitOvertime,
    createUnplannedJob,
    submitLeaveRequest,
    submitOnTheWayAction,
  ]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
