import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

export type TrendPoint = {
  label: string;
  faculty: number;
  students: number;
};

type SortKey = "Years" | "Quarters";

const DEFAULT_DATASETS: Record<SortKey, TrendPoint[]> = {
  Years: [
    { label: "2020", faculty: 42, students: 58 },
    { label: "2021", faculty: 55, students: 50 },
    { label: "2022", faculty: 48, students: 66 },
    { label: "2023", faculty: 63, students: 54 },
    { label: "2024", faculty: 58, students: 72 },
    { label: "2025", faculty: 70, students: 61 },
    { label: "2026", faculty: 65, students: 78 },
  ],
  Quarters: [
    { label: "Q1", faculty: 50, students: 60 },
    { label: "Q2", faculty: 58, students: 66 },
    { label: "Q3", faculty: 55, students: 71 },
    { label: "Q4", faculty: 65, students: 68 },
  ],
};

const WIDTH = 700;
const HEIGHT = 220;
const PAD_X = 20;
const PAD_Y = 24;

function smoothPath(points: { x: number; y: number }[]) {
  if (points.length < 2) return "";
  let d = `M ${points[0].x},${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] ?? p2;
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  return d;
}

function useDrawIn(pathRef: React.RefObject<SVGPathElement | null>, dep: unknown) {
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength();
    el.style.transition = "none";
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1.1s cubic-bezier(.4,0,.2,1)";
    el.style.strokeDashoffset = "0";
  }, [dep]);
}

export function AnimatedTrendChart({
  title = "Department Growth",
  seriesALabel = "Faculty",
  seriesBLabel = "Students",
  datasets = DEFAULT_DATASETS,
}: {
  title?: string;
  seriesALabel?: string;
  seriesBLabel?: string;
  datasets?: Record<SortKey, TrendPoint[]>;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("Years");
  const [menuOpen, setMenuOpen] = useState(false);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const pathARef = useRef<SVGPathElement | null>(null);
  const pathBRef = useRef<SVGPathElement | null>(null);

  const data = datasets[sortKey];

  const { pointsA, pointsB } = useMemo(() => {
    const max = Math.max(...data.flatMap((d) => [d.faculty, d.students])) * 1.15;
    const step = (WIDTH - PAD_X * 2) / (data.length - 1);
    const scaleY = (v: number) => HEIGHT - PAD_Y - (v / max) * (HEIGHT - PAD_Y * 2);
    const pointsA = data.map((d, i) => ({ x: PAD_X + i * step, y: scaleY(d.faculty) }));
    const pointsB = data.map((d, i) => ({ x: PAD_X + i * step, y: scaleY(d.students) }));
    return { pointsA, pointsB };
  }, [data]);

  useDrawIn(pathARef, sortKey);
  useDrawIn(pathBRef, sortKey);

  const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return;
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const step = (WIDTH - PAD_X * 2) / (data.length - 1);
    let idx = Math.round((relX - PAD_X) / step);
    idx = Math.max(0, Math.min(data.length - 1, idx));
    setHoverIdx(idx);
  };

  const downloadSvg = () => {
    const el = svgRef.current;
    if (!el) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(el);
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "-").toLowerCase()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const hovered = hoverIdx !== null ? data[hoverIdx] : null;
  const hoverPoint = hoverIdx !== null ? pointsA[hoverIdx] : null;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="flex items-center gap-1 text-sm font-semibold text-foreground"
          >
            {title}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          {menuOpen && (
            <div className="absolute z-10 mt-1 bg-white border rounded-lg shadow-lg py-1 min-w-[120px]">
              {(["Years", "Quarters"] as SortKey[]).map((k) => (
                <button
                  key={k}
                  className={`block w-full text-left px-3 py-1.5 text-sm hover:bg-muted ${sortKey === k ? "font-semibold" : ""}`}
                  onClick={() => { setSortKey(k); setMenuOpen(false); }}
                >
                  {k}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-primary" /> {seriesALabel}
            </span>
            <span className="inline-flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-orange-400" /> {seriesBLabel}
            </span>
          </div>
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={downloadSvg}>
            ↓ SVG
          </Button>
        </div>
      </div>

      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full h-auto"
          onMouseMove={handleMove}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id="lineGradA" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--primary) / 0.6)" />
            </linearGradient>
            <linearGradient id="lineGradB" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#fb923c80" />
            </linearGradient>
          </defs>
          {data.map((d, i) => (
            <text
              key={d.label}
              x={PAD_X + i * ((WIDTH - PAD_X * 2) / (data.length - 1))}
              y={HEIGHT - 4}
              textAnchor="middle"
              fontSize={10}
              fill="#94a3b8"
            >
              {d.label}
            </text>
          ))}
          <path ref={pathARef} d={smoothPath(pointsA)} fill="none" stroke="url(#lineGradA)" strokeWidth={2.5} strokeLinecap="round" />
          <path ref={pathBRef} d={smoothPath(pointsB)} fill="none" stroke="url(#lineGradB)" strokeWidth={2.5} strokeLinecap="round" />
          {hovered && hoverPoint && (
            <>
              <line x1={hoverPoint.x} y1={PAD_Y} x2={hoverPoint.x} y2={HEIGHT - PAD_Y} stroke="#cbd5e1" strokeDasharray="4 3" />
              <circle cx={hoverPoint.x} cy={hoverPoint.y} r={5} fill="hsl(var(--primary))" stroke="white" strokeWidth={2} />
            </>
          )}
        </svg>
        {hovered && hoverPoint && (
          <div
            className="absolute z-10 bg-white border rounded-lg shadow-lg px-3 py-2 text-xs pointer-events-none"
            style={{ left: `calc(${(hoverPoint.x / WIDTH) * 100}% + 8px)`, top: `${(hoverPoint.y / HEIGHT) * 100}%` }}
          >
            <p className="font-semibold mb-1">{hovered.label}</p>
            <p>{seriesALabel}: <span className="font-medium text-foreground">{hovered.faculty}</span></p>
            <p>{seriesBLabel}: <span className="font-medium text-foreground">{hovered.students}</span></p>
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================================================
   AnimatedGauge
   ============================================================ */

const STROKE = 14;
const RADIUS = 70;
const CIRC = Math.PI * RADIUS;

export function AnimatedGauge({ title, value }: { title: string; value: number }) {
  const gaugeRef = useRef<SVGCircleElement>(null);
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    const el = gaugeRef.current;
    if (!el) return;
    const offset = CIRC - (value / 100) * CIRC;
    el.style.transition = "none";
    el.style.strokeDashoffset = `${CIRC}`;
    el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1.4s cubic-bezier(.4,0,.2,1)";
    el.style.strokeDashoffset = `${offset}`;
  }, [value]);

  useEffect(() => {
    let raf: number;
    const start = performance.now();
    const from = display;
    const to = value;
    const dur = 1400;
    const tick = (now: number) => {
      const t = Math.min((now - start) / dur, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(from + (to - from) * ease));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const cx = RADIUS + STROKE + 4;
  const cy = RADIUS + STROKE + 4;

  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm flex flex-col items-center">
      <p className="text-sm font-semibold text-foreground mb-3">{title}</p>
      <div className="relative" style={{ width: cx * 2, height: cy + 20 }}>
        <svg viewBox={`0 0 ${cx * 2} ${cy + 20}`} className="w-full h-auto">
          <defs>
            <linearGradient id="gaugeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          <path
            d={`M ${cx - RADIUS} ${cy} A ${RADIUS} ${RADIUS} 0 0 1 ${cx + RADIUS} ${cy}`}
            fill="none"
            stroke="#f1f2f4"
            strokeWidth={STROKE}
            strokeLinecap="round"
          />
          <path
            ref={gaugeRef}
            d={`M ${cx - RADIUS} ${cy} A ${RADIUS} ${RADIUS} 0 0 1 ${cx + RADIUS} ${cy}`}
            fill="none"
            stroke="url(#gaugeGradient)"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={CIRC}
          />
          <text x={cx - RADIUS} y={cy + 22} fontSize={11} fill="#94a3b8">0%</text>
          <text x={cx + RADIUS} y={cy + 22} textAnchor="end" fontSize={11} fill="#94a3b8">100%</text>
        </svg>
        <div
          className="absolute left-1/2 flex flex-col items-center"
          style={{ top: cy - 34, transform: "translateX(-50%)" }}
        >
          <div className="text-2xl font-bold text-orange-500 tabular-nums">{display}%</div>
        </div>
      </div>
    </div>
  );
}
