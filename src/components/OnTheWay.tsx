import { Clock, MapPin, Navigation, Route, ShieldCheck } from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';

interface OnTheWayProps {
  onBack: () => void;
  onCheckIn: () => void;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
  job: Job;
}

export default function OnTheWay({ onBack, onCheckIn, onTabChange, job }: OnTheWayProps) {
  const canNavigate = Boolean(job.site && job.site !== 'Standby / waiting dispatch');
  const mapQuery = encodeURIComponent([job.customer, job.site, job.area].filter(Boolean).join(' '));
  const openMaps = () => {
    if (!canNavigate) return;
    window.open(`https://www.google.com/maps/search/?api=1&query=${mapQuery}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Layout title="On The Way" onBack={onBack} activeTab="jobs" onTabChange={onTabChange}>
      <div className="p-4 space-y-6 pb-28">
        <section className="bg-primary text-white rounded-[2rem] p-6 shadow-[0px_8px_24px_rgba(0,102,110,0.22)] relative overflow-hidden">
          <Route className="absolute -right-4 -bottom-5 w-32 h-32 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-fixed">Active Dispatch</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold">Menuju Site</h2>
          <p className="mt-2 text-sm text-white/85">{job.customer} - {job.site}</p>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm">
            <Clock className="w-6 h-6 text-primary mb-3" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">On The Way Time</p>
            <p className="text-xl font-extrabold text-on-surface">{job.time}</p>
          </div>
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm">
            <ShieldCheck className="w-6 h-6 text-primary mb-3" />
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Event Status</p>
            <p className="text-xl font-extrabold text-on-surface">Logged</p>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-[2rem] p-5 space-y-4">
          <div className="flex items-start gap-3">
              <MapPin className="w-6 h-6 text-primary shrink-0" />
              <div>
                <p className="font-headline font-bold text-on-surface">Destination</p>
                <p className="text-sm text-on-surface-variant">{job.site}{job.area ? ` / ${job.area}` : ''}</p>
              </div>
            </div>
          <button onClick={openMaps} disabled={!canNavigate} className="w-full h-12 rounded-2xl bg-surface-container-lowest text-primary font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed">
            <Navigation className="w-5 h-5" />
            Open Maps
          </button>
        </section>

        <section className="bg-secondary-fixed/40 rounded-[2rem] p-5">
          <p className="text-sm font-semibold text-on-secondary-container">
            Check-in hanya dilakukan setelah teknisi berada di area site. Sistem akan mengambil GPS, selfie, dan timestamp saat check-in.
          </p>
        </section>

        <button
          onClick={onCheckIn}
          className="w-full h-14 bg-gradient-to-r from-primary to-primary-container text-white rounded-full font-headline font-extrabold text-lg shadow-[0px_8px_24px_rgba(0,102,110,0.25)] active:scale-95 transition-transform"
        >
          Check-in At Site
        </button>
      </div>
    </Layout>
  );
}
