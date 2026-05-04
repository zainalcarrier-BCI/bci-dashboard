import {
  AlarmClockCheck,
  AlertTriangle,
  Building2,
  CalendarClock,
  Construction,
  Download,
  FileWarning,
  LocateOff,
  Map,
  Route,
  Truck,
  User,
  UserCog,
} from 'lucide-react';
import { Pill, numberValue, time, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

function hasStatus(value: string | null | undefined, targets: string[]) {
  const normalized = String(value || '').toLowerCase();
  return targets.some((target) => normalized.includes(target));
}

function initials(value?: string | null) {
  return String(value || 'BC')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function mapEmbedUrl(latitude: number, longitude: number) {
  const latDelta = 0.04;
  const lngDelta = 0.06;
  const bbox = [
    longitude - lngDelta,
    latitude - latDelta,
    longitude + lngDelta,
    latitude + latDelta,
  ].join(',');
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`;
}

function googleMapsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

function openExceptionCount(row: { operational_context?: { open_exceptions?: unknown[] } }) {
  return row.operational_context?.open_exceptions?.length || 0;
}

function durationLabel(value: number) {
  if (!value) return '-';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours && minutes) return `${hours}j ${minutes}m`;
  if (hours) return `${hours}j`;
  return `${minutes}m`;
}

function KpiCard({
  label,
  value,
  tone,
  live,
  Icon,
}: {
  label: string;
  value: number;
  tone: 'blue' | 'cyan' | 'green' | 'amber' | 'red';
  live?: boolean;
  Icon: typeof UserCog;
}) {
  const toneMap = {
    blue: { border: 'border-l-[#3b82f6]', icon: 'bg-blue-50 text-[#2563eb]', value: 'text-[#002f63]' },
    cyan: { border: 'border-l-[#06b6d4]', icon: 'bg-cyan-50 text-[#0891b2]', value: 'text-[#002f63]' },
    green: { border: 'border-l-[#22c55e]', icon: 'bg-green-50 text-[#16a34a]', value: 'text-[#002f63]' },
    amber: { border: 'border-l-[#f59e0b]', icon: 'bg-amber-50 text-[#d97706]', value: 'text-[#002f63]' },
    red: { border: 'border-l-[#ba1a1a]', icon: 'bg-red-50 text-[#ba1a1a]', value: 'text-[#ba1a1a]' },
  }[tone];

  return (
    <div className={`flex h-32 flex-col justify-between rounded-lg border-l-4 bg-white p-4 shadow-sm shadow-blue-900/5 transition hover:shadow-lg ${toneMap.border}`}>
      <div className="flex items-start justify-between">
        <span className={`grid h-10 w-10 place-items-center rounded-md ${toneMap.icon}`}>
          <Icon className="h-5 w-5" />
        </span>
        {live && <span className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-[#2563eb]">Live</span>}
      </div>
      <div>
        <p className={`font-headline text-3xl font-extrabold tracking-tight ${toneMap.value}`}>{numberValue(value)}</p>
        <p className="mt-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#424751]">{label}</p>
      </div>
    </div>
  );
}

export default function LiveStatusTab() {
  const {
    liveRows,
    dailyOperationRows,
    scheduleRows,
    jobRows,
    overtimeRows,
    gpsExceptions,
    summary,
    setSelectedJobId,
  } = useManagerDashboardContext();

  const activeTechnicians = liveRows.filter((row) => (
    !!row.active_job
    || !!row.latest_event
    || row.operational_context?.office_attendance_submitted
    || ['completed', 'annual_leave', 'sick_leave'].includes(String(row.current_status || '').toLowerCase())
  )).length;
  const officeRows = liveRows.filter((row) => (
    hasStatus(row.current_status, ['office', 'standby', 'prepare'])
    || hasStatus(row.latest_event?.event_type, ['office'])
  ));
  const directToSite = liveRows.filter((row) => (
    hasStatus(row.current_status, ['direct_to_site'])
    || hasStatus(row.latest_event?.event_type, ['direct_to_site'])
    || hasStatus(row.active_job?.status, ['direct_to_site'])
  )).length;
  const onTheWay = liveRows.filter((row) => (
    hasStatus(row.current_status, ['on_the_way'])
    || hasStatus(row.latest_event?.event_type, ['on_the_way'])
    || hasStatus(row.active_job?.status, ['on_the_way'])
  )).length;
  const workingRows = liveRows.filter((row) => (
    hasStatus(row.current_status, ['working', 'on_site', 'closing'])
    || hasStatus(row.active_job?.status, ['working', 'on_site', 'closing'])
  ));
  const pendingJobs = jobRows.filter((job) => hasStatus(job.status, ['pending', 'paused', 'assigned'])).length;
  const overtimeRequests = overtimeRows.filter((row) => row.status === 'submitted').length;
  const soPending = scheduleRows.filter((job) => job.so_status === 'so_pending').length;
  const waitForSo = scheduleRows.filter((job) => !job.so_number && job.so_status !== 'so_available').length;
  const mapPoints = liveRows.flatMap((row) => row.map_position ? [{
    ...row.map_position,
    technicianId: row.technician.id,
    technicianName: row.user.full_name,
    team: row.technician.team,
    jobId: row.active_job?.id ?? null,
  }] : []);
  const selectedPoint = mapPoints[0] || null;
  const selectedProfile = liveRows.find((row) => row.active_job) || liveRows.find((row) => row.latest_event) || null;
  const selectedJob = selectedProfile?.active_job ? jobRows.find((job) => job.id === selectedProfile.active_job?.id) : null;
  const criticalAlerts = [
    ...gpsExceptions.slice(0, 2).map((exception) => ({
      key: `gps-${exception.id}`,
      tone: 'red' as const,
      title: 'GPS Exception',
      body: `${exception.technician_name} - ${exception.location_name || 'Outside approved radius'}.`,
      meta: exception.distance_meters !== null ? `${numberValue(exception.distance_meters)} m from radius` : title(exception.source),
    })),
    ...summary.pendingCaptures.slice(0, 1).map((capture) => ({
      key: `capture-${capture.id}`,
      tone: 'amber' as const,
      title: 'GPS Capture Review',
      body: `${capture.technician?.user?.full_name || 'Technician'} - ${capture.site?.name || capture.office_location?.name || 'Location'}.`,
      meta: 'Review before using as official reference',
    })),
    ...scheduleRows.filter((job) => job.so_status === 'so_pending').slice(0, 1).map((job) => ({
      key: `so-${job.id}`,
      tone: 'amber' as const,
      title: 'SO Pending After Job',
      body: `${job.job_no} still waiting for Sales Order number.`,
      meta: job.customer,
    })),
  ].slice(0, 4);

  const clusterRows = [
    {
      title: `On Site / Working (${workingRows.length})`,
      tone: 'green',
      rows: workingRows,
    },
    {
      title: `Office Check-In (${officeRows.length})`,
      tone: 'blue',
      rows: officeRows,
    },
  ];

  return (
    <div className="space-y-8">
      <section className="grid grid-cols-5 gap-4">
        <KpiCard label="Active Technicians" value={activeTechnicians} tone="blue" live Icon={UserCog} />
        <KpiCard label="Office Check-In" value={officeRows.length} tone="blue" Icon={Building2} />
        <KpiCard label="Direct To Site" value={directToSite} tone="cyan" Icon={Route} />
        <KpiCard label="On The Way" value={onTheWay} tone="cyan" Icon={Truck} />
        <KpiCard label="Working Now" value={workingRows.length} tone="green" Icon={Construction} />
        <KpiCard label="Pending Jobs" value={pendingJobs} tone="amber" Icon={CalendarClock} />
        <KpiCard label="Overtime Requests" value={overtimeRequests} tone="amber" Icon={AlarmClockCheck} />
        <KpiCard label="GPS Exceptions" value={gpsExceptions.length} tone="red" Icon={LocateOff} />
        <KpiCard label="SO Pending" value={soPending} tone="amber" Icon={FileWarning} />
        <KpiCard label="Wait For SO" value={waitForSo} tone="amber" Icon={AlarmClockCheck} />
      </section>

      <section className="grid grid-cols-12 gap-8">
        <div className="col-span-8 space-y-8">
          <div className="flex h-[400px] flex-col overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
            <div className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-2">
                <Map className="h-5 w-5 text-[#002f63]" />
                <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.18em] text-[#002f63]">Regional Fleet Map</h3>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1.5 rounded-md bg-green-50 px-2 py-1 text-[10px] font-extrabold text-green-700"><span className="h-1.5 w-1.5 rounded-full bg-green-600" /> {numberValue(workingRows.length)} Working</span>
                <span className="flex items-center gap-1.5 rounded-md bg-blue-50 px-2 py-1 text-[10px] font-extrabold text-blue-700"><span className="h-1.5 w-1.5 rounded-full bg-blue-600" /> {numberValue(officeRows.length)} Office</span>
              </div>
            </div>
            <div className="relative flex-1 overflow-hidden bg-[#d7eef3]">
              {selectedPoint ? (
                <>
                  <iframe
                    title="BCI regional live map"
                    src={mapEmbedUrl(selectedPoint.latitude, selectedPoint.longitude)}
                    className="h-full w-full border-0"
                    loading="lazy"
                  />
                  <div className="absolute left-4 top-4 max-w-[70%] rounded-md bg-white/95 px-4 py-3 shadow-lg shadow-blue-900/10">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#657181]">Map Focus</p>
                    <p className="mt-1 text-sm font-extrabold text-[#002f63]">{selectedPoint.label}</p>
                    <p className="mt-1 text-xs font-semibold text-[#42524c]">{title(selectedPoint.source)} / {title(selectedPoint.status)}</p>
                  </div>
                  <a
                    href={googleMapsUrl(selectedPoint.latitude, selectedPoint.longitude)}
                    target="_blank"
                    rel="noreferrer"
                    className="absolute bottom-4 right-4 rounded-md bg-[#002f63] px-4 py-2 text-xs font-extrabold text-white shadow-lg shadow-blue-900/20"
                  >
                    Open Maps
                  </a>
                </>
              ) : (
                <div className="grid h-full place-items-center px-6 text-center text-sm font-bold text-[#657181]">
                  Belum ada koordinat live. Update GPS office/site atau tunggu event teknisi berikutnya.
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {mapPoints.slice(0, 6).map((point) => (
              <button
                key={`${point.technicianId}-${point.source}-${point.latitude}-${point.longitude}`}
                onClick={() => point.jobId && setSelectedJobId(point.jobId)}
                className="rounded-lg bg-white p-4 text-left shadow-sm shadow-blue-900/5 transition hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-md bg-green-50 text-xs font-black text-green-700">
                    {initials(point.technicianName)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#002f63]">{point.technicianName}</p>
                    <p className="truncate text-[10px] font-bold text-[#657181]">{point.team}</p>
                  </div>
                </div>
                <p className="mt-3 text-xs font-bold text-[#42524c]">{point.job_no || point.site || title(point.status)}</p>
                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#9aa4b2]">
                  {point.distance_meters !== null ? `${numberValue(point.distance_meters)} m` : title(point.source)}
                </p>
              </button>
            ))}
            {!mapPoints.length && (
              <div className="col-span-3 rounded-lg bg-white px-4 py-6 text-center text-xs font-bold text-[#657181] shadow-sm shadow-blue-900/5">
                Belum ada titik GPS live. Setelah teknisi submit attendance atau event site, marker akan muncul di sini.
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.18em] text-[#002f63]">Technician Status Clusters</h3>
            <div className="grid grid-cols-2 gap-4">
              {clusterRows.map((cluster) => (
                <div key={cluster.title} className="space-y-3">
                  <div className={`rounded-md px-3 py-1 ${cluster.tone === 'green' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.18em]">{cluster.title}</span>
                  </div>
                  {cluster.rows.slice(0, 2).map((row) => (
                    <button
                      key={`${cluster.title}-${row.technician.id}`}
                      onClick={() => row.active_job && setSelectedJobId(row.active_job.id)}
                      className={`w-full rounded-lg border-l-4 bg-white p-4 text-left shadow-sm shadow-blue-900/5 ${cluster.tone === 'green' ? 'border-l-green-500' : 'border-l-blue-500'}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-md bg-[#f2f4f7] text-[#8a94a3]">
                            <User className="h-5 w-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-extrabold leading-tight text-[#002f63]">{row.user.full_name}</h4>
                            <p className="mt-1 text-[10px] font-bold text-[#657181]">{row.technician.team} / {row.active_job?.area || 'Office'}</p>
                          </div>
                        </div>
                        <span className="rounded-md bg-amber-50 px-2 py-1 text-[9px] font-black uppercase text-amber-700">{row.active_job?.so_status ? title(row.active_job.so_status) : title(row.current_status)}</span>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-y-3">
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9aa4b2]">Current Job</p>
                          <p className="mt-1 text-[11px] font-extrabold text-[#002f63]">{row.active_job?.job_no || 'Office'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9aa4b2]">Site</p>
                          <p className="mt-1 text-[11px] font-extrabold text-[#002f63]">{row.active_job?.site || 'Head Office'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9aa4b2]">Last Event</p>
                          <p className="mt-1 text-[11px] font-extrabold text-[#002f63]">{row.latest_event ? `${time(row.latest_event.server_timestamp)} ${title(row.latest_event.event_type)}` : '-'}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#9aa4b2]">Day Rule</p>
                          <p className="mt-1 text-[11px] font-extrabold text-[#002f63]">{row.operational_context?.day_type_label || 'Weekday'}</p>
                          <p className="mt-1 text-[10px] font-semibold text-[#657181]">{openExceptionCount(row)} open item</p>
                        </div>
                      </div>
                    </button>
                  ))}
                  {!cluster.rows.length && (
                    <div className="rounded-lg bg-white px-4 py-6 text-xs font-bold text-[#657181] shadow-sm shadow-blue-900/5">Belum ada teknisi pada cluster ini.</div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
            <div className="flex items-center justify-between px-6 py-4">
              <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.18em] text-[#002f63]">Real-time Job Stream</h3>
              <button className="flex items-center gap-1 text-[11px] font-extrabold text-[#00639a]">
                Export CSV <Download className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#f2f4f7]">
                    {['Job No', 'SO Status', 'SO Number', 'Technician', 'Customer / Site', 'Duration', 'Risk'].map((column) => (
                      <th key={column} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#657181]">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                {jobRows.slice(0, 6).map((job) => {
                    const lead = job.assigned_technicians[0];
                    const risk = job.so_status === 'so_pending' ? 'OT Risk' : gpsExceptions.some((exception) => exception.job_id === job.id) ? 'GPS Risk' : 'Normal';
                    return (
                      <tr key={job.id} className="transition hover:bg-[#f7f9fc]">
                        <td className="px-4 py-3 text-[11px] font-extrabold text-[#002f63]">{job.job_no}</td>
                        <td className="px-4 py-3"><Pill value={job.so_status} /></td>
                        <td className="px-4 py-3 text-[11px] font-extrabold text-amber-700">{job.so_number || 'Waiting SO'}</td>
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-extrabold text-[#002f63]">{lead?.full_name || '-'}</p>
                          <p className="text-[9px] font-semibold text-[#9aa4b2]">{lead?.team || job.team || '-'}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-[11px] font-extrabold text-[#002f63]">{job.customer}</p>
                          <p className="text-[9px] font-semibold text-[#9aa4b2]">{job.site}</p>
                        </td>
                        <td className="px-4 py-3 text-[11px] font-extrabold text-[#002f63]">{time(job.scheduled_start_at)} - {time(job.scheduled_end_at)}</td>
                        <td className="px-4 py-3">
                          <span className={`rounded-md px-2 py-1 text-[9px] font-black uppercase ${risk === 'Normal' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{risk}</span>
                        </td>
                      </tr>
                    );
                  })}
                  {!jobRows.length && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 text-sm font-semibold text-[#657181]">
                        Belum ada job operasional. Saat engineer membuat schedule baru atau teknisi kirim event job, stream ini akan terisi otomatis.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
            <div className="flex items-center justify-between px-6 py-4">
              <div>
                <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.18em] text-[#002f63]">Daily Operational Monitor</h3>
                <p className="mt-1 text-xs font-semibold text-[#657181]">Blank time cells berarti teknisi belum submit event pada langkah itu.</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] border-collapse text-left">
                <thead>
                  <tr className="bg-[#f2f4f7]">
                    {['Technician', 'Job', 'Office In', 'Trip Start', 'Arrive Site', 'Work Start', 'Finish Work', 'Site Out', 'Office Out', 'Travel', 'Work', 'Last Status'].map((column) => (
                      <th key={column} className="px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-[#657181]">{column}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dailyOperationRows.map((row) => (
                    <tr key={row.technician_id} className="border-t border-[#edf1f6] transition hover:bg-[#f7f9fc]">
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-extrabold text-[#002f63]">{row.technician_name}</p>
                        <p className="text-[9px] font-semibold text-[#9aa4b2]">{row.technician_employee_id} / {row.team}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] font-extrabold text-[#002f63]">{row.job_no || 'No active job'}</p>
                        <p className="text-[9px] font-semibold text-[#9aa4b2]">{row.site || row.branch}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.office_check_in_at)}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.trip_start_at)}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.site_check_in_at)}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.work_started_at)}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.finish_work_at)}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.site_check_out_at)}</td>
                      <td className="px-4 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.office_check_out_at)}</td>
                      <td className="px-4 py-3 text-[11px] font-extrabold text-[#00639a]">{durationLabel(row.travel_minutes)}</td>
                      <td className="px-4 py-3 text-[11px] font-extrabold text-[#007f73]">{durationLabel(row.work_minutes)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-2">
                          <Pill value={row.last_status || row.current_status} />
                          <span className="text-[9px] font-semibold text-[#9aa4b2]">{row.day_type_label} / {numberValue(row.open_item_count)} open item</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!dailyOperationRows.length && (
                    <tr>
                      <td colSpan={12} className="px-4 py-4 text-sm font-semibold text-[#657181]">
                        Belum ada teknisi dalam scope dashboard ini.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <aside className="col-span-4 space-y-7">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-[#ba1a1a]" />
              <h3 className="font-headline text-sm font-extrabold uppercase tracking-[0.18em] text-[#002f63]">Live Critical Alerts</h3>
            </div>
            <div className="space-y-4">
              {criticalAlerts.length ? criticalAlerts.map((alert) => (
                <div key={alert.key} className={`rounded-lg px-5 py-4 ${alert.tone === 'red' ? 'bg-red-50 text-[#7f1d1d]' : 'bg-amber-50 text-[#7c2d12]'}`}>
                  <p className="text-xs font-black uppercase tracking-[0.18em]">{alert.title}</p>
                  <p className="mt-2 text-sm font-extrabold leading-relaxed">{alert.body}</p>
                  <p className="mt-2 text-xs font-semibold opacity-75">{alert.meta}</p>
                </div>
              )) : (
                <div className="rounded-lg bg-white px-5 py-6 text-sm font-semibold text-[#657181] shadow-sm shadow-blue-900/5">
                  Tidak ada critical alert aktif saat ini.
                </div>
              )}
            </div>
          </div>

          {selectedProfile && (
            <div className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
              <div className="bg-[#002f63] p-6 text-white">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-md border border-white/25 bg-white/10 text-lg font-black">{initials(selectedProfile.user.full_name)}</div>
                  <div className="min-w-0">
                    <h3 className="truncate font-headline text-2xl font-extrabold">{selectedProfile.user.full_name}</h3>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.18em] text-blue-100">{title(selectedProfile.technician.level)}</p>
                    <span className="mt-3 inline-flex rounded-md bg-green-400 px-3 py-1 text-[10px] font-black uppercase text-[#002f63]">{title(selectedProfile.current_status)}</span>
                  </div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  <div className="rounded-md bg-white/10 px-3 py-3">
                    <p className="text-[10px] font-black uppercase text-blue-100">Hierarchy</p>
                    <p className="mt-1 text-xs font-extrabold">{selectedProfile.technician.team}</p>
                  </div>
                  <div className="rounded-md bg-white/10 px-3 py-3">
                    <p className="text-[10px] font-black uppercase text-blue-100">SO Status</p>
                    <p className="mt-1 text-xs font-extrabold">{title(selectedProfile.active_job?.so_status || selectedJob?.so_status || '-')}</p>
                  </div>
                  <div className="rounded-md bg-white/10 px-3 py-3">
                    <p className="text-[10px] font-black uppercase text-blue-100">Day Type</p>
                    <p className="mt-1 text-xs font-extrabold">{selectedProfile.operational_context?.day_type_label || 'Weekday'}</p>
                  </div>
                  <div className="rounded-md bg-white/10 px-3 py-3">
                    <p className="text-[10px] font-black uppercase text-blue-100">Open Items</p>
                    <p className="mt-1 text-xs font-extrabold">{numberValue(openExceptionCount(selectedProfile))}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-4 p-6">
                {!!openExceptionCount(selectedProfile) && (
                  <div className="rounded-md bg-[#f2f4f7] px-4 py-4 text-sm font-semibold text-[#42524c]">
                    {(selectedProfile.operational_context?.open_exceptions || []).slice(0, 2).map((item) => item.label).join(' / ')}
                  </div>
                )}
                {overtimeRequests > 0 && (
                  <div className="rounded-md bg-red-50 px-4 py-4 text-sm font-extrabold text-red-800">
                    Overtime Required: Needs approval for submitted request.
                  </div>
                )}
                {selectedProfile.active_job?.so_status === 'so_pending' && (
                  <div className="rounded-md bg-amber-50 px-4 py-4 text-sm font-extrabold text-amber-800">
                    SO pending: update SO number after commercial release.
                  </div>
                )}
                <div>
                  <h4 className="mb-4 text-xs font-black uppercase tracking-[0.18em] text-[#9aa4b2]">Activity Timeline</h4>
                  <div className="space-y-4">
                    {(selectedJob?.timeline || []).slice(0, 4).map((event) => (
                      <div key={event.id} className="flex gap-3">
                        <span className="mt-1 h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-50" />
                        <div>
                          <p className="text-sm font-extrabold text-[#002f63]">{title(event.event_type)}</p>
                          <p className="text-xs font-semibold text-[#657181]">{event.note || event.technician_name}</p>
                          <p className="mt-1 text-xs font-black text-[#9aa4b2]">{time(event.server_timestamp)}</p>
                        </div>
                      </div>
                    ))}
                    {!selectedJob?.timeline?.length && (
                      <p className="rounded-md bg-[#f2f4f7] px-4 py-3 text-xs font-bold text-[#657181]">Belum ada timeline untuk teknisi ini.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      </section>
    </div>
  );
}
