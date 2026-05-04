// Navigation configuration for screen order and transitions
export const SCREEN_ORDER = [
  'login',
  'change-password',
  'home',
  'calendar',
  'profile',
  'history',
  'notifications',
  'manual-book',
  'leave-request',
  'print-overtime',
  'manager-dashboard',
  'unplanned-job',
  'office-day',
  'job-detail',
  'on-the-way',
  'check-in',
  'work-status',
  'work-closing',
  'check-out',
  'overtime-request',
] as const;

export type Screen = typeof SCREEN_ORDER[number];

export const navigationGroups = {
  authentication: ['login', 'change-password'],
  main: ['home', 'calendar', 'profile', 'history', 'notifications', 'manual-book', 'leave-request', 'print-overtime'],
  jobs: ['unplanned-job', 'office-day', 'job-detail', 'on-the-way', 'check-in', 'work-status', 'work-closing', 'check-out', 'overtime-request'],
  manager: ['manager-dashboard'] as Screen[],
};

export const screenFlow: Record<Screen, Screen[]> = {
  login: ['change-password'],
  'change-password': ['home'],
  home: ['profile', 'calendar', 'history', 'notifications', 'manager-dashboard', 'unplanned-job', 'manual-book', 'leave-request'],
  // ... more flow definitions
  // Simplified for now
  'manager-dashboard': ['login', 'home'],
  profile: ['history', 'leave-request', 'print-overtime', 'manual-book', 'home'],
  calendar: ['home'],
  history: ['home'],
  notifications: ['home'],
  'manual-book': ['profile', 'home'],
  'leave-request': ['home'],
  'print-overtime': ['profile', 'home'],
  'unplanned-job': ['home'],
  'office-day': ['home', 'on-the-way'],
  'job-detail': ['home', 'on-the-way'],
  'on-the-way': ['check-in', 'job-detail'],
  'check-in': ['work-status', 'job-detail'],
  'work-status': ['work-closing', 'check-in'],
  'work-closing': ['check-out'],
  'check-out': ['overtime-request', 'work-closing'],
  'overtime-request': ['check-out'],
};

// Animation directions helper
export const getDirection = (from: Screen, to: Screen): 1 | -1 => {
  const fromIndex = SCREEN_ORDER.indexOf(from);
  const toIndex = SCREEN_ORDER.indexOf(to);
  return toIndex > fromIndex ? 1 : -1;
};

export const isAuthOnlyScreen = (screen: Screen): boolean => {
  return navigationGroups.authentication.includes(screen);
};

export const isMainScreen = (screen: Screen): boolean => {
  return navigationGroups.main.includes(screen) || screen === 'manager-dashboard';
};
