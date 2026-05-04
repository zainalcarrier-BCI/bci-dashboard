import { Panel, Pill, Row, StatCard, TableHeader, date, rupiah, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

export default function OvertimeTab() {
  const { permissions, overtimeRows, requestOvertimeDecision } = useManagerDashboardContext();
  const submittedRows = overtimeRows.filter((row) => row.status === 'submitted');
  const approvedRows = overtimeRows.filter((row) => row.status === 'approved');
  const submittedHours = submittedRows.reduce((total, row) => total + row.calculated_duration_minutes / 60, 0);
  const submittedAmount = submittedRows.reduce((total, row) => total + row.total_amount, 0);

  if (!overtimeRows.length) {
    return (
      <Panel title="Overtime Approval">
        <p className="text-sm font-semibold text-[#657181]">Belum ada overtime request di team yang Bapak pegang.</p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-4 md:grid-cols-4">
        <StatCard label="Pending Requests" value={submittedRows.length} tone={submittedRows.length ? 'text-[#c25f00]' : 'text-[#17201d]'} />
        <StatCard label="Pending Hours" value={`${submittedHours.toFixed(1)}h`} tone="text-[#002f63]" />
        <StatCard label="Pending Amount" value={rupiah(submittedAmount)} tone="text-[#007f73]" />
        <StatCard label="Approved Rows" value={approvedRows.length} tone="text-[#17201d]" />
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
        <TableHeader columns={['Technician / Job', 'Customer / Site', 'OT Window', 'Rate / Amount', 'SO / Status', 'Action']} />
        {overtimeRows.map((row) => (
          <Row
            key={row.id}
            values={[
              <div>
                <p className="font-extrabold text-[#17201d]">{row.technician_name}</p>
                <p className="text-xs font-semibold text-[#657181]">{row.job_no} / Visit {row.visit_no}</p>
                <p className="mt-1 text-xs font-semibold text-[#657181]">{title(row.job_type)}{row.equipment_name ? ` / ${row.equipment_name}` : ''}</p>
              </div>,
              <div>
                <p className="font-extrabold text-[#17201d]">{row.customer}</p>
                <p className="text-xs font-semibold text-[#657181]">{row.site}</p>
                <p className="mt-1 text-xs font-semibold text-[#657181]">{row.area || '-'} / {title(row.day_type)}</p>
              </div>,
              <div>
                <p className="font-extrabold text-[#17201d]">{date(row.overtime_date)}</p>
                <p className="text-xs font-semibold text-[#657181]">{row.overtime_start_at.slice(11, 16)} - {row.overtime_end_at.slice(11, 16)}</p>
                <p className="mt-1 text-xs font-semibold text-[#657181]">{`${Math.round((row.calculated_duration_minutes / 60) * 10) / 10}h`} OT</p>
              </div>,
              <div>
                <p className="font-extrabold text-[#17201d]">{rupiah(row.total_amount)}</p>
                <p className="text-xs font-semibold text-[#657181]">Rate {rupiah(row.rate_per_hour_snapshot)}/jam</p>
                <p className="mt-1 text-xs font-semibold text-[#657181]">Meal {rupiah(row.meal_allowance)}</p>
              </div>,
              <div>
                <Pill value={row.status} />
                <p className="mt-2 text-xs font-semibold text-[#657181]">SO: {row.so_number || 'Waiting SO'}</p>
              </div>,
              row.status === 'submitted' && permissions.canApproveOvertime ? (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => requestOvertimeDecision(row, 'approve')} className="rounded-md bg-[#007f73] px-3 py-1 text-xs font-bold text-white">Approve</button>
                  <button onClick={() => requestOvertimeDecision(row, 'reject')} className="rounded-md bg-red-50 px-3 py-1 text-xs font-bold text-red-700">Reject</button>
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
