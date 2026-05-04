import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, CheckCircle2, Download, Eye, FileText, Printer } from 'lucide-react';
import Layout from './Layout';
import { ApiOvertimeRow, createOvertimePrintBatch, getCurrentMonthBounds, getPrintableOvertime } from '../services/api';

interface PrintOvertimeProps {
  onBack: () => void;
  onTabChange: (tab: 'home' | 'jobs' | 'history' | 'profile') => void;
}

type OvertimePrintRow = {
  id: string;
  no: number;
  date: string;
  jobNo: string;
  customer: string;
  visit: string;
  so: string;
  workType: string;
  area: string;
  equipment: string;
  inTime: string;
  outTime: string;
  ot: string;
  dayType: string;
  ov1: string;
  ov2: string;
  ov3: string;
  ov4: string;
  tov: string;
  rate: string;
  nominal: string;
  meal: string;
  total: string;
  duration: string;
  status: string;
  raw: ApiOvertimeRow;
};

const DEFAULT_PERIOD = getCurrentMonthBounds();
const DEFAULT_PERIOD_START = DEFAULT_PERIOD.start;
const DEFAULT_PERIOD_END = DEFAULT_PERIOD.end;

function rupiah(value: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

function decimal(value: number) {
  return Number(value || 0).toLocaleString('id-ID', { maximumFractionDigits: 2 });
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(`${value}T00:00:00+07:00`));
}

function formatPeriod(periodStart: string, periodEnd: string) {
  const start = new Date(`${periodStart}T00:00:00+07:00`);
  const end = new Date(`${periodEnd}T00:00:00+07:00`);
  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();
  if (sameMonth) return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(start);
  return `${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(start)} - ${new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(end)}`;
}

function time(value: string) {
  return new Intl.DateTimeFormat('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
}

function htmlEscape(value: string | number | null | undefined) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char] || char));
}

function mapOvertimeRow(row: ApiOvertimeRow, index: number): OvertimePrintRow {
  const hours = row.calculated_duration_minutes / 60;
  return {
    id: row.id,
    no: index + 1,
    date: formatDate(row.overtime_date),
    jobNo: row.job_no || row.job_id,
    customer: row.customer,
    visit: `Visit ${row.visit_no}`,
    so: row.so_number ?? '-',
    workType: row.job_type.replaceAll('_', ' '),
    area: row.area,
    equipment: row.equipment_name ?? '-',
    inTime: time(row.overtime_start_at),
    outTime: time(row.overtime_end_at),
    ot: decimal(hours),
    dayType: row.day_type === 'weekday' ? 'Weekdays' : row.day_type,
    ov1: row.ov1_hours ? decimal(row.ov1_hours) : '-',
    ov2: row.ov2_hours ? decimal(row.ov2_hours) : '-',
    ov3: row.ov3_hours ? decimal(row.ov3_hours) : '-',
    ov4: row.ov4_hours ? decimal(row.ov4_hours) : '-',
    tov: decimal(row.total_overtime_value),
    rate: rupiah(row.rate_per_hour_snapshot),
    nominal: rupiah(row.nominal_overtime),
    meal: rupiah(row.meal_allowance),
    total: rupiah(row.total_amount),
    duration: `${decimal(hours)}h`,
    status: row.status === 'approved' ? 'Approved' : row.status === 'printed' ? 'Printed' : row.status,
    raw: row,
  };
}

