import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { updateManagerJobAssignments } from '../../../services/api';
import { Detail, Panel, Pill, Row, TableHeader, date, numberValue, time, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

function durationLabel(value: number) {
  if (!value) return '-';
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours && minutes) return `${hours}j ${minutes}m`;
  if (hours) return `${hours}j`;
  return `${minutes}m`;
}

export default function JobsTab() {
  const { jobRows, selectedJob, setSelectedJobId, loadDashboard, technicians } = useManagerDashboardContext();
  const [leadTechnicianId, setLeadTechnicianId] = useState('');
  const [supportIds, setSupportIds] = useState<string[]>([]);
  const [savingAssignments, setSavingAssignments] = useState(false);

  useEffect(() => {
    if (!selectedJob) return;
    setLeadTechnicianId(selectedJob.lead_technician_id || selectedJob.assigned_technicians[0]?.id || '');
    setSupportIds(selectedJob.support_technician_ids || selectedJob.assigned_technicians.slice(1).map((tech) => tech.id));
  }, [selectedJob]);

  const visibleTechnicians = selectedJob?.team
    ? technicians.filter((tech) => tech.team === selectedJob.team)
    : technicians;

  const toggleSupport = (technicianId: string) => {
    setSupportIds((current) => current.includes(technicianId) ? current.filter((id) => id !== technicianId) : [...current, technicianId]);
  };

  const saveAssignments = async () => {
    if (!selectedJob || !leadTechnicianId) return;
    setSavingAssignments(true);
    try {
      await updateManagerJobAssignments(selectedJob.id, {
        lead_technician_id: leadTechnicianId,
        support_technician_ids: supportIds.filter((id) => id !== leadTechnicianId),
      });
      await loadDashboard();
    } finally {
      setSavingAssignments(false);
    }
  };

  return (
    <section className="grid grid-cols-[minmax(0,1fr)_380px] gap-5">
      <div className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
        <TableHeader columns={['Job', 'Customer / Site', 'SO', 'Assigned Team', 'Status', 'Action']} />
        {jobRows.map((job) => {
          const sourceTag = job.dispatch_note?.includes('[EMERGENCY]')
            ? 'Emergency'
            : job.dispatch_note?.includes('[UNPLANNED]')
              ? 'Unplanned'
              : null;
          return (
          <Row
            key={job.id}
            values={[
              <div>
                <p className="font-extrabold">{job.job_no}</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <p className="text-xs font-semibold text-[#5d6b66]">Visit {job.visit_no} / {title(job.job_type)}</p>
                  {sourceTag && <span className="rounded-full bg-red-50 px-2 py-1 text-[10px] font-extrabold uppercase text-[#ba1a1a]">{sourceTag}</span>}
                </div>
              </div>,
              <div>
                <p className="font-bold">{job.customer}</p>
                <p className="text-xs text-[#5d6b66]">{job.site}</p>
              </div>,
              <div>
                <Pill value={job.so_status} />
                <p className="mt-1 text-xs font-semibold text-[#5d6b66]">{job.so_number || 'SO belum tersedia'}</p>
              </div>,
              <div>
                <p className="font-bold">{job.team || job.area}</p>
                <p className="text-xs text-[#5d6b66]">{job.assigned_technicians.map((tech) => tech.full_name).join(', ') || 'Belum assigned'}</p>
              </div>,
              <Pill value={job.status} />,
              <button onClick={() => setSelectedJobId(job.id)} className="rounded-md border border-[#007f73] px-3 py-1 text-xs font-bold text-[#007f73]">Open Detail</button>,
            ]}
          />
        );
        })}
      </div>

      <Panel title="Job Detail">
        {selectedJob ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-[#007f73]">{selectedJob.job_no}</p>
              <h3 className="font-headline text-xl font-extrabold">{selectedJob.customer}</h3>
              <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5d6b66]">
                <MapPin className="h-4 w-4" />
                {selectedJob.site}, {selectedJob.area}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Detail label="Schedule" value={`${date(selectedJob.scheduled_start_at)} ${time(selectedJob.scheduled_start_at)}`} />
              <Detail label="SO Number" value={selectedJob.so_number || 'Pending'} />
              <Detail label="Product" value={title(selectedJob.product_category || selectedJob.brand)} />
              <Detail label="Equipment" value={selectedJob.equipment_name || '-'} />
            </div>
            {(selectedJob.dispatch_note?.includes('[EMERGENCY]') || selectedJob.dispatch_note?.includes('[UNPLANNED]')) && (
              <div className="rounded-md border border-[#ffd7d7] bg-[#fff3f3] px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#ba1a1a]">
                  {selectedJob.dispatch_note.includes('[EMERGENCY]') ? 'Emergency Job' : 'Unplanned Job'}
                </p>
                <p className="mt-2 text-sm font-semibold text-[#6e2a2a]">
                  Dibuat dari web teknisi dan masih menunggu dispatch link / review engineer.
                </p>
              </div>
            )}
            <div>
              <p className="mb-2 text-xs font-extrabold text-[#5d6b66]">Assigned Technicians</p>
              <div className="space-y-2">
                {selectedJob.assigned_technicians.map((tech) => (
                  <div key={`${selectedJob.id}-${tech.id}`} className="rounded-md border border-[#dbe5df] px-3 py-2">
                    <p className="text-sm font-extrabold">{tech.full_name}</p>
                    <p className="text-xs font-semibold text-[#5d6b66]">{tech.employee_id} / {title(tech.assignment_role)} / {title(tech.level)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold text-[#5d6b66]">Operational Trace</p>
              <div className="overflow-x-auto rounded-md border border-[#dbe5df]">
                <table className="w-full min-w-[980px] border-collapse text-left">
                  <thead>
                    <tr className="bg-[#f2f4f7]">
                      {['Technician', 'Office In', 'Trip Start', 'Arrive Site', 'Work Start', 'Finish Work', 'Site Out', 'Office Out', 'Travel', 'Work', 'Last Status'].map((column) => (
                        <th key={column} className="px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#657181]">{column}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(selectedJob.operational_summary || []).map((row) => (
                      <tr key={`${selectedJob.id}-${row.technician_id}`} className="border-t border-[#edf1f6] align-top">
                        <td className="px-3 py-3">
                          <p className="text-[11px] font-extrabold text-[#002f63]">{row.technician_name}</p>
                          <p className="text-[10px] font-semibold text-[#657181]">{row.technician_employee_id}</p>
                        </td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.office_check_in_at)}</td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.trip_start_at)}</td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.site_check_in_at)}</td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.work_started_at)}</td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.finish_work_at)}</td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.site_check_out_at)}</td>
                        <td className="px-3 py-3 text-[11px] font-semibold text-[#17201d]">{time(row.office_check_out_at)}</td>
                        <td className="px-3 py-3 text-[11px] font-extrabold text-[#00639a]">{durationLabel(row.travel_minutes)}</td>
                        <td className="px-3 py-3 text-[11px] font-extrabold text-[#007f73]">{durationLabel(row.work_minutes)}</td>
                        <td className="px-3 py-3"><Pill value={row.last_status} /></td>
                      </tr>
                    ))}
                    {!selectedJob.operational_summary?.length && (
                      <tr>
                        <td colSpan={11} className="px-3 py-4 text-sm font-semibold text-[#657181]">
                          Belum ada jejak operasional untuk job ini. Setelah teknisi submit event, jam office, perjalanan, site, kerja, dan status terakhir akan muncul di tabel ini.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold text-[#5d6b66]">Redispatch Assignment</p>
              <div className="space-y-3 rounded-md bg-[#f7f9fc] p-4">
                <label className="space-y-1 text-sm font-semibold text-[#17201d]">
                  <span className="block text-xs font-bold text-[#5d6b66]">Lead Technician</span>
                  <select className="h-10 w-full rounded-md bg-white px-3 text-sm font-semibold" value={leadTechnicianId} onChange={(event) => setLeadTechnicianId(event.target.value)}>
                    <option value="">Pilih lead</option>
                    {visibleTechnicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>{tech.user?.full_name || tech.id}</option>
                    ))}
                  </select>
                </label>
                <div>
                  <p className="mb-2 text-xs font-bold text-[#5d6b66]">Support Technician</p>
                  <div className="grid gap-2">
                    {visibleTechnicians.filter((tech) => tech.id !== leadTechnicianId).map((tech) => (
                      <label key={tech.id} className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#17201d]">
                        <input type="checkbox" checked={supportIds.includes(tech.id)} onChange={() => toggleSupport(tech.id)} />
                        <span>{tech.user?.full_name || tech.id}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <button onClick={() => void saveAssignments()} disabled={!leadTechnicianId || savingAssignments} className="rounded-md bg-[#007f73] px-4 py-2 text-sm font-bold text-white disabled:opacity-60">
                  {savingAssignments ? 'Saving...' : 'Save Redispatch'}
                </button>
              </div>
            </div>
            <div className="rounded-md border border-dashed border-[#c9d4e4] bg-[#f7f9fc] px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#00639a]">Coming Soon</p>
              <p className="mt-2 text-sm font-extrabold text-[#002f63]">Digital Service Report</p>
              <p className="mt-1 text-xs font-semibold text-[#657181]">Modul service report ditunda dulu. Untuk tahap ini manager cukup review timeline, closing event, dan outcome pekerjaan.</p>
            </div>
            <div>
              <p className="mb-2 text-xs font-extrabold text-[#5d6b66]">Timeline Event</p>
              <div className="space-y-2">
                {selectedJob.timeline.length ? selectedJob.timeline.map((event) => (
                  <div key={event.id} className="rounded-md bg-[#f2f4f7] px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-extrabold">{title(event.event_type)}</p>
                      <p className="text-xs font-bold text-[#5d6b66]">{time(event.server_timestamp)}</p>
                    </div>
                    <p className="mt-1 text-xs text-[#5d6b66]">{event.technician_name} {event.geofence_status ? `/ ${title(event.geofence_status)}` : ''}</p>
                    {event.distance_meters !== null && <p className="mt-1 text-xs text-[#5d6b66]">Distance: {numberValue(event.distance_meters)} meter</p>}
                  </div>
                )) : (
                  <p className="rounded-md bg-[#f2f4f7] px-3 py-3 text-sm font-semibold text-[#657181]">Belum ada event timeline untuk job ini.</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <p className="text-sm font-semibold text-[#5d6b66]">Belum ada job untuk ditampilkan.</p>
        )}
      </Panel>
    </section>
  );
}
