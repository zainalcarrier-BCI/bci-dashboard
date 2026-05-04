export const TECHNICIAN_SIMULATION_EMPLOYEE_ID = 'TCH-001';
export const TECHNICIAN_SIMULATION_STORAGE_KEY = 'bci_tch_001_simulation';
export const TECHNICIAN_SIMULATION_EVENT = 'bci-technician-simulation-updated';

export type SimulationDayTypeMode = 'auto' | 'weekday' | 'weekend' | 'national_holiday' | 'company_holiday';

export interface TechnicianSimulationConfig {
  enabled: boolean;
  simulated_now: string;
  latitude: number;
  longitude: number;
  accuracy_meters: number;
  location_label: string;
  day_type_mode: SimulationDayTypeMode;
  holiday_name: string;
}

function safeLocalStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  return window.localStorage;
}

function dispatchSimulationChange() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TECHNICIAN_SIMULATION_EVENT));
}

function normalizeNumber(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSimulationConfig(value?: Partial<TechnicianSimulationConfig> | null): TechnicianSimulationConfig {
  const now = new Date();
  const parsedNow = value?.simulated_now ? new Date(value.simulated_now) : now;
  return {
    enabled: Boolean(value?.enabled),
    simulated_now: Number.isNaN(parsedNow.getTime()) ? now.toISOString() : parsedNow.toISOString(),
    latitude: normalizeNumber(value?.latitude, -6.1469),
    longitude: normalizeNumber(value?.longitude, 106.8449),
    accuracy_meters: Math.max(1, Math.round(normalizeNumber(value?.accuracy_meters, 12))),
    location_label: String(value?.location_label || 'JIExpo Kemayoran Office').trim() || 'JIExpo Kemayoran Office',
    day_type_mode: ['auto', 'weekday', 'weekend', 'national_holiday', 'company_holiday'].includes(String(value?.day_type_mode))
      ? (value?.day_type_mode as SimulationDayTypeMode)
      : 'auto',
    holiday_name: String(value?.holiday_name || '').trim(),
  };
}

export function readTechnicianSimulationConfig() {
  const storage = safeLocalStorage();
  if (!storage) return normalizeSimulationConfig();
  const raw = storage.getItem(TECHNICIAN_SIMULATION_STORAGE_KEY);
  if (!raw) return normalizeSimulationConfig();
  try {
    return normalizeSimulationConfig(JSON.parse(raw));
  } catch {
    return normalizeSimulationConfig();
  }
}

export function saveTechnicianSimulationConfig(config: Partial<TechnicianSimulationConfig>) {
  const storage = safeLocalStorage();
  const normalized = normalizeSimulationConfig({
    ...readTechnicianSimulationConfig(),
    ...config,
  });
  storage?.setItem(TECHNICIAN_SIMULATION_STORAGE_KEY, JSON.stringify(normalized));
  dispatchSimulationChange();
  return normalized;
}

export function clearTechnicianSimulationConfig() {
  const storage = safeLocalStorage();
  storage?.removeItem(TECHNICIAN_SIMULATION_STORAGE_KEY);
  dispatchSimulationChange();
  return normalizeSimulationConfig();
}

export function getActiveTechnicianSimulation(employeeId?: string | null) {
  if (String(employeeId || '').trim().toUpperCase() !== TECHNICIAN_SIMULATION_EMPLOYEE_ID) return null;
  const config = readTechnicianSimulationConfig();
  return config.enabled ? config : null;
}

export function buildTechnicianSimulationHeaders(employeeId?: string | null) {
  const simulation = getActiveTechnicianSimulation(employeeId);
  if (!simulation) return {};
  const headers: Record<string, string> = {
    'X-BCI-Sim-Enabled': 'true',
    'X-BCI-Simulated-Now': simulation.simulated_now,
    'X-BCI-Simulated-Work-Date': simulation.simulated_now.slice(0, 10),
  };
  if (simulation.day_type_mode !== 'auto') {
    headers['X-BCI-Simulated-Day-Type'] = simulation.day_type_mode;
  }
  if (simulation.holiday_name) {
    headers['X-BCI-Simulated-Holiday-Name'] = simulation.holiday_name;
  }
  return headers;
}

export function getTechnicianSimulationNow(employeeId?: string | null) {
  const simulation = getActiveTechnicianSimulation(employeeId);
  if (!simulation) return null;
  const value = new Date(simulation.simulated_now);
  return Number.isNaN(value.getTime()) ? null : value;
}

export function getTechnicianSimulationGps(employeeId?: string | null, note = '') {
  const simulation = getActiveTechnicianSimulation(employeeId);
  if (!simulation) return null;
  return {
    latitude: simulation.latitude,
    longitude: simulation.longitude,
    accuracy_meters: simulation.accuracy_meters,
    note: note ? `${note} / ${simulation.location_label}` : simulation.location_label,
  };
}

export function formatSimulationDateTimeInput(value?: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function parseSimulationDateTimeInput(value: string) {
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}
