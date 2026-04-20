// ─────────────────────────────────────────────────────────────────────────────
// pdfExporter.tsx — NexaFlow SA · Export PDF branded DRH
//
// Charte graphique complète : Midnight Circuit / Electric Teal / Pure Signal
// Fonctionnalités :
//   • Page de couverture sombre avec logo NF
//   • Header / Footer sur chaque page (logo + titre + numéro de page)
//   • Parser Markdown → composants react-pdf (H1-H3, body, bold, italic,
//     listes, blockquote, HR, tables)
//   • Graphiques SVG natifs : bar, donut, cases severity (ChartSpec)
// ─────────────────────────────────────────────────────────────────────────────

import {
  pdf,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Svg,
  Rect,
  Circle,
  Path,
  Line,
  G,
  Text as SvgText,
} from '@react-pdf/renderer';
import type { ChartSpec } from '@/hooks/use-command-router';

// ── Disable automatic hyphenation globally (react-pdf v4 Font API) ────────────
// Prevents layout engine from splitting words: "engi-neering", "harass-ment" etc.
// Font.registerHyphenationCallback is the reliable API in v4 (the hyphenationCallback
// prop on <Document> is a v3 compatibility shim that may not fire in all contexts).
Font.registerHyphenationCallback((word) => [word]);

// ── Charte chromatique ────────────────────────────────────────────────────────
const C = {
  midnight:   '#0B1020',
  graphite:   '#1E293B',
  teal:       '#16D5C0',
  silver:     '#D9E1EA',
  pure:       '#F7FAFC',
  blue:       '#3B82F6',
  violet:     '#7C3AED',
  success:    '#12B981',
  warning:    '#F59E0B',
  critical:   '#EF4444',
  textDark:   '#1E293B',
  textMuted:  '#64748B',
  rowAlt:     '#EFF3F8',
};

