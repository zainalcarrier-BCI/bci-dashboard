import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { Bell, BookOpen, Briefcase, Building2, Camera, ChevronRight, FlaskConical, HelpCircle, ImagePlus, LocateFixed, LogOut, Mail, Phone, Printer, Save, ShieldCheck, UserCircle2, Users, X, type LucideIcon } from 'lucide-react';
import { getCurrentMonthBounds, getManualDocuments, getPrintableOvertime, getTechnicianProfile, getTechnicianProfileSummary, requestProfileAvatarUploadUrl, updateTechnicianProfile, uploadFileToSignedUrl, type ApiUser, type TechnicianProfilePayload, type TechnicianProfileSummary } from '../services/api';
import { clearTechnicianSimulationConfig, formatSimulationDateTimeInput, parseSimulationDateTimeInput, readTechnicianSimulationConfig, saveTechnicianSimulationConfig, TECHNICIAN_SIMULATION_EMPLOYEE_ID, TECHNICIAN_SIMULATION_EVENT, type TechnicianSimulationConfig } from '../services/technician-simulation';
import Layout from './Layout';

interface ProfileProps {
  user?: ApiUser | null;
  onLeaveRequest: () => void;
  onManualBook: () => void;
  onPrintOvertime: () => void;
  onLogout: () => void;
  onRefreshTrialData?: () => Promise<void> | void;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

const PROFILE_CONTACT_STORAGE_PREFIX = 'bci_profile_contact_';
const PROFILE_PHOTO_STORAGE_PREFIX = 'bci_profile_photo_';

const AVATAR_PRESETS = [
  { id: 'teal', label: 'Teal', bg: '#0f766e', accent: '#ccfbf1' },
  { id: 'blue', label: 'Blue', bg: '#1d4ed8', accent: '#dbeafe' },
  { id: 'green', label: 'Green', bg: '#15803d', accent: '#dcfce7' },
  { id: 'amber', label: 'Amber', bg: '#b45309', accent: '#fef3c7' },
  { id: 'slate', label: 'Slate', bg: '#334155', accent: '#e2e8f0' },
  { id: 'rose', label: 'Rose', bg: '#be123c', accent: '#ffe4e6' },
] as const;

const SIMULATION_LOCATION_PRESETS = [
  { id: 'office_inside', label: 'Office Inside', latitude: -6.1469, longitude: 106.8449, accuracy_meters: 12, location_label: 'JIExpo Kemayoran Office / Inside Radius' },
  { id: 'office_outside', label: 'Office Outside', latitude: -6.1548, longitude: 106.8521, accuracy_meters: 18, location_label: 'Kemayoran Outer Road / Outside Radius' },
  { id: 'site_tangerang', label: 'Site Visit', latitude: -6.1783, longitude: 106.6319, accuracy_meters: 10, location_label: 'Tangerang Site / Direct To Site' },
] as const;

type SimulationScenarioId =
  | 'office_only_start'
  | 'office_only_end'
  | 'office_prepare_site'
  | 'direct_site'
  | 'office_outside'
  | 'weekend_job'
  | 'overnight_job';

const SIMULATION_SCENARIOS: Array<{
  id: SimulationScenarioId;
  label: string;
  description: string;
}> = [
  { id: 'office_only_start', label: 'Office Only Start', description: 'Pagi hari di office untuk check-in dan standby tanpa job aktif.' },
  { id: 'office_only_end', label: 'Office Only End', description: 'Sore hari di office untuk trial end day tanpa overtime.' },
  { id: 'office_prepare_site', label: 'Office Then Site', description: 'Masuk office dulu untuk prepare, lalu lanjut ke site.' },
  { id: 'direct_site', label: 'Direct To Site', description: 'Langsung ke site sejak pagi tanpa office check-in.' },
  { id: 'office_outside', label: 'Outside Office Radius', description: 'Simulasi gagal office check-in karena posisi di luar radius.' },
  { id: 'weekend_job', label: 'Weekend Job', description: 'Trial logic weekend dimana hanya jam kerja yang dihitung.' },
  { id: 'overnight_job', label: 'Overnight Job', description: 'Trial pekerjaan malam yang lewat jam 00:00.' },
] as const;

function nextDayAt(base: Date, hour: number, minute: number, plusDays = 0) {
  const value = new Date(base);
  value.setDate(value.getDate() + plusDays);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function nextSaturdayAt(base: Date, hour: number, minute: number) {
  const value = new Date(base);
  const delta = (6 - value.getDay() + 7) % 7 || 7;
  value.setDate(value.getDate() + delta);
  value.setHours(hour, minute, 0, 0);
  return value;
}

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase() ?? '')
    .join('') || 'BC';
}

