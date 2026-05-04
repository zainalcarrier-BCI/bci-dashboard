import { useMemo, useState } from 'react';
import { Detail, Panel, Pill, StatCard, date, numberValue, percent, scoreTone, time, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

function latestAttentionLabel(gpsCount: number, anomalyCount: number) {
  if (!gpsCount && !anomalyCount) return 'Normal';
  if (gpsCount && anomalyCount) return `${gpsCount} GPS / ${anomalyCount} anomaly`;
  if (gpsCount) return `${gpsCount} GPS exception`;
  return `${anomalyCount} anomaly`;
}

export default function TechniciansTab() {
  const { technicians, liveRows, gpsExceptions, anomalyRows, report, accessUsers } = useManagerDashboardContext();
  const [selectedTechnicianId, setSelectedTechnicianId] = useState('');

  const statusByTechnicianId = useMemo(
    () => new Map(liveRows.map((row) => [row.technician.id, row])),
    [liveRows],
  );
  const kpiByTechnicianId = useMemo(
    () => new Map((report?.technicians || []).map((row) => [row.technician_id, row])),
    [report],
  );
  const accessByUserId = useMemo(
    () => new Map(accessUsers.filter((row) => row.has_technician_profile).map((row) => [row.id, row])),
    [accessUsers],
  );

  const technicianCards = useMemo(() => technicians.map((technician) => {
    const liveRow = statusByTechnicianId.get(technician.id);
    const kpi = kpiByTechnicianId.get(technician.id);
    const access = accessByUserId.get(technician.user_id);
    const gpsCount = gpsExceptions.filter((row) => row.technician_id === technician.id).length;
    const anomalyCount = anomalyRows.filter((row) => row.technician_employee_id === technician.user?.employee_id).length;
    const openItemCount = liveRow?.operational_context?.open_exceptions?.length || 0;
    return {
      technician,
      liveRow,
      kpi,
      access,
      gpsCount,
      anomalyCount,
      openItemCount,
      attentionLabel: latestAttentionLabel(gpsCount, anomalyCount),
    };
  }), [accessByUserId, anomalyRows, gpsExceptions, kpiByTechnicianId, statusByTechnicianId, technicians]);

  const selectedTechnician = technicianCards.find((row) => row.technician.id === selectedTechnicianId) || technicianCards[0] || null;
  const activeWorkingCount = technicianCards.filter((row) => ['working', 'on_site', 'on_the_way', 'direct_to_site'].includes(String(row.liveRow?.current_status || '').toLowerCase())).length;
  const onLeaveCount = technicianCards.filter((row) => ['annual_leave', 'sick_leave'].includes(String(row.liveRow?.current_status || '').toLowerCase())).length;
  const attentionCount = technicianCards.filter((row) => row.gpsCount || row.anomalyCount).length;

  return (
    <section className="space-y-5">
      <section className="grid grid-cols-4 gap-4">
        <StatCard label="Technicians" value={numberValue(technicianCards.length)} />
        <StatCard label="Active Today" value={numberValue(activeWorkingCount)} tone="text-[#00639a]" />
        <StatCard label="On Leave" value={numberValue(onLeaveCount)} tone="text-amber-700" />
        <StatCard label="Need Review" value={numberValue(attentionCount)} tone="text-red-700" />
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)_380px] gap-5">
        <Panel title="Technician Directory">
          <div className="space-y-3">
            {technicianCards.map((row) => {
              const active = selectedTechnician?.technician.id === row.technician.id;
              const currentStatus = row.liveRow?.current_status || 'standby';
              return (
                <button
                  key={row.technician.id}
                  type="button"
                  onClick={() => setSelectedTechnicianId(row.technician.id)}
                  className={`grid w-full grid-cols-[minmax(0,1.2fr)_120px_120px_110px] items-center gap-3 rounded-md border px-4 py-4 text-left transition ${
                    active ? 'border-[#00639a] bg-[#f7fbff] shadow-sm shadow-blue-900/5' : 'border-[#e6e8eb] bg-white hover:border-[#bfd8f2]'
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#002f63]">{row.technician.user?.full_name || '-'}</p>
                    <p className="mt-1 text-xs font-semibold text-[#657181]">
                      {row.technician.user?.employee_id || '-'} / {title(row.technician.level)}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#657181]">
                      {row.technician.team} / {row.technician.branch}
                    </p>
                  </div>
                  <div>
                    <Pill value={currentStatus} />
                    <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.12em] text-[#657181]">
                      {row.liveRow?.active_job?.job_no || 'No active job'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-xl font-extrabold ${scoreTone(row.kpi?.score)}`}>{numberValue(row.kpi?.score || 0)}</p>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#657181]">KPI Score</p>
                    <p className="mt-1 text-xs font-semibold text-[#657181]">{percent(row.kpi?.submission_rate || 0)} submit</p>
                  </div>
                  <div>
                    <p className={`text-sm font-extrabold ${row.gpsCount || row.anomalyCount ? 'text-red-700' : 'text-emerald-700'}`}>
                      {row.attentionLabel}
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[#657181]">
                      {row.liveRow?.operational_context?.day_type_label || 'Weekday'} / {row.access?.direct_supervisor_name || 'No supervisor'}
                    </p>
                  </div>
                </button>
              );
            })}
            {!technicianCards.length && (
              <p className="rounded-md bg-[#f2f4f7] px-4 py-4 text-sm font-semibold text-[#657181]">
                Belum ada technician yang bisa ditampilkan pada scope login ini.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Technician Detail">
          {selectedTechnician ? (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#657181]">
                  {selectedTechnician.technician.user?.employee_id || '-'}
                </p>
                <h3 className="mt-1 font-headline text-xl font-extrabold text-[#002f63]">
                  {selectedTechnician.technician.user?.full_name || '-'}
                </h3>
                <p className="mt-1 text-sm font-semibold text-[#657181]">
                  {title(selectedTechnician.technician.level)} / {selectedTechnician.technician.team} / {selectedTechnician.technician.region}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Detail label="Current Status" value={<Pill value={selectedTechnician.liveRow?.current_status || 'standby'} />} />
                <Detail label="KPI Score" value={<span className={scoreTone(selectedTechnician.kpi?.score)}>{numberValue(selectedTechnician.kpi?.score || 0)}</span>} />
                <Detail label="Submission Rate" value={percent(selectedTechnician.kpi?.submission_rate || 0)} />
                <Detail label="Attendance Rate" value={percent(selectedTechnician.kpi?.attendance_rate || 0)} />
                <Detail label="Active Date" value={date(selectedTechnician.technician.active_date)} />
                <Detail label="KPI Effective Start" value={date(selectedTechnician.technician.kpi_effective_start)} />
                <Detail label="Day Type" value={selectedTechnician.liveRow?.operational_context?.day_type_label || 'Weekday'} />
                <Detail label="Open Items" value={numberValue(selectedTechnician.openItemCount)} />
              </div>

              <div className="rounded-md bg-[#f2f4f7] px-4 py-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#657181]">Today's Assignment</p>
                <p className="mt-2 text-sm font-extrabold text-[#191c1e]">
                  {selectedTechnician.liveRow?.active_job?.job_no || 'No active assignment'}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#42524c]">
                  {selectedTechnician.liveRow?.active_job
                    ? `${selectedTechnician.liveRow.active_job.customer} / ${selectedTechnician.liveRow.active_job.site}`
                    : 'Technician masih standby atau belum ada dispatch untuk hari ini.'}
                </p>
                <p className="mt-2 text-xs font-semibold text-[#657181]">
                  Latest event: {selectedTechnician.liveRow?.latest_event?.event_type ? title(selectedTechnician.liveRow.latest_event.event_type) : 'No event'}{selectedTechnician.liveRow?.latest_event?.server_timestamp ? ` / ${time(selectedTechnician.liveRow.latest_event.server_timestamp)}` : ''}
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-[#657181]">
                  {selectedTechnician.liveRow?.operational_context?.overtime_policy_label || 'Operational overtime policy will appear here.'}
                </p>
              </div>

              <div className="rounded-md bg-[#f2f4f7] px-4 py-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#657181]">Hierarchy & Scope</p>
                <p className="mt-2 text-sm font-semibold text-[#191c1e]">
                  Supervisor: {selectedTechnician.access?.direct_supervisor_name || '-'}
                </p>
                <p className="mt-1 text-sm font-semibold text-[#42524c]">
                  {selectedTechnician.access?.direct_supervisor_role || 'No direct supervisor role'}
                </p>
                <p className="mt-2 text-xs font-semibold leading-relaxed text-[#657181]">
                  {selectedTechnician.access?.reporting_line?.length
                    ? selectedTechnician.access.reporting_line.map((item) => `${item.role}: ${item.name}`).join(' / ')
                    : 'Belum ada reporting line detail untuk technician ini.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Detail label="GPS Exceptions" value={numberValue(selectedTechnician.gpsCount)} />
                <Detail label="Attendance Anomalies" value={numberValue(selectedTechnician.anomalyCount)} />
                <Detail label="Completed Jobs" value={numberValue(selectedTechnician.kpi?.completed_jobs || 0)} />
                <Detail label="SO Pending" value={numberValue(selectedTechnician.kpi?.so_pending_jobs || 0)} />
              </div>

              {!!selectedTechnician.liveRow?.operational_context?.open_exceptions?.length && (
                <div className="rounded-md bg-[#f2f4f7] px-4 py-4">
                  <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#657181]">Operational Open Items</p>
                  <div className="mt-2 space-y-2">
                    {selectedTechnician.liveRow.operational_context.open_exceptions.slice(0, 3).map((item) => (
                      <p key={item.code} className="text-sm font-semibold text-[#42524c]">{item.label}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#657181]">Belum ada technician yang dipilih.</p>
          )}
        </Panel>
      </section>
    </section>
  );
}
