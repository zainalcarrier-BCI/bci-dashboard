import { useState } from 'react';
import { MapPin, CheckCircle, PlayCircle, PauseCircle, Clock, ChevronDown } from 'lucide-react';
import Layout from './Layout';
import { Job, TodayMode } from '../types';

interface WorkStatusProps {
  onBack: () => void;
  onStatusChange: (status: TodayMode) => void;
  onWorkEvent: (eventType: string, reason?: string) => Promise<unknown>;
  onComplete: () => void;
  job: Job;
}

type WorkState = 'arrived' | 'working' | 'paused' | 'pending';

interface TimelineItem {
  label: string;
  time: string;
  note: string;
  active?: boolean;
}

const statusCopy: Record<WorkState, string> = {
  arrived: 'Arrived',
  working: 'Working',
  paused: 'Paused',
  pending: 'Pending',
};

export default function WorkStatus({ onBack, onStatusChange, onWorkEvent, onComplete, job }: WorkStatusProps) {
  const [workState, setWorkState] = useState<WorkState>('arrived');
  const [busyEvent, setBusyEvent] = useState('');
  const [message, setMessage] = useState('');
  const [timeline, setTimeline] = useState<TimelineItem[]>([
    {
      label: 'On The Way',
      time: '08:30',
      note: 'Dispatched from regional hub',
    },
    {
      label: 'Check-in',
      time: '09:15',
      note: 'Technician validated at entry point',
      active: true,
    },
  ]);

  const getActionTime = () =>
    new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(new Date());

  const addTimelineEvent = (event: TimelineItem) => {
    setTimeline((items) => [...items.map((item) => ({ ...item, active: false })), { ...event, active: true }]);
  };

  const recordWorkEvent = async (nextState: WorkState, eventType: string, label: string, note: string, todayMode: TodayMode) => {
    if (busyEvent) return;
    setBusyEvent(eventType);
    setMessage(`Submitting ${label.toLowerCase()}...`);
    try {
      await onWorkEvent(eventType, note);
      setWorkState(nextState);
      onStatusChange(todayMode);
      addTimelineEvent({
        label,
        time: getActionTime(),
        note,
      });
      setMessage(`${label} recorded.`);
    } catch {
      setMessage(`${label} belum tersimpan. Cek koneksi lalu coba lagi.`);
    } finally {
      setBusyEvent('');
    }
  };

  return (
    <Layout title="Work Status" onBack={onBack} activeTab="jobs">
      <div className="p-4 space-y-6 pb-24">
        {/* Active Job Card */}
        <section className="bg-surface-container-lowest rounded-[2rem] p-6 shadow-[0px_8px_24px_rgba(28,27,31,0.04)] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.05em] text-outline">Current Assignment</p>
              <h2 className="text-2xl font-headline font-extrabold text-on-surface tracking-tight">{job.id}</h2>
            </div>
            <div className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">
              Priority
            </div>
          </div>
          <div className="flex items-center gap-3 text-on-surface-variant mb-6">
            <MapPin className="text-primary-container w-6 h-6" />
            <span className="font-semibold text-lg">{job.customer}</span>
          </div>
          {/* Status Badge */}
          <div className="bg-primary-container text-white rounded-2xl p-4 flex items-center justify-between shadow-lg shadow-primary-container/20">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-medium text-white/80 uppercase">Current Status</p>
                <p className="text-xl font-headline font-bold">{statusCopy[workState]}</p>
              </div>
            </div>
            <CheckCircle className="w-10 h-10 opacity-50" />
          </div>
        </section>

        {/* Timeline Section */}
        <section className="bg-surface-container-low rounded-[2rem] p-6">
          <h3 className="text-xs font-bold uppercase tracking-widest text-outline mb-6">Activity Timeline</h3>
          <div className="space-y-0 relative">
            {/* Timeline Line */}
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-outline-variant/30"></div>
            
            {timeline.map((item, index) => (
              <div key={`${item.label}-${item.time}-${index}`} className={`relative flex items-start gap-4 ${index === timeline.length - 1 ? '' : 'pb-8'}`}>
                <div className={`z-10 w-6 h-6 rounded-full border-4 border-surface-container-low flex items-center justify-center ${item.active ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                  <div className={`w-2 h-2 rounded-full ${item.active ? 'bg-white' : 'bg-outline'}`}></div>
                </div>
                <div className="flex-1 -mt-1">
                  <div className="flex justify-between items-center">
                    <p className={`text-sm font-bold ${item.active ? 'text-primary' : 'text-on-surface'}`}>{item.label}</p>
                    <p className="text-xs font-medium text-outline">{item.time}</p>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-0.5">{item.note}</p>
                </div>
              </div>
            ))}

            {workState === 'arrived' && (
              <div className="relative flex items-start gap-4 mt-8">
                <div className="z-10 w-6 h-6 rounded-full bg-primary-fixed-dim border-4 border-surface-container-low animate-pulse"></div>
                <div className="flex-1 -mt-1">
                  <p className="text-sm font-bold text-primary italic">Awaiting Start...</p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Primary Action */}
        <section className="pt-4">
          {message && <p className="mb-3 rounded-2xl bg-surface-container-low px-4 py-3 text-xs font-bold text-primary">{message}</p>}
          <button
            type="button"
            onClick={() => recordWorkEvent('working', 'work_started', 'Start Work', 'Technician started work at site', 'Working')}
            disabled={workState === 'working' || !!busyEvent}
            className={`w-full h-16 rounded-full font-headline font-bold text-lg shadow-lg shadow-primary/30 flex items-center justify-center gap-3 transition-transform duration-200 ${
              workState === 'working'
                ? 'bg-primary-container/70 text-white cursor-default'
                : 'bg-gradient-to-r from-primary to-primary-container text-white active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed'
            }`}
          >
            <PlayCircle className="w-6 h-6" />
            {busyEvent === 'work_started' ? 'Submitting...' : workState === 'working' ? 'Work In Progress' : 'Start Work'}
          </button>
        </section>

        {/* Secondary Actions */}
        <section className="grid grid-cols-2 gap-3">
          <div className="relative group col-span-2">
            <button className="w-full h-14 bg-surface-container-high rounded-2xl px-4 flex items-center justify-between text-on-surface font-bold transition-all hover:bg-surface-variant">
              <div className="flex items-center gap-2">
                <PauseCircle className="w-5 h-5" />
                Pause
              </div>
              <ChevronDown className="w-5 h-5" />
            </button>
            <div className="mt-2 grid grid-cols-1 gap-2 bg-surface-container rounded-2xl p-3 shadow-inner">
              <p className="text-[10px] font-bold text-outline uppercase px-1 mb-1">Select Reason</p>
              <div className="flex flex-wrap gap-2">
                {['Lunch', 'Waiting Customer', 'Waiting Spare Part', 'Technical Query'].map(reason => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => recordWorkEvent('paused', 'work_paused', 'Pause', reason, 'Paused')}
                    disabled={!!busyEvent}
                    className="px-3 py-1.5 bg-surface-container-lowest border border-outline-variant/20 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-primary-fixed transition-colors disabled:opacity-50"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => recordWorkEvent('working', 'work_resumed', 'Resume Work', 'Work resumed after pause or pending status', 'Working')}
            disabled={!!busyEvent || workState === 'working'}
            className="h-14 bg-surface-container-low rounded-2xl px-4 flex items-center justify-center gap-2 text-on-surface font-bold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <PlayCircle className="w-4 h-4" />
            {busyEvent === 'work_resumed' ? 'Submitting...' : 'Resume'}
          </button>
          <button
            type="button"
            onClick={() => recordWorkEvent('pending', 'work_pending', 'Pending', 'Work marked pending for follow-up', 'Pending')}
            disabled={!!busyEvent}
            className="h-14 bg-surface-container-low rounded-2xl px-4 flex items-center justify-center gap-2 text-on-surface font-bold text-sm hover:bg-surface-container-high transition-colors disabled:opacity-50"
          >
            <Clock className="w-4 h-4" />
            {busyEvent === 'work_pending' ? 'Submitting...' : 'Pending'}
          </button>
          
          <button 
            onClick={onComplete}
            disabled={!!busyEvent}
            className="col-span-2 h-14 bg-secondary-fixed text-on-secondary-fixed rounded-2xl px-4 flex items-center justify-center gap-2 font-bold text-sm hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <CheckCircle className="w-5 h-5" />
            Complete Work
          </button>
        </section>
      </div>
    </Layout>
  );
}
