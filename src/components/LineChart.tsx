import { deltaColor } from '../lib/measurements'

export interface LinePoint {
  label: string
  value: number
}

interface LineChartProps {
  data: LinePoint[]
  unit?: string
  compact?: boolean
  color?: string
  showDelta?: boolean
  lowerIsBetter?: boolean | null
}

export function LineChart({
  data,
  unit = '',
  compact = false,
  color = '#4f46e5',
  showDelta = false,
  lowerIsBetter = null,
}: LineChartProps) {
  if (data.length === 0) return null

  const width = 640
  const height = compact ? 120 : 240
  const padX = compact ? 10 : 34
  const padTop = compact ? 12 : showDelta ? 52 : 26
  const padBottom = compact ? 12 : 40

  const values = data.map((d) => d.value)
  let min = Math.min(...values)
  let max = Math.max(...values)
  if (min === max) {
    min -= 1
    max += 1
  }
  const span = max - min
  min -= span * 0.15
  max += span * 0.15

  const innerW = width - padX * 2
  const innerH = height - padTop - padBottom
  const stepX = data.length > 1 ? innerW / (data.length - 1) : 0

  const points = data.map((d, i) => {
    const x = padX + stepX * i
    const y = padTop + innerH - ((d.value - min) / (max - min)) * innerH
    const delta = i > 0 ? Number((d.value - data[i - 1].value).toFixed(1)) : null
    return { x, y, delta, ...d }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
      : ''

  const gridLines = [0, 0.5, 1].map((t) => padTop + innerH - innerH * t)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: compact ? height : undefined }} preserveAspectRatio="none" role="img">
      <defs>
        <linearGradient id="lineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>

      {!compact &&
        gridLines.map((y, i) => (
          <line key={i} x1={padX} x2={width - padX} y1={y} y2={y} stroke="#e5e7eb" strokeWidth="1" />
        ))}

      {areaPath && <path d={areaPath} fill="url(#lineFill)" />}

      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={compact ? 2.5 : 3}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={compact ? 3 : 5} fill="#ffffff" stroke={color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          {!compact && (
            <>
              {showDelta && p.delta !== null && (
                <text
                  x={p.x}
                  y={p.y - 30}
                  textAnchor="middle"
                  fontSize="13"
                  fontWeight="700"
                  fill={deltaColor(p.delta, lowerIsBetter)}
                  fontFamily="Segoe UI, sans-serif"
                >
                  {p.delta === 0 ? '= 0' : `${p.delta > 0 ? '↑' : '↓'} ${Math.abs(p.delta)}${unit.replace(/^\s/, '')}`}
                </text>
              )}
              <text
                x={p.x}
                y={p.y - 13}
                textAnchor="middle"
                fontSize="14"
                fontWeight="700"
                fill="#1f2937"
                fontFamily="Segoe UI, sans-serif"
              >
                {p.value}
                {unit}
              </text>
              <text x={p.x} y={height - 14} textAnchor="middle" fontSize="12" fill="#9ca3af" fontFamily="Segoe UI, sans-serif">
                {p.label}
              </text>
            </>
          )}
        </g>
      ))}
    </svg>
  )
}

export function Sparkline({ data, color = '#4f46e5' }: { data: LinePoint[]; color?: string }) {
  return (
    <div className={`h-10 w-24 ${data.length < 2 ? 'opacity-40' : ''}`}>
      <LineChart data={data} compact color={color} />
    </div>
  )
}
