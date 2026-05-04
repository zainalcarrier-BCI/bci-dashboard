import { AlertTriangle, Wind, MapPin, Navigation, HardHat, Truck } from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';

interface JobDetailProps {
  onBack: () => void;
  onOnTheWay: () => void;
  job: Job;
}

export default function JobDetail({ onBack, onOnTheWay, job }: JobDetailProps) {
  const isCompleted = job.status === 'COMPLETED';
  const mapQuery = encodeURIComponent([job.customer, job.site, job.area].filter(Boolean).join(' '));
  const openMaps = () => {
    if (!job.site) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${mapQuery}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout title={`Job #${job.id}`} onBack={onBack} activeTab="jobs">
      <div className="p-4 space-y-4 pb-32">
        {/* Priority Alert */}
        <div className="grid grid-cols-12 gap-3">
          <div className="col-span-12 bg-error-container rounded-2xl p-4 flex items-start gap-4 shadow-sm border-l-4 border-error">
            <AlertTriangle className="text-error w-6 h-6 shrink-0" />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-error-container">Urgent Issue</span>
              <p className="font-headline font-extrabold text-on-error-container leading-tight">{job.issue}</p>
            </div>
          </div>
          <div className="col-span-7 bg-surface-container-lowest rounded-2xl p-4 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Job Type</span>
              <p className="font-headline font-bold text-primary text-lg">{job.type}</p>
          </div>
          <div className="col-span-5 bg-tertiary-fixed rounded-2xl p-4 shadow-sm flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-tertiary-fixed">Equipment</span>
            <Wind className="text-on-tertiary-fixed w-6 h-6 mt-1" />
            <p className="mt-2 text-center text-xs font-bold text-on-tertiary-fixed">{job.equipment || '-'}</p>
          </div>
        </div>

        <section className="bg-surface-container-low rounded-3xl shadow-sm">
          <div className="p-4 space-y-4">
            <div>
              <h2 className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Customer & Site</h2>
              <p className="font-headline font-extrabold text-on-surface text-xl">{job.customer}</p>
              <div className="flex items-center gap-1 text-on-surface-variant mt-1">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">{job.site}{job.area ? ` / ${job.area}` : ''}</span>
              </div>
            </div>
            <button onClick={openMaps} className="w-full bg-surface-container-lowest rounded-2xl p-3 flex items-center justify-between group active:bg-surface-container-high transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-fixed-dim flex items-center justify-center">
                  <Navigation className="text-primary w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-on-surface-variant leading-none">Navigation</p>
                  <p className="text-sm font-bold text-on-surface">Open site in Google Maps</p>
                </div>
              </div>
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center active:scale-90 transition-transform">
                <MapPin className="w-5 h-5" />
              </div>
            </button>
          </div>
        </section>

        {/* Technical Overview */}
        <section className="bg-surface-container-lowest rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-outline-variant/20 pb-3">
            <HardHat className="text-primary-container w-5 h-5" />
            <h3 className="font-headline font-bold text-on-surface">Technical Overview</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Model</p>
              <p className="font-headline font-bold text-on-surface">{job.model}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">Status</p>
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full ${isCompleted ? 'bg-primary' : 'bg-error animate-pulse'}`}></span>
                <p className={`font-headline font-bold ${isCompleted ? 'text-primary' : 'text-error'}`}>{job.status.replaceAll('_', ' ')}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low rounded-2xl p-4">
            <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant mb-1">Incident Problem</p>
            <p className="text-on-surface text-sm font-medium leading-relaxed italic">
              "{job.issue ?? 'Work detail will be updated by operation engineer.'}"
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">SO Status</p>
              <p className="font-headline font-bold text-on-surface">{job.soStatus?.replaceAll('_', ' ') || '-'}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-on-surface-variant">SO Number</p>
              <p className="font-headline font-bold text-on-surface">{job.soNumber || 'Waiting SO'}</p>
            </div>
          </div>
        </section>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-0 w-full px-4 max-w-md mx-auto z-50">
        {isCompleted ? (
          <div className="w-full rounded-full bg-primary-fixed px-5 py-4 text-center font-headline font-extrabold text-primary shadow-[0px_8px_24px_rgba(0,102,110,0.12)]">
            Job Completed
          </div>
        ) : (
          <button 
            onClick={onOnTheWay}
            className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-headline font-extrabold text-lg shadow-[0px_8px_24px_rgba(0,102,110,0.3)] flex items-center justify-center gap-3 active:scale-95 transition-all"
          >
            <Truck className="w-6 h-6" />
            Set On The Way
          </button>
        )}
      </div>
    </Layout>
  );
}
