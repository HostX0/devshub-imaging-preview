export type Role = 'center' | 'doctor' | 'admin' | 'patient';
export type Source = {
  id: string;
  name: string;
  kind: 'PDF' | 'MRI' | 'US' | 'OTHER';
  pages: number;
  sample: boolean;
  size?: number;
  sha256?: string;
};
export type Patient = {
  id: string;
  code: string;
  name: string;
  age: number;
  unit: string;
  phone: string;
  status: 'ACTIVE' | 'DELETED' | 'PURGED';
  aliases: string[];
  hiddenFor: string[];
};
export type Doctor = {
  id: string;
  name: string;
  specialty: string;
  linked: boolean;
  active: boolean;
};
export type Draft = {
  id: string;
  title: string;
  name: string;
  age: number;
  unit: string;
  phone: string;
  patientId: string;
  doctorId: string;
  sources: Source[];
  revision: number;
  approvedRevision: number | null;
  values?: Record<string, string>;
  ageEntered?: boolean;
  sentId?: string;
  batch?: boolean;
};
export type Exam = {
  id: string;
  patientId: string;
  patientName: string;
  patientCode: string;
  age: number;
  unit: string;
  doctorId: string;
  version: number;
  createdAt: string;
  title: string;
  sources: Source[];
  status: 'ACTIVE' | 'WITHDRAWN';
  grants: Record<string, 'ACTIVE' | 'HIDDEN' | 'REVOKED'>;
  qr: boolean;
  pdf: 'READY' | 'PREPARING' | 'UNAVAILABLE';
};
export type Note = {
  id: string;
  examId: string;
  doctorId: string;
  text: string;
  createdAt: string;
};
export type Audit = { id: string; action: string; detail: string; createdAt: string };
export type Account = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  permissions: string[];
  scope: string;
};
export type Merge = {
  id: string;
  sourceId: string;
  targetId: string;
  createdAt: string;
  reversed: boolean;
  reason?: string;
};
export type State = {
  version: 2;
  patients: Patient[];
  doctors: Doctor[];
  drafts: Draft[];
  exams: Exam[];
  notes: Note[];
  audit: Audit[];
  accounts: Account[];
  merges: Merge[];
  settings: {
    centerName: string;
    grace: number;
    pdfPartPages: number;
    features: Record<string, boolean>;
  };
  fields: { key: string; label: string; required: boolean; visible: boolean }[];
  notifications: { id: string; text: string; examId: string; read: boolean }[];
};
export const uid = () => crypto.randomUUID();
export const stamp = () => new Date().toISOString();
export const sampleSources: Source[] = [
  {
    id: 'sample-mri',
    name: 'Sample MRI · 24 synthetic frames',
    kind: 'MRI',
    pages: 24,
    sample: true,
  },
  {
    id: 'sample-report',
    name: 'Sample received report.pdf',
    kind: 'PDF',
    pages: 3,
    sample: true,
  },
];
export function initialState(): State {
  const names = [
    'Sample Patient One',
    'Sample Patient Two',
    'Sample Patient Three',
    'Sample Patient Four',
    'Sample Patient Five',
    'Sample Patient Six',
  ];
  const patients = names.map(
    (name, i): Patient => ({
      id: `p${i + 1}`,
      code: `DH-${String(248 + i).padStart(5, '0')}`,
      name,
      age: [42, 35, 58, 27, 64, 19][i]!,
      unit: 'YEARS',
      phone: '',
      status: 'ACTIVE',
      aliases: [],
      hiddenFor: [],
    }),
  );
  const doctors: Doctor[] = [
    {
      id: 'd1',
      name: 'Dr. Sample Rana Kareem',
      specialty: 'Radiology',
      linked: true,
      active: true,
    },
    {
      id: 'd2',
      name: 'Dr. Sample Omar Hassan',
      specialty: 'Internal medicine',
      linked: true,
      active: true,
    },
    {
      id: 'd3',
      name: 'Dr. Sample Leila Abbas',
      specialty: 'Orthopedics',
      linked: false,
      active: true,
    },
  ];
  const exams = patients.flatMap((p, i): Exam[] =>
    [0, ...(i < 2 ? [1] : [])].map((n) => ({
      id: `e${i + 1}-${n}`,
      patientId: p.id,
      patientName: p.name,
      patientCode: p.code,
      age: p.age,
      unit: p.unit,
      doctorId: i % 2 ? 'd2' : 'd1',
      version: 1,
      createdAt: new Date(Date.UTC(2026, 9, 10 - n * 20, 9 - i, 20)).toISOString(),
      title: n
        ? 'Previous examination'
        : i === 1
          ? 'Ultrasound examination'
          : 'MRI and received report',
      sources:
        i === 1
          ? [
              {
                id: 'sample-us',
                name: 'Sample ultrasound · 18 synthetic frames',
                kind: 'US',
                pages: 18,
                sample: true,
              },
              sampleSources[1]!,
            ]
          : sampleSources,
      status: 'ACTIVE',
      grants: { [i % 2 ? 'd2' : 'd1']: 'ACTIVE' },
      qr: i < 2,
      pdf: i === 4 ? 'UNAVAILABLE' : 'READY',
    })),
  );
  const drafts: Draft[] = [0, 1, 2].map((i) => ({
    id: `draft${i + 1}`,
    title: ['New MRI visit', 'Bulk · Sample person A', 'Bulk · Sample person B'][i]!,
    name: i ? 'Sample Bulk Patient ' + (i === 1 ? 'A' : 'B') : 'Sample New Patient',
    age: 32 + i * 10,
    unit: 'YEARS',
    phone: '',
    patientId: '',
    doctorId: i === 2 ? '' : 'd1',
    sources: i === 2 ? [] : sampleSources,
    revision: 1,
    approvedRevision: null,
    batch: i > 0,
  }));
  return {
    version: 2,
    patients,
    doctors,
    drafts,
    exams,
    notes: [
      {
        id: 'n1',
        examId: 'e1-0',
        doctorId: 'd1',
        text: 'Sample private note: compare the supplied images with the previous visit. This note is visible only to its author in this demo.',
        createdAt: '2026-10-10T09:25:00Z',
      },
    ],
    audit: [
      {
        id: 'a1',
        action: 'Package delivered',
        detail: 'Sample Patient One · exact version 1',
        createdAt: '2026-10-10T09:20:00Z',
      },
      {
        id: 'a2',
        action: 'Doctor linked',
        detail: 'Dr. Sample Omar Hassan · sample center directory',
        createdAt: '2026-10-10T08:30:00Z',
      },
    ],
    accounts: [
      {
        id: 'a-root',
        name: 'Sample Platform Administrator',
        role: 'Administrator',
        active: true,
        permissions: ['patient.read', 'delivery.grant', 'patient.merge', 'patient.delete'],
        scope: 'All centers',
      },
      {
        id: 'a-center',
        name: 'Sample Center Team',
        role: 'Center administrator',
        active: true,
        permissions: ['patient.read', 'draft.write', 'delivery.send', 'doctor.create'],
        scope: 'Sample Imaging Center',
      },
      {
        id: 'a-delegate',
        name: 'Sample Operations Delegate',
        role: 'Administrator',
        active: true,
        permissions: ['patient.read'],
        scope: 'Sample Imaging Center',
      },
    ],
    merges: [],
    settings: {
      centerName: 'DevsHub Sample Imaging Center',
      grace: 30,
      pdfPartPages: 100,
      features: {
        'Private doctor notes': true,
        'Patient PDF sharing': true,
        'Advanced volume tools': true,
        'Doctor account creation': true,
        'Source integrations': true,
      },
    },
    fields: [
      { key: 'fullName', label: 'Full three-part name', required: true, visible: true },
      { key: 'age', label: 'Supplied age', required: true, visible: true },
      { key: 'ageUnit', label: 'Age unit', required: true, visible: true },
      { key: 'birthDate', label: 'Date of birth', required: false, visible: true },
      { key: 'motherName', label: "Mother's name", required: false, visible: true },
      { key: 'phone', label: 'Phone number', required: false, visible: true },
      { key: 'diagnosis', label: 'Preliminary diagnosis', required: false, visible: true },
    ],
    notifications: [
      {
        id: 'event1',
        text: 'A sample MRI package is ready in your inbox.',
        examId: 'e1-0',
        read: false,
      },
      {
        id: 'event2',
        text: 'A sample ultrasound package is ready in your inbox.',
        examId: 'e2-0',
        read: false,
      },
    ],
  };
}
export function editDraft(s: State, id: string, change: Partial<Draft>): State {
  return {
    ...s,
    drafts: s.drafts.map((d) =>
      d.id === id ? { ...d, ...change, revision: d.revision + 1, approvedRevision: null } : d,
    ),
  };
}
export function draftIssues(
  s: State,
  d: Draft,
  fileIds: ReadonlySet<string> = new Set(),
): string[] {
  const issues: string[] = [];
  if (d.name.trim().split(/\s+/).length < 3) issues.push('Enter the full three-part name.');
  if (!Number.isFinite(d.age) || d.age < 0 || !(d.ageEntered || d.age > 0))
    issues.push('Enter the supplied age.');
  if (!s.doctors.some((x) => x.id === d.doctorId && x.active && x.linked))
    issues.push('Choose a currently available linked doctor.');
  if (d.patientId && !s.patients.some((x) => x.id === d.patientId && x.status === 'ACTIVE'))
    issues.push('The selected patient profile is no longer active. Review the identity again.');
  if (!d.sources.length) issues.push('Add all sources for this person.');
  if (d.sources.some((x) => !x.sample && !fileIds.has(x.id)))
    issues.push('Re-select the missing local files before review or delivery.');
  for (const field of s.fields) {
    if (
      field.required &&
      field.visible &&
      !['fullName', 'age', 'ageUnit'].includes(field.key) &&
      !(field.key === 'phone' ? d.phone : d.values?.[field.key])?.trim()
    )
      issues.push('Complete ' + field.label + '.');
  }
  return issues;
}
export function isReady(d: Draft) {
  return Boolean(
    d.name.trim() &&
    d.age >= 0 &&
    d.unit &&
    d.doctorId &&
    d.sources.length &&
    d.approvedRevision === d.revision &&
    !d.sentId,
  );
}
export function canSend(s: State, d: Draft, fileIds: ReadonlySet<string> = new Set()) {
  return isReady(d) && !draftIssues(s, d, fileIds).length;
}
export function canonicalPatientId(s: State, id: string) {
  const visited = new Set<string>();
  let current = id;
  while (!visited.has(current)) {
    visited.add(current);
    const merge = s.merges.find((m) => !m.reversed && m.sourceId === current);
    if (!merge) return current;
    current = merge.targetId;
  }
  return id;
}
export function patientFamily(s: State, id: string) {
  const canonical = canonicalPatientId(s, id);
  return s.patients.filter((p) => canonicalPatientId(s, p.id) === canonical).map((p) => p.id);
}

