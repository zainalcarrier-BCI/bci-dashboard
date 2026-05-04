import { useState } from 'react';
import { Detail, Field, InlineError, Panel, Pill, Row, StatCard, TableHeader, inputClass, numberValue, title } from '../shared';
import { useManagerDashboardContext } from '../manager-context';

const scopeEditableRoles = ['engineer', 'product_specialist', 'assistant_manager', 'manager', 'senior_manager', 'admin'];
const todayValue = new Date().toLocaleDateString('en-CA');

export default function UsersTab() {
  const {
    user,
    permissions,
    summary,
    formErrors,
    managerUserForm,
    setManagerUserForm,
    technicianUserForm,
    setTechnicianUserForm,
    master,
    accessUsers,
    selectedAccessUser,
    setSelectedAccessUserId,
    teamScopeDrafts,
    toggleTeamSelection,
    updateScopeDraft,
    createManagerAccount,
    createTechnicianAccount,
    requestResetUserPassword,
    requestToggleUserStatus,
    saveUserTeamScope,
    resetPilotData,
    runDummyCleanup,
  } = useManagerDashboardContext();
  const [pilotEmployeeId, setPilotEmployeeId] = useState('TCH-003');
  const [cleanupEmployeeId, setCleanupEmployeeId] = useState('TCH-003');
  const [cleanupWorkDate, setCleanupWorkDate] = useState(todayValue);
  const [cleanupCategories, setCleanupCategories] = useState<Array<'activity_today' | 'notifications' | 'overtime' | 'leave'>>([
    'activity_today',
    'notifications',
  ]);

  const toggleCleanupCategory = (category: 'activity_today' | 'notifications' | 'overtime' | 'leave') => {
    setCleanupCategories((current) => (
      current.includes(category)
        ? current.filter((value) => value !== category)
        : [...current, category]
    ));
  };

  return (
    <section className="space-y-5">
      <section className="grid grid-cols-5 gap-4">
        <StatCard label="Active Users" value={numberValue(summary.activeUsers)} />
        <StatCard label="Technician L1" value={numberValue(summary.technicianL1Count)} />
        <StatCard label="Technician L2" value={numberValue(summary.technicianL2Count)} />
        <StatCard label="Senior Technician" value={numberValue(summary.seniorTechnicianCount)} />
        <StatCard label="Product Specialist" value={numberValue(summary.productSpecialistCount)} />
      </section>

      <Panel title="Role Workspace">
        <div className="mb-3 rounded-md border border-[#dbe5df] bg-white px-4 py-3 text-sm font-semibold text-[#42524c]">
          <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#657181]">Current Access Guard</p>
          <p className="mt-1">
            Login sebagai {title(user.role)}. {permissions.canManageGlobalUsers ? 'Akses global aktif untuk user, team scope, audit, dan pilot reset.' : 'Data dibatasi ke team scope yang terpasang pada akun ini.'}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm font-semibold text-[#42524c]">
          <div className="rounded-md bg-[#f2f4f7] px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#657181]">Engineer</p>
            <p className="mt-1">Dispatch, jobs, team monitoring, technician creation.</p>
          </div>
          <div className="rounded-md bg-[#f2f4f7] px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#657181]">Manager</p>
            <p className="mt-1">Approvals, KPI, anomalies, user scope control.</p>
          </div>
          <div className="rounded-md bg-[#f2f4f7] px-4 py-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-[#657181]">Admin</p>
            <p className="mt-1">Master data, office locations, user access, pilot reset.</p>
          </div>
        </div>
      </Panel>

      {permissions.canResetPilotData && (
        <Panel title="Pilot Data Reset">
          <div className="grid grid-cols-[minmax(0,1fr)_180px] gap-3">
            {formErrors.pilot_reset && <InlineError message={formErrors.pilot_reset} className="col-span-2" />}
            <Field label="Technician Employee ID">
              <input className={inputClass} value={pilotEmployeeId} onChange={(event) => setPilotEmployeeId(event.target.value.toUpperCase())} placeholder="TCH-003" />
            </Field>
            <button onClick={() => void resetPilotData(pilotEmployeeId)} className="mt-5 h-10 rounded-md bg-[#002f63] text-sm font-bold text-white">
              Reset Today
            </button>
            <div className="col-span-2 flex flex-wrap gap-2">
              {['TCH-003', 'TCH-002', 'TCH-001'].map((employeeId) => (
                <button
                  key={employeeId}
                  type="button"
                  onClick={() => setPilotEmployeeId(employeeId)}
                  className="rounded-md border border-[#dbe5df] bg-white px-3 py-2 text-xs font-extrabold text-[#42524c]"
                >
                  Use {employeeId}
                </button>
              ))}
              <button
                type="button"
                onClick={() => void resetPilotData('TCH-003')}
                className="rounded-md bg-[#007f73] px-3 py-2 text-xs font-extrabold text-white"
              >
                Reset Clean Trial TCH-003
              </button>
            </div>
            <p className="col-span-2 text-xs font-semibold text-[#657181]">
              Reset membersihkan day session, office attendance, job event, dan evidence hari berjalan untuk akun pilot agar UAT bisa mulai fresh.
            </p>
          </div>
        </Panel>
      )}

      {permissions.canResetPilotData && (
        <Panel title="Dummy Data Cleanup Tool">
          <div className="grid grid-cols-[minmax(0,1fr)_200px] gap-3">
            {formErrors.dummy_cleanup && <InlineError message={formErrors.dummy_cleanup} className="col-span-2" />}
            <Field label="Technician Employee ID">
              <input className={inputClass} value={cleanupEmployeeId} onChange={(event) => setCleanupEmployeeId(event.target.value.toUpperCase())} placeholder="TCH-003" />
            </Field>
            <Field label="Work Date">
              <input type="date" className={inputClass} value={cleanupWorkDate} onChange={(event) => setCleanupWorkDate(event.target.value)} />
            </Field>
            <div className="col-span-2 rounded-lg bg-[#f2f4f7] p-4">
              <p className="text-xs font-extrabold text-[#5d6b66]">Cleanup Categories</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold text-[#42524c]">
                {[
                  ['activity_today', 'Activity Today'],
                  ['notifications', 'Notifications'],
                  ['overtime', 'Overtime Requests'],
                  ['leave', 'Leave Requests'],
                ].map(([value, label]) => (
                  <label key={value} className="flex items-center gap-2 rounded-md border border-[#dbe5df] bg-white px-3 py-2">
                    <input
                      type="checkbox"
                      checked={cleanupCategories.includes(value as 'activity_today' | 'notifications' | 'overtime' | 'leave')}
                      onChange={() => toggleCleanupCategory(value as 'activity_today' | 'notifications' | 'overtime' | 'leave')}
                    />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className="col-span-2 flex flex-wrap gap-2">
              {['TCH-003', 'TCH-002', 'TCH-001'].map((employeeId) => (
                <button
                  key={`cleanup-${employeeId}`}
                  type="button"
                  onClick={() => setCleanupEmployeeId(employeeId)}
                  className="rounded-md border border-[#dbe5df] bg-white px-3 py-2 text-xs font-extrabold text-[#42524c]"
                >
                  Use {employeeId}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCleanupEmployeeId('TCH-003');
                  setCleanupCategories(['activity_today', 'notifications', 'overtime', 'leave']);
                }}
                className="rounded-md bg-[#002f63] px-3 py-2 text-xs font-extrabold text-white"
              >
                Full Clean Trial TCH-003
              </button>
            </div>
            <button
              onClick={() => void runDummyCleanup(cleanupEmployeeId, cleanupWorkDate, cleanupCategories)}
              className="col-span-2 h-10 rounded-md bg-red-700 text-sm font-bold text-white"
            >
              Run Dummy Cleanup
            </button>
            <p className="col-span-2 text-xs font-semibold text-[#657181]">
              Tool ini membersihkan data UAT untuk teknisi terpilih: activity hari itu, notification, overtime request, dan leave request. User master, team, site, office, dan PDF manual tidak ikut terhapus.
            </p>
          </div>
        </Panel>
      )}

      {permissions.canManageGlobalUsers && (
        <Panel title="Create Engineer / Manager Access">
          <div className="grid grid-cols-6 gap-3">
            {formErrors.manager_user && <InlineError message={formErrors.manager_user} className="col-span-6" />}
            <Field label="Employee ID"><input className={inputClass} value={managerUserForm.employee_id} onChange={(event) => setManagerUserForm((current) => ({ ...current, employee_id: event.target.value }))} placeholder="ENG-002 / ADM-002" /></Field>
            <Field label="Full Name"><input className={inputClass} value={managerUserForm.full_name} onChange={(event) => setManagerUserForm((current) => ({ ...current, full_name: event.target.value }))} /></Field>
            <Field label="Email"><input className={inputClass} value={managerUserForm.email} onChange={(event) => setManagerUserForm((current) => ({ ...current, email: event.target.value }))} /></Field>
            <Field label="Role">
              <select className={inputClass} value={managerUserForm.role} onChange={(event) => setManagerUserForm((current) => ({ ...current, role: event.target.value }))}>
                <option value="engineer">Engineer</option>
                <option value="product_specialist">Product Specialist</option>
                <option value="assistant_manager">Assistant Manager</option>
                <option value="manager">Manager</option>
                <option value="senior_manager">Senior Manager</option>
                <option value="admin">Admin</option>
              </select>
            </Field>
            <Field label="Temp Password"><input className={inputClass} value={managerUserForm.temporary_password} onChange={(event) => setManagerUserForm((current) => ({ ...current, temporary_password: event.target.value }))} /></Field>
            <div className="col-span-6 rounded-lg bg-[#f2f4f7] p-4">
              <p className="text-xs font-extrabold text-[#5d6b66]">Team Scope</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm font-semibold text-[#42524c]">
                {master?.teams.map((team) => (
                  <label key={team.id} className="flex items-center gap-2 rounded-md border border-[#dbe5df] bg-white px-3 py-2">
                    <input type="checkbox" checked={managerUserForm.team_ids.includes(team.id)} onChange={() => toggleTeamSelection(team.id)} />
                    {team.name}
                  </label>
                ))}
              </div>
            </div>
            <button onClick={() => void createManagerAccount()} className="col-span-6 h-10 rounded-md bg-[#007f73] text-sm font-bold text-white">Create User And Temporary Password</button>
          </div>
        </Panel>
      )}

      {permissions.canCreateTechnicianUsers && (
        <Panel title="Create Technician User">
          <div className="grid grid-cols-6 gap-3">
            {formErrors.technician_user && <InlineError message={formErrors.technician_user} className="col-span-6" />}
            <Field label="Employee ID"><input className={inputClass} value={technicianUserForm.employee_id} onChange={(event) => setTechnicianUserForm((current) => ({ ...current, employee_id: event.target.value }))} placeholder="TCH-004" /></Field>
            <Field label="Full Name"><input className={inputClass} value={technicianUserForm.full_name} onChange={(event) => setTechnicianUserForm((current) => ({ ...current, full_name: event.target.value }))} /></Field>
            <Field label="Email"><input className={inputClass} value={technicianUserForm.email} onChange={(event) => setTechnicianUserForm((current) => ({ ...current, email: event.target.value }))} /></Field>
            <Field label="Level">
              <select className={inputClass} value={technicianUserForm.level} onChange={(event) => setTechnicianUserForm((current) => ({ ...current, level: event.target.value }))}>
                <option value="technician_l1">Technician L1</option>
                <option value="technician_l2">Technician L2</option>
                <option value="senior_technician_l1">Senior Technician L1</option>
                <option value="senior_technician_l2">Senior Technician L2</option>
                <option value="product_specialist">Product Specialist</option>
              </select>
            </Field>
            <Field label="Team">
              <select className={inputClass} value={technicianUserForm.team} onChange={(event) => setTechnicianUserForm((current) => ({ ...current, team: event.target.value }))}>
                {master?.teams.map((team) => <option key={team.id} value={team.name}>{team.name}</option>)}
              </select>
            </Field>
            <Field label="Active Date"><input type="date" className={inputClass} value={technicianUserForm.active_date} onChange={(event) => setTechnicianUserForm((current) => ({ ...current, active_date: event.target.value }))} /></Field>
            <Field label="Temp Password"><input className={inputClass} value={technicianUserForm.temporary_password} onChange={(event) => setTechnicianUserForm((current) => ({ ...current, temporary_password: event.target.value }))} /></Field>
            <div className="col-span-6 rounded-md bg-[#f2f4f7] px-4 py-3 text-xs font-bold text-[#657181]">
              KPI effective start mengikuti active date. Contoh join 14 Apr 2026 berarti KPI April mulai 14 Apr 2026.
            </div>
            <button onClick={() => void createTechnicianAccount()} className="col-span-6 h-10 rounded-md bg-[#007f73] text-sm font-bold text-white">Create Technician Account</button>
          </div>
        </Panel>
      )}

      <section className="grid grid-cols-[minmax(0,1fr)_360px] gap-5">
        <div className="overflow-hidden rounded-lg bg-white shadow-sm shadow-blue-900/5">
          <TableHeader columns={['User', 'System Role', 'Operational', 'Org Scope', 'Supervisor', 'Action']} />
          {accessUsers.map((accessUser) => (
            <Row
              key={accessUser.id}
              values={[
                <button onClick={() => setSelectedAccessUserId(accessUser.id)} className="text-left">
                  <p className="font-extrabold text-[#006a60]">{accessUser.full_name}</p>
                  <p className="text-xs text-[#5d6b66]">{accessUser.employee_id} / {accessUser.email || '-'}</p>
                </button>,
                title(accessUser.role),
                <div>
                  <p className="font-bold">{accessUser.operational_position || title(accessUser.role)}</p>
                  <p className="text-xs text-[#5d6b66]">{accessUser.has_technician_profile ? 'Technician profile' : 'Supervisor access'}</p>
                </div>,
                <div>
                  <p className="font-bold">{accessUser.team_name || accessUser.team_scope.map((team) => team.name).join(', ') || 'Global / none'}</p>
                  <p className="text-xs text-[#5d6b66]">{[accessUser.branch_name, accessUser.region_name].filter(Boolean).join(' / ') || 'Branch and region not set'}</p>
                </div>,
                <div>
                  <p className="font-bold">{accessUser.direct_supervisor_name || '-'}</p>
                  <p className="text-xs text-[#5d6b66]">{accessUser.direct_supervisor_role || 'No direct supervisor'}</p>
                </div>,
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center rounded-md bg-[#f2f4f7] px-2 py-1 text-[10px] font-bold text-[#42524c]">
                    {accessUser.must_change_password ? 'Must change' : title(accessUser.status)}
                  </span>
                  <button onClick={() => setSelectedAccessUserId(accessUser.id)} className="rounded-md border border-[#007f73] px-3 py-1 text-xs font-bold text-[#007f73]">Open</button>
                  {permissions.canManageGlobalUsers && (
                    <>
                      <button onClick={() => requestResetUserPassword(accessUser)} className="rounded-md bg-[#f0f5f2] px-3 py-1 text-xs font-bold text-[#42524c]">Reset</button>
                      <button onClick={() => requestToggleUserStatus(accessUser)} className="rounded-md bg-red-50 px-3 py-1 text-xs font-bold text-red-700">
                        {accessUser.status === 'active' ? 'Deactivate' : 'Activate'}
                      </button>
                    </>
                  )}
                </div>,
              ]}
            />
          ))}
        </div>

        <Panel title="Access Detail">
          {selectedAccessUser ? (
            <div className="space-y-4">
              {formErrors.team_scope && <InlineError message={formErrors.team_scope} />}
              <div>
                <p className="text-xs font-bold text-[#007f73]">{selectedAccessUser.employee_id}</p>
                <h3 className="font-headline text-xl font-extrabold">{selectedAccessUser.full_name}</h3>
                <p className="mt-1 text-sm font-semibold text-[#5d6b66]">{selectedAccessUser.email || '-'} / {title(selectedAccessUser.role)}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Status" value={<Pill value={selectedAccessUser.status} />} />
                <Detail label="First Login" value={selectedAccessUser.must_change_password ? 'Must change' : 'Completed'} />
                <Detail label="System Role" value={title(selectedAccessUser.role)} />
                <Detail label="Operational Position" value={selectedAccessUser.operational_position || title(selectedAccessUser.role)} />
                <Detail label="Branch / Region" value={[selectedAccessUser.branch_name, selectedAccessUser.region_name].filter(Boolean).join(' / ') || '-'} />
                <Detail label="Team" value={selectedAccessUser.team_name || '-'} />
              </div>
              <div>
                <p className="mb-2 text-xs font-extrabold text-[#5d6b66]">Direct Supervisor</p>
                <div className="rounded-md border border-[#dbe5df] px-3 py-3 text-sm font-semibold text-[#42524c]">
                  {selectedAccessUser.direct_supervisor_name
                    ? `${selectedAccessUser.direct_supervisor_name} (${selectedAccessUser.direct_supervisor_role || '-'})`
                    : 'Belum ada reporting line yang terpasang'}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-extrabold text-[#5d6b66]">Reporting Line</p>
                <div className="rounded-md border border-[#dbe5df] px-3 py-3 text-sm font-semibold text-[#42524c]">
                  {selectedAccessUser.reporting_line?.length
                    ? selectedAccessUser.reporting_line.map((row) => `${row.role}: ${row.name}${row.employee_id ? ` (${row.employee_id})` : ''}`).join(' / ')
                    : 'Belum ada hierarchy untuk user ini'}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-extrabold text-[#5d6b66]">Current Scope</p>
                <div className="rounded-md border border-[#dbe5df] px-3 py-3 text-sm font-semibold text-[#42524c]">
                  {selectedAccessUser.team_scope.length
                    ? selectedAccessUser.team_scope.map((team) => `${team.name} (${title(team.role_level)})${team.region_name ? ` / ${team.region_name}` : ''}${team.branch_name ? ` / ${team.branch_name}` : ''}`).join(', ')
                    : (selectedAccessUser.has_technician_profile ? 'Technician profile attached' : 'Global / no scoped team')}
                </div>
              </div>

              {permissions.canManageGlobalUsers && !selectedAccessUser.has_technician_profile && scopeEditableRoles.includes(selectedAccessUser.role) && (
                <div>
                  <p className="mb-2 text-xs font-extrabold text-[#5d6b66]">Edit Team Scope</p>
                  <div className="grid gap-2 text-sm font-semibold text-[#42524c]">
                    {master?.teams.map((team) => (
                      <label key={`${selectedAccessUser.id}-${team.id}`} className="flex items-center gap-2 rounded-md border border-[#dbe5df] px-3 py-2">
                        <input type="checkbox" checked={(teamScopeDrafts[selectedAccessUser.id] || []).includes(team.id)} onChange={() => updateScopeDraft(selectedAccessUser.id, team.id)} />
                        {team.name}
                      </label>
                    ))}
                  </div>
                  <button onClick={() => void saveUserTeamScope(selectedAccessUser)} className="mt-3 h-10 w-full rounded-md bg-[#007f73] text-sm font-bold text-white">Save Team Scope</button>
                </div>
              )}

              {permissions.canManageGlobalUsers && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => requestResetUserPassword(selectedAccessUser)} className="h-10 rounded-md border border-[#dbe5df] text-sm font-bold text-[#42524c]">Reset Password</button>
                  <button onClick={() => requestToggleUserStatus(selectedAccessUser)} className="h-10 rounded-md bg-red-50 text-sm font-bold text-red-700">
                    {selectedAccessUser.status === 'active' ? 'Deactivate User' : 'Activate User'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm font-semibold text-[#5d6b66]">Belum ada user yang dipilih.</p>
          )}
        </Panel>
      </section>
    </section>
  );
}
