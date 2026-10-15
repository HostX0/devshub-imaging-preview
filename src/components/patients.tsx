import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  GitMerge,
  Plus,
  ShieldCheck,
  Users,
  EyeOff,
  Undo2,
} from 'lucide-react';
import { useDemo, navigate } from '../store';
import {
  doctorExams,
  canonicalPatientId,
  patientFamily,
  stamp,
  uid,
  type Role,
  type Patient,
} from '../model';
import { Badge, Check, Empty, Field, Heading, Hint, Modal, Panel, date } from './ui';
import { ExamTable } from './dashboard';
export function Patients({ role, id }: { role: Exclude<Role, 'patient'>; id?: string }) {
  const { state, update, toast } = useDemo();
  const [query, setQuery] = useState(''),
    [newOpen, setNewOpen] = useState(false),
    [name, setName] = useState(''),
    [age, setAge] = useState<number | null>(null),
    [approved, setApproved] = useState(false);
  const doctorId = sessionStorage.getItem('demo-doctor') || 'd1';
  if (id) return <Profile role={role} id={id} />;
  const eligible = new Set(
    doctorExams(state, doctorId).map((e) => canonicalPatientId(state, e.patientId)),
  );
  const patients = state.patients
    .filter(
      (p) =>
        p.status !== 'PURGED' &&
        (role !== 'doctor' || eligible.has(p.id)) &&
        !state.merges.some((m) => !m.reversed && m.sourceId === p.id),
    )
    .filter((p) =>
      `${p.name} ${p.code} ${p.aliases.join(' ')}`.toLowerCase().includes(query.toLowerCase()),
    );
  return (
    <>
      <Heading
        title="Stable profiles. Complete visit history."
        description="Find the right person using their reference and reviewed details. Similar names never merge automatically."
        action={
          role !== 'doctor' ? (
            <button className="primary" onClick={() => setNewOpen(true)}>
              <Plus size={17} />
              New standalone profile
            </button>
          ) : null
        }
      />
      <Panel
        title="Patient profiles"
        description="Reviewed identities stay separate from received reports."
        action={
          <input
            aria-label="Search patients"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or reference…"
          />
        }
      >
        <div className="patient-grid">
          {patients.map((p) => (
            <button
              className="patient-card"
              key={p.id}
              onClick={() => navigate(`/${role}/patients/${p.id}`)}
            >
              <div className="avatar">
                <Users size={22} />
              </div>
              <div>
                <h3>{p.name}</h3>
                <p>
                  {p.code} · {p.age} {p.unit.toLowerCase()}
                </p>
                {p.aliases.length ? (
                  <small>Reviewed aliases: {p.aliases.join(', ')}</small>
                ) : null}
              </div>
              <Badge tone={p.status === 'ACTIVE' ? 'success' : 'danger'}>
                {p.status === 'ACTIVE' ? 'Active' : 'Deleted'}
              </Badge>
              <ArrowRight size={17} />
            </button>
          ))}
        </div>
        {!patients.length ? (
          <Empty
            title="No matching profiles"
            description="Try the stable reference or create a distinct new profile after review."
          />
        ) : null}
      </Panel>
      <Modal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        title="Save a reviewed standalone profile"
        description="Creates only a sample patient profile. It does not send a visit, notify a doctor or create a patient QR."
      >
        <Field label="Full three-part name">
          <input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setApproved(false);
            }}
          />
        </Field>
        <Field label="Supplied age in years">
          <input
            type="number"
            min="0"
            max="150"
            value={age ?? ''}
            onChange={(e) => {
              setAge(e.target.value === '' ? null : Math.max(0, Number(e.target.value)));
              setApproved(false);
            }}
          />
        </Field>
        <Check checked={approved} onChange={setApproved}>
          I reviewed these details and confirm this is a distinct new person.
        </Check>
        <div className="modal-actions">
          <button onClick={() => setNewOpen(false)}>Cancel</button>
          <button
            className="primary"
            disabled={name.trim().split(/\s+/).length < 3 || age === null || !approved}
            onClick={() => {
              const p: Patient = {
                id: uid(),
                code: `DH-${String(250 + state.patients.length).padStart(5, '0')}`,
                name,
                age: age ?? 0,
                unit: 'YEARS',
                phone: '',
                status: 'ACTIVE',
                aliases: [],
                hiddenFor: [],
              };
              update(
                (s) => ({ ...s, patients: [p, ...s.patients] }),
                'Standalone profile saved',
                name,
              );
              setNewOpen(false);
              toast('Sample profile saved. No visit was delivered.');
            }}
          >
            Save reviewed profile
          </button>
        </div>
      </Modal>
    </>
  );
}
function Profile({ role, id: requestedId }: { role: Exclude<Role, 'patient'>; id: string }) {
  const { state, update, toast } = useDemo();
  const id = canonicalPatientId(state, requestedId);
  const p = state.patients.find((p) => p.id === id);
  const [merge, setMerge] = useState(false),
    [sourceId, setSourceId] = useState(''),
    [reason, setReason] = useState(''),
    [checked, setChecked] = useState(false),
    [grant, setGrant] = useState(false),
    [scope, setScope] = useState('one'),
    [examId, setExamId] = useState(''),
    [selected, setSelected] = useState<string[]>([]),
    [grantAction, setGrantAction] = useState<'ACTIVE' | 'HIDDEN' | 'REVOKED'>('ACTIVE'),
    [visibility, setVisibility] = useState('d1'),
    [lifecycle, setLifecycle] = useState<'DELETE' | 'RESTORE' | 'PURGE' | null>(null),
    [typed, setTyped] = useState(''),
    [reverse, setReverse] = useState<string | null>(null);
  if (!p)
    return (
      <Empty
        title="Sample profile unavailable"
        description="Choose an existing profile from the patient list."
      />
    );
  const merges = state.merges.filter((m) => m.targetId === id || m.sourceId === id);
  const family = patientFamily(state, id);
  const doctorId = sessionStorage.getItem('demo-doctor') || 'd1';
  const exams = (role === 'doctor' ? doctorExams(state, doctorId) : state.exams).filter((e) =>
    family.includes(e.patientId),
  );
  const active = exams.filter((e) => e.status === 'ACTIVE');
  const target =
    scope === 'all' ? active : active.filter((e) => e.id === (examId || active[0]?.id));
  const resetConfirm = () => {
    setChecked(false);
    setReason('');
  };
  return (
    <>
      <button className="back-link" onClick={() => navigate(`/${role}/patients`)}>
        <ArrowLeft size={15} />
        Patient profiles
      </button>
      <Heading
        title={p.name}
        description={`${p.code} · ${p.age} ${p.unit.toLowerCase()} · Stable center-local identity`}
        action={<Badge tone={p.status === 'ACTIVE' ? 'success' : 'danger'}>{p.status}</Badge>}
      />
      {p.aliases.length ? (
        <Hint>
          Reviewed aliases: {p.aliases.join(', ')}. Original references and sealed visit
          snapshots remain unchanged.
        </Hint>
      ) : null}
      <Panel
        title="Received visit history"
        description="Each examination remains a separate sealed package with its own current recipients."
      >
        <ExamTable exams={exams} role={role} />
      </Panel>
      {role !== 'doctor' ? (
        <div className="profile-controls">
          <Panel
            title="Reviewed identity actions"
            description="Merging is a deliberate local alias operation, never an automatic name match."
          >
            <button
              onClick={() => {
                setMerge(true);
                resetConfirm();
              }}
            >
              <GitMerge size={17} />
              Merge with existing profile
            </button>
            <Hint>
              Original patient references, sources, grants and private note authors remain
              traceable.
            </Hint>
          </Panel>
          {role === 'admin' ? (
            <Panel
              title="Whole-package access"
              description="Review the exact selected version or all current sealed packages. Future visits are excluded."
            >
              <button
                disabled={!active.length}
                onClick={() => {
                  setGrant(true);
                  setSelected([]);
                  setChecked(false);
                }}
              >
                <ShieldCheck size={17} />
                Review doctor grants
              </button>
              <Field label="Persistent visibility target">
                <select value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                  <option value="*">All doctors</option>
                  {state.doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="actions">
                <button
                  onClick={() => {
                    update(
                      (s) => ({
                        ...s,
                        patients: s.patients.map((x) =>
                          family.includes(x.id)
                            ? { ...x, hiddenFor: [...new Set([...x.hiddenFor, visibility])] }
                            : x,
                        ),
                      }),
                      'Patient hidden',
                      `${p.code} · ${visibility}`,
                    );
                    toast(
                      'Sample visibility hide applied to current and future visits for this profile.',
                    );
                  }}
                >
                  <EyeOff size={17} />
                  Hide patient
                </button>
                <button
                  onClick={() => {
                    update(
                      (s) => ({
                        ...s,
                        patients: s.patients.map((x) =>
                          family.includes(x.id)
                            ? { ...x, hiddenFor: x.hiddenFor.filter((d) => d !== visibility) }
                            : x,
                        ),
                      }),
                      'Visibility restored',
                      p.code,
                    );
                    toast('Sample hiding removed. Revoked grants remain revoked.');
                  }}
                >
                  <Undo2 size={17} />
                  Restore visibility
                </button>
              </div>
            </Panel>
          ) : null}
          <Panel
            title="Record lifecycle"
            description={`Deleted sample records stop ordinary serving. Restoration is available during the configured ${state.settings.grace}-day grace period.`}
          >
            <div className="actions">
              <button
                disabled={p.status !== 'ACTIVE'}
                onClick={() => {
                  setLifecycle('DELETE');
                  setChecked(false);
                }}
              >
                Delete with recovery grace
              </button>
              <button
                disabled={p.status !== 'DELETED'}
                onClick={() => {
                  setLifecycle('RESTORE');
                  setChecked(false);
                }}
              >
                Restore retained record
              </button>
              {role === 'admin' ? (
                <button
                  className="danger"
                  disabled={p.status !== 'DELETED'}
                  onClick={() => {
                    setLifecycle('PURGE');
                    setTyped('');
                  }}
                >
                  Permanently purge
                </button>
              ) : null}
            </div>
            <Hint>
              Deleting a profile blocks its ordinary result and patient-share views. Recovery
              does not revive withdrawn packages or revoked doctor grants.
            </Hint>
          </Panel>
        </div>
      ) : null}
      {merges.length ? (
        <Panel
          title="Reviewed merge history"
          description="A separate reversal retains the original reviewed history."
        >
          {merges.map((m) => (
            <div className="merge-row" key={m.id}>
              <div>
                <strong>
                  {state.patients.find((p) => p.id === m.sourceId)?.code} →{' '}
                  {state.patients.find((p) => p.id === m.targetId)?.code}
                </strong>
                <small>
                  {date(m.createdAt)} ·{' '}
                  {m.reversed ? 'Reversed · ' + m.reason : 'Reviewed local merge'}
                </small>
              </div>
              <Badge tone={m.reversed ? 'neutral' : 'success'}>
                {m.reversed ? 'Reversed' : 'Active alias'}
              </Badge>
              {role === 'admin' && !m.reversed ? (
                <button
                  onClick={() => {
                    setReverse(m.id);
                    resetConfirm();
                  }}
                >
                  Review reversal
                </button>
              ) : null}
            </div>
          ))}
        </Panel>
      ) : null}
      <Modal
        open={merge}
        onClose={() => setMerge(false)}
        title="Review a local patient merge"
        description="Keep this profile as canonical. The selected source identity becomes a traceable alias; original visit snapshots and access stay unchanged."
      >
        <Field label="Original source profile">
          <select
            value={sourceId}
            onChange={(e) => {
              setSourceId(e.target.value);
              setChecked(false);
            }}
          >
            <option value="">Choose a distinct profile</option>
            {state.patients
              .filter(
                (x) =>
                  x.id !== id &&
                  x.status === 'ACTIVE' &&
                  !state.merges.some((m) => !m.reversed && m.sourceId === x.id),
              )
              .map((x) => (
                <option key={x.id} value={x.id}>
                  {x.name} · {x.code} · {x.age} years
                </option>
              ))}
          </select>
        </Field>
        <Field label="Evidence / reason">
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <Check checked={checked} onChange={setChecked}>
          I reviewed both people and confirm they represent the same person.
        </Check>
        <Hint>
          Merging never grants another doctor extra history, changes original sources or
          publishes private notes.
        </Hint>
        <div className="modal-actions">
          <button onClick={() => setMerge(false)}>Cancel</button>
          <button
            className="primary"
            disabled={!sourceId || !reason.trim() || !checked}
            onClick={() => {
              const source = state.patients.find((x) => x.id === sourceId)!;
              update(
                (s) => ({
                  ...s,
                  patients: s.patients.map((x) =>
                    x.id === id ? { ...x, aliases: [...x.aliases, source.code] } : x,
                  ),
                  merges: [
                    { id: uid(), sourceId, targetId: id, createdAt: stamp(), reversed: false },
                    ...s.merges,
                  ],
                }),
                'Reviewed local merge',
                `${source.code} → ${p.code}: ${reason}`,
              );
              setMerge(false);
              toast(
                'Sample profiles logically merged. Original visits and access remain unchanged.',
              );
            }}
          >
            Confirm reviewed merge
          </button>
        </div>
      </Modal>
      <Modal
        open={grant}
        onClose={() => setGrant(false)}
        title="Review complete-package doctor access"
        description="Checked doctors receive the same chosen complete versions. Unchecked doctors are unchanged. No future access is included."
      >
        <div className="form-grid">
          <Field label="Package scope">
            <select
              aria-label="Package scope"
              value={scope}
              onChange={(e) => {
                setScope(e.target.value);
                setChecked(false);
              }}
            >
              <option value="one">Selected sealed version</option>
              <option value="all">All current confirmed packages</option>
            </select>
          </Field>
          {scope === 'one' ? (
            <Field label="Sealed package">
              <select
                aria-label="Sealed package"
                value={examId || active[0]?.id || ''}
                onChange={(e) => {
                  setExamId(e.target.value);
                  setChecked(false);
                }}
              >
                {active.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title} · Version {e.version} · {date(e.createdAt)}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}
          <Field label="Access action">
            <select
              aria-label="Access action"
              value={grantAction}
              onChange={(e) => {
                setGrantAction(e.target.value as typeof grantAction);
                setChecked(false);
              }}
            >
              <option value="ACTIVE">Grant complete package</option>
              <option value="HIDDEN">Hide selected grant</option>
              <option value="REVOKED">Revoke selected grant</option>
            </select>
          </Field>
        </div>
        <div className="doctor-checklist">
          {state.doctors.map((d) => (
            <Check
              key={d.id}
              checked={selected.includes(d.id)}
              onChange={(v) => {
                setSelected((x) => (v ? [...x, d.id] : x.filter((id) => id !== d.id)));
                setChecked(false);
              }}
            >
              {d.name}{' '}
              <small>{target.map((e) => e.grants[d.id] || 'No access').join(' · ')}</small>
            </Check>
          ))}
        </div>
        <Hint>
          {selected.length} selected doctors × {target.length} sealed packages. Future visits
          are excluded.
        </Hint>
        <Check checked={checked} onChange={setChecked}>
          I reviewed this exact impact and the selected whole-package versions.
        </Check>
        <div className="modal-actions">
          <button onClick={() => setGrant(false)}>Keep reviewing</button>
          <button
            className="primary"
            disabled={!checked || !selected.length || !target.length}
            onClick={() => {
              update(
                (s) => ({
                  ...s,
                  exams: s.exams.map((e) =>
                    target.some((t) => t.id === e.id)
                      ? {
                          ...e,
                          grants: {
                            ...e.grants,
                            ...Object.fromEntries(selected.map((id) => [id, grantAction])),
                          },
                        }
                      : e,
                  ),
                }),
                'Whole-package access changed',
                `${selected.length} doctors × ${target.length} current packages · ${grantAction}`,
              );
              setGrant(false);
              toast('Reviewed sample grants updated. Future visits are unchanged.');
            }}
          >
            Apply reviewed access
          </button>
        </div>
      </Modal>
      <Modal
        open={Boolean(lifecycle)}
        onClose={() => setLifecycle(null)}
        title={
          lifecycle === 'PURGE'
            ? 'Permanently purge this sample record?'
            : lifecycle === 'RESTORE'
              ? 'Restore retained sample record?'
              : 'Delete with recovery grace?'
        }
        description={
          lifecycle === 'PURGE'
            ? 'This removes the local sample patient, retained packages and their notes. It cannot be undone except by resetting the entire demo.'
            : 'Current ordinary file and result access follows this record state.'
        }
      >
        {lifecycle === 'PURGE' ? (
          <Field label={`Type ${p.code} to confirm`}>
            <input value={typed} onChange={(e) => setTyped(e.target.value)} />
          </Field>
        ) : (
          <Check checked={checked} onChange={setChecked}>
            I reviewed this profile and its complete retained visit history.
          </Check>
        )}
        <div className="modal-actions">
          <button onClick={() => setLifecycle(null)}>Cancel</button>
          <button
            className={lifecycle === 'PURGE' ? 'danger' : 'primary'}
            disabled={lifecycle === 'PURGE' ? typed !== p.code : !checked}
            onClick={() => {
              const action = lifecycle;
              update(
                (s) => ({
                  ...s,
                  patients: s.patients.map((x) =>
                    family.includes(x.id)
                      ? {
                          ...x,
                          status:
                            action === 'DELETE'
                              ? 'DELETED'
                              : action === 'RESTORE'
                                ? 'ACTIVE'
                                : 'PURGED',
                        }
                      : x,
                  ),
                  exams:
                    action === 'PURGE'
                      ? s.exams.filter((e) => !family.includes(e.patientId))
                      : s.exams,
                  notes:
                    action === 'PURGE'
                      ? s.notes.filter((n) => !exams.some((e) => e.id === n.examId))
                      : s.notes,
                }),
                'Record lifecycle changed',
                `${p.code} · ${action}`,
              );
              setLifecycle(null);
              toast('Sample record lifecycle updated.');
            }}
          >
            Confirm {lifecycle?.toLowerCase()}
          </button>
        </div>
      </Modal>
      <Modal
        open={Boolean(reverse)}
        onClose={() => setReverse(null)}
        title="Reverse this reviewed merge?"
        description="Restores separate sample profile identities. Original source snapshots and grants remain unchanged."
      >
        <Field label="Reason for reversal">
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
        </Field>
        <Check checked={checked} onChange={setChecked}>
          I reviewed the current profiles and retained original references.
        </Check>
        <div className="modal-actions">
          <button onClick={() => setReverse(null)}>Cancel</button>
          <button
            className="primary"
            disabled={!reason.trim() || !checked}
            onClick={() => {
              const m = state.merges.find((m) => m.id === reverse)!;
              const code = state.patients.find((p) => p.id === m.sourceId)!.code;
              update(
                (s) => ({
                  ...s,
                  merges: s.merges.map((x) =>
                    x.id === reverse ? { ...x, reversed: true, reason } : x,
                  ),
                  patients: s.patients.map((x) =>
                    x.id === m.targetId
                      ? { ...x, aliases: x.aliases.filter((a) => a !== code) }
                      : x,
                  ),
                }),
                'Reviewed merge reversed',
                reason,
              );
              setReverse(null);
              toast('Sample identities restored separately.');
            }}
          >
            Confirm audited reversal
          </button>
        </div>
      </Modal>
    </>
  );
}
