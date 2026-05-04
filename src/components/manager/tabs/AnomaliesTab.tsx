import { Pill, Row, TableHeader, date, time, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

export default function AnomaliesTab() {
  const { anomalyRows } = useManagerDashboardContext();

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
      <TableHeader columns={['Type', 'Technician', 'Team', 'Job', 'When', 'Severity', 'Detail']} />
      {anomalyRows.length ? anomalyRows.map((row) => (
        <Row
          key={row.id}
          values={[
            title(row.anomaly_type),
            <div>
              <p className="font-extrabold">{row.technician_name}</p>
              <p className="text-xs font-semibold text-[#5d6b66]">{row.technician_employee_id}</p>
            </div>,
            row.team_name,
            row.job_no || '-',
            <div>
              <p className="font-bold">{date(row.event_at)}</p>
              <p className="text-xs font-semibold text-[#5d6b66]">{time(row.event_at)}</p>
            </div>,
            <Pill value={row.severity} />,
            <div>
              <p className="font-bold">{row.summary}</p>
              <p className="text-xs text-[#5d6b66]">{row.detail || '-'}</p>
            </div>,
          ]}
        />
      )) : (
        <div className="px-4 py-6 text-sm font-semibold text-[#5d6b66]">Belum ada anomaly aktif.</div>
      )}
    </section>
  );
}
