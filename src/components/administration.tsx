import { useState } from 'react';
import {
  Check,
  Plus,
  Stethoscope,
  Users,
  ArrowRight,
  Link2,
  RefreshCw,
  Download,
  FileText,
  ShieldCheck,
  Settings,
  Building2,
} from 'lucide-react';
import { useDemo, navigate } from '../store';
import { sampleSources, uid, type Role } from '../model';
import {
  Badge,
  Check as Checkbox,
  Empty,
  Field,
  Heading,
  Hint,
  Modal,
  Panel,
  date,
} from './ui';
export function Doctors() {
  const { state, update, toast } = useDemo();
  const [query, setQuery] = useState(''),
    [link, setLink] = useState(false),
    [selected, setSelected] = useState<string[]>([]),
    [create, setCreate] = useState(false),
    [name, setName] = useState(''),
    [specialty, setSpecialty] = useState(''),
    [phone, setPhone] = useState(''),
    [confirm, setConfirm] = useState(false);
  const available = state.doctors.filter((d) => !d.linked && d.active);
  return (
    <>
      <Heading
        title="A direct connection to the right doctor."
        description="Linked doctors are available for your next patient delivery. Linking never grants prior visit history."
        action={
          <div className="actions">
            <button onClick={() => setLink(true)}>
              <Link2 size={17} />
              Link existing doctor
            </button>
            <button
              className="primary"
              disabled={!state.settings.features['Doctor account creation']}
              title={
                !state.settings.features['Doctor account creation']
                  ? 'Doctor creation is disabled in sample settings.'
                  : undefined
              }
              onClick={() => setCreate(true)}
            >
              <Plus size={17} />
              Create sample doctor
            </button>
          </div>
        }
      />
      <Panel
        title="Center doctor directory"
        description="Select a primary referring doctor during each person's review."
        action={
          <input
            aria-label="Search doctors"
            placeholder="Search doctor or specialty…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        }
      >
        <div className="doctor-grid">
          {state.doctors
            .filter(
              (d) =>
                d.linked &&
                `${d.name} ${d.specialty}`.toLowerCase().includes(query.toLowerCase()),
            )
            .map((d) => (
              <article key={d.id} className="doctor-card">
                <div className="avatar">
                  <Stethoscope size={22} />
                </div>
                <h3>{d.name}</h3>
                <p>{d.specialty}</p>
                <Badge tone={d.active ? 'success' : 'neutral'}>
                  {d.active ? 'Available for delivery' : 'Directory disabled'}
                </Badge>
                <button
                  onClick={() => {
                    update(
                      (s) => ({
                        ...s,
                        doctors: s.doctors.map((x) =>
                          x.id === d.id ? { ...x, active: !x.active } : x,
                        ),
                      }),
                      'Directory availability changed',
                      d.name,
                    );
                    toast(
                      'Sample directory updated. Previously delivered grants remain separate.',
                    );
                  }}
                >
                  {d.active
                    ? 'Disable directory availability'
                    : 'Enable directory availability'}
                </button>
              </article>
            ))}
        </div>
      </Panel>
      <Modal
        open={link}
        onClose={() => setLink(false)}
        title="Link existing sample doctor identities"
        description="Choose the reviewed existing identities. No credentials are changed and no previous package is granted."
      >
        {available.length ? (
          <div className="doctor-checklist">
            {available.map((d) => (
              <Checkbox
                key={d.id}
                checked={selected.includes(d.id)}
                onChange={(v) =>
                  setSelected((x) => (v ? [...x, d.id] : x.filter((id) => id !== d.id)))
                }
              >
                {d.name}
                <small>{d.specialty} · Existing sample identity</small>
              </Checkbox>
            ))}
          </div>
        ) : (
          <Empty
            title="All sample doctors are linked"
            description="Create another sample doctor to explore a new local directory identity."
          />
        )}
        <Checkbox checked={confirm} onChange={setConfirm}>
          I reviewed the selected doctor identities for this center.
        </Checkbox>
        <div className="modal-actions">
          <button onClick={() => setLink(false)}>Cancel</button>
          <button
            className="primary"
            disabled={!confirm || !selected.length}
            onClick={() => {
              update(
                (s) => ({
                  ...s,
                  doctors: s.doctors.map((d) =>
                    selected.includes(d.id) ? { ...d, linked: true } : d,
                  ),
                }),
                'Existing doctors linked',
                `${selected.length} reviewed identities`,
              );
              setLink(false);
              setSelected([]);
              setConfirm(false);
              toast('Sample doctors linked to the center.');
            }}
          >
            Link {selected.length} selected doctors
          </button>
        </div>
      </Modal>
      <Modal
        open={create}
        onClose={() => setCreate(false)}
        title="Create a sample doctor identity"
        description="This interactive demo creates only a local sample profile, without credentials or a real external account."
      >
        <Field label="Doctor full name *">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Phone *">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Use a sample value only"
          />
        </Field>
        <Field label="Specialty · optional">
          <input value={specialty} onChange={(e) => setSpecialty(e.target.value)} />
        </Field>
        <div className="modal-actions">
          <button onClick={() => setCreate(false)}>Cancel</button>
          <button
            className="primary"
            disabled={!name.trim() || !phone.trim()}
            onClick={() => {
              update(
                (s) => ({
                  ...s,
                  doctors: [
                    ...s.doctors,
                    {
                      id: uid(),
                      name,
                      specialty: specialty || 'Not supplied',
                      linked: true,
                      active: true,
                    },
                  ],
                }),
                'Sample doctor created and linked',
                name,
              );
              setCreate(false);
              toast(
                'Local sample doctor is ready in the directory. No external account was created.',
              );
            }}
          >
            Create & link sample doctor
          </button>
        </div>
      </Modal>
    </>
  );
}
export function Accounts() {
  const { state, update, toast } = useDemo();
  const [open, setOpen] = useState(false),
    [name, setName] = useState(''),
    [role, setRole] = useState('Center administrator');
  return (
    <>
      <Heading
        title="The right people. Checked authority."
        description="Sample staff identities and lifecycle, separate from clinical patient profiles."
        action={
          <button className="primary" onClick={() => setOpen(true)}>
            <Plus size={17} />
            Add sample account
          </button>
        }
      />
      <Panel title="Staff accounts">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Role</th>
                <th>Scope</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {state.accounts.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.name}</strong>
                    <small>Sample local identity</small>
                  </td>
                  <td>{a.role}</td>
                  <td>{a.scope}</td>
                  <td>
                    <Badge tone={a.active ? 'success' : 'neutral'}>
                      {a.active ? 'Active' : 'Disabled'}
                    </Badge>
                  </td>
                  <td>
                    <button
                      disabled={a.id === 'a-root'}
                      title={
                        a.id === 'a-root'
                          ? 'The sample primary administrator remains available.'
                          : undefined
                      }
                      onClick={() => {
                        update(
                          (s) => ({
                            ...s,
                            accounts: s.accounts.map((x) =>
                              x.id === a.id ? { ...x, active: !x.active } : x,
                            ),
                          }),
                          'Account lifecycle changed',
                          a.name,
                        );
                        toast('Sample account state changed.');
                      }}
                    >
                      {a.active ? 'Disable account' : 'Restore account'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Hint>
        No real user or password is created by this preview. Local sample identities demonstrate
        the account workflow.
      </Hint>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a sample staff account"
        description="A local demonstration identity, without sign-in credentials or external provisioning."
      >
        <Field label="Display name">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Staff role">
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {['Center administrator', 'Examiner', 'Administrator'].map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </Field>
        <div className="modal-actions">
          <button onClick={() => setOpen(false)}>Cancel</button>
          <button
            className="primary"
            disabled={!name.trim()}
            onClick={() => {
              update(
                (s) => ({
                  ...s,
                  accounts: [
                    ...s.accounts,
                    {
                      id: uid(),
                      name,
                      role,
                      active: true,
                      permissions: ['patient.read'],
                      scope: 'Sample Imaging Center',
                    },
                  ],
                }),
                'Sample account added',
                name,
              );
              setOpen(false);
              toast('Local sample staff account added.');
            }}
          >
            Create sample account
          </button>
        </div>
      </Modal>
    </>
  );
}
const actions = [
  'patient.read',
  'draft.write',
  'delivery.send',
  'delivery.grant',
  'patient.merge',
  'patient.merge.reverse',
  'patient.delete',
  'patient.restore',
  'doctor.create',
  'doctor.manage',
  'config.manage',
];
export function Permissions() {
  const { state, update, toast } = useDemo();
  const [accountId, setAccount] = useState('a-delegate');
  const account = state.accounts.find((a) => a.id === accountId)!;
  const [selected, setSelected] = useState(account.permissions),
    [scope, setScope] = useState(account.scope),
    [confirmed, setConfirmed] = useState(false);
  return (
    <>
      <Heading
        title="Explicit actions. Explicit resource scope."
        description="Checked permissions make the impact visible before a reviewed change. Delegates cannot gain root-only purge authority."
      />
      <Panel
        title="Delegated access editor"
        description="Select a sample staff identity and review its current checked actions."
      >
        <Field label="Selected staff account">
          <select
            value={accountId}
            onChange={(e) => {
              const a = state.accounts.find((a) => a.id === e.target.value)!;
              setAccount(a.id);
              setSelected(a.permissions);
              setScope(a.scope);
              setConfirmed(false);
            }}
          >
            {state.accounts
              .filter((a) => a.id !== 'a-root')
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Resource scope">
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setConfirmed(false);
            }}
          >
            <option>Sample Imaging Center</option>
            <option>All centers</option>
          </select>
        </Field>
        <div className="permission-grid">
          {actions.map((action) => (
            <Checkbox
              key={action}
              checked={selected.includes(action)}
              onChange={(v) => {
                setSelected((x) => (v ? [...x, action] : x.filter((a) => a !== action)));
                setConfirmed(false);
              }}
            >
              {action
                .split('.')
                .map((w) => w[0]?.toUpperCase() + w.slice(1))
                .join(' · ')}
            </Checkbox>
          ))}
        </div>
        <Hint>
          Permissions are illustrated locally in this demo. Root-only permanent purge is never
          delegated by this checklist.
        </Hint>
        <Checkbox checked={confirmed} onChange={setConfirmed}>
          I reviewed these {selected.length} checked actions and the selected center scope.
        </Checkbox>
        <button
          className="primary"
          disabled={!confirmed}
          onClick={() => {
            update(
              (s) => ({
                ...s,
                accounts: s.accounts.map((a) =>
                  a.id === accountId ? { ...a, permissions: selected, scope } : a,
                ),
              }),
              'Delegated permissions changed',
              `${account.name} · ${selected.length} actions · ${scope}`,
            );
            setConfirmed(false);
            toast('Sample checked permissions saved.');
          }}
        >
          Save reviewed permissions
        </button>
      </Panel>
    </>
  );
}
export function Fields() {
  const { state, update, toast } = useDemo();
  const [fields, setFields] = useState(state.fields),
    [label, setLabel] = useState('');
  return (
    <>
      <Heading
        title="Ask for the right details."
        description="Configure visible patient fields and requiredness. Human identity and source ownership review always remain mandatory."
      />
      <Panel
        title="Effective patient fields"
        description="Default required name and supplied age; optional fields remain optional unless deliberately configured."
      >
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Display label</th>
                <th>Required</th>
                <th>Visible</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((f, i) => (
                <tr key={f.key}>
                  <td>
                    <input
                      aria-label={'Label for ' + f.key}
                      value={f.label}
                      onChange={(e) =>
                        setFields((x) =>
                          x.map((f, n) => (n === i ? { ...f, label: e.target.value } : f)),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={'Required ' + f.label}
                      type="checkbox"
                      checked={f.required}
                      onChange={(e) =>
                        setFields((x) =>
                          x.map((f, n) => (n === i ? { ...f, required: e.target.checked } : f)),
                        )
                      }
                    />
                  </td>
                  <td>
                    <input
                      aria-label={'Visible ' + f.label}
                      type="checkbox"
                      checked={f.visible}
                      onChange={(e) =>
                        setFields((x) =>
                          x.map((f, n) => (n === i ? { ...f, visible: e.target.checked } : f)),
                        )
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="actions">
          <input
            aria-label="New field label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="New optional field label"
          />
          <button
            disabled={!label.trim()}
            onClick={() => {
              setFields((f) => [...f, { key: uid(), label, required: false, visible: true }]);
              setLabel('');
            }}
          >
            <Plus size={17} />
            Add optional field
          </button>
          <button
            className="primary"
            disabled={fields.some((f) => !f.label.trim())}
            onClick={() => {
              update(
                (s) => ({
                  ...s,
                  fields,
                  drafts: s.drafts.map((d) =>
                    d.sentId ? d : { ...d, revision: d.revision + 1, approvedRevision: null },
                  ),
                }),
                'Patient field configuration changed',
                `${fields.length} configured fields`,
              );
              toast('Sample field schema saved. Unsent drafts require a fresh human review.');
            }}
          >
            Publish sample field settings
          </button>
        </div>
      </Panel>
    </>
  );
}
export function SettingsPage({ role }: { role: Exclude<Role, 'patient'> }) {
  const { state, update, toast } = useDemo();
  const [settings, setSettings] = useState(state.settings);
  return (
    <>
      <Heading
        title="Configured for your care team."
        description="Readable center identity, recovery policy and included feature switches."
      />
      <div className="settings-grid">
        <Panel title="Center presentation & recovery">
          <Field label="Displayed center name">
            <input
              value={settings.centerName}
              onChange={(e) => setSettings((s) => ({ ...s, centerName: e.target.value }))}
            />
          </Field>
          <Field label="Deletion recovery grace (days)">
            <input
              type="number"
              min="1"
              max="365"
              value={settings.grace}
              onChange={(e) =>
                setSettings((s) => ({ ...s, grace: Math.max(1, Number(e.target.value)) }))
              }
            />
          </Field>
          <Field label="Maximum PDF pages per part">
            <input
              type="number"
              min="1"
              max="500"
              value={settings.pdfPartPages}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  pdfPartPages: Math.max(1, Number(e.target.value)),
                }))
              }
            />
          </Field>
          <button
            className="primary"
            disabled={!settings.centerName.trim()}
            onClick={() => {
              update(
                (s) => ({ ...s, settings }),
                'Workspace settings saved',
                settings.centerName,
              );
              toast('Sample workspace settings saved locally.');
            }}
          >
            Save sample settings
          </button>
        </Panel>
        <Panel
          title="Included product features"
          description="Switches change relevant sample controls. Clinical source content is never rewritten."
        >
          {Object.entries(settings.features).map(([key, value]) => (
            <Checkbox
              key={key}
              checked={value}
              onChange={(v) =>
                setSettings((s) => ({ ...s, features: { ...s.features, [key]: v } }))
              }
            >
              {key}
            </Checkbox>
          ))}
          <Hint>
            These switches are local demonstration settings. They do not configure a real clinic
            or external service.
          </Hint>
        </Panel>
      </div>
    </>
  );
}
export function AuditPage() {
  const { state } = useDemo();
  return (
    <>
      <Heading
        title="An accountable history."
        description="Reviewed sample actions record the change, affected record and time."
      />
      <Panel title="Audit trail">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Action</th>
                <th>Resource / impact</th>
                <th>Actor</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {state.audit.map((a) => (
                <tr key={a.id}>
                  <td>
                    <strong>{a.action}</strong>
                  </td>
                  <td>{a.detail}</td>
                  <td>Sample workspace operator</td>
                  <td>{date(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}
export function Jobs() {
  const { state, update, toast } = useDemo();
  return (
    <>
      <Heading
        title="Progress you can trust."
        description="Doctor delivery and printable readiness are separate. An incomplete printable result stays unavailable."
      />
      <Panel title="Sample processing operations">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Patient package</th>
                <th>Original delivery</th>
                <th>Patient PDF</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {state.exams.map((e) => (
                <tr key={e.id}>
                  <td>
                    <strong>{e.patientName}</strong>
                    <small>{e.title}</small>
                  </td>
                  <td>
                    <Badge tone={e.status === 'ACTIVE' ? 'success' : 'danger'}>
                      {e.status === 'ACTIVE' ? 'Delivered' : 'Withdrawn'}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={e.pdf === 'READY' ? 'success' : 'warning'}>
                      {e.pdf === 'READY'
                        ? 'Ready'
                        : e.pdf === 'UNAVAILABLE'
                          ? 'Needs attention'
                          : 'Preparing'}
                    </Badge>
                  </td>
                  <td>
                    <button
                      className="text-link"
                      onClick={() => navigate('/admin/exams/' + e.id)}
                    >
                      Review package
                      <ArrowRight size={14} />
                    </button>
                    {e.pdf !== 'READY' ? (
                      <button
                        onClick={() =>
                          toast(
                            'Sample output remains unavailable until complete source coverage can be verified. The original package is still accessible to eligible doctors.',
                          )
                        }
                      >
                        Review export issue
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <Hint>
        Only complete output is shown as ready. The demo does not process external imaging files
        in a background service.
      </Hint>
    </>
  );
}
export function Integrations() {
  const { state, update, toast } = useDemo();
  const [selected, setSelected] = useState<string | null>(null),
    [confirm, setConfirm] = useState(false);
  return (
    <>
      <Heading
        title="Connected sources. The same human review."
        description="Explore how configured imaging sources feed saved review drafts, rather than automatically creating patients or sending visits."
      />
      <div className="integration-grid">
        {['Orthanc', 'DICOMweb', 'Worklist gateway'].map((name) => (
          <Panel
            key={name}
            title={name}
            description={
              name === 'Worklist gateway'
                ? 'Read-only scheduled patient suggestions'
                : 'Browse configured sample original instances'
            }
          >
            <span className="integration-icon">
              <Link2 size={25} />
            </span>
            <Badge tone="success">Sample connection</Badge>
            <p className="summary-help">
              This demo uses a built-in sample catalog and makes no external connection.
            </p>
            <button
              disabled={!state.settings.features['Source integrations']}
              onClick={() => {
                setSelected(name);
                setConfirm(false);
              }}
            >
              {name === 'Worklist gateway' ? 'Read sample worklist' : 'Browse sample catalog'}
            </button>
          </Panel>
        ))}
      </div>
      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={
          selected === 'Worklist gateway'
            ? 'Sample scheduled worklist'
            : 'Sample source catalog'
        }
        description="Review these example sources before creating a separate unsent intake draft."
      >
        <div className="catalog-item">
          <FileText size={23} />
          <div>
            <strong>Sample Scheduled Patient</strong>
            <p>{selected} · MRI + received report · Sample Study 001</p>
          </div>
          <Badge>Sample only</Badge>
        </div>
        <Checkbox checked={confirm} onChange={setConfirm}>
          Select this sample study for an unsent human-review draft.
        </Checkbox>
        <Hint>
          Imported device labels remain staged hints. No patient profile, doctor delivery or QR
          is created automatically.
        </Hint>
        <div className="modal-actions">
          <button onClick={() => setSelected(null)}>Cancel</button>
          <button
            className="primary"
            disabled={!confirm}
            onClick={() => {
              const id = uid();
              update(
                (s) => ({
                  ...s,
                  drafts: [
                    {
                      id,
                      title: `Sample import · ${selected}`,
                      name: 'Sample Scheduled Patient',
                      age: 41,
                      unit: 'YEARS',
                      phone: '',
                      patientId: '',
                      doctorId: '',
                      sources: sampleSources,
                      revision: 1,
                      approvedRevision: null,
                    },
                    ...s.drafts,
                  ],
                }),
                'Sample sources imported for review',
                selected || '',
              );
              setSelected(null);
              toast('Sample sources are now in an unsent review draft.');
              navigate('/center/intake/' + id);
            }}
          >
            Create sample review draft
          </button>
        </div>
      </Modal>
    </>
  );
}
export function Centers() {
  const { state } = useDemo();
  return (
    <>
      <Heading
        title="Care teams with clear context."
        description="The sending center remains visible throughout every received result."
      />
      <Panel title="Sample imaging center">
        <div className="center-card">
          <span className="avatar">
            <Building2 size={24} />
          </span>
          <div>
            <h2>{state.settings.centerName}</h2>
            <p>Sample Center · Active workspace</p>
            <small>
              {state.patients.filter((p) => p.status === 'ACTIVE').length} active profiles ·{' '}
              {state.doctors.filter((d) => d.linked).length} linked doctors
            </small>
          </div>
          <Badge tone="success">Active</Badge>
          <button onClick={() => navigate('/admin/settings')}>
            Configure presentation
            <ArrowRight size={15} />
          </button>
        </div>
      </Panel>
    </>
  );
}