function buildPrintableHtml(rows: OvertimePrintRow[], technicianName: string, periodLabel: string) {
  const firstRate = rows[0]?.raw.rate_salary_snapshot ?? 0;
  const firstHourlyRate = rows[0]?.raw.rate_per_hour_snapshot ?? 0;
  const totalMinutes = rows.reduce((sum, row) => sum + row.raw.calculated_duration_minutes, 0);
  const totalNominal = rows.reduce((sum, row) => sum + Number(row.raw.nominal_overtime || 0), 0);
  const grandTotal = rows.reduce((sum, row) => sum + Number(row.raw.total_amount || 0), 0);
  const bodyRows = rows.map((row, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${htmlEscape(row.date)}</td>
      <td>${htmlEscape(row.customer)}</td>
      <td>${htmlEscape(row.visit)}</td>
      <td>${htmlEscape(row.so)}</td>
      <td>${htmlEscape(row.workType)}</td>
      <td>${htmlEscape(row.area)}</td>
      <td>${htmlEscape(row.equipment)}</td>
      <td>${htmlEscape(row.inTime)}</td>
      <td>${htmlEscape(row.outTime)}</td>
      <td>${htmlEscape(row.ot)}</td>
      <td>${htmlEscape(row.dayType)}</td>
      <td>${htmlEscape(row.ov1)}</td>
      <td>${htmlEscape(row.ov2)}</td>
      <td>${htmlEscape(row.ov3)}</td>
      <td>${htmlEscape(row.ov4)}</td>
      <td>${htmlEscape(row.tov)}</td>
      <td>${htmlEscape(row.rate)}</td>
      <td>${htmlEscape(row.nominal)}</td>
      <td>${htmlEscape(row.meal)}</td>
      <td><strong>${htmlEscape(row.total)}</strong></td>
    </tr>
  `).join('');

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Detail Lembur - ${htmlEscape(technicianName)}</title>
  <style>
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: Arial, sans-serif; color: #0f172a; }
    h1 { margin: 0; font-size: 20px; letter-spacing: 1px; }
    p { margin: 6px 0 14px; color: #475569; }
    table { width: 100%; border-collapse: collapse; font-size: 9px; }
    th, td { border: 1px solid #aab6c8; padding: 5px; vertical-align: top; }
    th { background: #eef3f8; }
    .summary, .identity { display: grid; border: 1px solid #aab6c8; margin-top: 10px; }
    .identity { grid-template-columns: 0.9fr 2fr 0.8fr 2fr 0.8fr 2fr; font-size: 11px; }
    .summary { grid-template-columns: repeat(4, 1fr); font-size: 12px; }
    .cell { padding: 7px; border-right: 1px solid #aab6c8; }
    .cell:last-child { border-right: 0; }
    .label { color: #475569; font-size: 10px; }
    .value { font-weight: 700; margin-top: 2px; }
    .signatures { display: grid; grid-template-columns: repeat(3, 1fr); gap: 70px; margin-top: 34px; text-align: center; font-size: 12px; }
    .line { height: 1px; background: #0f172a; margin-top: 44px; }
  </style>
</head>
<body>
  <h1>Detail Lembur - ${htmlEscape(technicianName)}</h1>
  <p>Periode ${htmlEscape(periodLabel)}</p>
  <div class="identity">
    <div class="cell"><strong>Nama Teknisi</strong></div>
    <div class="cell">${htmlEscape(technicianName)}</div>
    <div class="cell"><strong>Rate Salary</strong></div>
    <div class="cell">${htmlEscape(rupiah(firstRate))}</div>
    <div class="cell"><strong>Rate/Jam</strong></div>
    <div class="cell">${htmlEscape(rupiah(firstHourlyRate))}</div>
  </div>
  <div class="summary">
    <div class="cell"><div class="label">Total Row</div><div class="value">${rows.length}</div></div>
    <div class="cell"><div class="label">Total Jam Lembur</div><div class="value">${decimal(totalMinutes / 60)}</div></div>
    <div class="cell"><div class="label">Nominal Lembur</div><div class="value">${htmlEscape(rupiah(totalNominal))}</div></div>
    <div class="cell"><div class="label">Grand Total</div><div class="value">${htmlEscape(rupiah(grandTotal))}</div></div>
  </div>
  <table style="margin-top: 10px;">
    <thead>
      <tr>
        ${['No', 'Tanggal', 'Customer', 'Visit', 'SO', 'Type Pekerjaan', 'Area', 'Equip', 'In', 'Out', 'OT', 'Day Type', 'OV1', 'OV2', 'OV3', 'OV4', 'TOV', 'Rate', 'Nominal', 'Makan', 'Total'].map((header) => `<th>${header}</th>`).join('')}
      </tr>
    </thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="signatures">
    ${['Dibuat oleh', 'Diperiksa HR', 'Disetujui'].map((label) => `<div><div>${label}</div><div class="line"></div></div>`).join('')}
  </div>
</body>
</html>`;
}

export default function PrintOvertime({ onBack, onTabChange }: PrintOvertimeProps) {
  const [apiRows, setApiRows] = useState<ApiOvertimeRow[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [periodStart, setPeriodStart] = useState(DEFAULT_PERIOD_START);
  const [periodEnd, setPeriodEnd] = useState(DEFAULT_PERIOD_END);
  const [technicianName, setTechnicianName] = useState('Technician');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const previewRef = useRef<HTMLDivElement | null>(null);

  const loadRows = useCallback(async (start = periodStart, end = periodEnd) => {
    setIsLoading(true);
    setMessage('');
    try {
      const payload = await getPrintableOvertime(start, end);
      setApiRows(payload.rows);
      setTechnicianName(payload.technician_name || 'Technician');
      setSelectedIds(payload.rows.filter((row) => row.status === 'approved').map((row) => row.id));
    } catch {
      setApiRows([]);
      setSelectedIds([]);
      setMessage('Data overtime belum bisa dimuat. Cek koneksi API atau login teknisi.');
    } finally {
      setIsLoading(false);
    }
  }, [periodEnd, periodStart]);

  useEffect(() => {
    void loadRows(DEFAULT_PERIOD_START, DEFAULT_PERIOD_END);
  }, [loadRows]);

  const overtimeRows = useMemo(() => apiRows.map(mapOvertimeRow), [apiRows]);
  const selectedRows = useMemo(() => {
    const selectedSet = new Set(selectedIds);
    return overtimeRows.filter((row) => selectedSet.has(row.id));
  }, [overtimeRows, selectedIds]);
  const approvedRows = overtimeRows.filter((row) => row.status === 'Approved');
  const periodLabel = formatPeriod(periodStart, periodEnd);
  const totalMinutes = selectedRows.reduce((sum, row) => sum + row.raw.calculated_duration_minutes, 0);
  const totalNominal = selectedRows.reduce((sum, row) => sum + Number(row.raw.nominal_overtime || 0), 0);
  const grandTotal = selectedRows.reduce((sum, row) => sum + Number(row.raw.total_amount || 0), 0);
  const rateSalary = selectedRows[0]?.raw.rate_salary_snapshot ?? overtimeRows[0]?.raw.rate_salary_snapshot ?? 0;
  const ratePerHour = selectedRows[0]?.raw.rate_per_hour_snapshot ?? overtimeRows[0]?.raw.rate_per_hour_snapshot ?? 0;

  const toggleRow = (rowId: string, checked: boolean) => {
    setSelectedIds((current) => (checked ? [...new Set([...current, rowId])] : current.filter((id) => id !== rowId)));
  };

  const openPrintableDocument = () => {
    if (!selectedRows.length) {
      setMessage('Pilih minimal satu overtime approved untuk diprint.');
      return;
    }
    const popup = window.open('', '_blank');
    if (!popup) {
      setMessage('Browser memblokir print window. Izinkan pop-up untuk halaman ini.');
      return;
    }
    popup.document.open();
    popup.document.write(buildPrintableHtml(selectedRows, technicianName, periodLabel));
    popup.document.close();
    popup.focus();
    window.setTimeout(() => popup.print(), 350);
  };

  const markAsPrinted = async () => {
    if (!selectedRows.length) {
      setMessage('Pilih minimal satu overtime approved sebelum mark as printed.');
      return;
    }
    setIsLoading(true);
    setMessage('Saving print batch...');
    try {
      const response = await createOvertimePrintBatch({
        period_start: periodStart,
        period_end: periodEnd,
        overtime_request_ids: selectedRows.map((row) => row.id),
      });
      setMessage(`Printed batch saved. Batch ${response.batch.id.slice(0, 8)} contains ${response.batch.total_rows} row(s).`);
      await loadRows(periodStart, periodEnd);
    } catch {
      setMessage('Print batch gagal disimpan. Pastikan hanya memilih overtime yang statusnya approved.');
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Print Overtime" onBack={onBack} activeTab="profile" onTabChange={onTabChange}>
      <div className="p-4 space-y-5 pb-28">
        <section className="bg-primary text-white rounded-[2rem] p-6 relative overflow-hidden">
          <Printer className="absolute -right-5 -bottom-5 w-36 h-36 opacity-10" />
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-fixed">Overtime Document</p>
          <h2 className="mt-2 font-headline text-3xl font-extrabold">Print Overtime</h2>
          <p className="mt-2 text-sm text-white/85">Pilih tanggal lembur approved, review, lalu print atau simpan sebagai PDF.</p>
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm text-center">
            <p className="font-headline text-2xl font-extrabold text-primary">{overtimeRows.length}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">OT Rows</p>
          </div>
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm text-center">
            <p className="font-headline text-2xl font-extrabold text-primary">{decimal(totalMinutes / 60)}h</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Selected OT</p>
          </div>
          <div className="bg-surface-container-lowest rounded-[1.5rem] p-4 shadow-sm text-center">
            <p className="font-headline text-2xl font-extrabold text-tertiary">{selectedRows.length}</p>
            <p className="text-[10px] uppercase tracking-wider font-bold text-outline">Selected</p>
          </div>
        </section>

        <section className="bg-surface-container-low rounded-[2rem] p-5 space-y-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <h3 className="font-headline font-extrabold text-on-surface">Filter Period</h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1">
              <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-outline">From</span>
              <input
                type="date"
                name="overtimeFrom"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
                className="h-12 w-full rounded-xl border-none bg-surface-container-lowest px-3 text-xs font-semibold focus:ring-2 focus:ring-primary"
              />
            </label>
            <label className="space-y-1">
              <span className="px-1 text-[10px] font-bold uppercase tracking-wider text-outline">To</span>
              <input
                type="date"
                name="overtimeTo"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
                className="h-12 w-full rounded-xl border-none bg-surface-container-lowest px-3 text-xs font-semibold focus:ring-2 focus:ring-primary"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={() => void loadRows(periodStart, periodEnd)}
            disabled={isLoading}
            className="h-12 w-full rounded-2xl bg-primary text-white font-bold active:scale-95 transition-transform disabled:opacity-60"
          >
            {isLoading ? 'Loading...' : 'Search Approved Overtime'}
          </button>
          {message && <p className="rounded-2xl bg-surface-container-lowest px-4 py-3 text-xs font-bold text-primary">{message}</p>}
        </section>

        <section className="bg-surface-container-lowest rounded-[2rem] p-5 shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-primary">Select Overtime Days</p>
              <h3 className="font-headline text-xl font-extrabold text-on-surface">{periodLabel}</h3>
            </div>
            <button
              type="button"
              onClick={() => setSelectedIds(approvedRows.map((row) => row.id))}
              className="rounded-full bg-primary-fixed/70 px-3 py-2 text-[10px] font-bold uppercase text-primary"
            >
              Select Approved
            </button>
          </div>
          <div className="space-y-3">
            {overtimeRows.length === 0 && (
              <p className="rounded-2xl bg-surface-container-low p-4 text-sm font-semibold text-on-surface-variant">Belum ada overtime approved pada periode ini.</p>
            )}
            {overtimeRows.map((row) => {
              const isApproved = row.status === 'Approved';
              return (
                <label key={row.id} className="flex items-start gap-3 rounded-2xl bg-surface-container-low p-4">
                  <input
                    type="checkbox"
                    name="selectedOvertime"
                    checked={selectedIds.includes(row.id)}
                    onChange={(event) => toggleRow(row.id, event.target.checked)}
                    disabled={!isApproved}
                    className="mt-1 w-5 h-5 rounded border-outline-variant text-primary focus:ring-primary disabled:opacity-40"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-extrabold text-on-surface">{row.date}</p>
                        <p className="mt-0.5 text-xs font-semibold text-on-surface-variant">{row.jobNo} / {row.customer}</p>
                      </div>
                      <span className={`shrink-0 rounded-full px-2 py-1 text-[9px] font-bold uppercase ${
                        isApproved ? 'bg-tertiary/15 text-tertiary' : 'bg-surface-container-high text-on-surface-variant'
                      }`}>
                        {row.status}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-[10px] font-bold uppercase text-outline">
                      <span>In {row.inTime}</span>
                      <span>Out {row.outTime}</span>
                      <span className="text-primary">{row.duration}</span>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </section>

        <section ref={previewRef} className="bg-primary-fixed/45 rounded-[2rem] p-5 space-y-4">
          <div className="flex items-start gap-3">
            <FileText className="w-6 h-6 text-primary shrink-0" />
            <div>
              <p className="font-headline font-extrabold text-on-surface">Review Before Download</p>
              <p className="text-xs text-on-surface-variant mt-1">Preview mengikuti format Detail Lembur HR sebelum dijadikan PDF.</p>
            </div>
          </div>
          <div className="rounded-2xl bg-surface-container-lowest p-3 shadow-sm">
            <div className="overflow-x-auto">
              <div className="min-w-[980px] rounded-xl bg-white p-4 text-[10px] text-slate-950">
                <div className="mb-3">
                  <h3 className="font-headline text-xl font-extrabold tracking-wider">Detail Lembur - {technicianName.toUpperCase()}</h3>
                  <p className="mt-1 text-sm text-slate-600">Periode {periodLabel}</p>
                </div>

                <div className="grid grid-cols-[0.8fr_2fr_0.7fr_2fr_0.7fr_2fr] border border-outline-variant text-[10px]">
                  <div className="border-r border-outline-variant px-2 py-1 font-bold">Nama Teknisi</div>
                  <div className="border-r border-outline-variant px-2 py-1">{technicianName.toUpperCase()}</div>
                  <div className="border-r border-outline-variant px-2 py-1 font-bold">Rate Salary</div>
                  <div className="border-r border-outline-variant px-2 py-1">{rupiah(rateSalary)}</div>
                  <div className="border-r border-outline-variant px-2 py-1 font-bold">Rate/Jam</div>
                  <div className="px-2 py-1">{rupiah(ratePerHour)}</div>
                </div>

                <div className="mt-3 grid grid-cols-4 border border-outline-variant text-xs">
                  <div className="border-r border-outline-variant p-2">
                    <p className="text-[10px] text-slate-600">Total Row</p>
                    <p className="text-sm font-extrabold">{selectedRows.length}</p>
                  </div>
                  <div className="border-r border-outline-variant p-2">
                    <p className="text-[10px] text-slate-600">Total Jam Lembur</p>
                    <p className="text-sm font-extrabold">{decimal(totalMinutes / 60)}</p>
                  </div>
                  <div className="border-r border-outline-variant p-2">
                    <p className="text-[10px] text-slate-600">Nominal Lembur</p>
                    <p className="text-sm font-extrabold">{rupiah(totalNominal)}</p>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-slate-600">Grand Total</p>
                    <p className="text-sm font-extrabold">{rupiah(grandTotal)}</p>
                  </div>
                </div>

                <table className="mt-3 w-full border-collapse border border-outline-variant text-[9px]">
                  <thead>
                    <tr className="bg-surface-container-low">
                      {['No', 'Tanggal', 'Customer', 'Visit', 'SO', 'Type Pekerjaan', 'Area', 'Equip', 'In', 'Out', 'OT', 'Day Type', 'OV1', 'OV2', 'OV3', 'OV4', 'TOV', 'Rate', 'Nominal', 'Makan', 'Total'].map((header) => (
                        <th key={header} className="border border-outline-variant px-1.5 py-1 text-center font-bold">{header}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedRows.map((row, index) => (
                      <tr key={row.id}>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{index + 1}</td>
                        <td className="border border-outline-variant px-1.5 py-1">{row.date}</td>
                        <td className="border border-outline-variant px-1.5 py-1">{row.customer}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.visit}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.so}</td>
                        <td className="border border-outline-variant px-1.5 py-1">{row.workType}</td>
                        <td className="border border-outline-variant px-1.5 py-1">{row.area}</td>
                        <td className="border border-outline-variant px-1.5 py-1">{row.equipment}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.inTime}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.outTime}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.ot}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.dayType}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.ov1}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.ov2}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.ov3}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.ov4}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-center">{row.tov}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-right">{row.rate}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-right">{row.nominal}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-right">{row.meal}</td>
                        <td className="border border-outline-variant px-1.5 py-1 text-right font-bold">{row.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-8 grid grid-cols-3 gap-12 text-center text-[10px]">
                  {['Dibuat oleh', 'Diperiksa HR', 'Disetujui'].map((label) => (
                    <div key={label}>
                      <p>{label}</p>
                      <div className="mx-auto mt-10 h-px w-40 bg-slate-950" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="h-14 rounded-full bg-surface-container-high text-on-surface font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Eye className="w-5 h-5 text-primary" />
            Review
          </button>
          <button
            type="button"
            onClick={openPrintableDocument}
            disabled={!selectedRows.length}
            className="h-14 rounded-full bg-primary text-white font-bold flex items-center justify-center gap-2 shadow-[0px_8px_24px_rgba(0,102,110,0.25)] active:scale-95 transition-transform disabled:opacity-60"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={() => void markAsPrinted()}
            disabled={!selectedRows.length || isLoading}
            className="col-span-2 h-12 rounded-2xl bg-surface-container-low text-primary font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            <CheckCircle2 className="w-5 h-5" />
            Mark As Printed
          </button>
        </section>
      </div>
    </Layout>
  );
}