function buildAvatarDataUrl(name: string, bg: string, accent: string) {
  const initials = initialsFromName(name);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
      <rect width="320" height="320" rx="72" fill="${bg}" />
      <circle cx="160" cy="118" r="56" fill="${accent}" fill-opacity="0.92" />
      <path d="M72 274c10-52 50-86 88-86h0c38 0 78 34 88 86" fill="${accent}" fill-opacity="0.92" />
      <text x="160" y="292" text-anchor="middle" font-family="Arial, sans-serif" font-size="62" font-weight="700" fill="white">${initials}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function optimizeImageFile(file: File) {
  return new Promise<string>((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSize = 360;
      const scale = Math.min(maxSize / image.width, maxSize / image.height, 1);
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('Canvas is not available'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Image failed to load'));
    };
    image.src = objectUrl;
  });
}

function readJsonStorage<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export default function Profile({ user, onLeaveRequest, onManualBook, onPrintOvertime, onLogout, onRefreshTrialData, onTabChange }: ProfileProps) {
  const displayName = user?.full_name || 'Andi Saputra';
  const profileTitle = user?.role === 'technician' ? 'Field Technician' : 'Field Engineer Specialist';
  const galleryInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [summary, setSummary] = useState<TechnicianProfileSummary | null>(null);
  const [summaryBusy, setSummaryBusy] = useState(false);
  const [profile, setProfile] = useState<TechnicianProfilePayload | null>(null);
  const [profileBusy, setProfileBusy] = useState(false);
  const [saveBusy, setSaveBusy] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [manualBadgeCount, setManualBadgeCount] = useState(0);
  const [printableOtCount, setPrintableOtCount] = useState(0);
  const [form, setForm] = useState({
    phone: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
  });
  const [simulationConfig, setSimulationConfig] = useState<TechnicianSimulationConfig>(() => readTechnicianSimulationConfig());
  const [simulationMessage, setSimulationMessage] = useState('');
  const [simulationBusy, setSimulationBusy] = useState(false);

  const defaultAvatar = useMemo(
    () => buildAvatarDataUrl(displayName, AVATAR_PRESETS[0].bg, AVATAR_PRESETS[0].accent),
    [displayName],
  );
  const avatarChoices = useMemo(
    () => AVATAR_PRESETS.map((preset) => ({
      ...preset,
      value: buildAvatarDataUrl(displayName, preset.bg, preset.accent),
    })),
    [displayName],
  );
  const contactStorageKey = `${PROFILE_CONTACT_STORAGE_PREFIX}${user?.employee_id || 'guest'}`;
  const photoStorageKey = `${PROFILE_PHOTO_STORAGE_PREFIX}${user?.employee_id || 'guest'}`;
  const photoValue = profile?.user.avatar_url || readJsonStorage<string>(photoStorageKey) || defaultAvatar;
  const effectiveEmployeeId = profile?.user.employee_id || user?.employee_id || '';
  const isSimulationLabUser = effectiveEmployeeId === TECHNICIAN_SIMULATION_EMPLOYEE_ID;

  useEffect(() => {
    let cancelled = false;
    const loadAll = async () => {
      const storedContact = readJsonStorage<typeof form>(contactStorageKey);
      try {
        setProfileBusy(true);
        setSummaryBusy(true);
        const [profilePayload, summaryPayload, manualPayload, printablePayload] = await Promise.all([
          getTechnicianProfile(),
          getTechnicianProfileSummary(),
          getManualDocuments(),
          getPrintableOvertime(getCurrentMonthBounds().start, getCurrentMonthBounds().end),
        ]);
        if (cancelled) return;
        setProfile(profilePayload);
        setSummary(summaryPayload);
        const now = Date.now();
        const recentManuals = manualPayload.rows.filter((row) => {
          if (!row.uploaded_at) return false;
          const uploadedAt = new Date(row.uploaded_at).getTime();
          return Number.isFinite(uploadedAt) && now - uploadedAt <= 7 * 24 * 60 * 60 * 1000;
        });
        setManualBadgeCount(recentManuals.length);
        setPrintableOtCount(printablePayload.rows.filter((row) => row.status === 'approved').length);
        setForm({
          phone: profilePayload.user.phone || storedContact?.phone || '',
          emergency_contact_name: profilePayload.user.emergency_contact_name || storedContact?.emergency_contact_name || '',
          emergency_contact_phone: profilePayload.user.emergency_contact_phone || storedContact?.emergency_contact_phone || '',
        });
        if (profilePayload.user.avatar_url) {
          localStorage.setItem(photoStorageKey, JSON.stringify(profilePayload.user.avatar_url));
        }
      } catch (error) {
        console.warn('Technician profile failed to load', error);
        if (!cancelled && storedContact) {
          setForm(storedContact);
        }
        if (!cancelled) {
          setManualBadgeCount(0);
          setPrintableOtCount(0);
        }
      } finally {
        if (!cancelled) {
          setProfileBusy(false);
          setSummaryBusy(false);
        }
      }
    };
    void loadAll();
    return () => {
      cancelled = true;
    };
  }, [contactStorageKey, photoStorageKey]);

  useEffect(() => {
    const syncSimulation = () => setSimulationConfig(readTechnicianSimulationConfig());
    window.addEventListener(TECHNICIAN_SIMULATION_EVENT, syncSimulation);
    return () => {
      window.removeEventListener(TECHNICIAN_SIMULATION_EVENT, syncSimulation);
    };
  }, []);

  const teamChain = summary?.team_line?.length
    ? [
        { role: 'Team', name: `${summary.technician.team} / ${summary.technician.region}` },
        ...summary.team_line,
      ]
    : [
        { role: 'Team', name: 'Team A - Jakarta Region' },
        { role: 'Product Specialist', name: 'Rudi Nugroho' },
        { role: 'Operation Engineer', name: 'Sinta Hartono' },
        { role: 'Assistant Manager', name: 'Fajar Maulana' },
        { role: 'Senior Manager', name: 'Zainal Abidin' },
      ];

  const settingItems: Array<{ Icon: LucideIcon; label: string; onClick?: () => void; badge?: string }> = [
    { Icon: Briefcase, label: 'Leave & Attendance', onClick: onLeaveRequest, badge: summary?.leave.pending_requests ? `${summary.leave.pending_requests} Pending` : undefined },
    { Icon: BookOpen, label: 'Manual Book Library', onClick: onManualBook, badge: manualBadgeCount ? `${manualBadgeCount} New` : undefined },
    { Icon: Printer, label: 'Print Overtime', onClick: onPrintOvertime, badge: printableOtCount ? `${printableOtCount} Ready` : undefined },
    { Icon: Bell, label: 'Notification Settings' },
    { Icon: HelpCircle, label: 'Help & Support' },
    { Icon: LogOut, label: 'Logout', onClick: onLogout },
  ];

  const persistProfile = async (partial: {
    phone?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    avatar_url?: string | null;
  }) => {
    setSaveBusy(true);
    setSaveMessage('');
    try {
      const merged = {
        phone: partial.phone ?? form.phone,
        emergency_contact_name: partial.emergency_contact_name ?? form.emergency_contact_name,
        emergency_contact_phone: partial.emergency_contact_phone ?? form.emergency_contact_phone,
        avatar_url: partial.avatar_url ?? profile?.user.avatar_url ?? null,
      };
      const next = await updateTechnicianProfile({
        phone: merged.phone,
        emergency_contact_name: merged.emergency_contact_name,
        emergency_contact_phone: merged.emergency_contact_phone,
        avatar_url: merged.avatar_url,
      });
      const fresh = await getTechnicianProfile().catch(() => next);
      setProfile(fresh);
      setForm({
        phone: fresh.user.phone || merged.phone || '',
        emergency_contact_name: fresh.user.emergency_contact_name || merged.emergency_contact_name || '',
        emergency_contact_phone: fresh.user.emergency_contact_phone || merged.emergency_contact_phone || '',
      });
      localStorage.setItem(contactStorageKey, JSON.stringify({
        phone: fresh.user.phone || merged.phone || '',
        emergency_contact_name: fresh.user.emergency_contact_name || merged.emergency_contact_name || '',
        emergency_contact_phone: fresh.user.emergency_contact_phone || merged.emergency_contact_phone || '',
      }));
      if (fresh.user.avatar_url) {
        localStorage.setItem(photoStorageKey, JSON.stringify(fresh.user.avatar_url));
      }
      setSaveMessage('Profile berhasil disimpan.');
      setPhotoError('');
    } catch (error) {
      console.warn('Profile update failed', error);
      const fallbackAvatar = partial.avatar_url ?? profile?.user.avatar_url ?? null;
      localStorage.setItem(contactStorageKey, JSON.stringify({
        phone: partial.phone ?? form.phone,
        emergency_contact_name: partial.emergency_contact_name ?? form.emergency_contact_name,
        emergency_contact_phone: partial.emergency_contact_phone ?? form.emergency_contact_phone,
      }));
      if (fallbackAvatar) {
        localStorage.setItem(photoStorageKey, JSON.stringify(fallbackAvatar));
      }
      setForm({
        phone: partial.phone ?? form.phone,
        emergency_contact_name: partial.emergency_contact_name ?? form.emergency_contact_name,
        emergency_contact_phone: partial.emergency_contact_phone ?? form.emergency_contact_phone,
      });
      setProfile((current) => current ? {
        ...current,
        user: {
          ...current.user,
          phone: partial.phone ?? form.phone,
          emergency_contact_name: partial.emergency_contact_name ?? form.emergency_contact_name,
          emergency_contact_phone: partial.emergency_contact_phone ?? form.emergency_contact_phone,
          avatar_url: fallbackAvatar ?? current.user.avatar_url ?? null,
        },
      } : current);
      setSaveMessage('Profile tersimpan di device ini. Backend akan disinkronkan saat request berikutnya berhasil.');
    } finally {
      setSaveBusy(false);
    }
  };

  const handleFileSelection = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setPhotoBusy(true);
      const optimizedDataUrl = await optimizeImageFile(file);
      try {
        const upload = await requestProfileAvatarUploadUrl(file.name || 'avatar.jpg');
        await uploadFileToSignedUrl(upload.signed_upload_url, file);
        await persistProfile({ avatar_url: `storage://profile-avatars/${upload.path}` });
      } catch (uploadError) {
        console.warn('Profile avatar storage upload failed, using compact fallback', uploadError);
        await persistProfile({ avatar_url: optimizedDataUrl });
      }
      setShowPhotoOptions(false);
    } catch (error) {
      console.warn('Profile image update failed', error);
      setPhotoError('Foto belum berhasil diproses. Coba pilih ulang.');
    } finally {
      setPhotoBusy(false);
      event.target.value = '';
    }
  };

  const updateSimulation = (partial: Partial<TechnicianSimulationConfig>) => {
    setSimulationConfig((current) => ({ ...current, ...partial }));
  };

  const refreshTrialData = async (message?: string) => {
    if (!onRefreshTrialData) {
      if (message) setSimulationMessage(message);
      return;
    }
    setSimulationBusy(true);
    try {
      await onRefreshTrialData();
      setSimulationMessage(message || 'Trial data berhasil dimuat ulang dari simulation lab.');
    } catch (error) {
      console.warn('Simulation refresh failed', error);
      setSimulationMessage('Preset tersimpan, tapi reload data trial belum berhasil. Coba tekan Reload Trial Data.');
    } finally {
      setSimulationBusy(false);
    }
  };

  const saveSimulation = async () => {
    const saved = saveTechnicianSimulationConfig(simulationConfig);
    setSimulationConfig(saved);
    await refreshTrialData(saved.enabled ? 'Simulation TCH-001 aktif dan data trial sudah dimuat ulang.' : 'Simulation config tersimpan tapi belum aktif.');
  };

  const disableSimulation = async () => {
    const saved = saveTechnicianSimulationConfig({ ...simulationConfig, enabled: false });
    setSimulationConfig(saved);
    await refreshTrialData('Simulation dimatikan. TCH-001 kembali pakai waktu dan GPS real device.');
  };

  const resetSimulation = async () => {
    const cleared = clearTechnicianSimulationConfig();
    setSimulationConfig(cleared);
    await refreshTrialData('Simulation config direset ke default lab dan data trial dimuat ulang.');
  };

  const applyLocationPreset = (presetId: (typeof SIMULATION_LOCATION_PRESETS)[number]['id']) => {
    const preset = SIMULATION_LOCATION_PRESETS.find((item) => item.id === presetId);
    if (!preset) return;
    setSimulationConfig((current) => ({
      ...current,
      latitude: preset.latitude,
      longitude: preset.longitude,
      accuracy_meters: preset.accuracy_meters,
      location_label: preset.location_label,
    }));
  };

  const nudgeSimulationTime = (hours: number) => {
    const base = new Date(simulationConfig.simulated_now);
    const current = Number.isNaN(base.getTime()) ? new Date() : base;
    current.setHours(current.getHours() + hours);
    setSimulationConfig((config) => ({ ...config, simulated_now: current.toISOString() }));
  };

  const buildScenarioConfig = (scenarioId: SimulationScenarioId): TechnicianSimulationConfig => {
    const now = new Date();
    const officeInside = SIMULATION_LOCATION_PRESETS.find((item) => item.id === 'office_inside')!;
    const officeOutside = SIMULATION_LOCATION_PRESETS.find((item) => item.id === 'office_outside')!;
    const siteVisit = SIMULATION_LOCATION_PRESETS.find((item) => item.id === 'site_tangerang')!;

    switch (scenarioId) {
      case 'office_only_start':
        return {
          ...simulationConfig,
          enabled: true,
          simulated_now: nextDayAt(now, 7, 55).toISOString(),
          latitude: officeInside.latitude,
          longitude: officeInside.longitude,
          accuracy_meters: officeInside.accuracy_meters,
          location_label: 'JIExpo Kemayoran Office / Morning Attendance',
          day_type_mode: 'weekday',
          holiday_name: '',
        };
      case 'office_only_end':
        return {
          ...simulationConfig,
          enabled: true,
          simulated_now: nextDayAt(now, 17, 30).toISOString(),
          latitude: officeInside.latitude,
          longitude: officeInside.longitude,
          accuracy_meters: officeInside.accuracy_meters,
          location_label: 'JIExpo Kemayoran Office / End Day',
          day_type_mode: 'weekday',
          holiday_name: '',
        };
      case 'office_prepare_site':
        return {
          ...simulationConfig,
          enabled: true,
          simulated_now: nextDayAt(now, 8, 10).toISOString(),
          latitude: officeInside.latitude,
          longitude: officeInside.longitude,
          accuracy_meters: officeInside.accuracy_meters,
          location_label: 'JIExpo Kemayoran Office / Prepare Tools',
          day_type_mode: 'weekday',
          holiday_name: '',
        };
      case 'direct_site':
        return {
          ...simulationConfig,
          enabled: true,
          simulated_now: nextDayAt(now, 9, 40).toISOString(),
          latitude: siteVisit.latitude,
          longitude: siteVisit.longitude,
          accuracy_meters: siteVisit.accuracy_meters,
          location_label: 'Tangerang Site / Direct To Site',
          day_type_mode: 'weekday',
          holiday_name: '',
        };
      case 'office_outside':
        return {
          ...simulationConfig,
          enabled: true,
          simulated_now: nextDayAt(now, 8, 5).toISOString(),
          latitude: officeOutside.latitude,
          longitude: officeOutside.longitude,
          accuracy_meters: officeOutside.accuracy_meters,
          location_label: 'Kemayoran Outer Road / Outside Office Radius',
          day_type_mode: 'weekday',
          holiday_name: '',
        };
      case 'weekend_job':
        return {
          ...simulationConfig,
          enabled: true,
          simulated_now: nextSaturdayAt(now, 10, 0).toISOString(),
          latitude: siteVisit.latitude,
          longitude: siteVisit.longitude,
          accuracy_meters: siteVisit.accuracy_meters,
          location_label: 'Weekend Site Visit / Emergency or Scheduled Job',
          day_type_mode: 'weekend',
          holiday_name: '',
        };
      case 'overnight_job':
        return {
          ...simulationConfig,
          enabled: true,
          simulated_now: nextDayAt(now, 23, 30).toISOString(),
          latitude: siteVisit.latitude,
          longitude: siteVisit.longitude,
          accuracy_meters: siteVisit.accuracy_meters,
          location_label: 'Night Shift Site / Overnight Trial',
          day_type_mode: 'weekday',
          holiday_name: '',
        };
      default:
        return simulationConfig;
    }
  };

  const applyScenarioPreset = async (scenarioId: SimulationScenarioId) => {
    const preset = SIMULATION_SCENARIOS.find((item) => item.id === scenarioId);
    const next = buildScenarioConfig(scenarioId);
    const saved = saveTechnicianSimulationConfig(next);
    setSimulationConfig(saved);
    await refreshTrialData(`${preset?.label || 'Scenario'} aktif. Data trial TCH-001 sudah dimuat ulang untuk ${preset?.description?.toLowerCase() || 'flow operasional'}.`);
  };

  const accountRows = [
    { Icon: Mail, label: 'Email Address', value: profile?.user.email || user?.email || 'andi.saputra@bci-field.com', readOnly: true, field: 'email' as const },
    { Icon: Phone, label: 'Phone Number', value: form.phone, readOnly: false, field: 'phone' as const },
    { Icon: Building2, label: 'Branch', value: summary?.technician.branch || 'Jakarta Central', readOnly: true, field: 'branch' as const },
    { Icon: Briefcase, label: 'Level / Team', value: summary ? `${summary.technician.level.replaceAll('_', ' ')} / ${summary.technician.team}` : 'Field Operations - HVAC', readOnly: true, field: 'level' as const },
  ];

  return (
    <Layout title="Profile" activeTab="profile" onTabChange={onTabChange}>
      <div className="space-y-5 p-4 pb-28">
        <section className="relative overflow-hidden rounded-[2rem] bg-primary-container p-6 text-on-primary">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="relative z-10 flex items-center gap-5">
            <div className="relative h-24 w-24 overflow-hidden rounded-[1.5rem] border-4 border-white/20 bg-primary-fixed-dim">
              <img src={photoValue} alt="Technician profile" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => setShowPhotoOptions(true)}
                className="absolute bottom-1 right-1 grid h-8 w-8 place-items-center rounded-full bg-white text-primary shadow-lg active:scale-95"
                aria-label="Change profile photo"
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <div className="min-w-0">
              <div className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-1 text-[10px] font-bold uppercase tracking-wider">
                <ShieldCheck className="h-3 w-3" />
                Active / On Duty
              </div>
              <h2 className="mt-2 font-headline text-2xl font-extrabold">{displayName}</h2>
              <p className="text-sm text-white/80">{profileTitle}</p>
              <button
                type="button"
                onClick={() => setShowPhotoOptions(true)}
                className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white/90"
              >
                <ImagePlus className="h-4 w-4" />
                Change Photo
              </button>
            </div>
          </div>
        </section>

        {photoError && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{photoError}</div>
        )}
        {saveMessage && (
          <div className="rounded-2xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary">{saveMessage}</div>
        )}

        <section className="grid grid-cols-3 gap-3">
          {[
            [summaryBusy ? '...' : String(summary?.kpi.completed_jobs ?? 0), 'Jobs Done'],
            [summaryBusy ? '...' : `${Math.round(summary?.kpi.attendance_rate ?? 0)}%`, 'Attendance'],
            [summaryBusy ? '...' : String(summary?.kpi.score ?? 0), 'KPI Score'],
          ].map(([value, label]) => (
            <div key={label} className="rounded-[1.5rem] bg-surface-container-lowest p-4 text-center shadow-sm">
              <p className="font-headline text-2xl font-extrabold text-primary">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</p>
            </div>
          ))}
        </section>

        {summary && (
          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Submission Rate</p>
              <p className="mt-2 font-headline text-xl font-extrabold text-primary">{Math.round(summary.kpi.submission_rate)}%</p>
              <p className="mt-1 text-xs font-semibold text-on-surface-variant">{summary.kpi.submitted_jobs} submitted / {summary.kpi.assigned_jobs} assigned</p>
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Annual Leave Balance</p>
              <p className="mt-2 font-headline text-xl font-extrabold text-primary">{summary.leave.annual_remaining_days} Days</p>
              <p className="mt-1 text-xs font-semibold text-on-surface-variant">{summary.leave.annual_used_days} used / {summary.leave.annual_pending_days} pending</p>
            </div>
          </section>
        )}

        {isSimulationLabUser && (
          <section className="space-y-4 rounded-[2rem] bg-surface-container-low p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-tertiary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-tertiary">
                  <FlaskConical className="h-3.5 w-3.5" />
                  TCH-001 Simulation Lab
                </div>
                <h3 className="mt-3 font-headline text-lg font-extrabold text-on-surface">Scenario Control</h3>
                <p className="mt-1 text-xs font-semibold leading-relaxed text-on-surface-variant">
                  Pakai akun ini untuk trial waktu, lokasi, weekday/weekend, dan holiday tanpa menunggu kondisi real di lapangan.
                </p>
              </div>
              <label className="flex items-center gap-2 rounded-full bg-surface-container-lowest px-3 py-2 text-xs font-bold text-on-surface">
                <input
                  type="checkbox"
                  checked={simulationConfig.enabled}
                  onChange={(event) => updateSimulation({ enabled: event.target.checked })}
                  className="h-4 w-4 rounded border-outline-variant text-primary focus:ring-primary"
                />
                Active
              </label>
            </div>

            {simulationMessage && (
              <div className="rounded-2xl border border-tertiary/20 bg-tertiary/10 px-4 py-3 text-xs font-bold text-tertiary">
                {simulationMessage}
              </div>
            )}

            <div className="rounded-[1.5rem] border border-primary/15 bg-primary/5 p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Trial Runtime</p>
                  <p className="mt-1 text-sm font-extrabold text-on-surface">
                    {simulationConfig.enabled ? 'Simulation Active' : 'Simulation Inactive'}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-on-surface-variant">
                    Setelah pilih preset, tekan reload atau tunggu auto refresh agar Home, attendance, dan job flow ikut baca skenario terbaru.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void refreshTrialData('Data trial berhasil dimuat ulang dari simulation lab.')}
                  disabled={simulationBusy}
                  className="rounded-full bg-primary px-4 py-2 text-[11px] font-bold text-white disabled:opacity-60"
                >
                  {simulationBusy ? 'Reloading...' : 'Reload Trial Data'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Simulated Time</p>
                <input
                  type="datetime-local"
                  value={formatSimulationDateTimeInput(simulationConfig.simulated_now)}
                  onChange={(event) => updateSimulation({ simulated_now: parseSimulationDateTimeInput(event.target.value) })}
                  className="mt-3 h-12 w-full rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                />
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => nudgeSimulationTime(-12)} className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-on-surface">-12h</button>
                  <button type="button" onClick={() => nudgeSimulationTime(12)} className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-on-surface">+12h</button>
                  <button type="button" onClick={() => nudgeSimulationTime(24)} className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-on-surface">+1 day</button>
                </div>
              </div>

              <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Calendar Mode</p>
                <select
                  value={simulationConfig.day_type_mode}
                  onChange={(event) => updateSimulation({ day_type_mode: event.target.value as TechnicianSimulationConfig['day_type_mode'] })}
                  className="mt-3 h-12 w-full rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                >
                  <option value="auto">Auto</option>
                  <option value="weekday">Weekday</option>
                  <option value="weekend">Weekend</option>
                  <option value="national_holiday">National Holiday</option>
                  <option value="company_holiday">Company Holiday</option>
                </select>
                <input
                  type="text"
                  value={simulationConfig.holiday_name}
                  onChange={(event) => updateSimulation({ holiday_name: event.target.value })}
                  placeholder="Holiday label (optional)"
                  className="mt-3 h-12 w-full rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                />
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <LocateFixed className="h-4 w-4 text-primary" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Location Override</p>
              </div>
              <input
                type="text"
                value={simulationConfig.location_label}
                onChange={(event) => updateSimulation({ location_label: event.target.value })}
                placeholder="Location label"
                className="mt-3 h-12 w-full rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
              />
              <div className="mt-3 grid grid-cols-3 gap-3">
                <input
                  type="number"
                  step="0.000001"
                  value={simulationConfig.latitude}
                  onChange={(event) => updateSimulation({ latitude: Number(event.target.value) })}
                  placeholder="Latitude"
                  className="h-12 rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={simulationConfig.longitude}
                  onChange={(event) => updateSimulation({ longitude: Number(event.target.value) })}
                  placeholder="Longitude"
                  className="h-12 rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                />
                <input
                  type="number"
                  min="1"
                  value={simulationConfig.accuracy_meters}
                  onChange={(event) => updateSimulation({ accuracy_meters: Number(event.target.value) })}
                  placeholder="Accuracy"
                  className="h-12 rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                />
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2">
                {SIMULATION_LOCATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyLocationPreset(preset.id)}
                    className="rounded-full bg-surface-container px-3 py-2 text-[11px] font-bold text-on-surface"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Quick Scenario Preset</p>
              <p className="mt-2 text-xs font-semibold leading-relaxed text-on-surface-variant">
                Pilih skenario operasional siap trial. Preset ini langsung mengaktifkan simulation dengan waktu dan lokasi yang sesuai use case.
              </p>
              <div className="mt-4 space-y-2">
                {SIMULATION_SCENARIOS.map((scenario) => (
                  <button
                    key={scenario.id}
                    type="button"
                    onClick={() => applyScenarioPreset(scenario.id)}
                    className="flex w-full items-start justify-between gap-3 rounded-[1.25rem] bg-surface-container px-4 py-3 text-left"
                  >
                    <span>
                      <span className="block text-sm font-extrabold text-on-surface">{scenario.label}</span>
                      <span className="mt-1 block text-xs font-semibold text-on-surface-variant">{scenario.description}</span>
                    </span>
                    <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase text-white">
                      Apply
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => void saveSimulation()} disabled={simulationBusy} className="rounded-full bg-primary px-4 py-3 text-xs font-bold text-white disabled:opacity-60">
                Save & Reload
              </button>
              <button type="button" onClick={() => void refreshTrialData('Data trial berhasil dimuat ulang dari simulation lab.')} disabled={simulationBusy} className="rounded-full bg-surface-container-lowest px-4 py-3 text-xs font-bold text-on-surface disabled:opacity-60">
                Reload Data
              </button>
              <button type="button" onClick={() => void disableSimulation()} disabled={simulationBusy} className="rounded-full bg-surface-container-lowest px-4 py-3 text-xs font-bold text-on-surface disabled:opacity-60">
                Disable
              </button>
              <button type="button" onClick={() => void resetSimulation()} disabled={simulationBusy} className="rounded-full bg-surface-container-lowest px-4 py-3 text-xs font-bold text-on-surface disabled:opacity-60">
                Reset
              </button>
            </div>
          </section>
        )}

        <section className="space-y-3 rounded-[2rem] bg-surface-container-low p-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-base font-extrabold text-on-surface">Contact & Emergency</h3>
              <p className="text-xs text-on-surface-variant">Data ini akan sinkron ke backend profile teknisi.</p>
            </div>
            <button
              type="button"
              onClick={() => void persistProfile({})}
              disabled={saveBusy || profileBusy}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saveBusy ? 'Saving...' : 'Save'}
            </button>
          </div>

          <div className="space-y-3">
            {accountRows.map(({ Icon, label, value, readOnly, field }) => (
              <div key={label} className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
                <div className="mb-2 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{label}</p>
                    {readOnly && <p className="text-sm font-semibold text-on-surface">{value}</p>}
                  </div>
                </div>
                {!readOnly && (
                  <input
                    className="h-12 w-full rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                    value={value}
                    onChange={(event) => setForm((current) => ({ ...current, [field]: event.target.value }))}
                    placeholder={label}
                  />
                )}
              </div>
            ))}

            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Emergency Contact Name</p>
              <input
                className="mt-2 h-12 w-full rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                value={form.emergency_contact_name}
                onChange={(event) => setForm((current) => ({ ...current, emergency_contact_name: event.target.value }))}
                placeholder="Nama PIC keluarga"
              />
            </div>
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Emergency Contact Phone</p>
              <input
                className="mt-2 h-12 w-full rounded-2xl border-0 bg-surface-container px-4 text-sm font-semibold text-on-surface outline-none"
                value={form.emergency_contact_phone}
                onChange={(event) => setForm((current) => ({ ...current, emergency_contact_phone: event.target.value }))}
                placeholder="+62..."
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] bg-surface-container-low p-5">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h3 className="font-headline font-extrabold text-on-surface">Team & Escalation Line</h3>
          </div>
          <div className="space-y-3">
            {teamChain.map((item, index) => (
              <div key={item.role} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-extrabold ${index === 0 ? 'bg-primary text-white' : 'bg-surface-container-lowest text-primary'}`}>
                    {index + 1}
                  </div>
                  {index < teamChain.length - 1 && <div className="h-8 w-0.5 bg-outline-variant/30" />}
                </div>
                <div className="pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-outline">{item.role}</p>
                  <p className="text-sm font-bold text-on-surface">{item.name}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="overflow-hidden rounded-[2rem] bg-surface-container-low">
          {settingItems.map(({ Icon, label, onClick, badge }) => (
            <button
              key={label}
              type="button"
              onClick={onClick}
              className="flex w-full items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest p-4 transition-colors last:border-b-0 active:bg-surface-container"
            >
              <span className="flex items-center gap-4 text-sm font-semibold text-on-surface">
                <Icon className="h-5 w-5 text-primary" />
                {label}
              </span>
              <span className="flex items-center gap-2">
                {badge && <span className="rounded-full bg-tertiary/15 px-2 py-1 text-[9px] font-bold uppercase text-tertiary">{badge}</span>}
                <ChevronRight className="h-4 w-4 text-outline" />
              </span>
            </button>
          ))}
        </section>

        {showPhotoOptions && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4">
            <div className="w-full max-w-md rounded-[2rem] bg-surface-container-low p-5 shadow-2xl">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h3 className="font-headline text-lg font-extrabold text-on-surface">Update Profile Photo</h3>
                  <p className="text-sm text-on-surface-variant">Pilih dari galeri, kamera, atau avatar preset.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhotoOptions(false)}
                  className="grid h-9 w-9 place-items-center rounded-full bg-surface-container-high text-on-surface-variant"
                  aria-label="Close photo picker"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <button type="button" onClick={() => galleryInputRef.current?.click()} disabled={photoBusy} className="rounded-2xl bg-surface-container-lowest p-4 text-left shadow-sm disabled:opacity-50">
                  <ImagePlus className="mb-3 h-5 w-5 text-primary" />
                  <div className="text-sm font-bold text-on-surface">Gallery</div>
                  <div className="mt-1 text-xs text-on-surface-variant">Ambil dari file foto.</div>
                </button>
                <button type="button" onClick={() => cameraInputRef.current?.click()} disabled={photoBusy} className="rounded-2xl bg-surface-container-lowest p-4 text-left shadow-sm disabled:opacity-50">
                  <Camera className="mb-3 h-5 w-5 text-primary" />
                  <div className="text-sm font-bold text-on-surface">Camera</div>
                  <div className="mt-1 text-xs text-on-surface-variant">Ambil foto langsung.</div>
                </button>
                <button type="button" onClick={() => void persistProfile({ avatar_url: defaultAvatar }).then(() => setShowPhotoOptions(false))} disabled={photoBusy} className="rounded-2xl bg-surface-container-lowest p-4 text-left shadow-sm disabled:opacity-50">
                  <UserCircle2 className="mb-3 h-5 w-5 text-primary" />
                  <div className="text-sm font-bold text-on-surface">Reset</div>
                  <div className="mt-1 text-xs text-on-surface-variant">Kembali ke avatar default.</div>
                </button>
              </div>

              <div className="mt-5">
                <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-outline">Avatar Preset</p>
                <div className="grid grid-cols-3 gap-3">
                  {avatarChoices.map((choice) => {
                    const active = photoValue === choice.value;
                    return (
                      <button
                        key={choice.id}
                        type="button"
                        onClick={() => void persistProfile({ avatar_url: choice.value }).then(() => setShowPhotoOptions(false))}
                        className={`rounded-2xl border p-2 ${active ? 'border-primary bg-primary/10' : 'border-outline-variant/30 bg-surface-container-lowest'}`}
                      >
                        <img src={choice.value} alt={`${choice.label} avatar`} className="h-20 w-full rounded-xl object-cover" />
                        <div className="mt-2 text-xs font-bold text-on-surface">{choice.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {photoBusy && <p className="mt-4 text-sm font-semibold text-primary">Processing photo...</p>}

              <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelection} />
              <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFileSelection} />
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
