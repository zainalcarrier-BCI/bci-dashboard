import { Field, InlineError, Panel, Pill, Row, TableHeader, inputClass, time } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

export default function SchedulingTab() {
  const {
    permissions,
    scheduleRows,
    formErrors,
    dispatchForm,
    setDispatchForm,
    master,
    technicians,
    openSoModal,
    createDispatch,
  } = useManagerDashboardContext();
  const selectedTeamTechnicians = dispatchForm.team
    ? technicians.filter((tech) => tech.team === dispatchForm.team)
    : technicians;

  const toggleSupportTechnician = (technicianId: string) => {
    setDispatchForm((current) => ({
      ...current,
      support_technician_ids: current.support_technician_ids.includes(technicianId)
        ? current.support_technician_ids.filter((id) => id !== technicianId)
        : [...current.support_technician_ids, technicianId],
    }));
  };

  return (
    <section className="grid grid-cols-[1fr_360px] gap-5">
      <div className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
        <TableHeader columns={['Job', 'Customer', 'SO', 'Team', 'Time', 'Action']} />
        {scheduleRows.map((job) => (
          <Row
            key={job.id}
            values={[
              job.job_no,
              `${job.customer} / ${job.site}`,
              <Pill value={job.so_status} />,
              job.area,
              `${time(job.scheduled_start_at)} - ${time(job.scheduled_end_at)}`,
              permissions.canManageSchedule ? (
                <button onClick={() => openSoModal(job)} className="rounded-md border border-[#007f73] px-3 py-1 text-xs font-bold text-[#007f73]">
                  Update SO
                </button>
              ) : (
                'Read only'
              ),
            ]}
          />
        ))}
      </div>

      <Panel title="Create Dispatch">
        {permissions.canManageSchedule ? (
          <div className="grid gap-3">
            {formErrors.dispatch && <InlineError message={formErrors.dispatch} />}
            <Field label="Customer"><input className={inputClass} value={dispatchForm.customer} onChange={(event) => setDispatchForm((current) => ({ ...current, customer: event.target.value }))} /></Field>
            <Field label="Site"><input className={inputClass} value={dispatchForm.site} onChange={(event) => setDispatchForm((current) => ({ ...current, site: event.target.value }))} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Priority">
                <select className={inputClass} value={dispatchForm.priority} onChange={(event) => setDispatchForm((current) => ({ ...current, priority: event.target.value }))}>
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                  <option value="emergency">Emergency</option>
                </select>
              </Field>
              <Field label="SO Status">
                <select className={inputClass} value={dispatchForm.so_status} onChange={(event) => setDispatchForm((current) => ({ ...current, so_status: event.target.value }))}>
                  <option value="so_pending">SO Pending</option>
                  <option value="so_available">SO Available</option>
                  <option value="so_added_after_job">SO Added After Job</option>
                </select>
              </Field>
            </div>
            {dispatchForm.so_status === 'so_available' && (
              <Field label="SO Number">
                <input className={inputClass} value={dispatchForm.so_number} onChange={(event) => setDispatchForm((current) => ({ ...current, so_number: event.target.value }))} placeholder="2600287" />
              </Field>
            )}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Schedule Start"><input type="datetime-local" className={inputClass} value={dispatchForm.scheduled_start_at} onChange={(event) => setDispatchForm((current) => ({ ...current, scheduled_start_at: event.target.value }))} /></Field>
              <Field label="Schedule End"><input type="datetime-local" className={inputClass} value={dispatchForm.scheduled_end_at} onChange={(event) => setDispatchForm((current) => ({ ...current, scheduled_end_at: event.target.value }))} /></Field>
            </div>
            <Field label="Team">
              <select className={inputClass} value={dispatchForm.team} onChange={(event) => setDispatchForm((current) => ({ ...current, team: event.target.value }))}>
                {master?.teams.map((team) => <option key={team.id} value={team.name}>{team.name}</option>)}
              </select>
            </Field>
            <Field label="Lead Technician">
              <select className={inputClass} value={dispatchForm.lead_technician_id} onChange={(event) => setDispatchForm((current) => ({ ...current, lead_technician_id: event.target.value }))}>
                {selectedTeamTechnicians.map((tech) => <option key={tech.id} value={tech.id}>{tech.user?.full_name || tech.id}</option>)}
              </select>
            </Field>
            <div className="space-y-1">
              <span className="block text-xs font-bold text-[#5d6b66]">Support Technician(s)</span>
              <div className="grid gap-2 rounded-md bg-[#f7f9fc] p-3">
                {!selectedTeamTechnicians.filter((tech) => tech.id !== dispatchForm.lead_technician_id).length && (
                  <p className="text-xs font-semibold text-[#657181]">Belum ada support technician lain pada team ini.</p>
                )}
                {selectedTeamTechnicians.filter((tech) => tech.id !== dispatchForm.lead_technician_id).map((tech) => (
                  <label key={tech.id} className="flex items-center gap-2 rounded-md bg-white px-3 py-2 text-sm font-semibold text-[#17201d]">
                    <input
                      type="checkbox"
                      checked={dispatchForm.support_technician_ids.includes(tech.id)}
                      onChange={() => toggleSupportTechnician(tech.id)}
                    />
                    <span>{tech.user?.full_name || tech.id}</span>
                    <span className="text-xs text-[#657181]">{tech.level.replaceAll('_', ' ')}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="rounded-md bg-[#f2f4f7] px-4 py-3 text-xs font-bold text-[#657181]">
              Multi technician dispatch aktif. Lead menentukan PIC utama, support bisa lebih dari satu teknisi.
            </div>
            <button onClick={() => void createDispatch()} className="h-10 rounded-md bg-[#007f73] text-sm font-bold text-white">Create Dispatch</button>
          </div>
        ) : (
          <div className="rounded-md bg-[#f2f4f7] px-4 py-3 text-sm font-semibold text-[#657181]">
            Role ini hanya bisa review schedule. Pembuatan dispatch dilakukan oleh engineer, product specialist, atau manager.
          </div>
        )}
      </Panel>
    </section>
  );
}
