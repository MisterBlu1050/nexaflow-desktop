// ─────────────────────────────────────────────────────────────────────────────
// ChartCard.tsx — Deterministic data visualizations for NexaAI responses.
//
// Charts are populated from ground-truth constants (REAL_HEADCOUNTS, etc.),
// NOT from LLM output. This guarantees correctness regardless of model quality.
//
// Supported types:
//   bar    → BarChart with optional benchmark reference line
//   donut  → PieChart with inner hole (headcount distributions)
//   cases  → custom severity track (active HR cases, risk level 1-5)
// ─────────────────────────────────────────────────────────────────────────────

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import type { ChartSpec } from '@/hooks/use-command-router';

// ── Shared tooltip style ─────────────────────────────────────────────────────
const tooltipStyle: React.CSSProperties = {
  background: '#fff',
  border: '1px solid #e5e7eb',
  borderRadius: 8,
  fontSize: 12,
  padding: '6px 10px',
  boxShadow: '0 2px 8px rgba(0,0,0,.08)',
};

// ── Formatters ───────────────────────────────────────────────────────────────
function fmtValue(v: number, unit?: string): string {
  if (unit === '€') return '€' + v.toLocaleString('fr-BE');
  return `${v.toLocaleString('fr-BE')}${unit ? ' ' + unit : ''}`;
}

// ── Y-axis domain helper ─────────────────────────────────────────────────────
// Avoids the "1000 scale for 5 employees" problem by adapting the ceiling
// to the magnitude of the data rather than always rounding to thousands.
function smartYMax(maxVal: number, unit?: string): number {
  if (maxVal <= 0) return unit === '€' ? 10_000 : 10;
  if (unit === '€') {
    // Salary values: round up to the nearest 10 k with 20 % headroom
    return Math.ceil((maxVal * 1.2) / 10_000) * 10_000;
  }
  // Employee counts / percentages — no thousands rounding
  if (maxVal <= 5)   return Math.ceil(maxVal * 1.6);
  if (maxVal <= 20)  return Math.ceil(maxVal * 1.35);
  if (maxVal <= 100) return Math.ceil((maxVal * 1.2) / 5) * 5;
  return Math.ceil((maxVal * 1.15) / 10) * 10;
}

// ── Bar chart ────────────────────────────────────────────────────────────────
function BarChartCard({ spec }: { spec: ChartSpec }) {
  // Flatten label newlines for recharts XAxis tick
  const data = spec.data.map(d => ({ ...d, label: d.label.replace(/\n/g, ' ') }));
  // Optional benchmark reference line — only if explicitly set on a data point
  const benchmarkValue = spec.data.find(d => d.benchmark != null)?.benchmark;
  const maxVal = Math.max(...spec.data.map(d => d.value), benchmarkValue ?? 0);
  const yMax   = smartYMax(maxVal, spec.unit);

  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#6b7280' }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={v =>
            spec.unit === '€'
              ? '€' + (v / 1000).toFixed(0) + 'k'
              : String(v)
          }
          tick={{ fontSize: 10, fill: '#9ca3af' }}
          axisLine={false}
          tickLine={false}
          domain={[0, yMax]}
          width={44}
        />
        <Tooltip
          formatter={(v: number) => [fmtValue(v, spec.unit), spec.title]}
          contentStyle={tooltipStyle}
          cursor={{ fill: '#f9fafb' }}
        />
        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
          {data.map((entry, i) => (
            <Cell key={i} fill={entry.color ?? '#6366f1'} />
          ))}
        </Bar>
        {/* Benchmark reference line — kept for single-bar use cases;
            not used by comp-analysis (which already shows a Market bar) */}
        {benchmarkValue != null && (
          <ReferenceLine
            y={benchmarkValue}
            stroke="#6366f1"
            strokeDasharray="5 3"
            strokeWidth={1.5}
            label={{
              value: 'Benchmark',
              position: 'insideTopRight',
              fontSize: 10,
              fill: '#6366f1',
              offset: 6,
            }}
          />
        )}
      </BarChart>
    </ResponsiveContainer>
  );
}

// ── Donut chart ──────────────────────────────────────────────────────────────
const RADIAN = Math.PI / 180;
function DonutLabel({ cx, cy, midAngle, innerRadius, outerRadius, value, name }: any) {
  // Only show label if slice is large enough
  if (value < 4) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight={600}>
      {value}
    </text>
  );
}

function DonutChartCard({ spec }: { spec: ChartSpec }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={spec.data}
          dataKey="value"
          nameKey="label"
          cx="50%"
          cy="45%"
          innerRadius={52}
          outerRadius={82}
          paddingAngle={2}
          labelLine={false}
          label={DonutLabel}
        >
          {spec.data.map((entry, i) => (
            <Cell key={i} fill={entry.color ?? '#6366f1'} />
          ))}
        </Pie>
        <Tooltip
          formatter={(v: number) => [fmtValue(v, spec.unit), '']}
          contentStyle={tooltipStyle}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, paddingTop: 4 }}
          formatter={(value) => <span style={{ color: '#4b5563' }}>{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

// ── Cases severity track ─────────────────────────────────────────────────────
const RISK_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Low–Med',
  3: 'Medium',
  4: 'High',
  5: 'Critical',
};

function CasesCard({ spec }: { spec: ChartSpec }) {
  return (
    <div className="space-y-2 py-1">
      {spec.data.map((d, i) => {
        const pct = (d.value / 5) * 100;
        const riskLabel = RISK_LABELS[d.value] ?? String(d.value);
        return (
          <div key={i} className="space-y-0.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-600 font-medium">{d.label}</span>
              <span className="font-semibold" style={{ color: d.color ?? '#6b7280' }}>
                {riskLabel} ({d.value}/5)
              </span>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: d.color ?? '#6366f1' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Public component ─────────────────────────────────────────────────────────
export default function ChartCard({ spec }: { spec: ChartSpec }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="mb-3">
        <p className="text-[12px] font-semibold text-slate-700 leading-tight">{spec.title}</p>
        {spec.subtitle && (
          <p className="text-[10px] text-slate-400 mt-0.5">{spec.subtitle}</p>
        )}
      </div>

      {/* Chart body */}
      {spec.type === 'bar'    && <BarChartCard  spec={spec} />}
      {spec.type === 'donut'  && <DonutChartCard spec={spec} />}
      {spec.type === 'cases'  && <CasesCard      spec={spec} />}
    </div>
  );
}
