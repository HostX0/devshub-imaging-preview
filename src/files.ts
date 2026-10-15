import type { Exam, Source } from './model';
import type { jsPDF as Pdf } from 'jspdf';
import { drawSample } from './imaging';

const brand = {
  midnight: '#0A0A0B',
  paper: '#F8FAFC',
  indigo: '#6366F1',
  cta: '#4F46E5',
};
let markPromise: Promise<HTMLImageElement> | undefined;
function loadBrandMark() {
  if (!markPromise) {
    markPromise = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error('The DevsHub mark could not be loaded. Please retry.'));
      image.src = `${import.meta.env.BASE_URL}brand/mark.png`;
    }).catch((error) => {
      markPromise = undefined;
      throw error;
    });
  }
  return markPromise;
}
function brandPdf(doc: Pdf, title: string) {
  doc.setProperties({
    title: 'DevsHub',
    author: 'DevsHub',
    creator: 'DevsHub',
    subject: `${title} - synthetic demonstration document - sample data only`,
    keywords: 'DevsHub, sample, synthetic demonstration',
  });
}
function pdfBlob(doc: Pdf) {
  const bytes = new Uint8Array(doc.output('arraybuffer'));
  const marker = new TextEncoder().encode('/Producer (jsPDF ');
  // jsPDF fixes its Producer field internally. A same-length metadata replacement
  // preserves every cross-reference offset; this runs only on newly generated PDFs.
  for (let start = bytes.length - marker.length; start >= 0; start--) {
    if (!marker.every((value, index) => bytes[start + index] === value)) continue;
    const valueStart = start + '/Producer ('.length;
    let end = valueStart;
    while (end < bytes.length && bytes[end] !== 41) end++;
    const name = new TextEncoder().encode('DevsHub');
    if (end < bytes.length && end - valueStart >= name.length) {
      bytes.fill(32, valueStart, end);
      bytes.set(name, valueStart);
    }
    break;
  }
  return new Blob([bytes], { type: 'application/pdf' });
}
function pdfFrame(doc: Pdf, mark: HTMLImageElement, page: number, pages: number) {
  doc.setFillColor(brand.paper);
  doc.rect(0, 0, 210, 297, 'F');
  doc.setFillColor(brand.midnight);
  doc.rect(0, 0, 210, 40, 'F');
  doc.addImage(mark, 'PNG', 16, 8, 24, 24, 'devshub-mark');
  doc.setTextColor(brand.paper);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('DevsHub', 46, 21);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('IMAGING & PATIENT DOCUMENTS', 46, 29);
  doc.setFillColor(brand.indigo);
  doc.rect(0, 40, 210, 1.2, 'F');
  doc.setDrawColor(220, 224, 232);
  doc.line(18, 275, 192, 275);
  doc.setTextColor(brand.midnight);
  doc.setFontSize(9);
  doc.text('DevsHub | Sample data only', 18, 284);
  doc.text(`Page ${page} of ${pages}`, 192, 284, { align: 'right' });
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
function reportPage(
  doc: Pdf,
  mark: HTMLImageElement,
  exam: Pick<Exam, 'patientName' | 'patientCode' | 'title'>,
  page: number,
  pages: number,
  outputPage = page,
  outputPages = pages,
) {
  pdfFrame(doc, mark, outputPage, outputPages);
  doc.setTextColor(brand.midnight);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Sample received document', 18, 62);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text('Sample Source Patient', 18, 80);
  doc.text('Reference: SOURCE-DEMO-001', 18, 90);
  doc.text('Sample received report', 18, 106);
  doc.setDrawColor(220, 224, 232);
  doc.line(18, 118, 192, 118);
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(
      'This is a synthetic demonstration document. It contains no clinical findings, real patient information or medical advice. The interactive preview demonstrates how an unchanged received report can be opened and downloaded.',
      170,
    ),
    18,
    133,
  );
  doc.setFontSize(12);
  doc.text('Source sample page ' + page + ' of ' + pages, 18, 251);
  doc.setFontSize(10);
  doc.setTextColor(brand.cta);
  doc.text('Interactive demo - no clinical findings or medical advice', 18, 261);
}
export async function samplePdf(
  exam: Pick<Exam, 'patientName' | 'patientCode' | 'title'>,
  pages = 3,
) {
  if (!Number.isInteger(pages) || pages < 1)
    throw new Error('This sample document has no printable pages.');
  const [{ jsPDF }, mark] = await Promise.all([import('jspdf'), loadBrandMark()]);
  const doc = new jsPDF();
  brandPdf(doc, 'Sample received document');
  for (let page = 1; page <= pages; page++) {
    if (page > 1) doc.addPage();
    reportPage(doc, mark, exam, page, pages);
  }
  return pdfBlob(doc);
}
export function printablePages(exam: Exam) {
  return exam.sources.flatMap((s) =>
    Array.from({ length: s.sample ? s.pages : 0 }, (_, i) => ({ source: s, frame: i + 1 })),
  );
}
export function pdfParts(exam: Exam, maxPages: number) {
  const total = printablePages(exam).length;
  if (!exam.sources.every((s) => s.sample))
    return [{ number: 1, start: 0, count: 0, total: 0 }];
  return Array.from({ length: Math.ceil(total / maxPages) }, (_, i) => ({
    number: i + 1,
    start: i * maxPages,
    count: Math.min(maxPages, total - i * maxPages),
    total,
  }));
}
export async function packagePdf(
  exam: Exam,
  files: Map<string, File>,
  start = 0,
  count = 1000,
) {
  if (
    exam.sources.length === 1 &&
    !exam.sources[0]!.sample &&
    exam.sources[0]!.kind === 'PDF'
  ) {
    const file = files.get(exam.sources[0]!.id);
    if (!file)
      throw new Error(
        'This local PDF is no longer in this tab. Re-select its original bytes before viewing.',
      );
    return file;
  }
  if (!exam.sources.every((s) => s.sample))
    throw new Error(
      'Complete printable coverage for this local package is unavailable in the demo.',
    );
  const [{ jsPDF }, mark] = await Promise.all([import('jspdf'), loadBrandMark()]);
  const doc = new jsPDF();
  brandPdf(doc, 'Sample patient document package');
  const pages = printablePages(exam).slice(start, start + count);
  if (!pages.length) throw new Error('This sample package has no printable pages.');
  const canvas = document.createElement('canvas');
  pages.forEach(({ source, frame }, index) => {
    if (index) doc.addPage();
    if (source.kind === 'PDF')
      reportPage(doc, mark, exam, frame, source.pages, index + 1, pages.length);
    else {
      pdfFrame(doc, mark, index + 1, pages.length);
      doc.setTextColor(brand.midnight);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Synthetic imaging sample', 18, 57);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.text(exam.patientName + ' - ' + exam.patientCode, 18, 68);
      doc.text(`${source.kind} - frame ${frame} of ${source.pages}`, 18, 77);
      drawSample(canvas, source.kind === 'US' ? 'US' : 'MRI', frame, source.pages);
      doc.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', 18, 84, 174, 174);
      doc.setFontSize(10);
      doc.text('Synthetic pixels only. Not clinical data or calibrated measurements.', 18, 267);
    }
  });
  return pdfBlob(doc);
}