// ── Styles globaux ────────────────────────────────────────────────────────────
const S = StyleSheet.create({
  // Pages
  coverPage: {
    backgroundColor: C.midnight,
    width: '100%',
    height: '100%',
    padding: 0,
  },
  contentPage: {
    backgroundColor: C.pure,
    paddingTop: 72,
    paddingBottom: 52,
    paddingHorizontal: 40,
    fontFamily: 'Helvetica',
  },

  // Cover elements
  coverAccentBar: {
    position: 'absolute',
    left: 32,
    top: '18%',
    width: 3,
    height: '64%',
    backgroundColor: C.teal,
  },
  coverLogo: {
    position: 'absolute',
    left: 44,
    top: '24%',
  },
  coverBrand: {
    fontSize: 28,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  coverTagline: {
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: C.teal,
  },
  coverTitle: {
    position: 'absolute',
    left: 44,
    top: '48%',
    right: 44,
  },
  coverTitleText: {
    fontSize: 22,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  coverSubtitleText: {
    fontSize: 12,
    fontFamily: 'Helvetica',
    color: C.silver,
    marginBottom: 10,
  },
  coverDivider: {
    width: 80,
    height: 1.5,
    backgroundColor: C.teal,
    marginBottom: 12,
  },
  coverMeta: {
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: C.textMuted,
    marginBottom: 3,
  },
  coverConfidential: {
    position: 'absolute',
    left: 44,
    bottom: '8%',
    backgroundColor: C.graphite,
    borderRadius: 3,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  coverConfidentialText: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.warning,
    letterSpacing: 1,
  },
  coverFooter: {
    position: 'absolute',
    left: 44,
    bottom: '4%',
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: C.textMuted,
  },

  // Header (fixed)
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 46,
    backgroundColor: C.midnight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  headerTealLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: C.teal,
  },
  headerLogoText: {
    fontSize: 9,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  headerSep: {
    width: 1,
    height: 14,
    backgroundColor: C.teal,
    marginHorizontal: 12,
  },
  headerTitle: {
    fontSize: 8,
    fontFamily: 'Helvetica-Bold',
    color: C.silver,
    flex: 1,
  },
  headerConfidential: {
    fontSize: 6.5,
    fontFamily: 'Helvetica-Bold',
    color: C.warning,
  },

  // Footer (fixed)
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    borderTopWidth: 0.8,
    borderTopColor: C.silver,
  },
  footerText: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: C.textMuted,
    flex: 1,
  },
  footerPage: {
    fontSize: 7,
    fontFamily: 'Helvetica',
    color: C.textMuted,
  },

  // Typography
  h1: {
    fontSize: 17,
    fontFamily: 'Helvetica-Bold',
    color: C.midnight,
    marginBottom: 6,
    marginTop: 14,
  },
  h2: {
    fontSize: 13,
    fontFamily: 'Helvetica-Bold',
    color: C.midnight,
    marginBottom: 4,
    marginTop: 12,
    paddingBottom: 3,
    borderBottomWidth: 1,
    borderBottomColor: C.silver,
  },
  h3: {
    fontSize: 11,
    fontFamily: 'Helvetica-Bold',
    color: C.graphite,
    marginBottom: 3,
    marginTop: 9,
  },
  body: {
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: C.textDark,
    lineHeight: 1.55,
    marginBottom: 5,
  },
  label: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: C.teal,
    letterSpacing: 0.8,
    marginBottom: 2,
    marginTop: 4,
  },
  muted: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: C.textMuted,
    lineHeight: 1.4,
    marginBottom: 3,
  },
  blockquote: {
    fontSize: 9.5,
    fontFamily: 'Helvetica-Oblique',
    color: '#4B5563',
    lineHeight: 1.55,
    marginBottom: 5,
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: C.teal,
  },
  hr: {
    borderBottomWidth: 0.8,
    borderBottomColor: C.silver,
    marginVertical: 8,
  },
  inlineCode: {
    fontFamily: 'Courier',
    fontSize: 8.5,
    backgroundColor: '#F1F5F9',
    color: C.graphite,
    borderRadius: 2,
    paddingHorizontal: 3,
  },

  // Lists
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3,
    paddingLeft: 4,
  },
  listBullet: {
    fontSize: 9,
    color: C.teal,
    fontFamily: 'Helvetica-Bold',
    marginRight: 6,
    marginTop: 1,
  },
  listText: {
    fontSize: 9.5,
    fontFamily: 'Helvetica',
    color: C.textDark,
    lineHeight: 1.5,
    flex: 1,
  },
  orderedNum: {
    fontSize: 9.5,
    color: C.teal,
    fontFamily: 'Helvetica-Bold',
    marginRight: 6,
    marginTop: 0,
    minWidth: 14,
  },

  // Tables
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: C.midnight,
    borderBottomWidth: 1.5,
    borderBottomColor: C.teal,
  },
  tableHeaderCell: {
    fontSize: 7.5,
    fontFamily: 'Helvetica-Bold',
    color: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 5,
    flex: 1,
    textAlign: 'center' as const,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.4,
    borderBottomColor: C.silver,
  },
  tableRowAlt: {
    backgroundColor: C.rowAlt,
  },
  tableCell: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: C.textDark,
    paddingHorizontal: 6,
    paddingVertical: 4,
    flex: 1,
  },

  // Alert boxes
  alertInfo: {
    backgroundColor: '#EFF6FF',
    borderLeftWidth: 3,
    borderLeftColor: C.blue,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginVertical: 5,
    borderRadius: 3,
  },
  alertSuccess: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 3,
    borderLeftColor: C.success,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginVertical: 5,
    borderRadius: 3,
  },
  alertWarning: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 3,
    borderLeftColor: C.warning,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginVertical: 5,
    borderRadius: 3,
  },
  alertCritical: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 3,
    borderLeftColor: C.critical,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginVertical: 5,
    borderRadius: 3,
  },
  alertText: {
    fontSize: 8.5,
    fontFamily: 'Helvetica',
    color: C.textDark,
    lineHeight: 1.45,
  },

  // KPI row
  kpiRow: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center' as const,
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderTopWidth: 2,
    borderTopColor: C.teal,
    borderWidth: 0.5,
    borderColor: C.silver,
    backgroundColor: C.pure,
    marginHorizontal: 2,
  },
  kpiValue: {
    fontSize: 20,
    fontFamily: 'Helvetica-Bold',
    color: C.teal,
    textAlign: 'center' as const,
  },
  kpiLabel: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: C.textMuted,
    textAlign: 'center' as const,
    marginTop: 2,
  },

  // Chart container
  chartContainer: {
    marginVertical: 8,
    borderWidth: 0.8,
    borderColor: C.silver,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    padding: 12,
  },
  chartTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    color: C.graphite,
    marginBottom: 2,
  },
  chartSubtitle: {
    fontSize: 8,
    fontFamily: 'Helvetica',
    color: C.textMuted,
    marginBottom: 6,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Helpers SVG — Graphiques natifs react-pdf
// ─────────────────────────────────────────────────────────────────────────────

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArcPath(
  cx: number, cy: number,
  outerR: number, innerR: number,
  startDeg: number, endDeg: number,
): string {
  // Clamp to avoid degenerate full-circle arc
  const sweep = Math.min(endDeg - startDeg, 359.99);
  const end = startDeg + sweep;
  const o1 = polarToXY(cx, cy, outerR, startDeg);
  const o2 = polarToXY(cx, cy, outerR, end);
  const i1 = polarToXY(cx, cy, innerR, end);
  const i2 = polarToXY(cx, cy, innerR, startDeg);
  const large = sweep > 180 ? 1 : 0;
  return [
    `M ${o1.x.toFixed(2)} ${o1.y.toFixed(2)}`,
    `A ${outerR} ${outerR} 0 ${large} 1 ${o2.x.toFixed(2)} ${o2.y.toFixed(2)}`,
    `L ${i1.x.toFixed(2)} ${i1.y.toFixed(2)}`,
    `A ${innerR} ${innerR} 0 ${large} 0 ${i2.x.toFixed(2)} ${i2.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

// ── Constantes de mise en page ─────────────────────────────────────────────────
// A4 = 595pt · marges 40pt/côté · padding chartContainer 12pt/côté
// Zone disponible pour le SVG à l'intérieur d'un chartContainer pleine largeur :
const PAGE_CONTENT_W = 515;        // 595 − 40×2
const CHART_H_PAD    = 12;         // padding horizontal du chartContainer
const CHART_SVG_W    = PAGE_CONTENT_W - CHART_H_PAD * 2;  // ≈ 491pt

// ── Bar Chart SVG ─────────────────────────────────────────────────────────────
// Coordinate space interne 460×180 → mis à l'échelle via viewBox
function BarChartSvg({ spec, svgWidth = CHART_SVG_W }: { spec: ChartSpec; svgWidth?: number }) {
  const VB_W = 460, VB_H = 180;
  const renderH = Math.round(svgWidth * VB_H / VB_W);
  const marginLeft = 44, marginRight = 12, marginTop = 10, marginBottom = 32;
  const chartW = VB_W - marginLeft - marginRight;
  const chartH = VB_H - marginTop - marginBottom;

  const values = spec.data.map(d => d.value);
  const benchmark = spec.data.find(d => d.benchmark != null)?.benchmark ?? 0;
  const rawMax = Math.max(...values, benchmark);
  const yMax = rawMax <= 0 ? 10 : Math.ceil(rawMax * 1.2);

  const barCount = spec.data.length;
  const barW = Math.min(Math.floor(chartW / barCount * 0.55), 52);
  const gap = chartW / barCount;
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * yMax));

  return (
    <Svg width={svgWidth} height={renderH} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {/* Grid lines */}
      {yTicks.map((v, i) => {
        const y = marginTop + chartH - (v / yMax) * chartH;
        return (
          <G key={i}>
            <Line x1={marginLeft} y1={y} x2={marginLeft + chartW} y2={y} stroke="#F0F0F0" strokeWidth={0.8} />
            <SvgText x={marginLeft - 4} y={y + 3} fontSize={8} fill={C.textMuted} textAnchor="end">
              {spec.unit === '€'
                ? (v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${v}`)
                : String(v)}
            </SvgText>
          </G>
        );
      })}

      {/* Bars */}
      {spec.data.map((d, i) => {
        const barH = Math.max((d.value / yMax) * chartH, 1);
        const x = marginLeft + gap * i + (gap - barW) / 2;
        const y = marginTop + chartH - barH;
        const color = d.color ?? C.blue;
        const label = d.label.replace(/\n/g, ' ');
        return (
          <G key={i}>
            <Rect x={x} y={y} width={barW} height={barH} fill={color} rx={3} ry={3} />
            <SvgText x={x + barW / 2} y={y - 3} fontSize={8} fill={C.graphite} textAnchor="middle" fontWeight="bold">
              {spec.unit === '€' ? `€${(d.value / 1000).toFixed(0)}k` : String(d.value)}
            </SvgText>
            <SvgText x={x + barW / 2} y={VB_H - marginBottom + 12} fontSize={8} fill={C.textMuted} textAnchor="middle">
              {label.length > 10 ? label.slice(0, 9) + '…' : label}
            </SvgText>
          </G>
        );
      })}

      {/* Benchmark line */}
      {benchmark > 0 && (
        <G>
          <Line
            x1={marginLeft} y1={marginTop + chartH - (benchmark / yMax) * chartH}
            x2={marginLeft + chartW} y2={marginTop + chartH - (benchmark / yMax) * chartH}
            stroke={C.violet} strokeWidth={1.5} strokeDasharray="4 3"
          />
          <SvgText
            x={marginLeft + chartW - 2} y={marginTop + chartH - (benchmark / yMax) * chartH - 4}
            fontSize={7.5} fill={C.violet} textAnchor="end"
          >Benchmark</SvgText>
        </G>
      )}

      {/* Axes */}
      <Line x1={marginLeft} y1={marginTop} x2={marginLeft} y2={marginTop + chartH} stroke={C.silver} strokeWidth={0.8} />
      <Line x1={marginLeft} y1={marginTop + chartH} x2={marginLeft + chartW} y2={marginTop + chartH} stroke={C.silver} strokeWidth={0.8} />
    </Svg>
  );
}

