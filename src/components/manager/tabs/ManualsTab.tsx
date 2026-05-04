import { Trash2, Upload } from 'lucide-react';
import { Field, InlineError, Panel, Pill, Row, TableHeader, date, inputClass, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

export default function ManualsTab() {
  const {
    permissions,
    formErrors,
    manualForm,
    setManualForm,
    manualFile,
    setManualFile,
    manualUploadBusy,
    saveManual,
    manualDocuments,
    viewManualDocument,
    downloadManualDocument,
    deleteManualDocument,
  } = useManagerDashboardContext();

  return (
    <section className="space-y-5">
      {permissions.canUploadManuals ? (
        <Panel title="Manual Book Upload">
          <div className="grid max-w-4xl grid-cols-2 gap-3">
            {formErrors.manual && <InlineError message={formErrors.manual} className="col-span-2" />}
            <Field label="Title"><input className={inputClass} value={manualForm.title} onChange={(event) => setManualForm((current) => ({ ...current, title: event.target.value }))} placeholder="Carrier Chiller IOM 30XA" /></Field>
            <Field label="PDF File">
              <input
                type="file"
                accept=".pdf,application/pdf"
                className="block h-10 w-full rounded-md border border-[#dbe5df] bg-white px-3 py-2 text-sm text-[#17201d]"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  setManualFile(file);
                  setManualForm((current) => ({ ...current, file_name: file?.name || 'manual.pdf' }));
                }}
              />
            </Field>
            <Field label="Brand">
              <select className={inputClass} value={manualForm.brand} onChange={(event) => setManualForm((current) => ({ ...current, brand: event.target.value }))}>
                <option value="carrier">Carrier</option>
                <option value="toshiba">Toshiba</option>
              </select>
            </Field>
            <Field label="Product">
              <select className={inputClass} value={manualForm.product_line} onChange={(event) => setManualForm((current) => ({ ...current, product_line: event.target.value }))}>
                <option value="chiller">Chiller</option>
                <option value="vrf">VRF</option>
                <option value="controls">Controls</option>
              </select>
            </Field>
            <Field label="Type">
              <select className={inputClass} value={manualForm.document_type} onChange={(event) => setManualForm((current) => ({ ...current, document_type: event.target.value }))}>
                <option value="iom">IOM</option>
                <option value="wiring_diagram">Wiring Diagram</option>
                <option value="service_manual">Service Manual</option>
                <option value="bulletin">Bulletin</option>
              </select>
            </Field>
            <Field label="Model Keyword"><input className={inputClass} value={manualForm.model_keyword} onChange={(event) => setManualForm((current) => ({ ...current, model_keyword: event.target.value }))} placeholder="30XA / MMY / SMMS" /></Field>
            <Field label="Version"><input className={inputClass} value={manualForm.version} onChange={(event) => setManualForm((current) => ({ ...current, version: event.target.value }))} /></Field>
            <div className="rounded-md bg-[#f2f4f7] px-4 py-3 text-xs font-bold text-[#657181]">File terpilih: {manualFile?.name || manualForm.file_name}</div>
            <button onClick={() => void saveManual()} disabled={manualUploadBusy} className="col-span-2 flex h-10 items-center justify-center gap-2 rounded-md bg-[#007f73] text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">
              <Upload className="h-4 w-4" />
              {manualUploadBusy ? 'Uploading PDF...' : 'Upload PDF Manual'}
            </button>
          </div>
        </Panel>
      ) : (
        <div className="rounded-lg bg-white px-5 py-4 text-sm font-semibold text-[#657181] shadow-sm shadow-blue-900/5">
          Role ini hanya bisa review manual book. Upload dokumen dibuka untuk product specialist atau manager.
        </div>
      )}

      <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
        <TableHeader columns={['Document', 'Brand / Product', 'Model', 'Version', 'Status', 'Action']} />
        {manualDocuments.length ? manualDocuments.map((document) => (
          <Row
            key={document.id}
            values={[
              <div>
                <p className="font-extrabold">{document.title}</p>
                <p className="text-xs text-[#5d6b66]">{title(document.document_type)} {document.uploaded_at ? `/ ${date(document.uploaded_at)}` : ''}</p>
              </div>,
              `${title(document.brand)} / ${title(document.product_line)}`,
              document.model_keyword || '-',
              document.version || '-',
              <Pill value={document.is_active ? 'active' : 'inactive'} />,
              <div className="flex flex-wrap gap-2">
                <button onClick={() => void viewManualDocument(document.id)} className="rounded-md border border-[#007f73] px-3 py-1 text-xs font-bold text-[#007f73]">View</button>
                <button onClick={() => void downloadManualDocument(document.id, document.title)} className="rounded-md bg-[#f0f5f2] px-3 py-1 text-xs font-bold text-[#42524c]">Download</button>
                {permissions.canUploadManuals && (
                  <button onClick={() => void deleteManualDocument(document)} className="inline-flex items-center gap-1 rounded-md bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                )}
              </div>,
            ]}
          />
        )) : (
          <Row values={['Belum ada manual', '-', '-', '-', <Pill value="inactive" />, '-']} />
        )}
      </section>
    </section>
  );
}
