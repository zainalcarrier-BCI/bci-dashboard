import { Field, InlineError, Panel, Pill, Row, StatCard, TableHeader, coordinate, date, googleMapsUrl, inputClass, numberValue, time, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

export default function LocationsTab() {
  const {
    permissions,
    summary,
    locations,
    master,
    gpsExceptions,
    formErrors,
    siteForm,
    setSiteForm,
    officeForm,
    setOfficeForm,
    selectedSite,
    selectedOffice,
    siteGpsForm,
    setSiteGpsForm,
    officeGpsForm,
    setOfficeGpsForm,
    editSiteGps,
    editOfficeGps,
    createSite,
    createOffice,
    updateSiteGps,
    updateOfficeGps,
    requestCaptureDecision,
  } = useManagerDashboardContext();

  const scrollToOfficeEditor = () => {
    window.requestAnimationFrame(() => {
      document.getElementById('office-gps-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };
  const selectedOfficeMapUrl = selectedOffice ? googleMapsUrl(selectedOffice.latitude, selectedOffice.longitude) : '';
  const selectedSiteMapUrl = selectedSite ? googleMapsUrl(selectedSite.latitude, selectedSite.longitude) : '';

  return (
    <section className="space-y-5">
      <section className="grid grid-cols-4 gap-4">
        <StatCard label="Office Points" value={numberValue(locations?.offices.length)} />
        <StatCard label="Registered Sites" value={numberValue(locations?.sites.length)} />
        <StatCard label="Need Verification" value={numberValue(summary.unverifiedSites.length)} tone={summary.unverifiedSites.length ? 'text-yellow-700' : 'text-emerald-700'} />
        <StatCard label="GPS Exceptions" value={numberValue(gpsExceptions.length)} tone={gpsExceptions.length ? 'text-red-700' : 'text-emerald-700'} />
      </section>

      <section className="grid grid-cols-2 gap-5">
        <Panel title="Office Map Preview">
          {selectedOffice ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#eef6ff] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#00639a]">Selected Office</p>
                <h3 className="mt-1 font-headline text-xl font-extrabold text-[#002f63]">{selectedOffice.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#42524c]">{selectedOffice.address || selectedOffice.branch?.name || '-'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-[#f2f4f7] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#657181]">Latitude</p>
                  <p className="font-bold">{coordinate(selectedOffice.latitude)}</p>
                </div>
                <div className="rounded-md bg-[#f2f4f7] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#657181]">Longitude</p>
                  <p className="font-bold">{coordinate(selectedOffice.longitude)}</p>
                </div>
                <div className="rounded-md bg-[#f2f4f7] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#657181]">Radius</p>
                  <p className="font-bold">{selectedOffice.radius_meters} m</p>
                </div>
              </div>
              <button
                disabled={!selectedOfficeMapUrl}
                onClick={() => selectedOfficeMapUrl && window.open(selectedOfficeMapUrl, '_blank', 'noopener')}
                className="h-10 w-full rounded-md bg-[#002f63] text-sm font-bold text-white disabled:bg-[#dbe5df] disabled:text-[#657181]"
              >
                Open Office In Google Maps
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#657181]">Pilih office point untuk melihat preview lokasi.</p>
          )}
        </Panel>

        <Panel title="Site Map Preview">
          {selectedSite ? (
            <div className="space-y-3">
              <div className="rounded-lg bg-[#f0f5f2] p-4">
                <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#007f73]">Selected Site</p>
                <h3 className="mt-1 font-headline text-xl font-extrabold text-[#002f63]">{selectedSite.name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#42524c]">{selectedSite.customer?.name || selectedSite.area || '-'}</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-md bg-[#f2f4f7] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#657181]">Latitude</p>
                  <p className="font-bold">{coordinate(selectedSite.latitude)}</p>
                </div>
                <div className="rounded-md bg-[#f2f4f7] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#657181]">Longitude</p>
                  <p className="font-bold">{coordinate(selectedSite.longitude)}</p>
                </div>
                <div className="rounded-md bg-[#f2f4f7] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-[#657181]">Radius</p>
                  <p className="font-bold">{selectedSite.radius_meters} m</p>
                </div>
              </div>
              <button
                disabled={!selectedSiteMapUrl}
                onClick={() => selectedSiteMapUrl && window.open(selectedSiteMapUrl, '_blank', 'noopener')}
                className="h-10 w-full rounded-md bg-[#007f73] text-sm font-bold text-white disabled:bg-[#dbe5df] disabled:text-[#657181]"
              >
                Open Site In Google Maps
              </button>
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#657181]">Pilih site untuk melihat preview lokasi.</p>
          )}
        </Panel>
      </section>

      <section>
        <div className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
          <TableHeader columns={['Office Point', 'Branch', 'Coordinates', 'Radius', 'Status', 'Action']} />
          {locations?.offices.map((office) => (
            <Row
              key={office.id}
              values={[
                <div>
                  <p className="font-extrabold">{office.name}</p>
                  <p className="text-xs font-semibold text-[#5d6b66]">{office.address || '-'}</p>
                </div>,
                office.branch?.name || '-',
                <div>
                  <p className="font-bold">{coordinate(office.latitude)}, {coordinate(office.longitude)}</p>
                  <p className="text-xs text-[#5d6b66]">{title(office.coordinate_source)}</p>
                </div>,
                `${office.radius_meters} m`,
                <div className="flex flex-col gap-1">
                  <Pill value={office.verification_status} />
                  <span className="text-[10px] font-bold text-[#5d6b66]">{office.is_active ? 'Active' : 'Inactive'}</span>
                </div>,
                <div className="flex flex-wrap gap-2">
                  {permissions.canManageLocations ? (
                    <button
                      onClick={() => {
                        editOfficeGps(office);
                        scrollToOfficeEditor();
                      }}
                      className="rounded-md border border-[#007f73] px-3 py-1 text-xs font-bold text-[#007f73]"
                    >
                      Edit Office
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-[#5d6b66]">Read only</span>
                  )}
                  {googleMapsUrl(office.latitude, office.longitude) && (
                    <button onClick={() => window.open(googleMapsUrl(office.latitude, office.longitude), '_blank', 'noopener')} className="rounded-md bg-[#f0f5f2] px-3 py-1 text-xs font-bold text-[#42524c]">Map</button>
                  )}
                </div>,
              ]}
            />
          ))}
        </div>
      </section>

      <section className="grid grid-cols-[minmax(0,1fr)_380px] gap-5">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
          <TableHeader columns={['Site', 'Customer', 'Coordinates', 'Radius', 'Status', 'Action']} />
          {locations?.sites.map((site) => (
            <Row
              key={site.id}
              values={[
                <div>
                  <p className="font-extrabold">{site.name}</p>
                  <p className="text-xs font-semibold text-[#5d6b66]">{site.area || '-'}</p>
                </div>,
                site.customer?.name || '-',
                <div>
                  <p className="font-bold">{coordinate(site.latitude)}, {coordinate(site.longitude)}</p>
                  <p className="text-xs text-[#5d6b66]">{title(site.coordinate_source)}</p>
                </div>,
                `${site.radius_meters} m`,
                <Pill value={site.verification_status} />,
                <div className="flex flex-wrap gap-2">
                  {permissions.canManageLocations ? (
                    <button onClick={() => editSiteGps(site)} className="rounded-md border border-[#007f73] px-3 py-1 text-xs font-bold text-[#007f73]">Edit GPS</button>
                  ) : (
                    <span className="text-xs font-semibold text-[#5d6b66]">Read only</span>
                  )}
                  {googleMapsUrl(site.latitude, site.longitude) && (
                    <button onClick={() => window.open(googleMapsUrl(site.latitude, site.longitude), '_blank', 'noopener')} className="rounded-md bg-[#f0f5f2] px-3 py-1 text-xs font-bold text-[#42524c]">Map</button>
                  )}
                </div>,
              ]}
            />
          ))}
        </div>

        <div className="space-y-5">
          <Panel title="Create Office Point">
            {permissions.canManageLocations ? (
              <div className="grid gap-3">
                {formErrors.office_create && <InlineError message={formErrors.office_create} />}
                <Field label="Branch">
                  <select className={inputClass} value={officeForm.branch_id} onChange={(event) => setOfficeForm((current) => ({ ...current, branch_id: event.target.value }))}>
                    {master?.branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>{branch.name}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Office Name"><input className={inputClass} value={officeForm.name} onChange={(event) => setOfficeForm((current) => ({ ...current, name: event.target.value }))} placeholder="Jakarta HO / Surabaya Branch" /></Field>
                <Field label="Address"><input className={inputClass} value={officeForm.address} onChange={(event) => setOfficeForm((current) => ({ ...current, address: event.target.value }))} placeholder="Office address / landmark" /></Field>
                <Field label="Google Maps Link"><input className={inputClass} value={officeForm.maps_url} onChange={(event) => setOfficeForm((current) => ({ ...current, maps_url: event.target.value }))} placeholder="Optional, coordinates parsed by API" /></Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Latitude"><input className={inputClass} value={officeForm.latitude} onChange={(event) => setOfficeForm((current) => ({ ...current, latitude: event.target.value }))} /></Field>
                  <Field label="Longitude"><input className={inputClass} value={officeForm.longitude} onChange={(event) => setOfficeForm((current) => ({ ...current, longitude: event.target.value }))} /></Field>
                  <Field label="Radius"><input className={inputClass} value={officeForm.radius_meters} onChange={(event) => setOfficeForm((current) => ({ ...current, radius_meters: event.target.value }))} /></Field>
                </div>
                <button onClick={() => void createOffice()} className="h-10 rounded-md bg-[#007f73] text-sm font-bold text-white">Create Office Point</button>
              </div>
            ) : (
              <div className="rounded-md bg-[#f2f4f7] px-4 py-3 text-sm font-semibold text-[#657181]">
                Role ini hanya bisa review GPS. Pembuatan titik office dilakukan oleh engineer ke atas.
              </div>
            )}
          </Panel>

          <div id="office-gps-editor">
          <Panel title="Update Office GPS">
            {permissions.canManageLocations ? (
              <div className="grid gap-3">
                {formErrors.office_update && <InlineError message={formErrors.office_update} />}
                <Field label="Selected Office">
                  <select
                    className={inputClass}
                    value={selectedOffice?.id || ''}
                    onChange={(event) => {
                      const office = locations?.offices.find((item) => item.id === event.target.value);
                      if (office) editOfficeGps(office);
                    }}
                  >
                    {locations?.offices.map((office) => <option key={office.id} value={office.id}>{office.name}</option>)}
                  </select>
                </Field>
                <Field label="Office Name"><input className={inputClass} value={officeGpsForm.name} onChange={(event) => setOfficeGpsForm((current) => ({ ...current, name: event.target.value }))} /></Field>
                <Field label="Address"><input className={inputClass} value={officeGpsForm.address} onChange={(event) => setOfficeGpsForm((current) => ({ ...current, address: event.target.value }))} /></Field>
                <Field label="Google Maps Link"><input className={inputClass} value={officeGpsForm.maps_url} onChange={(event) => setOfficeGpsForm((current) => ({ ...current, maps_url: event.target.value }))} /></Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Latitude"><input className={inputClass} value={officeGpsForm.latitude} onChange={(event) => setOfficeGpsForm((current) => ({ ...current, latitude: event.target.value }))} /></Field>
                  <Field label="Longitude"><input className={inputClass} value={officeGpsForm.longitude} onChange={(event) => setOfficeGpsForm((current) => ({ ...current, longitude: event.target.value }))} /></Field>
                  <Field label="Radius"><input className={inputClass} value={officeGpsForm.radius_meters} onChange={(event) => setOfficeGpsForm((current) => ({ ...current, radius_meters: event.target.value }))} /></Field>
                </div>
                <label className="flex items-center gap-2 text-sm font-semibold text-[#42524c]">
                  <input type="checkbox" checked={officeGpsForm.is_active} onChange={(event) => setOfficeGpsForm((current) => ({ ...current, is_active: event.target.checked }))} />
                  Active office point
                </label>
                <button onClick={() => void updateOfficeGps()} className="h-10 rounded-md bg-[#007f73] text-sm font-bold text-white">Verify Office Point</button>
              </div>
            ) : (
              <div className="rounded-md bg-[#f2f4f7] px-4 py-3 text-sm font-semibold text-[#657181]">
                Update office coordinate membutuhkan role yang punya akses operasional.
              </div>
            )}
          </Panel>
          </div>

          <Panel title="Create Site GPS">
            {permissions.canManageLocations ? (
              <div className="grid gap-3">
                {formErrors.site_create && <InlineError message={formErrors.site_create} />}
                <Field label="Customer"><input className={inputClass} value={siteForm.customer} onChange={(event) => setSiteForm((current) => ({ ...current, customer: event.target.value }))} /></Field>
                <Field label="Site Name"><input className={inputClass} value={siteForm.name} onChange={(event) => setSiteForm((current) => ({ ...current, name: event.target.value }))} /></Field>
                <Field label="Area"><input className={inputClass} value={siteForm.area} onChange={(event) => setSiteForm((current) => ({ ...current, area: event.target.value }))} /></Field>
                <Field label="Google Maps Link"><input className={inputClass} value={siteForm.maps_url} onChange={(event) => setSiteForm((current) => ({ ...current, maps_url: event.target.value }))} placeholder="Optional, coordinates parsed by API" /></Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Latitude"><input className={inputClass} value={siteForm.latitude} onChange={(event) => setSiteForm((current) => ({ ...current, latitude: event.target.value }))} /></Field>
                  <Field label="Longitude"><input className={inputClass} value={siteForm.longitude} onChange={(event) => setSiteForm((current) => ({ ...current, longitude: event.target.value }))} /></Field>
                  <Field label="Radius"><input className={inputClass} value={siteForm.radius_meters} onChange={(event) => setSiteForm((current) => ({ ...current, radius_meters: event.target.value }))} /></Field>
                </div>
                <button onClick={() => void createSite()} className="h-10 rounded-md bg-[#007f73] text-sm font-bold text-white">Create Site</button>
              </div>
            ) : (
              <div className="rounded-md bg-[#f2f4f7] px-4 py-3 text-sm font-semibold text-[#657181]">
                Role ini hanya bisa review GPS. Pembuatan atau verifikasi site dilakukan oleh engineer ke atas.
              </div>
            )}
          </Panel>

          <Panel title="Update Selected GPS">
            {permissions.canManageLocations ? (
              <div className="grid gap-3">
                {formErrors.site_update && <InlineError message={formErrors.site_update} />}
                <Field label="Selected Site">
                  <select
                    className={inputClass}
                    value={selectedSite?.id || ''}
                    onChange={(event) => {
                      const site = locations?.sites.find((item) => item.id === event.target.value);
                      if (site) editSiteGps(site);
                    }}
                  >
                    {locations?.sites.map((site) => <option key={site.id} value={site.id}>{site.name}</option>)}
                  </select>
                </Field>
                <Field label="Google Maps Link"><input className={inputClass} value={siteGpsForm.maps_url} onChange={(event) => setSiteGpsForm((current) => ({ ...current, maps_url: event.target.value }))} /></Field>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Latitude"><input className={inputClass} value={siteGpsForm.latitude} onChange={(event) => setSiteGpsForm((current) => ({ ...current, latitude: event.target.value }))} /></Field>
                  <Field label="Longitude"><input className={inputClass} value={siteGpsForm.longitude} onChange={(event) => setSiteGpsForm((current) => ({ ...current, longitude: event.target.value }))} /></Field>
                  <Field label="Radius"><input className={inputClass} value={siteGpsForm.radius_meters} onChange={(event) => setSiteGpsForm((current) => ({ ...current, radius_meters: event.target.value }))} /></Field>
                </div>
                <button onClick={() => void updateSiteGps()} className="h-10 rounded-md bg-[#007f73] text-sm font-bold text-white">Verify GPS Point</button>
              </div>
            ) : (
              <div className="rounded-md bg-[#f2f4f7] px-4 py-3 text-sm font-semibold text-[#657181]">
                Lokasi terpilih tetap bisa direview, tapi update koordinat membutuhkan role yang punya akses operasional.
              </div>
            )}
          </Panel>
        </div>
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
        <TableHeader columns={['Capture Target', 'Technician', 'Captured At', 'GPS Evidence', 'Status', 'Action']} />
        {summary.pendingCaptures.length ? summary.pendingCaptures.map((capture) => (
          <Row
            key={capture.id}
            values={[
              capture.site?.name || capture.office_location?.name || '-',
              capture.technician?.user ? `${capture.technician.user.full_name} / ${capture.technician.user.employee_id}` : '-',
              `${date(capture.captured_at)} ${time(capture.captured_at)}`,
              <div>
                <p className="font-bold">{coordinate(capture.latitude)}, {coordinate(capture.longitude)}</p>
                <p className="text-xs text-[#5d6b66]">Accuracy {capture.accuracy_meters} m / Radius {capture.suggested_radius_meters} m</p>
              </div>,
              <Pill value={capture.status} />,
              permissions.canReviewGpsCaptures ? (
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => requestCaptureDecision(capture, 'approve')} className="rounded-md bg-[#007f73] px-3 py-1 text-xs font-bold text-white">Approve</button>
                  <button onClick={() => requestCaptureDecision(capture, 'reject')} className="rounded-md bg-red-50 px-3 py-1 text-xs font-bold text-red-700">Reject</button>
                </div>
              ) : (
                'Pending review'
              ),
            ]}
          />
        )) : (
          <Row values={['No pending capture', '-', '-', '-', <Pill value="verified" />, '-']} />
        )}
      </section>

      <section className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
        <TableHeader columns={['Source', 'Technician', 'Location', 'Event Time', 'Distance', 'Reason']} />
        {gpsExceptions.length ? gpsExceptions.map((row) => (
          <Row
            key={row.id}
            values={[
              <Pill value={row.source} />,
              row.technician_name,
              row.location_name || '-',
              `${date(row.event_at)} ${time(row.event_at)}`,
              `${numberValue(row.distance_meters)} m / acc ${numberValue(row.accuracy_meters)} m`,
              row.reason || title(row.status),
            ]}
          />
        )) : (
          <Row values={['No exception', '-', '-', '-', '-', '-']} />
        )}
      </section>
    </section>
  );
}