// ── Donut Chart SVG ───────────────────────────────────────────────────────────
// Coordinate space interne 460×220 → mis à l'échelle via viewBox
function DonutChartSvg({ spec, svgWidth = CHART_SVG_W }: { spec: ChartSpec; svgWidth?: number }) {
  const VB_W = 460, VB_H = 220;
  const renderH = Math.round(svgWidth * VB_H / VB_W);
  const cx = 110, cy = 110, outerR = 85, innerR = 50;

  const total = spec.data.reduce((s, d) => s + d.value, 0) || 1;
  let startDeg = 0;
  const slices = spec.data.map((d) => {
    const sweep = (d.value / total) * 360;
    const slice = { d, startDeg, endDeg: startDeg + sweep };
    startDeg += sweep + 1;
    return slice;
  });

  // Legend positioned to the right of the donut
  const legendX = 215, legendY = 25, legendRowH = 20;

  return (
    <Svg width={svgWidth} height={renderH} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {slices.map((s, i) => (
        <Path key={i} d={donutArcPath(cx, cy, outerR, innerR, s.startDeg, s.endDeg)} fill={s.d.color ?? C.blue} />
      ))}
      <Circle cx={cx} cy={cy} r={innerR - 1} fill={C.pure} />
      <SvgText x={cx} y={cy - 7} fontSize={13} fontWeight="bold" fill={C.midnight} textAnchor="middle">{total}</SvgText>
      <SvgText x={cx} y={cy + 9} fontSize={9} fill={C.textMuted} textAnchor="middle">{spec.unit ?? 'total'}</SvgText>

      {spec.data.slice(0, 9).map((d, i) => (
        <G key={i}>
          <Rect x={legendX} y={legendY + i * legendRowH} width={9} height={9} rx={4} ry={4} fill={d.color ?? C.blue} />
          <SvgText x={legendX + 14} y={legendY + i * legendRowH + 8} fontSize={9} fill={C.textDark}>
            {d.label} ({d.value})
          </SvgText>
        </G>
      ))}
    </Svg>
  );
}