function cardText(
  context: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  width: number,
  lineHeight: number,
  maxLines = 2,
) {
  const words = value.trim().split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (line && context.measureText(next).width > width) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  lines.slice(0, maxLines).forEach((text, index) => {
    if (index === maxLines - 1 && lines.length > maxLines) text += '…';
    while (context.measureText(text).width > width && text.length > 1)
      text = text.slice(0, -2) + '…';
    context.fillText(text, x, y + index * lineHeight);
  });
}
export async function sampleQrCard(
  exam: Pick<Exam, 'patientName' | 'patientCode' | 'title'>,
  centerName: string,
  targetUrl: string,
) {
  const [{ toCanvas }, mark] = await Promise.all([import('qrcode'), loadBrandMark()]);
  const qr = document.createElement('canvas');
  await toCanvas(qr, targetUrl, {
    width: 560,
    margin: 6,
    errorCorrectionLevel: 'M',
    color: { dark: brand.midnight, light: '#FFFFFF' },
  });
  const canvas = document.createElement('canvas');
  canvas.width = 900;
  canvas.height = 1320;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not create the sample QR card.');
  context.fillStyle = brand.paper;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = brand.midnight;
  context.fillRect(0, 0, canvas.width, 168);
  context.drawImage(mark, 56, 40, 88, 88);
  context.fillStyle = brand.paper;
  context.font = '700 48px Arial, sans-serif';
  context.fillText('DevsHub', 168, 93);
  context.font = '22px Arial, sans-serif';
  context.fillText('Imaging & patient documents', 170, 130);
  context.fillStyle = brand.indigo;
  context.fillRect(0, 164, canvas.width, 4);
  context.fillStyle = brand.cta;
  context.font = '700 22px Arial, sans-serif';
  context.fillText('PATIENT DOCUMENTS', 64, 224);
  context.fillStyle = brand.midnight;
  context.font = '700 42px Arial, sans-serif';
  cardText(context, exam.patientName, 64, 280, 772, 50);
  context.font = '700 25px Arial, sans-serif';
  cardText(context, exam.patientCode, 64, 381, 772, 30, 1);
  context.font = '26px Arial, sans-serif';
  cardText(context, exam.title, 64, 429, 772, 32);
  context.font = '23px Arial, sans-serif';
  cardText(context, centerName, 64, 510, 772, 30);
  // The untouched QR square includes six quiet modules on every side.
  // Branding and patient context stay entirely outside that square.
  context.drawImage(qr, 170, 572);
  context.textAlign = 'center';
  context.fillStyle = brand.cta;
  context.font = '700 28px Arial, sans-serif';
  context.fillText('Scan to view sample PDFs', 450, 1190);
  context.fillStyle = brand.midnight;
  context.font = '700 23px Arial, sans-serif';
  context.fillText('SAMPLE DATA ONLY', 450, 1240);
  context.font = '21px Arial, sans-serif';
  context.fillText('Demo link only. Not a private clinical share.', 450, 1276);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob ? resolve(blob) : reject(new Error('The sample QR card could not be exported.')),
      'image/png',
    );
  });
  return { blob, imageUrl: canvas.toDataURL('image/png') };
}
export async function sourceBlob(source: Source, exam: Exam, files: Map<string, File>) {
  const file = files.get(source.id);
  if (file) return file;
  if (source.sample && source.kind === 'PDF') return samplePdf(exam, source.pages);
  if (source.sample)
    return new Blob(
      [
        JSON.stringify(
          {
            product: 'DevsHub Imaging',
            disclosure: 'Synthetic viewer demonstration; not an original clinical DICOM file.',
            modality: source.kind,
            frames: source.pages,
          },
          null,
          2,
        ),
      ],
      { type: 'application/json' },
    );
  throw new Error(
    'This local file is no longer in this tab. Re-select it in the draft to restore access.',
  );
}
