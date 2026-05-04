import { Field, Panel, Row, StatCard, TableHeader, date, inputClass, numberValue, percent, rupiah, scoreTone, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

export default function ReportsTab() {
  const { report, reportFilters, setReportFilters, master, loadDashboard } = useManagerDashboardContext();

  return (
    <section className="space-y-5">
      <Panel title="KPI Period Filter">
        <div className="grid max-w-4xl grid-cols-[180px_180px_1fr_140px] gap-3">
          <Field label="Period Start"><input type="date" className={inputClass} value={reportFilters.period_start} onChange={(event) => setReportFilters((current) => ({ ...current, period_start: event.target.value }))} /></Field>
          <Field label="Period End"><input type="date" className={inputClass} value={reportFilters.period_end} onChange={(event) => setReportFilters((current) => ({ ...current, period_end: event.target.value }))} /></Field>
          <Field label="Team">
            <select className={inputClass} value={reportFilters.team_id} onChange={(event) => setReportFilters((current) => ({ ...current, team_id: event.target.value }))}>
              <option value="">All allowed teams</option>
              {master?.teams.map((team) => <option key={team.id} value={team.id}>{team.name}</option>)}
            </select>
          </Field>
          <button onClick={() => void loadDashboard()} className="mt-5 h-10 rounded-md bg-[#007f73] text-sm font-bold text-white">Apply</button>
        </div>
      </Panel>

      {report && (
        <>
          <section className="grid grid-cols-4 gap-4">
            <StatCard label="Average Score" value={numberValue(report.summary.average_score)} tone={scoreTone(report.summary.average_score)} />
            <StatCard label="Submission Rate" value={percent(report.summary.submission_rate)} />
            <StatCard label="Attendance Valid" value={percent(report.summary.attendance_valid_rate)} />
            <StatCard label="On Time Arrival" value={percent(report.summary.on_time_rate)} />
            <StatCard label="Completed Jobs" value={`${numberValue(report.summary.completed_jobs)} / ${numberValue(report.summary.total_jobs)}`} />
            <StatCard label="SO Pending" value={numberValue(report.summary.so_pending_jobs)} />
            <StatCard label="GPS Exceptions" value={numberValue(report.summary.gps_exceptions)} />
            <StatCard label="Overtime" value={`${numberValue(report.summary.overtime_hours)}h / ${rupiah(report.summary.overtime_amount)}`} />
          </section>

          <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
            <TableHeader columns={['Technician', 'KPI Start', 'Jobs', 'Submission', 'Attendance', 'OT Amount', 'Score']} />
            {report.technicians.map((tech) => (
              <Row
                key={tech.technician_id}
                values={[
                  <div>
                    <p className="font-extrabold">{tech.full_name}</p>
                    <p className="text-xs font-semibold text-[#5d6b66]">{tech.employee_id} / {title(tech.level)} / {tech.team}</p>
                  </div>,
                  <div>
                    <p className="font-bold">{date(tech.kpi_effective_start)}</p>
                    <p className="text-xs text-[#5d6b66]">{tech.kpi_days} KPI days</p>
                  </div>,
                  `${tech.completed_jobs}/${tech.assigned_jobs} done`,
                  percent(tech.submission_rate),
                  percent(tech.attendance_rate),
                  rupiah(tech.overtime_amount),
                  <span className={`text-lg font-extrabold ${scoreTone(tech.score)}`}>{tech.score}</span>,
                ]}
              />
            ))}
          </section>

          <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
            <TableHeader columns={['Team', 'Technicians', 'Jobs', 'SO Pending', 'Attendance', 'OT Hours', 'Avg Score']} />
            {report.teams.map((team) => (
              <Row
                key={team.team_id}
                values={[
                  team.team_name,
                  numberValue(team.technician_count),
                  `${numberValue(team.completed_jobs)} / ${numberValue(team.total_jobs)}`,
                  numberValue(team.so_pending_jobs),
                  percent(team.attendance_rate),
                  `${numberValue(team.overtime_hours)}h`,
                  <span className={`font-extrabold ${scoreTone(team.average_score)}`}>{numberValue(team.average_score)}</span>,
                ]}
              />
            ))}
          </section>
        </>
      )}
    </section>
  );
}