// ── Cases Severity Track SVG ──────────────────────────────────────────────────
// Coordinate space interne 460×(n×32+10) → mis à l'échelle via viewBox
function CasesSvg({ spec, svgWidth = CHART_SVG_W }: { spec: ChartSpec; svgWidth?: number }) {
  const rowH = 32;
  const VB_W = 460;
  const VB_H = spec.data.length * rowH + 16;
  const renderH = Math.round(svgWidth * VB_H / VB_W);

  // Layout dans l'espace interne 460pt
  const labelMaxW = 155;
  const trackX   = labelMaxW + 10;
  const trackW   = 220;
  const tagX     = trackX + trackW + 8;
  const barH     = 8;

  const RISK: Record<number, string> = { 1: 'Low', 2: 'Low–Med', 3: 'Medium', 4: 'High', 5: 'Critical' };

  return (
    <Svg width={svgWidth} height={renderH} viewBox={`0 0 ${VB_W} ${VB_H}`}>
      {spec.data.map((d, i) => {
        const y    = i * rowH + 12;
        const filled = trackW * (d.value / 5);
        const color  = d.color ?? C.textMuted;
        const risk   = RISK[d.value] ?? String(d.value);
        return (
          <G key={i}>
            <SvgText x={0} y={y + 7} fontSize={9} fill={C.textDark} fontWeight="bold">
              {d.label.length > 22 ? d.label.slice(0, 21) + '…' : d.label}
            </SvgText>
            <Rect x={trackX} y={y} width={trackW} height={barH} fill="#F1F5F9" rx={4} ry={4} />
            <Rect x={trackX} y={y} width={filled} height={barH} fill={color} rx={4} ry={4} />
            <SvgText x={tagX} y={y + 8} fontSize={8.5} fill={color} fontWeight="bold">
              {risk} ({d.value}/5)
            </SvgText>
          </G>
        );
      })}
    </Svg>
  );
}

