import { Row, TableHeader, date, time, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

export default function AuditTab() {
  const { auditRows } = useManagerDashboardContext();

  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
      <TableHeader columns={['When', 'Actor', 'Entity', 'Action', 'Summary', 'Metadata']} />
      {auditRows.length ? auditRows.map((row) => (
        <Row
          key={row.id}
          values={[
            <div>
              <p className="font-bold">{date(row.created_at)}</p>
              <p className="text-xs font-semibold text-[#5d6b66]">{time(row.created_at)}</p>
            </div>,
            <div>
              <p className="font-extrabold">{row.actor_name || title(row.actor_type)}</p>
              <p className="text-xs font-semibold text-[#5d6b66]">{title(row.actor_role || row.actor_type)}</p>
            </div>,
            title(row.entity_type),
            title(row.action),
            row.summary,
            <pre className="whitespace-pre-wrap text-[10px] font-semibold text-[#5d6b66]">{JSON.stringify(row.metadata || {}, null, 2)}</pre>,
          ]}
        />
      )) : (
        <div className="px-4 py-6 text-sm font-semibold text-[#5d6b66]">Belum ada audit log.</div>
      )}
    </section>
  );
}