export function sendDraft(
  s: State,
  id: string,
  fileIds: ReadonlySet<string> = new Set(),
): State {
  const d = s.drafts.find((x) => x.id === id);
  if (!d || !canSend(s, d, fileIds)) return s;
  let p = s.patients.find((x) => x.id === d.patientId && x.status === 'ACTIVE');
  const created = !p;
  if (!p)
    p = {
      id: uid(),
      code: `DH-${String(250 + s.patients.length).padStart(5, '0')}`,
      name: d.name,
      age: d.age,
      unit: d.unit,
      phone: d.phone,
      status: 'ACTIVE',
      aliases: [],
      hiddenFor: [],
    };
  const e: Exam = {
    id: uid(),
    patientId: p.id,
    patientName: d.name,
    patientCode: p.code,
    age: d.age,
    unit: d.unit,
    doctorId: d.doctorId,
    version: 1,
    createdAt: stamp(),
    title: d.title,
    sources: d.sources,
    status: 'ACTIVE',
    grants: { [d.doctorId]: 'ACTIVE' },
    qr: false,
    pdf:
      d.sources.every((x) => x.sample) ||
      (d.sources.length === 1 && d.sources[0]?.kind === 'PDF')
        ? 'READY'
        : 'UNAVAILABLE',
  };
  return {
    ...s,
    patients: created ? [p, ...s.patients] : s.patients,
    exams: [e, ...s.exams],
    drafts: s.drafts.map((x) => (x.id === id ? { ...x, sentId: e.id } : x)),
    notifications: [
      { id: uid(), text: `New sample package: ${d.name}`, examId: e.id, read: false },
      ...s.notifications,
    ],
    audit: [
      {
        id: uid(),
        action: 'Package delivered',
        detail: `${d.name} · complete ${d.sources.length}-source package`,
        createdAt: stamp(),
      },
      ...s.audit,
    ],
  };
}
export function doctorExams(s: State, doctorId: string) {
  return s.exams.filter(
    (e) =>
      e.status === 'ACTIVE' &&
      e.grants[doctorId] === 'ACTIVE' &&
      s.patients.some(
        (p) =>
          p.id === e.patientId &&
          p.status === 'ACTIVE' &&
          !p.hiddenFor.includes(doctorId) &&
          !p.hiddenFor.includes('*'),
      ),
  );
}