// ── Conteneur de graphique ────────────────────────────────────────────────────
function ChartSvgRenderer({ spec, svgWidth = CHART_SVG_W }: { spec: ChartSpec; svgWidth?: number }) {
  return (
    <View style={S.chartContainer}>
      <Text style={S.chartTitle}>{spec.title}</Text>
      {spec.subtitle && <Text style={S.chartSubtitle}>{spec.subtitle}</Text>}
      {spec.type === 'bar'   && <BarChartSvg   spec={spec} svgWidth={svgWidth} />}
      {spec.type === 'donut' && <DonutChartSvg spec={spec} svgWidth={svgWidth} />}
      {spec.type === 'cases' && <CasesSvg      spec={spec} svgWidth={svgWidth} />}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Markdown → react-pdf renderer
// ─────────────────────────────────────────────────────────────────────────────

/** Parse inline markdown (bold, italic, inline-code) into Text spans */
function renderInline(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  // Strip stray lone asterisks that aren't part of bold/italic pairs
  // then tokenise: **bold**, *italic*, `code`, plain
  const re = /(\*\*(.+?)\*\*|\*([^*\n]+?)\*|`(.+?)`|([^*`]+|\*))/g;
  let match;
  let key = 0;
  while ((match = re.exec(text)) !== null) {
    if (match[2] !== undefined) {
      // **bold**
      parts.push(<Text key={key++} style={{ fontFamily: 'Helvetica-Bold', color: C.graphite }}>{match[2]}</Text>);
    } else if (match[3] !== undefined) {
      // *italic*
      parts.push(<Text key={key++} style={{ fontFamily: 'Helvetica-Oblique' }}>{match[3]}</Text>);
    } else if (match[4] !== undefined) {
      // `code`
      parts.push(<Text key={key++} style={S.inlineCode}>{match[4]}</Text>);
    } else if (match[5] !== undefined) {
      // plain text — drop lone asterisks silently
      const plain = match[5] === '*' ? '' : match[5];
      if (plain) parts.push(<Text key={key++}>{plain}</Text>);
    }
  }
  return parts.length > 0 ? parts : <Text>{text}</Text>;
}

/** Detect simple KPI line like "87 Effectif" or "€6,49M Masse salariale" */
function isKpiLine(line: string): boolean {
  return /^[€$]?[\d,.]+[KkMm%]?\s+\w/.test(line.trim());
}

/** Parse a markdown pipe-table into header + rows */
function parseTable(lines: string[]): { headers: string[]; rows: string[][] } | null {
  if (lines.length < 2) return null;
  const splitRow = (l: string) =>
    l.split('|').map(c => c.trim()).filter((_, i, a) => i > 0 && i < a.length - 1);
  const headers = splitRow(lines[0]);
  if (!headers.length) return null;
  // Skip separator line (---)
  const dataRows = lines.slice(2).map(splitRow).filter(r => r.length > 0);
  return { headers, rows: dataRows };
}

/** Render a parsed table as react-pdf */
function renderTable(headers: string[], rows: string[][]): React.ReactNode {
  return (
    <View style={{ marginVertical: 6, borderWidth: 0.4, borderColor: C.silver, borderRadius: 4, overflow: 'hidden' }}>
      {/* Header row */}
      <View style={S.tableHeader}>
        {headers.map((h, i) => (
          <Text key={i} style={S.tableHeaderCell}>{h}</Text>
        ))}
      </View>
      {/* Data rows */}
      {rows.map((row, ri) => (
        <View key={ri} style={[S.tableRow, ri % 2 === 1 ? S.tableRowAlt : {}]}>
          {row.map((cell, ci) => (
            <Text key={ci} style={S.tableCell}>{renderInline(cell)}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Render full markdown content to an array of react-pdf elements */
function renderMarkdown(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Blank line
    if (!trimmed) {
      i++;
      continue;
    }

    // H1
    if (trimmed.startsWith('# ')) {
      elements.push(
        <Text key={key++} style={S.h1}>{trimmed.slice(2).replace(/\*\*/g, '')}</Text>
      );
      i++;
      continue;
    }

    // H2
    if (trimmed.startsWith('## ')) {
      elements.push(
        <Text key={key++} style={S.h2}>{trimmed.slice(3).replace(/\*\*/g, '')}</Text>
      );
      i++;
      continue;
    }

    // H3
    if (trimmed.startsWith('### ')) {
      elements.push(
        <Text key={key++} style={S.h3}>{trimmed.slice(4).replace(/\*\*/g, '')}</Text>
      );
      i++;
      continue;
    }

    // HR
    if (/^---+$/.test(trimmed) || /^===+$/.test(trimmed)) {
      elements.push(<View key={key++} style={S.hr} />);
      i++;
      continue;
    }

    // Blockquote
    if (trimmed.startsWith('> ')) {
      elements.push(
        <Text key={key++} style={S.blockquote}>{trimmed.slice(2)}</Text>
      );
      i++;
      continue;
    }

    // Unordered list block
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      const items: string[] = [];
      while (i < lines.length && (lines[i].trim().startsWith('- ') || lines[i].trim().startsWith('* '))) {
        items.push(lines[i].trim().slice(2));
        i++;
      }
      items.forEach((item, idx) => {
        elements.push(
          <View key={key++} style={S.listItem}>
            <Text style={S.listBullet}>•</Text>
            <Text style={S.listText}>{renderInline(item)}</Text>
          </View>
        );
      });
      continue;
    }

    // Ordered list block
    if (/^\d+\.\s/.test(trimmed)) {
      const items: string[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s/, ''));
        i++;
      }
      items.forEach((item, idx) => {
        elements.push(
          <View key={key++} style={S.listItem}>
            <Text style={S.orderedNum}>{idx + 1}.</Text>
            <Text style={S.listText}>{renderInline(item)}</Text>
          </View>
        );
      });
      continue;
    }

    // Table (pipe-based)
    if (trimmed.startsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      const parsed = parseTable(tableLines);
      if (parsed) {
        elements.push(
          <View key={key++}>{renderTable(parsed.headers, parsed.rows)}</View>
        );
      }
      continue;
    }

    // ⚠️ Alert / info callout lines (keep before body)
    if (trimmed.startsWith('⚠️') || trimmed.startsWith('⚠')) {
      elements.push(
        <View key={key++} style={S.alertWarning}>
          <Text style={S.alertText}>{trimmed}</Text>
        </View>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('✅') || trimmed.startsWith('✓')) {
      elements.push(
        <View key={key++} style={S.alertSuccess}>
          <Text style={S.alertText}>{trimmed}</Text>
        </View>
      );
      i++;
      continue;
    }
    if (trimmed.startsWith('🔴') || trimmed.startsWith('❌') || trimmed.toLowerCase().includes('critique')) {
      // Only treat standalone short lines as alerts
      if (trimmed.length < 120) {
        elements.push(
          <View key={key++} style={S.alertCritical}>
            <Text style={S.alertText}>{trimmed}</Text>
          </View>
        );
        i++;
        continue;
      }
    }

    // Regular paragraph — collect consecutive non-special lines
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith('#') &&
      !lines[i].trim().startsWith('- ') &&
      !lines[i].trim().startsWith('* ') &&
      !/^\d+\.\s/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('> ') &&
      !/^---+$/.test(lines[i].trim()) &&
      !lines[i].trim().startsWith('|')
    ) {
      paraLines.push(lines[i]);
      i++;
    }
    if (paraLines.length > 0) {
      const combined = paraLines.join(' ').trim();
      elements.push(
        <Text key={key++} style={S.body}>{renderInline(combined)}</Text>
      );
    }
  }

  return elements;
}

// ─────────────────────────────────────────────────────────────────────────────
// Composants de page
// ─────────────────────────────────────────────────────────────────────────────

function CoverPage({ title, subtitle, author }: { title: string; subtitle: string; author: string }) {
  const today = new Date().toLocaleDateString('fr-BE', { day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <Page size="A4" style={S.coverPage}>
      {/* Accent bar left */}
      <View style={S.coverAccentBar} />

      {/* Logo + brand */}
      <View style={S.coverLogo}>
        {/* NF monogram as pure text approximation */}
        <Text style={S.coverBrand}>NexaFlow</Text>
        <Text style={S.coverTagline}>Flow with confidence.</Text>
      </View>

      {/* Title block */}
      <View style={S.coverTitle}>
        <Text style={S.coverTitleText}>{title}</Text>
        {subtitle && <Text style={S.coverSubtitleText}>{subtitle}</Text>}
        <View style={S.coverDivider} />
        <Text style={S.coverMeta}>{author}</Text>
        <Text style={S.coverMeta}>{today}</Text>
      </View>

      {/* Confidential badge */}
      <View style={S.coverConfidential}>
        <Text style={S.coverConfidentialText}>DOCUMENT CONFIDENTIEL</Text>
      </View>

      {/* Footer address */}
      <Text style={S.coverFooter}>NexaFlow SA · Avenue Louise 54 · 1050 Bruxelles · www.nexaflow.io</Text>
    </Page>
  );
}

function ContentPage({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const today = new Date().toLocaleDateString('fr-BE', { day: '2-digit', month: 'long', year: 'numeric' });
  return (
    <Page size="A4" style={S.contentPage}>
      {/* Header */}
      <View style={S.header} fixed>
        {/* NF logo text */}
        <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: C.teal }}>NF</Text>
        <Text style={S.headerLogoText}>NexaFlow</Text>
        <View style={S.headerSep} />
        <Text style={S.headerTitle}>{title}{subtitle ? ` · ${subtitle}` : ''}</Text>
        <Text style={S.headerConfidential}>CONFIDENTIEL</Text>
        <View style={S.headerTealLine} />
      </View>

      {/* Content */}
      {children}

      {/* Footer */}
      <View style={S.footer} fixed>
        <Text style={S.footerText}>NexaFlow SA · Avenue Louise 54 · Bruxelles · {today}</Text>
        <Text
          style={S.footerPage}
          render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
          fixed
        />
      </View>
    </Page>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Strip code fences and excalidraw blocks
// ─────────────────────────────────────────────────────────────────────────────
function sanitizeContent(raw: string): string {
  return raw
    // ── Code fences ────────────────────────────────────────────────────────
    .replace(/```excalidraw[\s\S]*/g, '')
    .replace(/```json[\s\S]*?```/gs, '')
    .replace(/```[\s\S]*?```/gs, '')

    // ── Footer metadata injected by LLM ───────────────────────────────────
    .replace(/📌[^\n]*/g, '')
    .replace(/🕐[^\n]*/g, '')

    // ── *** → horizontal rule (triple-asterisk variant) ───────────────────
    .replace(/^\*\*\*\s*$/gm, '---')

    // ── Artifacts LLM en début de ligne ───────────────────────────────────
    // Patterns observés : =ÊTitre, =ÈTitre, =h=»Titre, <Titre, –Titre, +Titre
    // Règle : strip 1-6 chars non-alphanum/non-markdown au début d'une ligne
    // suivis d'une lettre majuscule (= vraie entrée de section)
    .replace(/^[=<+–—»«•·][=<+–—»«h·\u00C0-\u00FF\u0080-\u009F]*\s+(?=[A-Z])/gm, '')
    .replace(/^[=<+–—»«•·][=<+–—»«h·\u00C0-\u00FF\u0080-\u009F]*(?=[A-Z])/gm, '')
    // En-dash/em-dash seul avant une majuscule (–Active, —Focus…)
    .replace(/^[–—]\s*(?=[A-Z])/gm, '')
    // Moins/plus seul avant une majuscule (+HR Key…)
    .replace(/^[-+]\s*(?=[A-Z][a-z])/gm, '')

    // ── Corrections de terminologie LLM ──────────────────────────────────
    // "SIRI" est une hallucination LLM — le système s'appelle SIRH
    .replace(/\bSIRI\b/g, 'SIRH')

    // ── Nettoyage final ───────────────────────────────────────────────────
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// Document principal
// ─────────────────────────────────────────────────────────────────────────────

interface ExportMemoOptions {
  title: string;
  content: string;
  subtitle?: string;
  author?: string;
  chartData?: ChartSpec[];
}

function NexaFlowDocument({ title, subtitle = '', author = 'Bruno Mineo, DRH', content, chartData }: ExportMemoOptions) {
  const cleanContent = sanitizeContent(content);
  const mdElements = renderMarkdown(cleanContent);

  return (
    <Document
      title={title}
      author={author}
      creator="NexaFlow DRH · NexaAI"
      subject={subtitle}
      hyphenationCallback={(word) => [word]}
    >
      {/* Page de couverture */}
      <CoverPage title={title} subtitle={subtitle} author={author} />

      {/* Page(s) de contenu */}
      <ContentPage title={title} subtitle={subtitle}>
        {/* Charts en premier (données vérifiées avant narrative LLM) */}
        {chartData && chartData.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={S.label}>VISUALISATIONS</Text>
            <View style={{ borderBottomWidth: 1.5, borderBottomColor: C.teal, marginBottom: 8 }} />
            {/* Toujours en colonne — svgWidth calculé depuis la zone de contenu réelle */}
            <View style={{ flexDirection: 'column' }}>
              {chartData.map((spec, i) => (
                <View key={i} style={{ marginBottom: 8 }}>
                  <ChartSvgRenderer spec={spec} svgWidth={CHART_SVG_W} />
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Markdown narrative */}
        <View>
          {mdElements}
        </View>
      </ContentPage>
    </Document>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Export public
// ─────────────────────────────────────────────────────────────────────────────

export const exportMemoPdf = async (options: ExportMemoOptions) => {
  const {
    title,
    content,
    subtitle = '',
    author = 'Bruno Mineo, DRH',
    chartData,
  } = options;

  const doc = (
    <NexaFlowDocument
      title={title}
      content={content}
      subtitle={subtitle}
      author={author}
      chartData={chartData}
    />
  );

  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // Filename : NexaFlow_[Titre-lisible]_YYYY-MM-DD_HH-MM-SS.pdf
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10);                          // 2026-04-20
  const timePart = now.toTimeString().slice(0, 8).replace(/:/g, '-');       // 14-30-22
  // Titre : conserver majuscules + chiffres, remplacer espaces/tirets par '_', supprimer le reste
  const titleSlug = title
    .replace(/[\/\\:*?"<>|]/g, '')          // chars interdits Windows/macOS
    .replace(/\s+/g, '_')                   // espaces → underscore
    .replace(/[^A-Za-z0-9_\-]/g, '')        // tout le reste supprimé
    .replace(/_+/g, '_')                    // underscores consécutifs
    .slice(0, 50);                          // max 50 chars
  a.download = `NexaFlow_${titleSlug}_${datePart}_${timePart}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};
