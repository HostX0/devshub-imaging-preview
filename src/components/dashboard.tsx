import {
  ArrowRight,
  CheckCircle2,
  Clock,
  FileStack,
  Plus,
  Send,
  Users,
  Stethoscope,
  ShieldCheck,
  Activity,
} from 'lucide-react';
import { useState } from 'react';
import { useDemo, navigate } from '../store';
import { doctorExams, type Exam } from '../model';
import { Badge, Empty, Heading, Panel, date, Hint } from './ui';
export function ExamTable({
  exams,
  role,
}: {
  exams: Exam[];
  role: 'center' | 'doctor' | 'admin';
}) {
  return exams.length ? (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Patient / reference</th>
            <th>Complete package</th>
            <th>Sending center</th>
            <th>Received</th>
            <th>Status</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {exams.map((e) => (
            <tr key={e.id}>
              <td>
                <strong>{e.patientName}</strong>
                <small>
                  {e.patientCode} · Version {e.version}
                </small>
              </td>
              <td>
                <strong>{e.title}</strong>
                <small>
                  {e.sources.length} original sources ·{' '}
                  {e.sources.reduce((n, s) => n + s.pages, 0)} pages / frames
                </small>
              </td>
              <td>DevsHub Sample Center</td>
              <td>{date(e.createdAt)}</td>
              <td>
                <Badge tone={e.status === 'ACTIVE' ? 'success' : 'danger'}>
                  {e.status === 'ACTIVE' ? 'Delivered' : 'Withdrawn'}
                </Badge>
                <small>
                  {e.pdf === 'READY'
                    ? 'Patient PDF ready'
                    : e.pdf === 'UNAVAILABLE'
                      ? 'PDF needs attention'
                      : 'PDF preparing'}
                </small>
              </td>
              <td>
                <button
                  className="text-link"
                  onClick={() => navigate(`/${role}/exams/${e.id}`)}
                >
                  Open
                  <ArrowRight size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="No results in this view"
      description="Try another filter or deliver a reviewed sample intake."
    />
  );
}
export function Dashboard({ role }: { role: 'center' | 'doctor' | 'admin' }) {
  const { state } = useDemo();
  const [query, setQuery] = useState(''),
    [doctorId, setDoctorId] = useState(sessionStorage.getItem('demo-doctor') || 'd1');
  const [filter, setFilter] = useState('all');
  const exams = role === 'doctor' ? doctorExams(state, doctorId) : state.exams;
  const visible = exams.filter(
    (e) =>
      (filter !== 'ready' || e.pdf === 'READY') &&
      `${e.patientName} ${e.patientCode} ${e.title}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const drafts = state.drafts.filter((d) => !d.sentId).length;
  const stats =
    role === 'admin'
      ? [
          [
            state.patients.filter((p) => p.status === 'ACTIVE').length,
            'Active patients',
            Users,
          ],
          [state.doctors.filter((d) => d.active).length, 'Doctor identities', Stethoscope],
          [state.accounts.length, 'Staff accounts', ShieldCheck],
          [state.audit.length, 'Audited events', Activity],
        ]
      : role === 'doctor'
        ? [
            [exams.length, 'Received packages', FileStack],
            [exams.filter((e) => e.pdf === 'READY').length, 'Printable results', CheckCircle2],
            [
              state.notes.filter((n) => n.doctorId === doctorId).length,
              'My private notes',
              Users,
            ],
            [new Set(exams.map((e) => e.patientId)).size, 'Eligible patients', Users],
          ]
        : [
            [
              state.exams.filter((e) => e.status === 'ACTIVE').length,
              'Delivered packages',
              Send,
            ],
            [drafts, 'Saved intake drafts', Clock],
            [
              state.patients.filter((p) => p.status === 'ACTIVE').length,
              'Patient profiles',
              Users,
            ],
            [
              state.doctors.filter((d) => d.linked && d.active).length,
              'Linked doctors',
              Stethoscope,
            ],
          ];
  return (
    <>
      <Heading
        eyebrow={
          role === 'doctor'
            ? 'YOUR RECEIVED RESULTS'
            : role === 'admin'
              ? 'PLATFORM WORKSPACE'
              : 'CENTER WORKSPACE'
        }
        title={
          role === 'doctor'
            ? 'Your result inbox.'
            : role === 'admin'
              ? 'Clear oversight. Trusted access.'
              : 'A good day starts with clarity.'
        }
        description={
          role === 'doctor'
            ? 'Every eligible source in one place, with the sending center always clear.'
            : role === 'admin'
              ? 'Manage the sample workspace, current access and operational history.'
              : 'Review the right person. Deliver every original. Keep work moving.'
        }
        action={
          role === 'center' ? (
            <button className="primary" onClick={() => navigate('/center/intake')}>
              <Plus size={17} />
              New patient intake
            </button>
          ) : null
        }
      />
      {role === 'center' ? (
        <div className="hero">
          <div className="hero-copy">
            <div className="eyebrow">FROM RECEIVED FILE TO REVIEWED RESULT</div>
            <h2>
              One person.
              <br />
              One complete package.
            </h2>
            <p>
              Confirm identity and source ownership, choose the doctor, and send. Printable
              output follows independently.
            </p>
            <button onClick={() => navigate('/center/bulk')}>
              Open bulk workspace
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="workflow">
            {[
              [FileStack, 'Receive', 'Upload all original files'],
              [Users, 'Review', 'Confirm the person and sources'],
              [Send, 'Deliver', 'Send to the selected doctor'],
            ].map(([Icon, title, help], i) => {
              const I = Icon as typeof FileStack;
              return (
                <div key={i}>
                  <span>
                    <I size={21} />
                  </span>
                  <div>
                    <strong>{title as string}</strong>
                    <small>{help as string}</small>
                  </div>
                  <b>0{i + 1}</b>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
      <div className="stats">
        {stats.map(([value, label, Icon]) => {
          const I = Icon as typeof Users;
          return (
            <div className="stat" key={label as string}>
              <I size={19} />
              <strong>{value as number}</strong>
              <span>{label as string}</span>
            </div>
          );
        })}
      </div>
      {role === 'doctor' ? (
        <div className="doctor-selector">
          <label>
            Explore inbox as{' '}
            <select
              aria-label="Sample doctor identity"
              value={doctorId}
              onChange={(e) => {
                setDoctorId(e.target.value);
                sessionStorage.setItem('demo-doctor', e.target.value);
              }}
            >
              {state.doctors
                .filter((d) => d.active)
                .map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
            </select>
          </label>
          <Hint>Private notes and received packages follow the selected sample doctor.</Hint>
        </div>
      ) : null}
      <Panel
        title={role === 'doctor' ? 'Received examinations' : 'Recent patient packages'}
        description="Open a complete package to review its originals and current status."
        action={
          <button className="text-link" onClick={() => navigate(`/${role}/patients`)}>
            Patient history
            <ArrowRight size={14} />
          </button>
        }
      >
        <div className="filter-row">
          <div className="tabs">
            <button
              className={filter === 'all' ? 'selected' : ''}
              onClick={() => setFilter('all')}
            >
              All packages
            </button>
            <button
              className={filter === 'ready' ? 'selected' : ''}
              onClick={() => setFilter('ready')}
            >
              PDF ready
            </button>
          </div>
          <input
            aria-label="Search packages"
            placeholder="Search patient, reference or package…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <ExamTable exams={visible} role={role} />
      </Panel>
    </>
  );
}
