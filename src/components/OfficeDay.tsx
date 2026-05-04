import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Briefcase, Building2, CheckCircle2, Clock, MapPin, Navigation, PackageCheck, RefreshCw, Route, ShieldCheck } from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';
import { ApiError, GpsEvidencePayload, ManagerOfficeLocation } from '../services/api';
import { getActiveTechnicianSimulation, getTechnicianSimulationGps, getTechnicianSimulationNow, TECHNICIAN_SIMULATION_EMPLOYEE_ID, TECHNICIAN_SIMULATION_EVENT } from '../services/technician-simulation';
import EvidenceCapture from './EvidenceCapture';

interface OfficeDayProps {
  onBack: () => void;
  job: Job;
  activeOffice?: ManagerOfficeLocation | null;
  officeCheckedIn: boolean;
  flowMode?: 'start' | 'return';
  onSubmitOfficeCheckIn: (gps?: GpsEvidencePayload, selfieFile?: File | null) => void | Promise<void>;
  onSubmitOfficeArrival?: (gps?: GpsEvidencePayload) => void | Promise<void>;
  onStartTrip: () => void | Promise<void>;
  onEndDayFromOffice?: (gps?: GpsEvidencePayload) => void | Promise<void>;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

export default function OfficeDay({
  onBack,
  job,
  activeOffice,
  officeCheckedIn,
  flowMode = 'start',
  onSubmitOfficeCheckIn,
  onSubmitOfficeArrival,
  onStartTrip,
  onEndDayFromOffice,
  onTabChange,
}: OfficeDayProps) {
  const nextJob = job;
  const hasActiveJob = Boolean(nextJob.apiId);
  const isReturnFlow = flowMode === 'return';
  const [gps, setGps] = useState<GpsEvidencePayload>({
    latitude: -6.14691,
    longitude: 106.84491,
    accuracy_meters: 999,
    note: 'Office attendance submitted from technician web',
  });
  const [gpsMessage, setGpsMessage] = useState('Waiting for device GPS...');
  const [selfieReady, setSelfieReady] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [exceptionReason, setExceptionReason] = useState('Office coordinate not accurate');
  const [exceptionNote, setExceptionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStartingTrip, setIsStartingTrip] = useState(false);
  const [isEndingDay, setIsEndingDay] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [officeArrivalSubmitted, setOfficeArrivalSubmitted] = useState(false);
  const [simulationVersion, setSimulationVersion] = useState(0);
  const gpsQuality = gps.accuracy_meters <= 50 ? 'Good' : gps.accuracy_meters <= 100 ? 'Review' : 'Poor';
  const activeSimulation = getActiveTechnicianSimulation(TECHNICIAN_SIMULATION_EMPLOYEE_ID);
  const displayClock = getTechnicianSimulationNow(TECHNICIAN_SIMULATION_EMPLOYEE_ID) ?? new Date();
  const gpsSource = gpsMessage.includes('Device') ? 'Device' : gpsMessage.includes('Reading') ? 'Reading' : gpsMessage.includes('Waiting') ? 'Pending' : 'Manual Review';
  const officeDistanceMeters = useMemo(() => {
    if (!activeOffice || activeOffice.latitude === null || activeOffice.longitude === null) return null;
    const fromLat = Number(gps.latitude);
    const fromLng = Number(gps.longitude);
    const toLat = Number(activeOffice.latitude);
    const toLng = Number(activeOffice.longitude);
    if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) return null;
    const earthRadiusMeters = 6371000;
    const toRadians = (degree: number) => (degree * Math.PI) / 180;
    const dLat = toRadians(toLat - fromLat);
    const dLng = toRadians(toLng - fromLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(dLng / 2) ** 2;
    return Math.round(earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }, [activeOffice, gps.latitude, gps.longitude]);
  const officeRadiusMeters = Number(activeOffice?.radius_meters || 0);
  const isEstimatedInsideOffice = officeDistanceMeters !== null && officeRadiusMeters > 0 && officeDistanceMeters <= officeRadiusMeters;
  const officeDistanceLabel = officeDistanceMeters === null ? 'Waiting for GPS' : officeDistanceMeters >= 1000 ? `${(officeDistanceMeters / 1000).toFixed(1)} km` : `${officeDistanceMeters} m`;
  const canSubmitOffice = selfieReady && !officeCheckedIn && !isSubmitting && isEstimatedInsideOffice;
  const canSubmitArrival = !officeArrivalSubmitted && !isSubmitting && isEstimatedInsideOffice;
  const canEndDayFromOfficeDirect = !isReturnFlow && officeCheckedIn && !hasActiveJob && isEstimatedInsideOffice;

  const refreshGps = () => {
    const simulatedGps = getTechnicianSimulationGps(TECHNICIAN_SIMULATION_EMPLOYEE_ID, isReturnFlow ? 'Office arrival simulation' : 'Office attendance simulation');
    if (simulatedGps) {
      setGps(simulatedGps);
      setGpsMessage(`Simulation GPS: ${activeSimulation?.location_label || 'Lab mode'}`);
      return;
    }
    if (!navigator.geolocation) {
      setGpsMessage('Browser GPS tidak tersedia. Check-in tetap bisa dilanjutkan dengan review server.');
      return;
    }
    setGpsMessage('Reading device GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: Number(position.coords.latitude.toFixed(7)),
          longitude: Number(position.coords.longitude.toFixed(7)),
          accuracy_meters: Math.round(position.coords.accuracy),
          note: 'Office attendance submitted from device GPS',
        });
        setGpsMessage('Device GPS captured');
      },
      () => setGpsMessage('GPS permission ditolak. Check-in akan masuk review bila dibutuhkan.'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 },
    );
  };

  useEffect(() => {
    refreshGps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simulationVersion, isReturnFlow]);

  useEffect(() => {
    const syncSimulation = () => setSimulationVersion((value) => value + 1);
    window.addEventListener(TECHNICIAN_SIMULATION_EVENT, syncSimulation);
    return () => {
      window.removeEventListener(TECHNICIAN_SIMULATION_EVENT, syncSimulation);
    };
  }, []);

  const submitOfficeAttendance = async () => {
    if (officeCheckedIn) {
      setSubmitMessage('Office check-in hari ini sudah tercatat. Submit ulang tidak diperlukan.');
      return;
    }
    if (!selfieReady) {
      setSubmitMessage('Ambil selfie office terlebih dahulu sebelum submit.');
      return;
    }
    if (!isEstimatedInsideOffice) {
      setSubmitMessage(`Tidak bisa submit. Estimasi jarak ke ${activeOffice?.name || 'office point'} adalah ${officeDistanceLabel}, di luar radius ${officeRadiusMeters || '-'} m.`);
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage('Submitting office check-in evidence...');
    try {
      await onSubmitOfficeCheckIn({
        ...gps,
        exception_reason: gpsQuality === 'Poor' || exceptionNote ? exceptionReason : undefined,
        note: exceptionNote || gps.note,
      }, selfieFile);
      setSubmitMessage('Office check-in berhasil disimpan.');
    } catch (error) {
      setSubmitMessage(error instanceof ApiError ? error.detail || error.message : 'Office check-in gagal. Refresh GPS dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOfficeArrival = async () => {
    if (officeArrivalSubmitted) {
      setSubmitMessage('Office arrival sudah tercatat. Lanjutkan dengan End Day from Office.');
      return;
    }
    if (!isEstimatedInsideOffice) {
      setSubmitMessage(`Tidak bisa submit. Estimasi jarak ke ${activeOffice?.name || 'office point'} adalah ${officeDistanceLabel}, di luar radius ${officeRadiusMeters || '-'} m.`);
      return;
    }
    if (!onSubmitOfficeArrival) return;
    setIsSubmitting(true);
    setSubmitMessage('Submitting office arrival validation...');
    try {
      await onSubmitOfficeArrival({
        ...gps,
        exception_reason: gpsQuality === 'Poor' || exceptionNote ? exceptionReason : undefined,
        note: exceptionNote || 'Returned to office from technician web',
      });
      setOfficeArrivalSubmitted(true);
      setSubmitMessage('Office arrival berhasil disimpan.');
    } catch (error) {
      setSubmitMessage(error instanceof ApiError ? error.detail || error.message : 'Office arrival gagal. Refresh GPS dan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const endDayFromOffice = async () => {
    if (!onEndDayFromOffice) return;
    setIsEndingDay(true);
    setSubmitMessage('Submitting end day from office...');
    try {
      await onEndDayFromOffice({
        ...gps,
        exception_reason: gpsQuality === 'Poor' || exceptionNote ? exceptionReason : undefined,
        note: 'End day from office',
      });
    } catch (error) {
      setSubmitMessage(error instanceof ApiError ? error.detail || error.message : 'End day from office gagal. Refresh GPS lalu coba lagi.');
    } finally {
      setIsEndingDay(false);
    }
  };

  const startTrip = async () => {
    setIsStartingTrip(true);
    try {
      await onStartTrip();
    } finally {
      setIsStartingTrip(false);
    }
  };

  return (
    <Layout title="Office Attendance" onBack={onBack} activeTab="home" onTabChange={onTabChange}>
      <div className="p-4 space-y-5 pb-28">
        <section className="bg-primary text-white rounded-[2rem] p-6 shadow-[0px_8px_24px_rgba(0,102,110,0.22)] relative overflow-hidden">
          <Building2 className="absolute -right-5 -bottom-5 w-36 h-36 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-fixed">{isReturnFlow ? 'Return Validation' : 'Daily Attendance'}</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold">{isReturnFlow ? 'Return To Office' : 'Office Check-in'}</h2>
          <p className="mt-2 text-sm text-white/85">
            {isReturnFlow
              ? 'Validasi bahwa teknisi benar-benar sudah kembali ke office sebelum menutup hari kerja.'
              : 'Teknisi sudah hadir di kantor untuk standby, briefing, atau prepare alat.'}
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm">
            <Clock className="w-6 h-6 text-primary mb-3" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">{isReturnFlow ? 'Office Arrival' : 'Office Check-in'}</p>
            <p className="text-xl font-extrabold text-on-surface">
              {new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false }).format(displayClock)}
            </p>
          </div>
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-primary mb-3" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Submission</p>
            <p className="text-xl font-extrabold text-on-surface">{isReturnFlow ? (officeArrivalSubmitted ? 'Submitted' : 'Pending') : (officeCheckedIn ? 'Submitted' : 'Pending')}</p>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary">Office Geofence</p>
              <h3 className="font-headline text-xl font-extrabold text-on-surface">{activeOffice?.name || 'Office point belum tersedia'}</h3>
              <p className="text-xs text-on-surface-variant mt-1">{activeOffice?.address || 'Radius valid akan dicek server berdasarkan office point aktif.'}</p>
            </div>
            <span className="rounded-full bg-primary-fixed/60 px-3 py-1 text-[10px] font-bold uppercase text-on-primary-fixed">
              {officeCheckedIn ? 'Submitted' : 'Server Check'}
            </span>
          </div>

          <div className="rounded-[1.5rem] bg-surface-container-high p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-outline">Current GPS Reading</p>
            <p className="mt-2 text-sm font-extrabold text-on-surface">{gps.latitude}, {gps.longitude}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
              Office reference: {activeOffice?.name || '-'} / Radius {officeRadiusMeters || '-'} m.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-surface-container-low p-3">
              <MapPin className="mb-2 h-5 w-5 text-primary" />
              <p className="text-[10px] font-bold uppercase text-outline">GPS</p>
              <p className="text-sm font-bold text-on-surface">{gpsSource}</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3">
              <Navigation className="mb-2 h-5 w-5 text-primary" />
              <p className="text-[10px] font-bold uppercase text-outline">Accuracy</p>
              <p className="text-sm font-bold text-on-surface">{gps.accuracy_meters} m</p>
            </div>
            <div className="rounded-2xl bg-surface-container-low p-3">
              <ShieldCheck className="mb-2 h-5 w-5 text-primary" />
              <p className="text-[10px] font-bold uppercase text-outline">Office Radius</p>
              <p className={`text-sm font-bold ${isEstimatedInsideOffice ? 'text-primary' : 'text-error'}`}>
                {officeDistanceMeters === null ? 'Checking' : isEstimatedInsideOffice ? 'Valid' : 'Outside'}
              </p>
            </div>
          </div>

          <div className={`rounded-[1.5rem] p-4 ${isEstimatedInsideOffice ? 'bg-primary-fixed/45' : 'bg-error/10'}`}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Distance Preview</p>
            <p className={`mt-1 font-headline text-2xl font-extrabold ${isEstimatedInsideOffice ? 'text-on-surface' : 'text-error'}`}>{officeDistanceLabel}</p>
            <p className="mt-1 text-xs font-semibold text-on-surface-variant">
              {officeDistanceMeters === null
                ? 'Tekan Refresh GPS untuk mengambil posisi HP.'
                : isEstimatedInsideOffice
                  ? `Estimasi berada dalam radius ${officeRadiusMeters} m. Server tetap melakukan validasi final saat submit.`
                  : `Di luar radius ${officeRadiusMeters || '-'} m. Check-in office akan ditolak sampai teknisi berada di area kantor.`}
            </p>
          </div>

          <button
            type="button"
            onClick={refreshGps}
            className="h-12 w-full rounded-2xl bg-surface-container-low text-primary font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh GPS
          </button>
          <p className="text-center text-[10px] font-semibold text-outline">
            {gpsMessage}: {gps.latitude}, {gps.longitude}
          </p>
          {gpsQuality !== 'Good' && (
            <p className="rounded-2xl bg-tertiary/10 px-4 py-3 text-[11px] font-bold text-tertiary">
              Accuracy masih {gps.accuracy_meters} m. Refresh GPS atau isi exception reason jika teknisi berada di area kantor/warehouse.
            </p>
          )}
        </section>

        <section className="bg-surface-container-low rounded-[2rem] p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-outline">
            {isReturnFlow ? 'Office Return Evidence' : 'Office Attendance Evidence'}
          </h3>
          {!isReturnFlow ? (
            <EvidenceCapture
              title="Ambil Selfie Office Check-in"
              helper="Wajah dan area office harus terlihat jelas"
              capture="user"
              required
              onCaptureStateChange={setSelfieReady}
              onFileChange={setSelfieFile}
            />
          ) : (
            <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 text-sm font-semibold text-on-surface-variant">
              Return to office menggunakan GPS geofence office. Selfie tidak diwajibkan di step ini agar flow lapangan lebih ringan.
            </div>
          )}
        </section>

        <details className="group overflow-hidden rounded-[2rem] border border-outline-variant/10 bg-surface-container-low">
          <summary className="flex cursor-pointer list-none items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-tertiary" />
              <span className="text-sm font-bold text-on-surface-variant">Outside Office Radius?</span>
            </div>
          </summary>
          <div className="space-y-4 p-4 pt-0">
            <div className="space-y-1">
              <label htmlFor="office-exception-reason" className="px-1 text-[10px] font-bold uppercase tracking-wider text-outline">
                Reason for Exception
              </label>
              <select id="office-exception-reason" name="officeExceptionReason" value={exceptionReason} onChange={(event) => setExceptionReason(event.target.value)} className="h-12 w-full rounded-xl border-none bg-surface-container-lowest text-sm font-medium focus:ring-2 focus:ring-primary">
                <option>Office coordinate not accurate</option>
                <option>Parking / loading area</option>
                <option>Warehouse / tool room nearby</option>
                <option>GPS inaccurate</option>
              </select>
            </div>
            <textarea
              name="officeExceptionNote"
              value={exceptionNote}
              onChange={(event) => setExceptionNote(event.target.value)}
              className="w-full rounded-xl border-none bg-surface-container-lowest p-3 text-sm focus:ring-2 focus:ring-primary"
              placeholder="Tambahkan catatan jika diperlukan..."
              rows={2}
            />
          </div>
        </details>

        <section className="bg-primary-fixed/45 rounded-[2rem] p-5 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
            <div>
              <p className="font-headline font-extrabold text-on-surface">
                {isReturnFlow
                  ? officeArrivalSubmitted
                    ? 'Office arrival submitted'
                    : 'Ready to submit office arrival'
                  : officeCheckedIn
                    ? 'Office check-in submitted'
                    : 'Ready to submit office check-in'}
              </p>
              <p className="text-xs text-on-surface-variant mt-1">
                {isReturnFlow
                  ? officeArrivalSubmitted
                    ? 'Office return sudah tercatat. Hari kerja bisa ditutup dari office.'
                    : 'Sistem akan memvalidasi GPS office dan mencatat timestamp kedatangan kembali.'
                  : officeCheckedIn
                    ? hasActiveJob
                      ? 'Event office attendance sudah tercatat. Teknisi boleh standby, prepare tools, atau mulai trip ke site.'
                      : 'Event office attendance sudah tercatat dan tidak ada job aktif. Hari kerja bisa langsung ditutup dari office.'
                    : 'Sistem akan menyimpan office geofence, selfie, GPS accuracy, distance, dan server timestamp.'}
              </p>
            </div>
          </div>
          {submitMessage && <p className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-xs font-bold text-primary">{submitMessage}</p>}
          <button
            type="button"
            onClick={() => void (isReturnFlow ? submitOfficeArrival() : submitOfficeAttendance())}
            disabled={isReturnFlow ? !canSubmitArrival : !canSubmitOffice}
            className={`h-14 w-full rounded-full text-white font-headline font-extrabold text-lg shadow-[0px_8px_24px_rgba(0,102,110,0.25)] active:scale-95 transition-transform ${
              (isReturnFlow ? officeArrivalSubmitted : officeCheckedIn) ? 'bg-primary-container/70 cursor-default' : 'bg-gradient-to-r from-primary to-primary-container disabled:opacity-60 disabled:cursor-not-allowed'
            }`}
          >
            {isReturnFlow
              ? officeArrivalSubmitted
                ? 'Office Arrival Submitted'
                : isSubmitting
                  ? 'Submitting...'
                  : !isEstimatedInsideOffice
                    ? 'Outside Office Radius'
                    : 'Submit Office Arrival'
              : officeCheckedIn
                ? 'Office Check-in Submitted'
                : isSubmitting
                  ? 'Submitting...'
                  : !selfieReady
                    ? 'Selfie Required'
                    : !isEstimatedInsideOffice
                      ? 'Outside Office Radius'
                      : 'Submit Office Check-in'}
          </button>
          {isReturnFlow && (
            <button
              type="button"
              onClick={() => void endDayFromOffice()}
              disabled={!officeArrivalSubmitted || isEndingDay}
              className="mt-3 h-14 w-full rounded-full bg-secondary-fixed font-headline font-extrabold text-lg text-on-secondary-fixed shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEndingDay ? 'Submitting...' : 'End Day From Office'}
            </button>
          )}
          {!isReturnFlow && officeCheckedIn && !hasActiveJob && (
            <button
              type="button"
              onClick={() => void endDayFromOffice()}
              disabled={!canEndDayFromOfficeDirect || isEndingDay}
              className="mt-3 h-14 w-full rounded-full bg-secondary-fixed font-headline font-extrabold text-lg text-on-secondary-fixed shadow-sm transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isEndingDay ? 'Submitting...' : !isEstimatedInsideOffice ? 'Outside Office Radius' : 'End Day From Office'}
            </button>
          )}
        </section>

        {!isReturnFlow && (
        <section className="bg-surface-container-low rounded-[2rem] p-5 space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-headline font-bold text-on-surface">{activeOffice?.name || 'Jakarta Office'}</p>
              <p className="text-sm text-on-surface-variant">{activeOffice?.address || 'Office point aktif sesuai branch teknisi'}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button className="h-12 rounded-2xl bg-surface-container-lowest text-on-surface font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Briefcase className="w-4 h-4 text-primary" />
              Standby
            </button>
            <button className="h-12 rounded-2xl bg-surface-container-lowest text-on-surface font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <PackageCheck className="w-4 h-4 text-primary" />
              Prepare Tools
            </button>
          </div>
        </section>
        )}

        {!isReturnFlow && (
        <section className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-sm space-y-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Prepare Tools Checklist</p>
            <h3 className="font-headline text-xl font-extrabold text-on-surface">Sebelum Berangkat</h3>
          </div>
          <div className="space-y-3">
            {['Tool bag', 'Safety equipment / APD', 'Laptop / controller cable', 'Refrigerant tools', 'Spare part / material'].map((item, index) => (
              <label key={item} className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-3">
                <input
                  type="checkbox"
                  defaultChecked={index < 2}
                  className="w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary"
                />
                <span className="text-sm font-semibold text-on-surface">{item}</span>
              </label>
            ))}
          </div>
        </section>
        )}

        {!isReturnFlow && (
        <section className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Next Scheduled Job</p>
          <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">{hasActiveJob ? nextJob.customer : 'Belum ada dispatch aktif'}</h3>
          <p className="text-sm text-on-surface-variant">{hasActiveJob ? nextJob.site : 'Teknisi tetap standby di office sampai engineer assign job baru.'}</p>
          <div className="mt-4 flex items-center justify-between rounded-2xl bg-surface-container-low p-4">
            <span className="text-sm font-bold text-on-surface">{hasActiveJob ? `Schedule ${nextJob.time}` : 'No active schedule'}</span>
            <span className="text-[10px] font-bold uppercase text-primary">{hasActiveJob ? nextJob.type : 'Standby'}</span>
          </div>
        </section>
        )}

        <section className="bg-secondary-fixed/40 rounded-[2rem] p-5">
          <p className="text-sm font-semibold text-on-secondary-container">
            {isReturnFlow
              ? 'Setelah office arrival tervalidasi, teknisi bisa langsung tutup hari dari office.'
              : !hasActiveJob && officeCheckedIn
                ? 'Karena tidak ada job aktif, teknisi bisa langsung check out dari office setelah GPS tervalidasi.'
                : 'Jika belum ada job, status tetap Office / Standby. Jika job sudah siap, teknisi bisa mulai trip ke site langsung dari halaman ini.'}
          </p>
        </section>

        {!isReturnFlow && (
        <button
          onClick={() => void startTrip()}
          disabled={!officeCheckedIn || isStartingTrip || !hasActiveJob}
          className={`w-full h-14 rounded-full font-headline font-extrabold text-lg shadow-[0px_8px_24px_rgba(0,102,110,0.25)] transition-transform flex items-center justify-center gap-3 ${
            officeCheckedIn && hasActiveJob
              ? 'bg-gradient-to-r from-primary to-primary-container text-white active:scale-95'
              : 'bg-surface-container-high text-outline cursor-not-allowed'
          }`}
        >
          <Route className="w-5 h-5" />
          {isStartingTrip ? 'Starting Trip...' : !officeCheckedIn ? 'Submit Office Check-in First' : !hasActiveJob ? 'No Active Job To Trip' : 'Start Trip To Site'}
        </button>
        )}

        <button
          onClick={onBack}
          className="w-full h-12 bg-surface-container-low text-on-surface-variant rounded-2xl font-bold active:scale-95 transition-transform"
        >
          Back To Home
        </button>
      </div>
    </Layout>
  );
}
