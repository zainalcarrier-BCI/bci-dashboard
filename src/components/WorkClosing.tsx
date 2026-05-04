import { useState } from 'react';
import { ClipboardCheck, Camera, CheckCircle, ChevronDown, Clock3, FileText, MapPin } from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';
import EvidenceCapture from './EvidenceCapture';

interface WorkClosingProps {
  onBack: () => void;
  job: Job;
  onSubmit: (finalStatus: string, closingNote: string, evidenceFile: File | null) => void;
}

export default function WorkClosing({ onBack, job, onSubmit }: WorkClosingProps) {
  const [finalStatus, setFinalStatus] = useState('completed');
  const [closingNote, setClosingNote] = useState('');
  const [evidenceCaptured, setEvidenceCaptured] = useState(false);
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [error, setError] = useState('');

  const submit = () => {
    if (!closingNote.trim()) {
      setError('Closing note wajib diisi.');
      return;
    }
    if (!evidenceCaptured) {
      setError('Foto bukti penyelesaian wajib diambil sebelum submit.');
      return;
    }
    setError('');
    onSubmit(finalStatus, closingNote, evidenceFile);
  };

  return (
    <Layout title={`Closing Job ${job.id}`} onBack={onBack} activeTab="jobs">
      <div className="space-y-6 p-4 pb-24">
        <section className="space-y-4 rounded-[2rem] bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-primary" />
            <label htmlFor="final-status" className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Final Status</label>
          </div>
          <div className="relative">
            <select
              id="final-status"
              value={finalStatus}
              onChange={(event) => setFinalStatus(event.target.value)}
              className="h-14 w-full appearance-none rounded-2xl border-none bg-surface-container-lowest px-4 text-on-surface shadow-sm transition-all focus:ring-2 focus:ring-primary-container"
            >
              <option value="completed">Completed</option>
              <option value="pending">Pending Follow Up</option>
              <option value="cancelled">Cancelled</option>
              <option value="need_specialist">Need Specialist</option>
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <ChevronDown className="h-5 w-5 text-outline" />
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <label className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Evidence of Completion</label>
          </div>
          <EvidenceCapture
            title="Ambil Foto Bukti"
            helper="Capture equipment state or job site"
            capture="environment"
            required
            onCaptureStateChange={setEvidenceCaptured}
            onFileChange={setEvidenceFile}
          />
        </section>

        <section className="rounded-[2rem] border border-dashed border-primary/30 bg-primary/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-primary shadow-sm">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Coming Soon</p>
              <h3 className="mt-1 font-headline text-lg font-extrabold text-on-surface">Digital Service Report</h3>
              <p className="mt-2 text-sm text-on-surface-variant">
                Modul digital service report ditunda dulu. Untuk tahap sekarang teknisi cukup isi closing note dan foto bukti penyelesaian.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] bg-surface-container-low p-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <label htmlFor="closing-note" className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Closing Note</label>
          </div>
          <textarea
            id="closing-note"
            value={closingNote}
            onChange={(event) => setClosingNote(event.target.value)}
            className="min-h-[140px] w-full resize-none rounded-[2rem] border-none bg-surface-container-lowest p-6 text-on-surface shadow-sm transition-all focus:ring-2 focus:ring-primary-container"
            placeholder="Ringkasan penyelesaian, kondisi akhir unit, atau pending issue..."
          />
        </section>

        <div className="mx-auto flex w-fit items-center justify-center gap-3 rounded-full bg-secondary-fixed/30 px-4 py-2">
          <MapPin className="h-4 w-4 text-secondary" />
          <span className="text-xs font-medium text-on-secondary-container">Location Captured Automatically</span>
        </div>

        {error && (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>
        )}

        <div className="pt-4">
          <button
            onClick={submit}
            className="flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-primary to-primary-container font-bold text-white shadow-[0px_8px_24px_rgba(0,102,110,0.25)] transition-all duration-200 active:scale-95"
          >
            <CheckCircle className="h-6 w-6" />
            <span>Submit Closing</span>
          </button>
        </div>
      </div>
    </Layout>
  );
}
