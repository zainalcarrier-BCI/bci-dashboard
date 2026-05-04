'use client';

import { Suspense, lazy, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AppProvider, useApp } from './context/AppContext';
import { SCREEN_ORDER } from './navigation/config';
import type { Screen } from './types';

// Lazy load components
const Login = lazy(() => import('./components/Login'));
const ChangePassword = lazy(() => import('./components/ChangePassword'));
const Home = lazy(() => import('./components/Home'));
const CalendarSchedule = lazy(() => import('./components/CalendarSchedule'));
const Profile = lazy(() => import('./components/Profile'));
const JobHistory = lazy(() => import('./components/JobHistory'));
const OfficeDay = lazy(() => import('./components/OfficeDay'));
const JobDetail = lazy(() => import('./components/JobDetail'));
const OnTheWay = lazy(() => import('./components/OnTheWay'));
const CheckIn = lazy(() => import('./components/CheckIn'));
const WorkStatus = lazy(() => import('./components/WorkStatus'));
const WorkClosing = lazy(() => import('./components/WorkClosing'));
const CheckOut = lazy(() => import('./components/CheckOut'));
const OvertimeRequest = lazy(() => import('./components/OvertimeRequest'));
const UnplannedJob = lazy(() => import('./components/UnplannedJob'));
const ManagerDashboard = lazy(() => import('./components/manager/ManagerDashboard'));
const Notifications = lazy(() => import('./components/Notifications'));
const ManualBook = lazy(() => import('./components/ManualBook'));
const LeaveRequest = lazy(() => import('./components/LeaveRequest'));
const PrintOvertime = lazy(() => import('./components/PrintOvertime'));

