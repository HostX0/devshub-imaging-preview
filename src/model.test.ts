import { describe, it, expect } from 'vitest';
import {
  initialState,
  editDraft,
  sendDraft,
  canSend,
  doctorExams,
  canonicalPatientId,
  draftIssues,
} from './model';
import { pdfParts, printablePages } from './files';
describe('reviewed frontend demo flow', () => {
  it('resolves chained reviewed aliases to one canonical identity while retaining only eligible visits', () => {
    const s = initialState();
    s.merges = [
      { id: 'm1', sourceId: 'p2', targetId: 'p1', createdAt: 'sample', reversed: false },
      { id: 'm2', sourceId: 'p1', targetId: 'p3', createdAt: 'sample', reversed: false },
    ];
    expect(canonicalPatientId(s, 'p2')).toBe('p3');
    expect(
      doctorExams(s, 'd2')
        .filter((e) => canonicalPatientId(s, e.patientId) === 'p3')
        .map((e) => e.patientId),
    ).toEqual(['p2', 'p2']);
  });
  it('publishes every source once and makes the package eligible for its selected doctor', () => {
    let s = initialState();
    const d = s.drafts[0]!;
    s = {
      ...s,
      drafts: s.drafts.map((x) => (x.id === d.id ? { ...x, approvedRevision: x.revision } : x)),
    };
    const sent = sendDraft(s, d.id);
    expect(sent.exams).toHaveLength(s.exams.length + 1);
    expect(sent.exams[0]!.sources).toEqual(d.sources);
    expect(doctorExams(sent, d.doctorId).some((e) => e.id === sent.exams[0]!.id)).toBe(true);
    expect(sendDraft(sent, d.id)).toBe(sent);
  });
  it('a changed source or demographic clears exact revision approval', () => {
    let s = initialState();
    s.drafts[0]!.approvedRevision = 1;
    s = editDraft(s, s.drafts[0]!.id, { age: 44 });
    expect(s.drafts[0]!.approvedRevision).toBeNull();
    expect(sendDraft(s, s.drafts[0]!.id)).toBe(s);
  });
  it('holds unresolved bulk cards while dispatching reviewed people independently', () => {
    let s = initialState();
    const ready = s.drafts[1]!;
    s.drafts[1]!.approvedRevision = 1;
    const next = s.drafts
      .filter((d) => d.batch)
      .reduce((state, d) => sendDraft(state, d.id), s);
    expect(next.drafts.find((d) => d.id === ready.id)?.sentId).toBeTruthy();
    expect(next.drafts[2]!.sentId).toBeUndefined();
  });
  it('blocks stale active-directory authority and deleted existing selections', () => {
    let s = initialState();
    const d = s.drafts[0]!;
    d.approvedRevision = 1;
    s.doctors[0]!.active = false;
    expect(canSend(s, d)).toBe(false);
    expect(sendDraft(s, d.id)).toBe(s);
    s.doctors[0]!.active = true;
    d.patientId = 'p1';
    s.patients[0]!.status = 'DELETED';
    expect(sendDraft(s, d.id)).toBe(s);
    expect(s.patients).toHaveLength(6);
  });
  it('requires entered age and reviewed full name and honors configured additional required fields', () => {
    const s = initialState(),
      d = s.drafts[0]!;
    d.name = 'Only';
    d.age = 0;
    d.ageEntered = false;
    expect(draftIssues(s, d)).toContain('Enter the full three-part name.');
    expect(draftIssues(s, d)).toContain('Enter the supplied age.');
    d.name = 'Sample Infant Patient';
    d.ageEntered = true;
    s.fields.push({
      key: 'custom',
      label: 'Custom required field',
      required: true,
      visible: true,
    });
    expect(draftIssues(s, d)).toContain('Complete Custom required field.');
    d.values = { custom: 'Reviewed value' };
    expect(draftIssues(s, d)).toHaveLength(0);
  });
  it('refuses local missing bytes after refresh and allows reviewed exact-file availability', () => {
    const s = initialState(),
      d = s.drafts[0]!;
    d.sources = [
      {
        id: 'local1',
        name: 'local.pdf',
        kind: 'PDF',
        pages: 1,
        sample: false,
        size: 100,
        sha256: 'abc',
      },
    ];
    d.approvedRevision = 1;
    expect(sendDraft(s, d.id)).toBe(s);
    expect(canSend(s, d, new Set(['local1']))).toBe(true);
    expect(sendDraft(s, d.id, new Set(['local1'])).exams).toHaveLength(9);
  });
  it('preserves age units in the delivered snapshot', () => {
    const s = initialState(),
      d = s.drafts[0]!;
    d.unit = 'WEEKS';
    d.age = 12;
    d.approvedRevision = 1;
    const next = sendDraft(s, d.id);
    expect(next.exams[0]!.unit).toBe('WEEKS');
    expect(next.exams[0]!.age).toBe(12);
  });
  it('retains source-patient doctor eligibility while resolving to the canonical profile', () => {
    const s = initialState();
    s.merges = [
      {
        id: 'm',
        sourceId: 'p2',
        targetId: 'p1',
        createdAt: new Date().toISOString(),
        reversed: false,
      },
    ];
    const eligible = doctorExams(s, 'd2');
    expect(eligible.some((e) => e.patientId === 'p2')).toBe(true);
    expect(eligible.some((e) => e.patientId === 'p1')).toBe(false);
    expect(new Set(eligible.map((e) => canonicalPatientId(s, e.patientId))).has('p1')).toBe(
      true,
    );
  });
  it('current hides, revoked grants, deletion and withdrawal never broaden doctor access', () => {
    const s = initialState();
    s.patients[0]!.hiddenFor = ['d1'];
    expect(doctorExams(s, 'd1').some((e) => e.patientId === 'p1')).toBe(false);
    s.patients[0]!.hiddenFor = [];
    s.exams[0]!.grants.d1 = 'REVOKED';
    expect(doctorExams(s, 'd1').some((e) => e.id === s.exams[0]!.id)).toBe(false);
    s.exams[1]!.status = 'WITHDRAWN';
    expect(doctorExams(s, 'd1').some((e) => e.patientId === 'p1')).toBe(false);
  });
  it('patient printable parts cover every ordered MRI frame and report page exactly once', () => {
    const s = initialState(),
      e = s.exams[0]!;
    const pages = printablePages(e);
    expect(pages).toHaveLength(27);
    expect(pages.slice(0, 24).map((p) => p.frame)).toEqual(
      Array.from({ length: 24 }, (_, i) => i + 1),
    );
    expect(pages.slice(24).map((p) => p.frame)).toEqual([1, 2, 3]);
    const parts = pdfParts(e, 10);
    expect(parts.map((p) => p.count)).toEqual([10, 10, 7]);
    expect(parts.reduce((n, p) => n + p.count, 0)).toBe(27);
  });
  it('sample imaging-only output still accounts for all frames', () => {
    const e = initialState().exams[0]!;
    e.sources = e.sources.filter((s) => s.kind === 'MRI');
    expect(pdfParts(e, 10).reduce((n, p) => n + p.count, 0)).toBe(24);
  });
});
