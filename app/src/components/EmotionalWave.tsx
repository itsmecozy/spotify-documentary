import { motion, useInView } from 'framer-motion';
import { useRef, useMemo, useEffect } from 'react';
import type { TimeSeriesPoint } from '@/types/spotify-analysis';

interface EmotionalWaveProps {
  title: string;
  dataPoints?: TimeSeriesPoint[];
}

const W = 1200;
const H = 120;
const PAD = 12;

function buildPaths(points: TimeSeriesPoint[]): { line: string; fill: string; coords: {x:number;y:number}[] } {
  const coords = points.map((p, i) => ({
    x: (i / (points.length - 1)) * (W - PAD * 2) + PAD,
    y: H - PAD - p.valence * (H - PAD * 2),
  }));

  const line = coords.reduce((path, pt, i) => {
    if (i === 0) return `M${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
    const prev = coords[i - 1];
    const dx = (pt.x - prev.x) / 2.8;
    return `${path} C${(prev.x+dx).toFixed(1)},${prev.y.toFixed(1)} ${(pt.x-dx).toFixed(1)},${pt.y.toFixed(1)} ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
  }, '');

  const fill = `${line} L${W - PAD},${H} L${PAD},${H} Z`;
  return { line, fill, coords };
}

// Static demo path when no real data
const DEMO_LINE = 'M0,60 C50,20 100,90 200,55 C300,20 350,100 450,65 C550,30 580,95 700,40 C820,-15 870,90 950,50 C1030,10 1100,80 1200,45';
const DEMO_FILL = `${DEMO_LINE} L1200,120 L0,120 Z`;

export function EmotionalWave({ title, dataPoints }: EmotionalWaveProps) {
  const ref = useRef<HTMLDivElement>(null);
  const lineRef = useRef<SVGPathElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  const hasData = dataPoints && dataPoints.length >= 2;

  const { line, fill, coords } = useMemo(() => {
    if (!hasData) return { line: DEMO_LINE, fill: DEMO_FILL, coords: [] };
    return buildPaths(dataPoints!);
  }, [dataPoints, hasData]);

  // Set stroke-dasharray to actual path length after mount
  useEffect(() => {
    if (lineRef.current) {
      try {
        const len = lineRef.current.getTotalLength();
        lineRef.current.style.strokeDasharray = `${len}`;
        lineRef.current.style.strokeDashoffset = `${len}`;
      } catch (_) {}
    }
  }, [line]);

  // Animate the offset to 0 when in view
  useEffect(() => {
    if (isInView && lineRef.current) {
      lineRef.current.style.transition = 'stroke-dashoffset 2.4s cubic-bezier(0.4,0,0.2,1) 0.3s';
      lineRef.current.style.strokeDashoffset = '0';
    }
  }, [isInView]);

  const copingPoints = hasData
    ? coords.filter((_, i) => dataPoints![i]?.isCopingCluster)
    : [];

  const labels = hasData
    ? dataPoints!.filter((_, i) => i % Math.ceil(dataPoints!.length / 8) === 0)
        .map((p, i) => {
          const srcIdx = i * Math.ceil(dataPoints!.length / 8);
          return { label: new Date(p.date).toLocaleDateString('en-US', { month: 'short' }).toUpperCase(), x: coords[Math.min(srcIdx, coords.length - 1)]?.x ?? 0 };
        })
    : [
        { x: 0, label: 'JAN' }, { x: 110, label: 'MAR' }, { x: 220, label: 'APR' },
        { x: 350, label: 'JUN' }, { x: 480, label: 'JUL' }, { x: 610, label: 'SEP' },
        { x: 740, label: 'OCT' }, { x: 890, label: 'NOV' }, { x: 1090, label: 'DEC' },
      ];

  return (
    <div className="chart-container">
      <div className="chart-title">{title}</div>
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.8 }}
        className="wave-container"
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="waveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c0392b" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#c0392b" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Fill */}
          <motion.path
            d={fill}
            fill="url(#waveGrad)"
            initial={{ opacity: 0 }}
            animate={isInView ? { opacity: 1 } : {}}
            transition={{ duration: 1.5, delay: 0.5 }}
          />

          {/* Line — animated via direct DOM ref */}
          <path
            ref={lineRef}
            d={line}
            fill="none"
            stroke="#c0392b"
            strokeWidth="1.5"
          />

          {/* Coping cluster dots */}
          {copingPoints.map((pt, i) => (
            <motion.circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={4}
              fill="#e74c3c"
              initial={{ opacity: 0, scale: 0 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.35, delay: 2.2 + i * 0.1 }}
            />
          ))}

          {/* Month labels */}
          {labels.map((m, i) => (
            <text key={i} x={m.x} y={H - 2} fill="#3a3a3a" fontSize="9" fontFamily="monospace">
              {m.label}
            </text>
          ))}

          {/* Y-axis hints */}
          <text x={PAD} y={PAD + 4} fill="#2a2a2a" fontSize="8" fontFamily="monospace">HIGH</text>
          <text x={PAD} y={H - PAD} fill="#2a2a2a" fontSize="8" fontFamily="monospace">LOW</text>
        </svg>
      </motion.div>

      {hasData && copingPoints.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', fontSize: '9px', color: 'var(--steel)', letterSpacing: '0.1em', fontFamily: 'monospace' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e74c3c', display: 'inline-block' }} />
          {copingPoints.length} coping cluster{copingPoints.length !== 1 ? 's' : ''} detected
        </div>
      )}
    </div>
  );
}
