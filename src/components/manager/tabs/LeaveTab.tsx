import { Panel, Pill, Row, StatCard, TableHeader, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

export default function LeaveTab() {
  const { leaveRows, permissions, requestLeaveDecision } = useManagerDashboardContext();
  const submittedRows = leaveRows.filter((row) => row.status === 'submitted');
  const impactedJobs = leaveRows.reduce((count, row) => count + (row.impacted_jobs?.length || 0), 0);
  const annualRows = leaveRows.filter((row) => row.leave_type === 'annual_leave').length;
  const sickRows = leaveRows.filter((row) => row.leave_type === 'sick_leave').length;

  if (!leaveRows.length) {
    return (
      <Panel title="Leave Approval">
        <p className="text-sm font-semibold text-[#657181]">Belum ada leave request di scope team saat ini.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending Requests" value={submittedRows.length} tone={submittedRows.length ? 'text-[#c25f00]' : 'text-[#17201d]'} />
        <StatCard label="Impacted Jobs" value={impactedJobs} tone={impactedJobs ? 'text-red-700' : 'text-[#17201d]'} />
        <StatCard label="Annual Leave" value={annualRows} tone="text-[#002f63]" />
        <StatCard label="Sick Leave" value={sickRows} tone="text-[#007f73]" />
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
        <TableHeader columns={['Technician', 'Leave Window', 'Reason', 'Operational Impact', 'Status', 'Action']} />
        {leaveRows.map((row) => (
          <Row
            key={row.id}
            values={[
              <div>
                <p className="font-extrabold text-[#17201d]">{row.technician_name}</p>
                <p className="text-xs font-semibold text-[#657181]">{row.technician_employee_id} / {row.team_name}</p>
                <p className="mt-1 text-xs font-semibold text-[#657181]">{title(row.leave_type)}</p>
              </div>,
              <div>
                <p className="font-extrabold text-[#17201d]">{row.start_date} - {row.end_date}</p>
                <p className="text-xs font-semibold text-[#657181]">{row.total_days} day{row.total_days === 1 ? '' : 's'} / submitted {row.submitted_at?.slice(0, 10) || '-'}</p>
              </div>,
              <div>
                <p className="font-semibold text-[#17201d]">{row.reason}</p>
                {row.medical_note && <p className="mt-1 text-xs font-semibold text-[#657181]">Medical note: {row.medical_note}</p>}
              </div>,
              row.impacted_jobs?.length ? (
                <div>
                  <p className="font-extrabold text-red-700">{row.impacted_jobs.length} active job</p>
                  <p className="text-xs font-semibold text-[#657181]">{row.impacted_jobs.slice(0, 2).map((job) => `${job.job_no} / ${job.site}`).join(', ')}</p>
                </div>
              ) : (
                <span className="text-xs font-semibold text-[#657181]">No active job impact</span>
              ),
              <div>
                <Pill value={row.status} />
              </div>,
              row.status === 'submitted' && permissions.canApproveLeave ? (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => requestLeaveDecision(row, 'approve')} className="rounded-md bg-[#007f73] px-3 py-1 text-xs font-bold text-white">Approve</button>
                  <button onClick={() => requestLeaveDecision(row, 'reject')} className="rounded-md bg-red-50 px-3 py-1 text-xs font-bold text-red-700">Reject</button>
                </div>
              ) : (
                <span className="text-xs font-semibold text-[#657181]">No action</span>
              ),
            ]}
          />
        ))}
      </section>
    </div>
  );
}
