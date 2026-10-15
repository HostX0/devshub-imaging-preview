import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  FlipHorizontal2,
  FlipVertical2,
  Maximize,
  Move,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Ruler,
  Scan,
  Sun,
  ZoomIn,
  MousePointer2,
  Layers,
  Box,
  Download,
} from 'lucide-react';
import { drawSample } from '../imaging';
import { saveBlob } from '../files';
import type { Exam, Source } from '../model';
import { useDemo } from '../store';
import { Hint } from './ui';
type Point = { x: number; y: number };
type Mark = { tool: string; points: Point[] };
export function Reader({
  source,
  exam,
  onClose,
}: {
  source: Source;
  exam: Exam;
  onClose: () => void;
}) {
  const { state } = useDemo();
  const kind = source.kind === 'US' ? 'US' : 'MRI';
  const canvas = useRef<HTMLCanvasElement>(null);
  const [frame, setFrame] = useState(1),
    [tool, setTool] = useState('Window / level'),
    [contrast, setContrast] = useState(1),
    [brightness, setBrightness] = useState(0),
    [zoom, setZoom] = useState(1),
    [rotation, setRotation] = useState(0),
    [flipH, setFlipH] = useState(false),
    [flipV, setFlipV] = useState(false),
    [invert, setInvert] = useState(false),
    [playing, setPlaying] = useState(false),
    [mode, setMode] = useState('Stack'),
    [preset, setPreset] = useState('Source default'),
    [marks, setMarks] = useState<Mark[]>([]),
    [pan, setPan] = useState({ x: 0, y: 0 });
  const drag = useRef<{ x: number; y: number; point: Point; pan: Point } | null>(null);
  const [pending, setPending] = useState<Mark | null>(null);
  useEffect(() => {
    if (canvas.current)
      drawSample(canvas.current, kind, frame, source.pages, contrast, brightness);
  }, [kind, frame, source.pages, contrast, brightness]);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setFrame((f) => (f % source.pages) + 1), 140);
    return () => clearInterval(id);
  }, [playing, source.pages]);
  const reset = () => {
    setContrast(1);
    setBrightness(0);
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setInvert(false);
    setPan({ x: 0, y: 0 });
    setPreset('Source default');
  };
  const tools = [
    ['Window / level', Sun],
    ['Zoom', ZoomIn],
    ['Pan', Move],
    ['Length', Ruler],
    ['Angle', Scan],
    ['ROI', MousePointer2],
  ] as const;
  const point = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 100,
      y: ((e.clientY - r.top) / r.height) * 100,
    };
  };
  const pointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const p = point(e);
    drag.current = { x: e.clientX, y: e.clientY, point: p, pan };
    if (['Length', 'Angle', 'ROI'].includes(tool)) setPending({ tool, points: [p, p] });
  };
  const pointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x,
      dy = e.clientY - d.y;
    if (tool === 'Window / level') {
      setContrast(Math.max(0.25, Math.min(4, 1 + dx / 150)));
      setBrightness(Math.max(-100, Math.min(100, dy / 2)));
      setPreset('Custom');
    } else if (tool === 'Zoom') setZoom(Math.max(0.5, Math.min(4, 1 - dy / 150)));
    else if (tool === 'Pan') setPan({ x: d.pan.x + dx, y: d.pan.y + dy });
    else setPending({ tool, points: [d.point, point(e)] });
  };
  const pointerUp = () => {
    if (pending) {
      setMarks((m) => [...m, pending]);
      setPending(null);
    }
    drag.current = null;
  };
  const renderedMarks = [...marks, ...(pending ? [pending] : [])];
  return (
    <div className="reader">
      <header className="reader-header">
        <button onClick={onClose}>
          <ArrowLeft size={17} />
          Close reader
        </button>
        <img
          className="reader-brand-mark"
          src="/brand/mark.svg"
          alt="DevsHub"
          width="30"
          height="30"
        />
        <div>
          <strong>{exam.patientName}</strong>
          <small>
            {exam.patientCode} · {source.name}
          </small>
        </div>
        <span className="reader-demo">Synthetic imaging sample</span>
      </header>
      <div className="reader-toolbar">
        {tools.map(([name, Icon]) => (
          <button
            key={name}
            aria-pressed={tool === name}
            className={tool === name ? 'active' : ''}
            onClick={() => setTool(name)}
            title={
              name === 'Length' || name === 'ROI' || name === 'Angle'
                ? 'Drag to place a temporary sample measurement'
                : name === 'Zoom'
                  ? 'Drag vertically to zoom'
                  : name === 'Pan'
                    ? 'Drag to move the image'
                    : 'Drag to adjust brightness and contrast'
            }
          >
            <Icon size={17} />
            {name}
          </button>
        ))}
        <span className="toolbar-divider" />
        <button onClick={() => setRotation((r) => (r + 90) % 360)}>
          <RotateCw size={17} />
          Rotate
        </button>
        <button onClick={() => setFlipH((v) => !v)}>
          <FlipHorizontal2 size={17} />
          Flip H
        </button>
        <button onClick={() => setFlipV((v) => !v)}>
          <FlipVertical2 size={17} />
          Flip V
        </button>
        <button onClick={() => setInvert((v) => !v)}>
          <Sun size={17} />
          Invert
        </button>
        <button onClick={reset}>
          <RotateCcw size={17} />
          Reset display
        </button>
        <button onClick={() => setMarks([])}>Clear measurements</button>
      </div>
      <div className="reader-options">
        <label>
          Display preset
          <select
            aria-label="Display preset"
            value={preset}
            onChange={(e) => {
              const p = e.target.value;
              setPreset(p);
              setContrast(p === 'High contrast' ? 1.8 : p === 'Soft display' ? 0.7 : 1);
              setBrightness(p === 'Soft display' ? 25 : 0);
            }}
          >
            {['Source default', 'High contrast', 'Soft display', 'Custom'].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        {kind === 'MRI' && state.settings.features['Advanced volume tools'] ? (
          <div className="reader-modes">
            {(['Stack', 'MPR', 'MIP', '3D'] as const).map((m) => (
              <button className={mode === m ? 'active' : ''} key={m} onClick={() => setMode(m)}>
                {m === '3D' ? <Box size={16} /> : <Layers size={16} />} {m}
              </button>
            ))}
          </div>
        ) : null}
        <small>
          {tool}:{' '}
          {['Length', 'ROI', 'Angle'].includes(tool)
            ? 'Drag to place a temporary sample measurement.'
            : 'Drag on the image. Wheel or frame controls navigate.'}
        </small>
      </div>
      <div className={`reader-canvas-area mode-${mode}`}>
        <div
          className="image-viewport"
          onPointerDown={pointerDown}
          onPointerMove={pointerMove}
          onPointerUp={pointerUp}
          onPointerCancel={() => {
            drag.current = null;
            setPending(null);
          }}
          onWheel={(e) => {
            setFrame((f) => Math.max(1, Math.min(source.pages, f + (e.deltaY > 0 ? 1 : -1))));
          }}
        >
          <canvas
            ref={canvas}
            role="img"
            aria-label={`Synthetic ${kind} sample frame ${frame} of ${source.pages}`}
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${zoom * (flipH ? -1 : 1)},${zoom * (flipV ? -1 : 1)})`,
              filter: invert ? 'invert(1)' : 'none',
            }}
          />
          <div className="viewport-label">
            <strong>{kind} · Sample only</strong>
            <span>
              {mode === 'Stack'
                ? 'Frame'
                : mode === 'MIP'
                  ? 'Synthetic maximum projection'
                  : 'Synthetic spatial view'}{' '}
              {frame} / {source.pages}
            </span>
            <span>
              Brightness {brightness.toFixed(0)} · Contrast {contrast.toFixed(2)}
            </span>
          </div>
          <svg className="measurement-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
            {renderedMarks.map((m, i) => {
              const [a, b] = m.points;
              const length = Math.hypot(b!.x - a!.x, b!.y - a!.y);
              return (
                <g key={i} data-measurement={m.tool}>
                  {m.tool === 'ROI' ? (
                    <ellipse
                      cx={(a!.x + b!.x) / 2}
                      cy={(a!.y + b!.y) / 2}
                      rx={Math.abs(b!.x - a!.x) / 2}
                      ry={Math.abs(b!.y - a!.y) / 2}
                    />
                  ) : (
                    <>
                      <line x1={a!.x} y1={a!.y} x2={b!.x} y2={b!.y} />
                      {m.tool === 'Angle' ? (
                        <line x1={a!.x} y1={a!.y} x2={a!.x + 15} y2={a!.y} />
                      ) : null}
                    </>
                  )}
                  <text x={b!.x + 2} y={b!.y}>
                    {m.tool === 'Length'
                      ? `${length.toFixed(1)} sample units`
                      : m.tool === 'Angle'
                        ? `${Math.abs((Math.atan2(b!.y - a!.y, b!.x - a!.x) * 180) / Math.PI).toFixed(0)}°`
                        : 'Sample ROI'}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
        {mode !== 'Stack' ? (
          <div className="spatial-samples">
            {mode === '3D' ? (
              <div className="synthetic-volume">
                <div />
                <small>Illustrative synthetic volume · not a clinical reconstruction</small>
              </div>
            ) : (
              <>
                <div className="orthogonal-view">
                  <div className="synthetic-slice sagittal" />
                  <span>{mode === 'MIP' ? 'Synthetic projection' : 'Sagittal sample'}</span>
                </div>
                <div className="orthogonal-view">
                  <div className="synthetic-slice coronal" />
                  <span>{mode === 'MIP' ? 'Synthetic projection' : 'Coronal sample'}</span>
                </div>
              </>
            )}
          </div>
        ) : null}
      </div>
      <div className="reader-frame-controls">
        <button aria-label="Previous frame" onClick={() => setFrame((f) => Math.max(1, f - 1))}>
          <ChevronLeft />
        </button>
        <button
          aria-label={playing ? 'Pause cine' : 'Play cine'}
          onClick={() => setPlaying((v) => !v)}
        >
          {playing ? <Pause size={17} /> : <Play size={17} />}
        </button>
        <input
          aria-label="Frame"
          type="range"
          min="1"
          max={source.pages}
          value={frame}
          onChange={(e) => setFrame(Number(e.target.value))}
        />
        <strong>
          {frame} / {source.pages}
        </strong>
        <button
          aria-label="Next frame"
          onClick={() => setFrame((f) => Math.min(source.pages, f + 1))}
        >
          <ChevronRight />
        </button>
        <button
          aria-label="Download synthetic sample frame"
          onClick={() => {
            if (canvas.current)
              canvas.current.toBlob((b) => {
                if (b) saveBlob(b, 'synthetic-sample-frame.png');
              });
          }}
        >
          <Download size={16} />
          <span>Sample frame</span>
        </button>
      </div>
      <footer className="reader-footer">
        DevsHub Imaging · Interactive display demonstration. Synthetic pixels and measurements
        are not calibrated for clinical use. Changes are temporary; source files are never
        edited.
      </footer>
    </div>
  );
}
