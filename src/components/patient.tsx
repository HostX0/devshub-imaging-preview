import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Download,
  FileText,
  Printer,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useDemo, navigate } from '../store';
import type { Exam, Source } from '../model';
import { samplePdf, saveBlob, sourceBlob, packagePdf, pdfParts } from '../files';
import { Badge, Empty, Hint, Panel } from './ui';
import { Brand } from './shell';
export function DocumentView({
  source,
  exam,
  completeExam,
  part,
}: {
  source: Source;
  exam: Pick<Exam, 'patientName' | 'patientCode' | 'title'>;
  completeExam?: Exam;
  part?: { start: number; count: number };
}) {
  const { files } = useDemo();
  const [url, setUrl] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true,
      objectUrl = '';
    const file = files.get(source.id);
    (completeExam
      ? packagePdf(completeExam, files, part?.start, part?.count)
      : file
        ? Promise.resolve(file)
        : source.sample
          ? samplePdf(exam, source.pages)
          : Promise.reject(
              new Error(
                'This local file is no longer in this tab. Re-select it to view its exact bytes.',
              ),
            )
    )
      .then((blob) => {
        objectUrl = URL.createObjectURL(blob);
        if (active) setUrl(objectUrl);
      })
      .catch((e) => {
        if (active) setError((e as Error).message);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [
    source.id,
    source.sample,
    source.pages,
    files,
    exam.patientName,
    exam.patientCode,
    exam.title,
    completeExam,
    part?.start,
    part?.count,
  ]);
  return error ? (
    <Empty title="Local document unavailable" description={error} />
  ) : url ? (
    <div className="document-preview">
      <iframe src={url} title="Sample received PDF preview" />
      <a href={url} target="_blank" rel="noreferrer">
        Open document in a new tab
      </a>
    </div>
  ) : (
    <div className="loading">Preparing the sample document…</div>
  );
}
export function PatientView({ id }: { id: string }) {
  const { state, files, toast } = useDemo();
  const exam = state.exams.find((e) => e.id === id);
  const patient = state.patients.find((p) => p.id === exam?.patientId);
  const [busy, setBusy] = useState(false),
    [selectedPart, setSelectedPart] = useState(0);
  if (!exam || !patient || patient.status !== 'ACTIVE' || exam.status !== 'ACTIVE')
    return (
      <div className="patient-page">
        <Brand />
        <Empty
          title="This sample result is unavailable"
          description="The sample package was withdrawn or its patient record was deleted. Restore retained data from the administrator workspace to explore recovery."
          action={<button onClick={() => navigate('/welcome')}>Back to demo roles</button>}
        />
      </div>
    );
  const bytesAvailable = exam.sources.every((s) => s.sample || files.has(s.id));
  const parts = pdfParts(exam, state.settings.pdfPartPages);
  const part = parts[selectedPart] || parts[0];
  const download = async (index: number) => {
    setBusy(true);
    try {
      const p = parts[index]!;
      saveBlob(
        await packagePdf(exam, files, p.start, p.count || 1000),
        parts.length > 1
          ? `sample-result-part-${index + 1}-of-${parts.length}.pdf`
          : 'sample-complete-result.pdf',
      );
    } catch (e) {
      toast((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="patient-page">
      <header>
        <Brand />
        <span className="demo-pill">
          <i />
          Interactive demo • sample data
        </span>
      </header>
      <section className="patient-heading">
        <span className="patient-icon">
          <ShieldCheck size={30} />
        </span>
        <div className="eyebrow">YOUR EXAMINATION DOCUMENTS</div>
        <h1>Your result, ready to view.</h1>
        <p>{exam.patientName}</p>
        <small>
          {state.settings.centerName} · {exam.patientCode}
        </small>
      </section>
      <Panel
        title="Ready printable documents"
        description="Every sample report page and imaging frame is included in ordered printable coverage. Private doctor notes and interactive imaging tools are excluded."
      >
        {exam.pdf === 'READY' && bytesAvailable && parts.length ? (
          <>
            <div className="patient-documents">
              {parts.map((p, i) => (
                <div key={p.number}>
                  <FileText size={23} />
                  <div>
                    <strong>
                      {parts.length > 1
                        ? `Part ${i + 1} of ${parts.length}`
                        : 'Complete patient PDF'}
                    </strong>
                    <small>
                      {p.count
                        ? `${p.count} pages · ordered sample source coverage`
                        : 'Exact local received PDF · all original pages'}
                    </small>
                  </div>
                  <Badge tone="success">Ready</Badge>
                  <button onClick={() => setSelectedPart(i)}>Preview</button>
                  <button disabled={busy} className="primary" onClick={() => download(i)}>
                    <Download size={16} />
                    Download PDF
                  </button>
                </div>
              ))}
            </div>
            <DocumentView
              source={{
                id: 'complete-' + exam.id,
                kind: 'PDF',
                name: 'Complete sample package',
                sample: true,
                pages: part?.count || 3,
              }}
              exam={exam}
              completeExam={exam}
              part={part}
            />
            <div className="patient-actions">
              <button onClick={() => window.print()}>
                <Printer size={17} />
                Print page
              </button>
              <button onClick={() => navigate('/welcome')}>
                <ArrowLeft size={17} />
                Explore another role
              </button>
            </div>
          </>
        ) : (
          <Empty
            title="Complete patient PDF unavailable"
            description="This sample package contains an unsupported source, or its local file bytes are no longer in this tab after a refresh. Choose a built-in sample result to explore complete PDF output. Partial or missing output is never labeled ready."
          />
        )}
        <Hint>
          Sample documents only. This preview does not contain medical findings or real patient
          information.
        </Hint>
      </Panel>
      <footer>DevsHub Imaging · A clear, private document handoff.</footer>
    </div>
  );
}
