import { useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  MessageSquare,
  ScanLine,
  QrCode,
  Send,
  ShieldCheck,
  Stethoscope,
  Plus,
  ArrowRight,
  Undo2,
} from 'lucide-react';
import { useDemo, navigate } from '../store';
import { doctorExams, stamp, uid, type Source, type Role } from '../model';
import { sampleQrCard, saveBlob, sourceBlob } from '../files';
import { Badge, Check, Empty, Field, Heading, Hint, Modal, Panel, date } from './ui';
import { Reader } from './reader';
import { DocumentView } from './patient';
export function Result({ id, role }: { id: string; role: Exclude<Role, 'patient'> }) {
  const { state, update, files, toast } = useDemo();
  const doctorId = sessionStorage.getItem('demo-doctor') || 'd1';
  const exam = state.exams.find((e) => e.id === id);
  const [tab, setTab] = useState('sources'),
    [source, setSource] = useState<Source | null>(null),
    [reader, setReader] = useState<Source | null>(null),
    [text, setText] = useState(''),
    [share, setShare] = useState(false),
    [qr, setQr] = useState<Awaited<ReturnType<typeof sampleQrCard>> | null>(null),
    [qrBusy, setQrBusy] = useState(false),
    [qrError, setQrError] = useState(''),
    [withdraw, setWithdraw] = useState(false),
    [reason, setReason] = useState(''),
    [confirmed, setConfirmed] = useState(false);
  if (
    !exam ||
    !state.patients.some((p) => p.id === exam.patientId && p.status === 'ACTIVE') ||
    (role === 'doctor' && !doctorExams(state, doctorId).some((e) => e.id === id))
  )
    return (
      <Empty
        title="This package is unavailable in this view"
        description="Current sample grants, visibility and lifecycle control which doctor can open a result."
        action={<button onClick={() => navigate(`/${role}`)}>Return to overview</button>}
      />
    );
  const notes = state.notes.filter(
    (n) => n.examId === id && (role === 'admin' || n.doctorId === doctorId),
  );
  const download = async (s: Source) => {
    try {
      saveBlob(
        await sourceBlob(s, exam, files),
        s.sample && s.kind !== 'PDF'
          ? `synthetic-${s.kind.toLowerCase()}-sample.json`
          : s.sample
            ? 'sample-received-report.pdf'
            : s.name,
      );
    } catch (e) {
      toast((e as Error).message);
    }
  };
  const showQr = async () => {
    setShare(true);
    setQr(null);
    setQrError('');
    setQrBusy(true);
    try {
      setQr(
        await sampleQrCard(
          exam,
          state.settings.centerName,
          window.location.href.split('#')[0] + '#/patient/' + id,
        ),
      );
      update(
        (s) => ({ ...s, exams: s.exams.map((e) => (e.id === id ? { ...e, qr: true } : e)) }),
        'Patient share opened',
        exam.patientName,
      );
    } catch (error) {
      const message = (error as Error).message;
      setQrError(message);
      toast(message);
    } finally {
      setQrBusy(false);
    }
  };
  const correction = () => {
    const draftId = uid();
    update(
      (s) => ({
        ...s,
        drafts: [
          {
            id: draftId,
            title: 'Corrected · ' + exam.title,
            name: exam.patientName,
            age: exam.age,
            unit: exam.unit,
            phone: '',
            patientId: exam.patientId,
            doctorId: exam.doctorId,
            sources: exam.sources,
            revision: 1,
            approvedRevision: null,
          },
          ...s.drafts,
        ],
      }),
      'Correction draft created',
      exam.patientName,
    );
    navigate('/center/intake/' + draftId);
  };
  if (reader) return <Reader source={reader} exam={exam} onClose={() => setReader(null)} />;
  return (
    <>
      <button className="back-link" onClick={() => navigate(`/${role}`)}>
        <ArrowLeft size={15} />
        Back to {role === 'doctor' ? 'inbox' : 'overview'}
      </button>
      <Heading
        eyebrow="COMPLETE PATIENT PACKAGE"
        title={exam.patientName}
        description={`${exam.patientCode} · ${exam.age} ${exam.unit.toLowerCase()} · Version ${exam.version} · Received ${date(exam.createdAt)}`}
        action={
          <Badge tone={exam.status === 'ACTIVE' ? 'success' : 'danger'}>
            {exam.status === 'ACTIVE' ? 'Delivered' : 'Withdrawn'}
          </Badge>
        }
      />
      <div className="result-context">
        <div>
          <ShieldCheck size={21} />
          <span>
            Sending center<strong>{state.settings.centerName}</strong>
          </span>
        </div>
        <div>
          <Stethoscope size={21} />
          <span>
            Primary doctor
            <strong>{state.doctors.find((d) => d.id === exam.doctorId)?.name}</strong>
          </span>
        </div>
        <div>
          <FileText size={21} />
          <span>
            Complete source manifest
            <strong>
              {exam.sources.length} originals · {exam.sources.reduce((n, s) => n + s.pages, 0)}{' '}
              pages / frames
            </strong>
          </span>
        </div>
      </div>
      {exam.status === 'WITHDRAWN' ? (
        <Hint>
          This whole package was withdrawn. Ordinary doctor access and its patient share are
          unavailable. Retained sources remain visible in the administration history.
        </Hint>
      ) : null}
      <div className="result-layout">
        <Panel
          title="All received content"
          description="Clinical originals and private authored notes remain separate."
        >
          <div className="tabs large">
            <button
              className={tab === 'sources' ? 'selected' : ''}
              onClick={() => setTab('sources')}
            >
              Original sources ({exam.sources.length})
            </button>
            {(role === 'doctor' || role === 'admin') &&
            state.settings.features['Private doctor notes'] ? (
              <button
                className={tab === 'notes' ? 'selected' : ''}
                onClick={() => setTab('notes')}
              >
                {role === 'admin'
                  ? 'Private notes · administrative access'
                  : 'My private notes'}{' '}
                ({notes.length})
              </button>
            ) : null}
          </div>
          {tab === 'sources' ? (
            <div className="exam-sources">
              {exam.sources.map((s) => (
                <article key={s.id}>
                  <span className="source-icon">
                    {s.kind === 'PDF' ? <FileText size={25} /> : <ScanLine size={25} />}
                  </span>
                  <div>
                    <h3>{s.name}</h3>
                    <p>
                      {s.sample
                        ? 'Synthetic demonstration source'
                        : files.has(s.id)
                          ? 'Local original · browser only'
                          : 'Local original · re-select after refresh'}{' '}
                      · {s.pages} pages / frames
                    </p>
                    <Badge>{s.kind}</Badge>
                  </div>
                  <div className="source-actions">
                    <button
                      className="primary-soft"
                      disabled={s.kind === 'OTHER' || (!s.sample && !files.has(s.id))}
                      title={
                        s.kind === 'OTHER'
                          ? 'This demo retains the original but cannot decode this format.'
                          : undefined
                      }
                      onClick={() =>
                        s.kind === 'MRI' || s.kind === 'US' ? setReader(s) : setSource(s)
                      }
                    >
                      {s.kind === 'PDF' ? <FileText size={16} /> : <ScanLine size={16} />}Open{' '}
                      {s.kind === 'PDF' ? 'document' : 'reader'}
                    </button>
                    <button onClick={() => download(s)}>
                      <Download size={16} />
                      {s.sample && s.kind !== 'PDF' ? 'Sample file' : 'Original'}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <>
              <Hint>
                {role === 'admin'
                  ? 'Audited administrative access can inspect authored notes. Each note retains its author and date.'
                  : 'Only the selected sample doctor sees their own notes. They never appear in patient PDFs or the QR handoff.'}
              </Hint>
              {notes.length ? (
                <div className="notes-list">
                  {notes.map((n) => (
                    <article key={n.id}>
                      <div>
                        <span className="avatar">
                          <MessageSquare size={17} />
                        </span>
                        <strong>{state.doctors.find((d) => d.id === n.doctorId)?.name}</strong>
                        <small>{date(n.createdAt)}</small>
                      </div>
                      <p>{n.text}</p>
                    </article>
                  ))}
                </div>
              ) : (
                <Empty
                  title="No private notes yet"
                  description="Received reports stay unchanged. An optional authored note is a separate entry."
                />
              )}
              {role === 'doctor' ? (
                <div className="note-form">
                  <Field label="Append a private note">
                    <textarea
                      rows={4}
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Write a sample private note…"
                    />
                  </Field>
                  <button
                    className="primary"
                    disabled={!text.trim()}
                    onClick={() => {
                      update(
                        (s) => ({
                          ...s,
                          notes: [
                            {
                              id: uid(),
                              examId: id,
                              doctorId,
                              text: text.trim(),
                              createdAt: stamp(),
                            },
                            ...s.notes,
                          ],
                        }),
                        'Private note appended',
                        exam.patientCode,
                      );
                      setText('');
                      toast('Private sample note saved for this doctor.');
                    }}
                  >
                    <Plus size={17} />
                    Save private note
                  </button>
                </div>
              ) : null}
            </>
          )}
        </Panel>
        <aside>
          <Panel
            title="Patient documents"
            description="Patient access contains ready PDFs only."
          >
            <Badge
              tone={
                exam.pdf === 'READY' && exam.sources.every((s) => s.sample || files.has(s.id))
                  ? 'success'
                  : 'warning'
              }
            >
              {exam.pdf === 'READY' && exam.sources.every((s) => s.sample || files.has(s.id))
                ? 'Sample PDF ready'
                : 'Complete PDF unavailable'}
            </Badge>
            <p className="summary-help">
              Original source delivery remains separate from printable readiness.
            </p>
            <button
              className="wide"
              disabled={
                exam.pdf !== 'READY' ||
                !exam.sources.every((s) => s.sample || files.has(s.id)) ||
                exam.status !== 'ACTIVE'
              }
              onClick={() => navigate('/patient/' + id)}
            >
              <FileText size={17} />
              Preview patient PDF
            </button>
            {role !== 'doctor' ? (
              <button
                className="primary wide"
                disabled={
                  !state.settings.features['Patient PDF sharing'] ||
                  exam.status !== 'ACTIVE' ||
                  qrBusy
                }
                title={
                  !state.settings.features['Patient PDF sharing']
                    ? 'Patient sharing is disabled in sample settings.'
                    : undefined
                }
                onClick={showQr}
              >
                <QrCode size={17} />
                {exam.qr ? 'Recover sample QR card' : 'Generate sample QR card'}
              </button>
            ) : null}
          </Panel>
          {role !== 'doctor' ? (
            <Panel
              title="Reviewed package actions"
              description="A correction is a new reviewed submission, preserving this historical source association."
            >
              <button className="wide" onClick={correction}>
                <Undo2 size={17} />
                Create correction draft
              </button>
              <button
                className="wide danger-text"
                disabled={exam.status !== 'ACTIVE'}
                onClick={() => setWithdraw(true)}
              >
                Withdraw whole package
              </button>
              {role === 'admin' ? (
                <button
                  className="wide"
                  onClick={() => navigate('/admin/patients/' + exam.patientId)}
                >
                  Grants, visibility & lifecycle
                  <ArrowRight size={15} />
                </button>
              ) : null}
            </Panel>
          ) : null}
        </aside>
      </div>
      <Modal
        open={Boolean(source)}
        onClose={() => setSource(null)}
        title="Received document"
        description="This sample document is separate from human-approved profile metadata."
      >
        {source ? <DocumentView source={source} exam={exam} /> : null}
      </Modal>
      <Modal
        open={share}
        onClose={() => setShare(false)}
        title="Sample patient QR card"
        description="This demo link opens the same local sample examination. It is not a private clinical share."
      >
        <div className="qr-card-preview" aria-busy={qrBusy}>
          {qr ? (
            <img
              src={qr.imageUrl}
              alt={`DevsHub sample patient document card for ${exam.patientName}, ${exam.patientCode}. ${exam.title}. ${state.settings.centerName}. Scan the QR code to view sample PDFs. Sample data only; not a private clinical share.`}
            />
          ) : qrBusy ? (
            <p className="qr-card-loading" role="status">
              Preparing your DevsHub sample QR card…
            </p>
          ) : (
            <p className="qr-card-loading" role="alert">
              {qrError}
            </p>
          )}
        </div>
        <div className="actions">
          <button
            className="primary"
            disabled={!qr || qrBusy}
            onClick={() => qr && saveBlob(qr.blob, 'devshub-sample-patient-qr-card.png')}
          >
            <Download size={16} />
            Download sample QR card
          </button>
          <button onClick={() => navigate('/patient/' + id)}>Preview patient page</button>
        </div>
        <Hint>
          Manual WhatsApp handoff: download the card, open your chat, attach the file and send
          it yourself. This demo never opens or sends an external message.
        </Hint>
      </Modal>
      <Modal
        open={withdraw}
        onClose={() => setWithdraw(false)}
        title="Withdraw this whole package?"
        description="Stops sample doctor access for every recipient and disables the sample patient QR. Other patient visits remain unchanged."
      >
        <Field label="Reason for withdrawal">
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field>
        <Check checked={confirmed} onChange={setConfirmed}>
          I reviewed the entire package and understand this affects every recipient.
        </Check>
        <div className="modal-actions">
          <button onClick={() => setWithdraw(false)}>Keep reviewing</button>
          <button
            className="danger"
            disabled={!reason.trim() || !confirmed}
            onClick={() => {
              update(
                (s) => ({
                  ...s,
                  exams: s.exams.map((e) =>
                    e.id === id ? { ...e, status: 'WITHDRAWN', qr: false } : e,
                  ),
                }),
                'Whole package withdrawn',
                reason,
              );
              setWithdraw(false);
              toast('Sample package withdrawn. Its originals and history remain retained.');
            }}
          >
            Withdraw all recipients & QR
          </button>
        </div>
      </Modal>
    </>
  );
}
export function Notes() {
  const { state } = useDemo();
  const doctorId = sessionStorage.getItem('demo-doctor') || 'd1';
  const eligible = doctorExams(state, doctorId);
  const notes = state.notes.filter(
    (n) => n.doctorId === doctorId && eligible.some((e) => e.id === n.examId),
  );
  return (
    <>
      <Heading
        title="Your private note history"
        description="Separate dated notes across your eligible examinations. Other doctors and patients never see these entries."
      />
      <Panel title="My authored notes">
        {notes.length ? (
          <div className="notes-list">
            {notes.map((n) => {
              const e = state.exams.find((e) => e.id === n.examId)!;
              return (
                <article key={n.id}>
                  <div>
                    <strong>
                      {e.patientName} · {e.patientCode}
                    </strong>
                    <small>{date(n.createdAt)}</small>
                    <button
                      className="text-link"
                      onClick={() => navigate('/doctor/exams/' + n.examId)}
                    >
                      Open examination
                      <ArrowRight size={14} />
                    </button>
                  </div>
                  <p>{n.text}</p>
                </article>
              );
            })}
          </div>
        ) : (
          <Empty
            title="No private notes for this doctor"
            description="Open an eligible package to append a sample note."
          />
        )}
      </Panel>
    </>
  );
}
