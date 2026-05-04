import { useEffect, useState } from 'react';
import { MapPin, Navigation, RefreshCw, Camera, AlertTriangle, ChevronDown, ChevronRight } from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';
import { GpsEvidencePayload } from '../services/api';
import { getActiveTechnicianSimulation, getTechnicianSimulationGps, getTechnicianSimulationNow, TECHNICIAN_SIMULATION_EMPLOYEE_ID, TECHNICIAN_SIMULATION_EVENT } from '../services/technician-simulation';
import EvidenceCapture from './EvidenceCapture';

interface CheckInProps {
  onBack: () => void;
  onSubmit: (gps?: GpsEvidencePayload, selfieFile?: File | null) => void | Promise<void>;
  job: Job;
}

export default function CheckIn({ onBack, onSubmit, job }: CheckInProps) {
  const [gps, setGps] = useState<GpsEvidencePayload>({
    latitude: -6.17831,
    longitude: 106.63191,
    accuracy_meters: 999,
    note: 'Site check-in submitted from technician web',
  });
  const [gpsMessage, setGpsMessage] = useState('Waiting for device GPS...');
  const [captureAsSiteLocation, setCaptureAsSiteLocation] = useState(false);
  const [selfieReady, setSelfieReady] = useState(false);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [exceptionReason, setExceptionReason] = useState('GPS Inaccurate');
  const [exceptionNote, setExceptionNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [simulationVersion, setSimulationVersion] = useState(0);

  const gpsQuality = gps.accuracy_meters <= 50 ? 'Good' : gps.accuracy_meters <= 100 ? 'Review' : 'Poor';
  const activeSimulation = getActiveTechnicianSimulation(TECHNICIAN_SIMULATION_EMPLOYEE_ID);
  const displayClock = getTechnicianSimulationNow(TECHNICIAN_SIMULATION_EMPLOYEE_ID) ?? new Date();
  const gpsSource = gpsMessage.includes('Device') ? 'Device' : gpsMessage.includes('Reading') ? 'Reading' : gpsMessage.includes('Waiting') ? 'Pending' : 'Manual Review';

  const refreshGps = () => {
    const simulatedGps = getTechnicianSimulationGps(TECHNICIAN_SIMULATION_EMPLOYEE_ID, 'Site check-in simulation');
    if (simulatedGps) {
      setGps(simulatedGps);
      setGpsMessage(`Simulation GPS: ${activeSimulation?.location_label || 'Lab mode'}`);
      return;
    }
    if (!navigator.geolocation) {
      setGpsMessage('Browser GPS tidak tersedia. Check-in tetap bisa dengan review server.');
      return;
    }
    setGpsMessage('Reading device GPS...');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          latitude: Number(position.coords.latitude.toFixed(7)),
          longitude: Number(position.coords.longitude.toFixed(7)),
          accuracy_meters: Math.round(position.coords.accuracy),
          note: 'Site check-in submitted from device GPS',
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
  }, [simulationVersion]);

  useEffect(() => {
    const syncSimulation = () => setSimulationVersion((value) => value + 1);
    window.addEventListener(TECHNICIAN_SIMULATION_EVENT, syncSimulation);
    return () => {
      window.removeEventListener(TECHNICIAN_SIMULATION_EVENT, syncSimulation);
    };
  }, []);

  const submitCheckIn = async () => {
    if (!selfieReady) {
      setSubmitMessage('Ambil selfie terlebih dahulu sebelum submit check-in.');
      return;
    }
    setIsSubmitting(true);
    setSubmitMessage('Submitting check-in evidence...');
    try {
      await onSubmit({
        ...gps,
        capture_as_site_location: captureAsSiteLocation,
        suggested_radius_meters: 200,
        exception_reason: gpsQuality === 'Poor' || exceptionNote ? exceptionReason : undefined,
        note: exceptionNote || gps.note,
      }, selfieFile);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout title="Check-in" onBack={onBack} activeTab="jobs">
      <div className="p-4 space-y-4 pb-24">
        {/* Job Context Card */}
        <section className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-[0px_8px_24px_rgba(28,27,31,0.06)]">
          <div className="flex justify-between items-start mb-2">
            <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-primary">Service Request</span>
                <h2 className="text-xl font-extrabold text-on-surface leading-tight tracking-tight">{job.id}</h2>
              </div>
              <div className="bg-surface-container-high px-3 py-1 rounded-full">
                <span className="text-[14px] font-bold text-on-surface">
                  {new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(displayClock)}
                </span>
              </div>
            </div>
          <div className="flex items-center gap-2 text-on-surface-variant">
            <MapPin className="w-4 h-4" />
            <p className="text-sm font-semibold">{job.customer}</p>
          </div>
        </section>

        {/* Operational Status Bento Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-low p-4 rounded-3xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <MapPin className="text-primary w-5 h-5" />
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">GPS Connection</p>
              <p className="text-sm font-bold text-on-surface">{gpsSource}</p>
            </div>
          </div>
          <div className="bg-surface-container-low p-4 rounded-3xl flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Navigation className="text-primary w-5 h-5" />
              <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)]"></div>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-outline">GPS Quality</p>
              <p className="text-sm font-bold text-on-surface">{gpsQuality}</p>
            </div>
          </div>
          <div className="col-span-2 bg-primary text-white p-4 rounded-3xl flex items-center justify-between relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">GPS Quality</p>
              <p className="text-3xl font-extrabold font-headline">{gps.accuracy_meters}<span className="text-lg ml-1 font-medium">m accuracy</span></p>
            </div>
            <Navigation className="text-white w-24 h-24 absolute -right-4 -bottom-2 opacity-10 rotate-45" />
            <button
              type="button"
              onClick={refreshGps}
              className="relative z-10 bg-primary-container px-4 py-2 rounded-xl text-xs font-bold active:scale-95 transition-transform flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh GPS
            </button>
          </div>
          <p className="col-span-2 text-center text-[10px] font-semibold text-outline">
            {gpsMessage}: {gps.latitude}, {gps.longitude} / accuracy {gps.accuracy_meters} m
          </p>
          {gpsQuality !== 'Good' && (
            <p className="col-span-2 rounded-2xl bg-tertiary/10 px-4 py-3 text-[11px] font-bold text-tertiary">
              Accuracy masih {gps.accuracy_meters} m. Ini menunjukkan kualitas GPS HP, bukan hasil geofence final. Radius site tetap dievaluasi server saat submit.
            </p>
          )}
        </div>

        {/* Camera Section */}
        <section className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-widest text-outline px-1">Evidence Acquisition</h3>
          <EvidenceCapture
            title="Ambil Foto Selfie di Lokasi"
            helper="Wajah harus terlihat jelas"
            capture="user"
            required
            onCaptureStateChange={setSelfieReady}
            onFileChange={setSelfieFile}
          />
        </section>

        {/* Exception Handler Section */}
        <details className="group bg-surface-container-low rounded-[2rem] overflow-hidden border border-outline-variant/10">
          <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-tertiary w-5 h-5" />
              <span className="text-sm font-bold text-on-surface-variant">Outside Geofence?</span>
            </div>
            <ChevronDown className="w-5 h-5 text-outline transition-transform group-open:rotate-180" />
          </summary>
          <div className="p-4 pt-0 space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-outline px-1">Reason for Exception</label>
              <select value={exceptionReason} onChange={(event) => setExceptionReason(event.target.value)} className="w-full bg-surface-container-lowest border-none rounded-xl text-sm font-medium focus:ring-2 focus:ring-primary h-12">
                <option>GPS Inaccurate</option>
                <option>Guardhouse Check-in</option>
                <option>Site Access Restrictions</option>
                <option>Remote Location Override</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-outline px-1">Additional Notes</label>
              <textarea value={exceptionNote} onChange={(event) => setExceptionNote(event.target.value)} className="w-full bg-surface-container-lowest border-none rounded-xl text-sm focus:ring-2 focus:ring-primary p-3" placeholder="Explain the discrepancy..." rows={2}></textarea>
            </div>
          </div>
        </details>

        <section className="rounded-[2rem] bg-surface-container-low p-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={captureAsSiteLocation}
              onChange={(event) => setCaptureAsSiteLocation(event.target.checked)}
              className="mt-1 h-5 w-5 rounded border-outline-variant text-primary focus:ring-primary"
            />
            <span>
              <span className="block text-sm font-bold text-on-surface">Submit as first visit GPS reference</span>
              <span className="mt-1 block text-xs text-on-surface-variant">
                Aktifkan jika titik project belum punya GPS resmi atau perlu dikoreksi oleh engineer.
              </span>
            </span>
          </label>
        </section>

        {/* Action Section */}
        <div className="pt-4">
          {submitMessage && <p className="mb-3 rounded-2xl bg-surface-container-low px-4 py-3 text-xs font-bold text-primary">{submitMessage}</p>}
          <button 
            onClick={() => void submitCheckIn()}
            disabled={!selfieReady || isSubmitting}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-extrabold tracking-tight text-lg shadow-[0px_8px_24px_rgba(0,102,110,0.25)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Submitting...' : selfieReady ? 'Submit Check-in' : 'Selfie Required'}
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-center text-[10px] text-outline mt-4 leading-relaxed px-4">
            Submit check-in akan menyimpan selfie, GPS HP, timestamp, dan validasi geofence final dari server.
          </p>
        </div>
      </div>
    </Layout>
  );
}
