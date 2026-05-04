import { useMemo, useState } from 'react';
import { AlertTriangle, BriefcaseBusiness, Building2, MapPin, Route } from 'lucide-react';
import Layout from './Layout';
import { ApiError, TechnicianUnplannedJobPayload } from '../services/api';

interface UnplannedJobProps {
  officeCheckedIn: boolean;
  onBack: () => void;
  onSubmit: (payload: TechnicianUnplannedJobPayload) => Promise<void>;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

const JOB_TYPE_OPTIONS = [
  { value: 'service_agreement', label: 'SA / Service Agreement' },
  { value: 'service_repair', label: 'SR / Service Repair' },
  { value: 'free_maintenance', label: 'FM / Free Maintenance' },
  { value: 'free_inspection', label: 'Free Inspection' },
  { value: 'warranty', label: 'Warranty' },
  { value: 'test_and_commissioning', label: 'T&C / Test & Commissioning' },
  { value: 'training', label: 'Training' },
  { value: 'emergency_call', label: 'Emergency Call' },
];

export default function UnplannedJob({
  officeCheckedIn,
  onBack,
  onSubmit,
  onTabChange,
}: UnplannedJobProps) {
  const [form, setForm] = useState<TechnicianUnplannedJobPayload>({
    customer: '',
    site: '',
    area: 'Jakarta',
    job_type: 'emergency_call',
    priority: 'emergency',
    note: '',
    start_mode: officeCheckedIn ? 'from_office' : 'direct_to_site',
    equipment_name: '',
    product_category: '',
    brand: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const startModeDescription = useMemo(() => {
    if (form.start_mode === 'direct_to_site') {
      return 'Teknisi langsung dibuat masuk flow perjalanan ke customer/site tanpa office check-in tambahan.';
    }
    return officeCheckedIn
      ? 'Job dibuat lalu langsung masuk flow Start Trip To Site dari office.'
      : 'Job dibuat dulu, lalu teknisi masuk ke office flow untuk check-in dan prepare sebelum trip.';
  }, [form.start_mode, officeCheckedIn]);

  const canSubmit = form.customer.trim() && form.site.trim() && form.job_type && !submitting;

  const updateField = <K extends keyof TechnicianUnplannedJobPayload>(key: K, value: TechnicianUnplannedJobPayload[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    if (!canSubmit) {
      setMessage('Customer, site, dan job type wajib diisi dulu.');
      return;
    }
    setSubmitting(true);
    setMessage('Membuat unplanned job...');
    try {
      await onSubmit({
        ...form,
        customer: form.customer.trim(),
        site: form.site.trim(),
        area: form.area?.trim() || 'Jakarta',
        note: form.note?.trim() || '',
        equipment_name: form.equipment_name?.trim() || '',
        product_category: form.product_category?.trim() || '',
        brand: form.brand?.trim() || '',
      });
    } catch (error) {
      setMessage(error instanceof ApiError ? error.detail || error.message : 'Unplanned job gagal dibuat. Coba lagi.');
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  return (
    <Layout title="Emergency / Unplanned Job" onBack={onBack} activeTab="home" onTabChange={onTabChange}>
      <div className="space-y-5 p-4 pb-28">
        <section className="relative overflow-hidden rounded-[2rem] bg-[#ba1a1a] p-6 text-white shadow-[0px_10px_28px_rgba(186,26,26,0.24)]">
          <AlertTriangle className="absolute -right-4 -bottom-4 h-28 w-28 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-white/70">Rapid Dispatch</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold">Buat Job Mendadak</h2>
          <p className="mt-2 text-sm leading-relaxed text-white/85">
            Gunakan form ini kalau ada emergency call atau pekerjaan mendadak dan engineer belum sempat dispatch dari web engineer.
          </p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
            <Building2 className="mb-3 h-6 w-6 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-outline">Office Status</p>
            <p className="mt-2 text-base font-extrabold text-on-surface">{officeCheckedIn ? 'Sudah Check In Office' : 'Belum Check In Office'}</p>
          </div>
          <div className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
            <Route className="mb-3 h-6 w-6 text-primary" />
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-outline">Start Mode</p>
            <p className="mt-2 text-base font-extrabold text-on-surface">{form.start_mode === 'direct_to_site' ? 'Direct To Site' : 'From Office'}</p>
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] bg-surface-container-lowest p-5 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Job Identity</p>
            <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">Data Dasar Pekerjaan</h3>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface">Customer</span>
            <input
              value={form.customer}
              onChange={(event) => updateField('customer', event.target.value)}
              placeholder="Contoh: Bank Mandiri"
              className="h-12 w-full rounded-2xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface">Site / Project</span>
            <input
              value={form.site}
              onChange={(event) => updateField('site', event.target.value)}
              placeholder="Contoh: Sudirman Office Tower B"
              className="h-12 w-full rounded-2xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface outline-none"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface">Area</span>
              <input
                value={form.area}
                onChange={(event) => updateField('area', event.target.value)}
                placeholder="Jakarta / Tangerang"
                className="h-12 w-full rounded-2xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface">Job Type</span>
              <select
                value={form.job_type}
                onChange={(event) => updateField('job_type', event.target.value)}
                className="h-12 w-full rounded-2xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface outline-none"
              >
                {JOB_TYPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface">Priority</span>
              <select
                value={form.priority}
                onChange={(event) => updateField('priority', event.target.value as TechnicianUnplannedJobPayload['priority'])}
                className="h-12 w-full rounded-2xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface outline-none"
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface">Start Mode</span>
              <select
                value={form.start_mode}
                onChange={(event) => updateField('start_mode', event.target.value as TechnicianUnplannedJobPayload['start_mode'])}
                className="h-12 w-full rounded-2xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface outline-none"
              >
                <option value="direct_to_site">Direct To Site</option>
                <option value="from_office">From Office</option>
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface">Equipment</span>
              <input
                value={form.equipment_name}
                onChange={(event) => updateField('equipment_name', event.target.value)}
                placeholder="Contoh: VRF Toshiba"
                className="h-12 w-full rounded-2xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface outline-none"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface">Brand / Category</span>
              <input
                value={form.brand}
                onChange={(event) => updateField('brand', event.target.value)}
                placeholder="Carrier / Toshiba"
                className="h-12 w-full rounded-2xl bg-surface-container-low px-4 text-sm font-semibold text-on-surface outline-none"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-on-surface">Note / Reason</span>
            <textarea
              value={form.note}
              onChange={(event) => updateField('note', event.target.value)}
              rows={4}
              placeholder="Contoh: Emergency call dari customer, engineer belum sempat dispatch."
              className="w-full rounded-2xl bg-surface-container-low px-4 py-3 text-sm font-semibold text-on-surface outline-none"
            />
          </label>
        </section>

        <section className="rounded-[2rem] bg-surface-container-lowest p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <BriefcaseBusiness className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-primary">Action Result</p>
              <h3 className="mt-1 font-headline text-xl font-extrabold text-on-surface">Create & Continue</h3>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-on-surface-variant">{startModeDescription}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canSubmit}
            className="mt-4 h-14 w-full rounded-full bg-[#ba1a1a] font-headline text-lg font-extrabold text-white transition-transform active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Creating...' : 'Create Emergency Job'}
          </button>
          {!!message && (
            <div className="mt-4 rounded-[1.25rem] bg-surface-container-low px-4 py-3">
              <p className="text-sm font-semibold text-on-surface-variant">{message}</p>
            </div>
          )}
        </section>

        <section className="rounded-[1.5rem] bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <p className="font-headline text-base font-extrabold text-on-surface">Catatan Operasional</p>
              <p className="mt-1 text-xs leading-relaxed text-on-surface-variant">
                Job ini akan ditandai sebagai unplanned / pending dispatch link supaya engineer bisa melengkapi dispatch resminya dari web engineer setelah teknisi sudah jalan.
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}
