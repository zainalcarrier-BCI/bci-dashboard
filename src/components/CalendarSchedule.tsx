import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, User } from 'lucide-react';
import Layout from './Layout';
import { Job } from '../types';

interface CalendarScheduleProps {
  jobs: Job[];
  onSelectJob: (job: Job) => void;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

function titleMonth(value: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(value);
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

export default function CalendarSchedule({ jobs, onSelectJob, onTabChange }: CalendarScheduleProps) {
  const initialDate = useMemo(() => {
    const firstScheduled = jobs.find((job) => job.scheduledStartAt)?.scheduledStartAt;
    return firstScheduled ? new Date(firstScheduled) : new Date();
  }, [jobs]);
  const [monthCursor, setMonthCursor] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1));
  const [selectedDateKey, setSelectedDateKey] = useState(() => dateKey(initialDate));

  const calendarCells = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const mondayOffset = (firstDay.getDay() + 6) % 7;
    return Array.from({ length: mondayOffset + daysInMonth }, (_, index) => {
      if (index < mondayOffset) return null;
      const dayNumber = index - mondayOffset + 1;
      return new Date(year, month, dayNumber);
    });
  }, [monthCursor]);

  const jobsByDate = useMemo(() => {
    const grouped = new Map<string, Job[]>();
    jobs.forEach((job) => {
      if (!job.scheduledStartAt) return;
      const key = job.scheduledStartAt.slice(0, 10);
      const current = grouped.get(key) || [];
      current.push(job);
      grouped.set(key, current);
    });
    return grouped;
  }, [jobs]);

  const selectedDate = new Date(`${selectedDateKey}T00:00:00`);
  const selectedDayJobs = jobsByDate.get(selectedDateKey) || [];
  const activeJobs = selectedDayJobs.filter((job) => job.status !== 'COMPLETED');
  const completedJobs = selectedDayJobs.filter((job) => job.status === 'COMPLETED');

  return (
    <Layout title="Schedule" activeTab="jobs" onTabChange={onTabChange}>
      <div className="p-4 space-y-5 pb-28">
        <section className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="font-headline text-2xl font-extrabold text-primary">{titleMonth(monthCursor)}</h2>
              <p className="text-sm font-medium text-on-surface-variant">Technician schedule</p>
            </div>
            <div className="flex gap-2">
              <button
                aria-label="Previous month"
                onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                className="rounded-xl bg-surface-container-high p-2 transition-transform active:scale-95"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                aria-label="Next month"
                onClick={() => setMonthCursor((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                className="rounded-xl bg-surface-container-high p-2 transition-transform active:scale-95"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2">
            {days.map((day) => (
              <div key={day} className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-outline">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {calendarCells.map((value, index) => {
              if (!value) return <div key={`empty-${index}`} className="aspect-square rounded-xl bg-transparent" />;
              const key = dateKey(value);
              const isSelected = key === selectedDateKey;
              const hasJob = (jobsByDate.get(key) || []).length > 0;
              const isCurrentMonth = sameMonth(value, monthCursor);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedDateKey(key)}
                  className={`aspect-square rounded-xl text-sm font-bold flex flex-col items-center justify-center gap-1 transition-colors ${
                    isSelected
                      ? 'bg-primary text-white'
                      : isCurrentMonth
                        ? 'bg-surface-container hover:bg-surface-container-high'
                        : 'bg-surface-container-low text-outline'
                  }`}
                >
                  <span>{value.getDate()}</span>
                  {hasJob && <span className={`h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-primary'}`} />}
                </button>
              );
            })}
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-headline text-lg font-bold text-on-surface">Jobs for {selectedDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</h3>
              <p className="text-xs font-medium text-on-surface-variant">Jadwal ditarik dari tanggal dispatch job.</p>
            </div>
            <span className="rounded-full bg-primary-fixed/50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
              {activeJobs.length} Active
            </span>
          </div>

          {activeJobs.length ? activeJobs.map((job) => (
            <button
              key={job.id}
              onClick={() => onSelectJob(job)}
              className="w-full text-left bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-sm border-l-4 border-primary active:scale-[0.98] transition-transform"
            >
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{job.id}</p>
                  <h4 className="font-headline text-lg font-extrabold text-on-surface truncate">{job.customer}</h4>
                  <p className="text-xs font-semibold text-on-surface-variant">{job.type}</p>
                </div>
                <span className="shrink-0 text-xs font-bold text-on-surface bg-surface-container-low rounded-full px-3 py-1 h-fit">
                  {job.time}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-on-surface-variant">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  <span>PIC Customer</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Scheduled</span>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="truncate">{job.site}</span>
                </div>
              </div>
            </button>
          )) : (
            <p className="rounded-[1.5rem] bg-surface-container-lowest p-5 text-sm font-semibold text-on-surface-variant">Tidak ada job aktif pada tanggal ini.</p>
          )}
        </section>

        {completedJobs.length > 0 && (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-headline text-lg font-bold text-on-surface">Completed</h3>
              <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary-fixed/50 rounded-full px-3 py-1">
                {completedJobs.length} Done
              </span>
            </div>
            {completedJobs.map((job) => (
              <button
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="w-full text-left bg-surface-container-lowest rounded-[1.5rem] p-5 shadow-sm border-l-4 border-primary-fixed-dim active:scale-[0.98] transition-transform"
              >
                <div className="flex justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-primary">{job.id}</p>
                    <h4 className="font-headline text-lg font-extrabold text-on-surface truncate">{job.customer}</h4>
                    <p className="text-xs font-semibold text-on-surface-variant">{job.site}</p>
                  </div>
                  <span className="shrink-0 text-xs font-bold text-primary bg-primary-fixed/70 rounded-full px-3 py-1 h-fit">
                    Completed
                  </span>
                </div>
              </button>
            ))}
          </section>
        )}
      </div>
    </Layout>
  );
}
