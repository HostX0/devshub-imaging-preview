import { useState, useRef, useEffect } from 'react';
import {
  CheckCircle2,
  FileText,
  Plus,
  Send,
  Trash2,
  UploadCloud,
  Users,
  ArrowRight,
  Save,
  Eye,
} from 'lucide-react';
import { useDemo, navigate } from '../store';
import {
  editDraft,
  isReady,
  canSend,
  draftIssues,
  sampleSources,
  sendDraft,
  uid,
  type Draft,
  type Source,
} from '../model';
import { Badge, Check, Empty, Field, Heading, Hint, Modal, Panel, Success } from './ui';
import { DocumentView } from './patient';
import { Reader } from './reader';
function makeDraft(): Draft {
  return {
    id: uid(),
    title: 'New patient visit',
    name: '',
    age: 0,
    ageEntered: false,
    unit: 'YEARS',
    phone: '',
    patientId: '',
    doctorId: '',
    sources: [],
    revision: 1,
    approvedRevision: null,
  };
}
export function Intake({ id }: { id?: string }) {
  const { state, update, files, toast } = useDemo();
  const [review, setReview] = useState(false),
    [view, setView] = useState<Source | null>(null);
  const d = state.drafts.find((x) => x.id === id);
  const input = useRef<HTMLInputElement>(null);
  const create = () => {
    const draft = makeDraft();
    update((s) => ({ ...s, drafts: [draft, ...s.drafts] }));
    navigate('/center/intake/' + draft.id);
  };
  if (!d)
    return (
      <>
        <Heading
          title="New patient intake"
          description="Start a separate saved draft. Review the person and every source before delivery."
        />
        <div className="start-intake">
          <UploadCloud size={42} />
          <h2>Begin with the right person.</h2>
          <p>
            Use a complete sample package, or select a PDF from your device. Your local files
            stay in this browser and are never uploaded.
          </p>
          <button className="primary" onClick={create}>
            <Plus size={18} />
            Create intake draft
          </button>
        </div>
        <Hint>
          Use sample files only. Demo changes are saved on this device; you can reset them at
          any time.
        </Hint>
      </>
    );
  if (d.sentId)
    return (
      <>
        <Heading
          title="Complete package delivered"
          description="This sample delivery is now visible in the selected doctor's inbox."
        />
        <Success>All {d.sources.length} sources were included in one reviewed package.</Success>
        <div className="actions">
          <button className="primary" onClick={() => navigate('/center/exams/' + d.sentId)}>
            Open delivered result
            <ArrowRight size={16} />
          </button>
          {d.batch ? (
            <button onClick={() => navigate('/center/bulk')}>Return to bulk workspace</button>
          ) : (
            <button onClick={() => navigate('/doctor')}>Explore doctor inbox</button>
          )}
        </div>
      </>
    );
  const change = (patch: Partial<Draft>) => update((s) => editDraft(s, d.id, patch));
  const addFiles = async (list: FileList | null) => {
    const snapshot = Array.from(list || []);
    const accepted = snapshot.filter((f) => f.size <= 25 * 1024 * 1024);
    if (accepted.length !== snapshot.length)
      toast(
        'The demo supports files up to 25 MB. Larger originals belong in the full product.',
      );
    const sources = await Promise.all(
      accepted.map(async (file): Promise<Source> => {
        const hash = Array.from(
          new Uint8Array(await crypto.subtle.digest('SHA-256', await file.arrayBuffer())),
        )
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        const retained = d.sources.find(
          (s) => !s.sample && s.name === file.name && s.size === file.size && s.sha256 === hash,
        );
        const id = retained?.id || uid();
        files.set(id, file);
        return {
          id,
          name: file.name,
          kind:
            file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
              ? 'PDF'
              : 'OTHER',
          pages: 1,
          sample: false,
          size: file.size,
          sha256: hash,
        };
      }),
    );
    update((s) => {
      const current = s.drafts.find((x) => x.id === d.id)!;
      return editDraft(s, d.id, {
        sources: [
          ...current.sources,
          ...sources.filter((x) => !current.sources.some((y) => y.id === x.id)),
        ],
      });
    });
  };
  const issues = draftIssues(state, d, new Set(files.keys()));
  const valid = !issues.length;

  return (
    <>
      <Heading
        eyebrow="SAVED INTAKE DRAFT"
        title={d.title}
        description="Edits autosave locally. Only your explicit review and Send create a delivered package."
        action={
          <Badge tone="success">
            <CheckCircle2 size={13} />
            Saved on this device
          </Badge>
        }
      />
      <div className="intake-layout">
        <div>
          <Panel
            title="1. Confirm the patient"
            description="Matching suggestions never prove identity. Choose an existing profile or explicitly create a new one."
          >
            <div className="form-grid">
              <Field label="Patient profile">
                <select
                  aria-label="Patient profile"
                  value={d.patientId}
                  onChange={(e) => {
                    const p = state.patients.find((x) => x.id === e.target.value);
                    change(
                      p
                        ? {
                            patientId: p.id,
                            name: p.name,
                            age: p.age,
                            unit: p.unit,
                            phone: p.phone,
                          }
                        : { patientId: '' },
                    );
                  }}
                >
                  <option value="">Create a new profile after review</option>
                  {state.patients
                    .filter((p) => p.status === 'ACTIVE')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} · {p.code} · {p.age} {p.unit.toLowerCase()}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Visit title">
                <input value={d.title} onChange={(e) => change({ title: e.target.value })} />
              </Field>
              <Field label="Full three-part name *">
                <input
                  value={d.name}
                  onChange={(e) => change({ name: e.target.value })}
                  autoComplete="off"
                />
              </Field>
              <div className="age-fields">
                <Field label="Supplied age *">
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={d.ageEntered || d.age > 0 ? d.age : ''}
                    onChange={(e) =>
                      change({
                        age: Math.max(0, Number(e.target.value)),
                        ageEntered: e.target.value !== '',
                      })
                    }
                  />
                </Field>
                <Field label="Age unit *">
                  <select value={d.unit} onChange={(e) => change({ unit: e.target.value })}>
                    {['YEARS', 'MONTHS', 'WEEKS', 'DAYS'].map((x) => (
                      <option key={x}>{x}</option>
                    ))}
                  </select>
                </Field>
              </div>
              <Field label="Phone number · optional">
                <input
                  value={d.phone}
                  onChange={(e) => change({ phone: e.target.value })}
                  placeholder="Optional manual handoff"
                />
              </Field>
              <Field label="Primary referring doctor *">
                <select
                  aria-label="Primary referring doctor"
                  value={d.doctorId}
                  onChange={(e) => change({ doctorId: e.target.value })}
                >
                  <option value="">Choose a linked doctor</option>
                  {state.doctors
                    .filter((x) => x.linked && x.active)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                </select>
              </Field>
              {state.fields
                .filter(
                  (f) => f.visible && !['fullName', 'age', 'ageUnit', 'phone'].includes(f.key),
                )
                .map((f) => (
                  <Field key={f.key} label={f.label + (f.required ? ' *' : ' · optional')}>
                    <input
                      value={d.values?.[f.key] || ''}
                      onChange={(e) =>
                        change({ values: { ...d.values, [f.key]: e.target.value } })
                      }
                    />
                  </Field>
                ))}
            </div>
          </Panel>
          <Panel
            title="2. Retain and review every source"
            description="One person's current files stay together. Use a separate card for another person."
          >
            <div
              className="dropzone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                addFiles(e.dataTransfer.files);
              }}
            >
              <UploadCloud size={32} />
              <strong>Drop sample files here</strong>
              <p>PDF or other files · up to 25 MB per file · browser only</p>
              <div className="actions">
                <button onClick={() => input.current?.click()}>Browse local files</button>
                <button
                  className="primary-soft"
                  onClick={() =>
                    change({
                      sources: [
                        ...d.sources,
                        ...sampleSources.map((s) => ({ ...s, id: uid() })),
                      ],
                    })
                  }
                >
                  Add sample MRI + PDF
                </button>
                <button
                  onClick={() =>
                    change({
                      sources: [
                        ...d.sources,
                        {
                          id: uid(),
                          name: 'Sample ultrasound · 18 synthetic frames',
                          kind: 'US',
                          pages: 18,
                          sample: true,
                        },
                      ],
                    })
                  }
                >
                  Add sample ultrasound
                </button>
              </div>
              <input
                ref={input}
                type="file"
                hidden
                multiple
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
              />
            </div>
            {d.sources.length ? (
              <div className="source-list">
                {d.sources.map((s) => (
                  <div className="source-row" key={s.id}>
                    <span className="source-icon">
                      <FileText size={21} />
                    </span>
                    <div>
                      <strong>{s.name}</strong>
                      <small>
                        {s.sample
                          ? 'Sample source'
                          : files.has(s.id)
                            ? 'Local file · retained in this tab'
                            : 'Local file metadata · re-select after refresh'}{' '}
                        · {s.pages} pages / frames
                      </small>
                      {s.kind === 'OTHER' ? (
                        <Badge tone="warning">Original retained · preview unavailable</Badge>
                      ) : null}
                    </div>
                    <button
                      className="icon-button"
                      aria-label={'Review ' + s.name}
                      title="Review source"
                      onClick={() => setView(s)}
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      className="icon-button"
                      aria-label={'Remove ' + s.name}
                      onClick={() =>
                        change({ sources: d.sources.filter((x) => x.id !== s.id) })
                      }
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <Hint>
              After refreshing, re-select the same local file to restore its exact retained
              bytes. File names and device labels are hints. Review the actual content and
              confirm all pages and frames belong to this person.
            </Hint>
          </Panel>
        </div>
        <aside className="intake-summary">
          <Panel title="3. Review & deliver">
            <div className="summary-row">
              <span>Patient resolution</span>
              <strong>{d.patientId ? 'Existing profile' : 'New profile'}</strong>
            </div>
            <div className="summary-row">
              <span>Retained sources</span>
              <strong>{d.sources.length}</strong>
            </div>
            <div className="summary-row">
              <span>Primary doctor</span>
              <strong>
                {state.doctors.find((x) => x.id === d.doctorId)?.name || 'Not selected'}
              </strong>
            </div>
            <div className="summary-row">
              <span>Human approval</span>
              <Badge tone={canSend(state, d, new Set(files.keys())) ? 'success' : 'warning'}>
                {canSend(state, d, new Set(files.keys())) ? 'Reviewed' : 'Needs review'}
              </Badge>
            </div>
            <button className="primary wide" disabled={!valid} onClick={() => setReview(true)}>
              <Users size={17} />
              {canSend(state, d, new Set(files.keys()))
                ? 'Review & send package'
                : 'Review identity & sources'}
            </button>
            {!valid ? <small>{issues.join(' ')}</small> : null}
            {d.batch ? (
              <button className="wide" onClick={() => navigate('/center/bulk')}>
                Return to bulk workspace
              </button>
            ) : null}
            <p className="summary-help">
              Send delivers all retained originals immediately. Printable output is a separate
              step.
            </p>
          </Panel>
        </aside>
      </div>
      <ReviewDialog
        draft={d}
        open={review}
        onClose={() => setReview(false)}
        bulk={Boolean(d.batch)}
      />
      <Modal
        open={Boolean(view)}
        onClose={() => setView(null)}
        title="Review the received source"
        description="Confirm the actual pages or frames and the intended patient. Source content stays separate from profile fields."
      >
        {view ? (
          view.kind === 'PDF' ? (
            <DocumentView
              source={view}
              exam={{
                patientName: d.name || 'Sample draft',
                patientCode: 'UNSENT DRAFT',
                title: d.title,
              }}
            />
          ) : view.sample && (view.kind === 'MRI' || view.kind === 'US') ? (
            <Reader
              source={view}
              exam={{
                id: d.id,
                patientId: d.patientId,
                patientName: d.name || 'Sample draft',
                patientCode: 'UNSENT DRAFT',
                age: d.age,
                unit: d.unit,
                doctorId: d.doctorId,
                version: 1,
                createdAt: new Date().toISOString(),
                title: d.title,
                sources: d.sources,
                status: 'ACTIVE',
                grants: {},
                qr: false,
                pdf: 'UNAVAILABLE',
              }}
              onClose={() => setView(null)}
            />
          ) : (
            <div className="empty">
              <FileText />
              <h3>{view.name}</h3>
              <p>
                Original retained locally. This demo cannot decode this file; verify it in an
                appropriate local viewer before approving ownership.
              </p>
            </div>
          )
        ) : null}
      </Modal>
    </>
  );
}
export function ReviewDialog({
  draft: d,
  open,
  onClose,
  bulk = false,
}: {
  draft: Draft;
  open: boolean;
  onClose: () => void;
  bulk?: boolean;
}) {
  const { state, update, toast, files } = useDemo();
  const [identity, setIdentity] = useState(false),
    [sources, setSources] = useState(false);
  const [reviewRevision, setReviewRevision] = useState(d.revision);
  useEffect(() => {
    setIdentity(false);
    setSources(false);
    setReviewRevision(d.revision);
  }, [open, d.id, d.revision]);
  const exact = reviewRevision === d.revision;
  const ready =
    identity && sources && exact && !draftIssues(state, d, new Set(files.keys())).length;
  const approve = () => {
    if (!ready) return;
    update(
      (s) => ({
        ...s,
        drafts: s.drafts.map((x) =>
          x.id === d.id ? { ...x, approvedRevision: x.revision } : x,
        ),
      }),
      'Human review recorded',
      d.name,
    );
    onClose();
    setIdentity(false);
    setSources(false);
    toast('This person is reviewed. The complete package is ready to send.');
  };
  const send = () => {
    if (!ready) return;
    update((s) =>
      sendDraft(
        {
          ...s,
          drafts: s.drafts.map((x) =>
            x.id === d.id ? { ...x, approvedRevision: x.revision } : x,
          ),
        },
        d.id,
        new Set(files.keys()),
      ),
    );
    onClose();
    setIdentity(false);
    setSources(false);
    toast('Sample package delivered to the selected doctor.');
  };
  return (
    <Modal
      open={open}
      onClose={() => {
        onClose();
        setIdentity(false);
        setSources(false);
      }}
      title="Review this person's complete package"
      description="Approval covers these exact demographics, the selected identity and every listed source."
    >
      <div className="review-patient">
        <div className="avatar">
          <Users size={23} />
        </div>
        <div>
          <h3>{d.name || 'Patient name required'}</h3>
          <p>
            {d.age} {d.unit.toLowerCase()} · {d.patientId ? 'Existing profile' : 'New profile'}
          </p>
        </div>
      </div>
      <div className="review-sources">
        {d.sources.map((s) => (
          <div key={s.id}>
            <FileText size={17} />
            <span>{s.name}</span>
            <Badge>{s.kind}</Badge>
          </div>
        ))}
      </div>
      <p className="review-recipient">
        Primary doctor:{' '}
        <strong>
          {state.doctors.find((x) => x.id === d.doctorId)?.name || 'Not selected'}
        </strong>
      </p>
      {!exact ? (
        <Hint>
          Details changed while this review was open. Review the current values again.
        </Hint>
      ) : null}
      <Check
        checked={identity && exact}
        onChange={(v) => {
          setIdentity(v);
          setReviewRevision(d.revision);
        }}
      >
        I reviewed the demographics and confirm the selected or new patient identity.
      </Check>
      <Check
        checked={sources && exact}
        onChange={(v) => {
          setSources(v);
          setReviewRevision(d.revision);
        }}
      >
        I reviewed every listed source and confirm all its pages / frames belong to this person.
      </Check>
      {draftIssues(state, d, new Set(files.keys())).length ? (
        <Hint>{draftIssues(state, d, new Set(files.keys())).join(' ')}</Hint>
      ) : null}
      <Hint>
        Editing the person, doctor or sources clears this approval. No package is sent until you
        explicitly choose Send.
      </Hint>
      <div className="modal-actions">
        <button
          onClick={() => {
            setIdentity(false);
            setSources(false);
            onClose();
          }}
        >
          Keep reviewing
        </button>
        {bulk ? (
          <button className="primary" disabled={!ready} onClick={approve}>
            <CheckCircle2 size={17} />
            Mark reviewed for bulk
          </button>
        ) : (
          <button className="primary" disabled={!ready} onClick={send}>
            <Send size={17} />
            Send complete package
          </button>
        )}
      </div>
    </Modal>
  );
}
export function Drafts() {
  const { state, files } = useDemo();
  const drafts = state.drafts.filter((d) => !d.sentId);
  return (
    <>
      <Heading
        title="Work safely. Pick up where you left off."
        description="Multiple separate intake drafts, with no delivery or patient record created by autosave."
        action={
          <button className="primary" onClick={() => navigate('/center/intake')}>
            <Plus size={17} />
            New intake
          </button>
        }
      />
      <Panel
        title="Saved intake drafts"
        description="Sample metadata persists on this device. Local file bytes stay in the current tab."
      >
        {drafts.length ? (
          <div className="draft-grid">
            {drafts.map((d) => (
              <button
                key={d.id}
                className="draft-card"
                onClick={() => navigate('/center/intake/' + d.id)}
              >
                <div>
                  <FileText size={23} />
                  <Badge
                    tone={canSend(state, d, new Set(files.keys())) ? 'success' : 'warning'}
                  >
                    {canSend(state, d, new Set(files.keys()))
                      ? 'Ready to send'
                      : 'Needs review'}
                  </Badge>
                </div>
                <h3>{d.title}</h3>
                <p>{d.name || 'Patient details incomplete'}</p>
                <small>
                  {d.sources.length} sources · {d.batch ? 'Bulk person card' : 'Single intake'}
                </small>
                <strong>
                  Resume review
                  <ArrowRight size={15} />
                </strong>
              </button>
            ))}
          </div>
        ) : (
          <Empty
            title="No unsent drafts"
            description="Start a new intake or a bulk person card."
          />
        )}
      </Panel>
    </>
  );
}
export function Bulk() {
  const { state, update, toast, files } = useDemo();
  const [doctorId, setDoctorId] = useState(''),
    [review, setReview] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const drafts = state.drafts.filter((d) => d.batch);
  const ready = drafts.filter((d) => canSend(state, d, new Set(files.keys()))),
    held = drafts.filter((d) => !d.sentId && !canSend(state, d, new Set(files.keys())));
  const add = () => {
    const d = { ...makeDraft(), batch: true, title: 'Bulk · New person' };
    update((s) => ({ ...s, drafts: [...s.drafts, d] }));
    navigate('/center/intake/' + d.id);
  };
  return (
    <>
      <Heading
        eyebrow="ONE COMPLETE PACKAGE PER PERSON"
        title="Review together. Deliver independently."
        description="Each card has its own identity, source review and primary doctor. Ready people can be sent while unresolved cards stay held."
        action={
          <button className="primary" onClick={add}>
            <Plus size={17} />
            Add person card
          </button>
        }
      />
      <div className="stats compact">
        <div className="stat">
          <Users />
          <strong>{drafts.length}</strong>
          <span>Person cards</span>
        </div>
        <div className="stat">
          <CheckCircle2 />
          <strong>{ready.length}</strong>
          <span>Ready to send</span>
        </div>
        <div className="stat">
          <FileText />
          <strong>{held.length}</strong>
          <span>Held for review</span>
        </div>
        <div className="stat">
          <Send />
          <strong>{drafts.filter((d) => d.sentId).length}</strong>
          <span>Delivered</span>
        </div>
      </div>
      <Panel
        title="Apply a linked doctor to unsent cards"
        description="Each person can still have an individual override. Changing the doctor clears that person's previous approval."
      >
        <div className="apply-doctor">
          <select
            aria-label="Apply doctor to all"
            value={doctorId}
            onChange={(e) => setDoctorId(e.target.value)}
          >
            <option value="">Select a linked doctor</option>
            {state.doctors
              .filter((d) => d.linked && d.active)
              .map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
          </select>
          <button
            disabled={!doctorId}
            onClick={() => {
              update((s) => ({
                ...s,
                drafts: s.drafts.map((d) =>
                  d.batch && !d.sentId
                    ? { ...d, doctorId, revision: d.revision + 1, approvedRevision: null }
                    : d,
                ),
              }));
              toast(
                'Doctor applied to unsent person cards. Review each person before sending.',
              );
            }}
          >
            Apply to all unsent
          </button>
          <button className="primary" disabled={!ready.length} onClick={() => setConfirm(true)}>
            <Send size={17} />
            Send {ready.length} ready {ready.length === 1 ? 'person' : 'people'}
          </button>
        </div>
      </Panel>
      <div className="bulk-grid">
        {drafts.map((d) => (
          <article className="bulk-card" key={d.id}>
            <div className="bulk-card-header">
              <span className="avatar">
                <Users size={20} />
              </span>
              <Badge
                tone={
                  d.sentId
                    ? 'success'
                    : canSend(state, d, new Set(files.keys()))
                      ? 'success'
                      : 'warning'
                }
              >
                {d.sentId
                  ? 'Delivered'
                  : canSend(state, d, new Set(files.keys()))
                    ? 'Ready'
                    : 'Held'}
              </Badge>
            </div>
            <h3>{d.name || 'Unresolved person'}</h3>
            <p>{d.title}</p>
            <div className="summary-row">
              <span>Sources</span>
              <strong>{d.sources.length}</strong>
            </div>
            {!d.sentId ? (
              <Field label="Primary doctor for this person">
                <select
                  aria-label={'Doctor for ' + (d.name || d.id)}
                  value={d.doctorId}
                  onChange={(e) =>
                    update((s) => editDraft(s, d.id, { doctorId: e.target.value }))
                  }
                >
                  <option value="">Choose a doctor</option>
                  {state.doctors
                    .filter((x) => x.active && x.linked)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                </select>
              </Field>
            ) : (
              <p>Delivered to {state.doctors.find((x) => x.id === d.doctorId)?.name}</p>
            )}
            <div className="actions">
              {d.sentId ? (
                <button className="wide" onClick={() => navigate('/center/exams/' + d.sentId)}>
                  Open package
                  <ArrowRight size={15} />
                </button>
              ) : (
                <>
                  <button onClick={() => navigate('/center/intake/' + d.id)}>
                    Open person & sources
                  </button>
                  <button
                    className="primary-soft"
                    disabled={!d.sources.length || !d.name || !d.doctorId}
                    onClick={() => setReview(d.id)}
                  >
                    Human review
                  </button>
                </>
              )}
            </div>
          </article>
        ))}
      </div>
      {review ? (
        state.drafts.find((d) => d.id === review) ? (
          <ReviewDialog
            draft={state.drafts.find((d) => d.id === review)!}
            open
            onClose={() => setReview(null)}
            bulk
          />
        ) : null
      ) : null}
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title={`Send ${ready.length} reviewed people?`}
        description={`${held.length} unresolved person ${held.length === 1 ? 'card stays' : 'cards stay'} held. Each ready person receives one separate complete package.`}
      >
        <div className="review-sources">
          {ready.map((d) => (
            <div key={d.id}>
              <CheckCircle2 size={17} />
              <span>{d.name}</span>
              <Badge>{d.sources.length} sources</Badge>
            </div>
          ))}
        </div>
        <div className="modal-actions">
          <button onClick={() => setConfirm(false)}>Keep reviewing</button>
          <button
            className="primary"
            onClick={() => {
              update((s) =>
                ready.reduce((next, d) => sendDraft(next, d.id, new Set(files.keys())), s),
              );
              setConfirm(false);
              toast('Reviewed sample packages delivered. Unresolved cards remain held.');
            }}
          >
            Send ready packages
          </button>
        </div>
      </Modal>
    </>
  );
}