function AppContent() {
  const {
    currentScreen,
    direction,
    navigate,
    navigateTab,
    leaveBackTarget,
    selectJob,
    todayMode,
    today,
    jobs,
    officeCheckedIn,
    officeFlowMode,
    selectedJob,
    lastCheckOutSummary,
    checkOutJob,
    resolutionBusy,
    overtimeHandled,
    authenticatedUser,
    postPasswordLanding,
    refreshToday,
    logout,
    login,
    requestPasswordReset,
    changePassword,
    submitCheckIn,
    submitEndOfDay,
    submitCheckOut,
    submitOvertime,
    submitOnTheWay,
    submitWorkEvent: submitWorkEventType,
    createUnplannedJob,
    submitLeaveRequest,
  } = useApp();

  const readbleTodayMode = (mode: string, hasCompleted: boolean) => {
    const modeMap: Record<string, string> = {
      'office_prepare': 'Prepare Tools',
      'office_then_site': 'Office Check-in Submitted',
      'office_check_in_submitted': 'Office Check-in Submitted',
      'standby': 'Office / Standby',
      'assigned': 'Office / Standby',
      'dispatched': 'Office / Standby',
      'direct_to_site': 'Direct To Site',
      'on_the_way': 'On The Way',
      'on_site': 'On Site',
      'working': 'Working',
      'paused': 'Paused',
      'pending': 'Pending',
      'closing_submitted': 'Completed',
      'overtime_review': 'Completed',
      'completed': 'Completed',
      'Annual Leave': 'Annual Leave',
      'Sick Leave': 'Sick Leave',
    };
    return modeMap[mode] ?? (hasCompleted ? 'Completed' : 'Not Started');
  };

  useEffect(() => {
    if (todayMode === 'Not Started' && today && jobs.length > 0) {
      const hasCompleted = jobs.every(j => j.status === 'COMPLETED');
      const mode = readbleTodayMode(today.today_mode || 'not_started', hasCompleted);
      // Sync context if needed
    }
  }, [todayMode, today, jobs]);

  const selectJobWithFlow = (job: any) => {
    selectJob(job);
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? '100%' : '-100%',
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? '100%' : '-100%',
      opacity: 0,
    }),
  };

  const isManager = currentScreen === 'manager-dashboard';

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login':
        return (
          <Login
            onLogin={login}
            onForgotPassword={requestPasswordReset}
            onPasswordChange={async (current, newPassword) => {
              const result = await changePassword(current, newPassword);
              // Reset auth flow handled in context
            }}
            postLanding={postPasswordLanding}
          />
        );

      case 'change-password':
        return (
          <ChangePassword
            onBack={() => navigate('login', -1)}
            onSubmit={async (current, newPassword) => {
              await changePassword(current, newPassword);
              navigate('home');
              await refreshToday();
            }}
          />
        );

      case 'manager-dashboard':
        if (!authenticatedUser) return null;
        return (
          <ManagerDashboard
            user={authenticatedUser}
            onLogout={() => logout()}
          />
        );

      case 'home':
        return (
          <Home
            todayMode={todayMode}
            today={today}
            jobs={jobs}
            onSelectJob={selectJob}
            onOfficeCheckIn={() => navigate('office-day')}
            onPrepareTools={() => navigate('office-day')}
            onStandby={() => navigate('home')}
            onStartTripToSite={() => selectedJob && submitOnTheWay(selectedJob.apiId, false)}
            onOpenOfficeDay={() => navigate('office-day', -1)}
            onResumeTrip={() => navigate('on-the-way')}
            onOpenWorkStatus={() => navigate('work-status')}
            onOpenHistory={() => navigateTab('history')}
            onEmergencyJob={() => navigate('unplanned-job')}
            onDirectToSite={() => selectedJob && submitOnTheWay(selectedJob.apiId, true)}
            onManualBook={() => navigate('manual-book')}
            onNotifications={() => navigate('notifications')}
            onLeaveRequest={() => {
              navigate('leave-request');
            }}
            onTabChange={navigateTab}
          />
        );

      case 'calendar':
        return <CalendarSchedule jobs={jobs} onSelectJob={selectJob} onTabChange={navigateTab} />;

      case 'unplanned-job':
        return (
          <UnplannedJob
            officeCheckedIn={officeCheckedIn}
            onBack={() => navigate('home', -1)}
            onSubmit={async (payload: any) => {
              await createUnplannedJob(payload);
            }}
            onTabChange={navigateTab}
          />
        );

      case 'profile':
        return (
          <Profile
            user={authenticatedUser}
            onLeaveRequest={() => navigate('leave-request')}
            onManualBook={() => navigate('manual-book')}
            onPrintOvertime={() => navigate('print-overtime')}
            onLogout={() => logout()}
            onRefresh={refreshToday}
            onTabChange={navigateTab}
          />
        );

      case 'history':
        return <JobHistory onTabChange={navigateTab} />;

      case 'notifications':
        return <Notifications onBack={() => navigate('home', -1)} onTabChange={navigateTab} />;

      case 'manual-book':
        return <ManualBook onBack={() => navigate('profile', -1)} onTabChange={navigateTab} />;

      case 'leave-request':
        return (
          <LeaveRequest
            today={today}
            onBack={() => navigate(leaveBackTarget, -1)}
            onSubmit={async (payload: any) => {
              await submitLeaveRequest(payload);
              await refreshToday();
              navigate('home', -1);
            }}
            onTabChange={navigateTab}
          />
        );

      case 'print-overtime':
        return <PrintOvertime onBack={() => navigate('profile', -1)} onTabChange={navigateTab} />;

      case 'office-day':
        return (
          <OfficeDay
            onBack={() => navigate('home', -1)}
            job={selectedJob}
            activeOffice={today?.active_office_location ?? null}
            officeCheckedIn={officeCheckedIn}
            flowMode={officeFlowMode}
            onSubmitOfficeCheckIn={async () => {
              await refreshToday();
              navigate('office-day');
            }}
            onSubmitOfficeArrival={async () => await refreshToday()}
            onStartTrip={async () => {
              await submitOnTheWay(selectedJob.apiId, false);
              navigate('on-the-way');
            }}
            onEndDayFromOffice={async () => await submitEndOfDay('office', 'End day from office')}
            onTabChange={navigateTab}
          />
        );

      case 'job-detail':
        return (
          <JobDetail
            onBack={() => navigate('home', -1)}
            job={selectedJob}
            onOnTheWay={() => selectedJob && submitOnTheWay(selectedJob.apiId, false)}
          />
        );

      case 'on-the-way':
        return (
          <OnTheWay
            onBack={() => navigate('job-detail', -1)}
            job={selectedJob}
            onCheckIn={submitCheckIn}
            onTabChange={navigateTab}
          />
        );

      case 'check-in':
        return (
          <CheckIn
            onBack={() => navigate('job-detail', -1)}
            job={selectedJob}
            onSubmit={async () => {
              await refreshToday();
              navigate('work-status');
            }}
          />
        );

      case 'work-status':
        return (
          <WorkStatus
            onBack={() => navigate('check-in', -1)}
            job={selectedJob}
            onStatusChange={(status) => { /* TODO: update todayMode in context */ }}
            onWorkEvent={async (type, reason) => {
              await submitWorkEventType(selectedJob.apiId, type, reason);
            }}
            onComplete={() => navigate('work-closing')}
            onTabChange={navigateTab}
          />
        );

      case 'work-closing':
        return (
          <WorkClosing
            onBack={() => navigate('work-status', -1)}
            job={selectedJob}
            onSubmit={async (finalStatus, closingNote, evidence) => {
              await submitWorkEventType(selectedJob.apiId, 'work_closing_submitted', closingNote || '');
              navigate('check-out');
            }}
          />
        );

      case 'check-out':
        return (
          <CheckOut
            onBack={() => navigate('work-closing', -1)}
            job={checkOutJob || selectedJob}
            summary={lastCheckOutSummary}
            hasNextJob={jobs.some(j => j.apiId !== checkOutJob?.apiId && j.status !== 'COMPLETED')}
            resolutionBusy={resolutionBusy}
            onGoToNextJob={() => navigate('job-detail')}
            onReturnToOffice={() => navigate('office-day')}
            onEndDayFromSite={async () => await submitEndOfDay('site', 'End day from site')}
            onSubmit={async () => {
              const job = checkOutJob || selectedJob;
              await submitCheckOut(job.apiId, job.id);
              navigate('overtime-request');
            }}
          />
        );

      case 'overtime-request':
        return (
          <OvertimeRequest
            onBack={() => navigate('check-out', -1)}
            job={checkOutJob || selectedJob}
            summary={lastCheckOutSummary}
            onSubmit={async (reason) => {
              const job = checkOutJob || selectedJob;
              await submitOvertime(job.apiId, reason);
              navigate('check-out');
            }}
            onSkip={async () => {
              // Skip overtime
              navigate('check-out');
            }}
          />
        );

      default:
        return <Login onLogin={login} onForgotPassword={requestPasswordReset} />;
    }
  };

  return (
    <div className={`relative h-screen overflow-hidden bg-surface ${isManager ? 'w-full' : 'w-full max-w-md mx-auto shadow-2xl'}`}>
      <AnimatePresence initial={false} custom={direction} mode="wait">
        <motion.div
          key={currentScreen}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{
            x: { type: 'spring', stiffness: 300, damping: 30 },
            opacity: { duration: 0.2 },
          }}
          className="absolute inset-0 w-full h-full"
        >
          <Suspense fallback={
            <div className="flex h-full items-center justify-center text-sm font-bold text-[#5d6b66]">
              Loading...
            </div>
          }>
            {renderScreen()}
          </Suspense>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
