"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"

import { cn } from "@/lib/utils"

export interface ChartPoint {
  /** Display label for the x position, e.g. "27 Nov". */
  label: string
  value: number
}

interface LineChartProps {
  data: ChartPoint[]
  /** Same length as `data`; drawn dashed and compared in the tooltip. */
  previous?: ChartPoint[]
  /** Full chart with axes and tooltip, or a decorative sparkline. */
  variant?: "full" | "mini"
  height?: number
  /** Full value, used in the tooltip and the screen-reader table. */
  format: (n: number) => string
  /** Short value for y-axis ticks. */
  formatAxis?: (n: number) => string
  /** Describes what the chart shows, for assistive tech. */
  ariaLabel: string
}

/** Largest "nice" step so 4 ticks cover the data. */
function niceMax(max: number) {
  if (max <= 0) return 1
  const rough = max / 4
  const pow = 10 ** Math.floor(Math.log10(rough))
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough
  return step * 4
}

function useWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setWidth(Math.round(e.contentRect.width)))
    ro.observe(el)
    setWidth(Math.round(el.getBoundingClientRect().width))
    return () => ro.disconnect()
  }, [])
  return [ref, width] as const
}

/**
 * Dependency-free SVG line chart: current period in brand blue, previous period
 * in light grey, dashed average line, dashed grid.
 * The full variant has axes and a tooltip that follows the pointer or the
 * arrow keys; every value is also in a visually hidden table.
 */
export function LineChart({
  data,
  previous,
  variant = "full",
  height = variant === "full" ? 240 : 64,
  format,
  formatAxis = format,
  ariaLabel,
}: LineChartProps) {
  const full = variant === "full"
  const [ref, width] = useWidth()
  const [active, setActive] = useState<number | null>(null)
  const uid = useId()

  const pad = full ? { l: 52, r: 8, t: 10, b: 26 } : { l: 0, r: 0, t: 4, b: 4 }
  const n = data.length
  const maxVal = niceMax(Math.max(...data.map((d) => d.value), ...(previous ?? []).map((d) => d.value)))
  const innerW = Math.max(0, width - pad.l - pad.r)
  const innerH = height - pad.t - pad.b

  const x = (i: number) => pad.l + (n > 1 ? (i * innerW) / (n - 1) : innerW / 2)
  const y = (v: number) => pad.t + innerH * (1 - v / maxVal)
  const path = (pts: ChartPoint[]) =>
    pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(p.value).toFixed(1)}`).join(" ")

  const avg = n ? data.reduce((s, d) => s + d.value, 0) / n : 0
  const ticks = useMemo(() => [0, 1, 2, 3, 4].map((t) => (maxVal * t) / 4), [maxVal])
  const xTickIdx = n > 2 ? [0, Math.floor((n - 1) / 2), n - 1] : n === 2 ? [0, 1] : [0]

  const move = (clientX: number) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box || n < 2) return
    const rel = clientX - box.left - pad.l
    setActive(Math.min(n - 1, Math.max(0, Math.round((rel / innerW) * (n - 1)))))
  }

  const cur = active === null ? null : data[active]
  const prev = active === null ? null : previous?.[active]
  const tipChange = cur && prev && prev.value > 0 ? (cur.value - prev.value) / prev.value : null

  return (
    <div
      ref={ref}
      className={cn("relative w-full", full && "outline-offset-4")}
      style={{ height }}
      {...(full && {
        tabIndex: 0,
        role: "group",
        "aria-label": `${ariaLabel}. Use the left and right arrow keys to read each day.`,
        "aria-describedby": `${uid}-table`,
        onPointerMove: (e: React.PointerEvent) => move(e.clientX),
        onPointerLeave: () => setActive(null),
        onFocus: () => setActive((a) => a ?? n - 1),
        onBlur: () => setActive(null),
        onKeyDown: (e: React.KeyboardEvent) => {
          if (e.key === "ArrowLeft") setActive((a) => Math.max(0, (a ?? n - 1) - 1))
          else if (e.key === "ArrowRight") setActive((a) => Math.min(n - 1, (a ?? n - 1) + 1))
          else if (e.key === "Home") setActive(0)
          else if (e.key === "End") setActive(n - 1)
          else if (e.key === "Escape") setActive(null)
          else return
          e.preventDefault()
        },
      })}
      {...(!full && { "aria-hidden": true })}
    >
      {width > 0 && n > 0 && (
        <svg width={width} height={height} aria-hidden className="block overflow-visible">
          {full &&
            ticks.map((t) => (
              <g key={t}>
                <line
                  x1={pad.l}
                  x2={width - pad.r}
                  y1={y(t)}
                  y2={y(t)}
                  className="stroke-border-default"
                  strokeWidth={1}
                  strokeDasharray="2 3"
                />
                <text
                  x={pad.l - 8}
                  y={y(t)}
                  textAnchor="end"
                  dominantBaseline="middle"
                  className="fill-text-tertiary text-[11px]"
                >
                  {formatAxis(t)}
                </text>
              </g>
            ))}

          {full &&
            xTickIdx.map((i) => (
              <line
                key={`v${i}`}
                x1={x(i)}
                x2={x(i)}
                y1={pad.t}
                y2={pad.t + innerH}
                className="stroke-border-default"
                strokeWidth={1}
                strokeDasharray="2 3"
              />
            ))}

          {full &&
            xTickIdx.map((i, k) => (
              <text
                key={i}
                x={x(i)}
                y={height - 6}
                textAnchor={k === 0 ? "start" : k === xTickIdx.length - 1 ? "end" : "middle"}
                className="fill-text-tertiary text-[11px]"
              >
                {data[i].label}
              </text>
            ))}

          {previous && (
            <path
              d={path(previous)}
              fill="none"
              className="stroke-border-strong"
              strokeWidth={1.5}
              strokeLinejoin="round"
            />
          )}
          {full && (
            <line
              x1={pad.l}
              x2={width - pad.r}
              y1={y(avg)}
              y2={y(avg)}
              className="stroke-text-tertiary"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
          )}
          <path
            d={path(data)}
            fill="none"
            className="stroke-info-strong"
            strokeWidth={1.5}
            strokeLinejoin="round"
          />

          {full && active !== null && cur && (
            <g>
              <line
                x1={x(active)}
                x2={x(active)}
                y1={pad.t}
                y2={pad.t + innerH}
                className="stroke-border-strong"
              />
              {prev && (
                <circle cx={x(active)} cy={y(prev.value)} r={3.5} className="fill-border-strong" />
              )}
              <circle
                cx={x(active)}
                cy={y(cur.value)}
                r={4}
                className="fill-info-strong stroke-bg-base"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      )}

      {full && active !== null && cur && width > 0 && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 z-10 min-w-40 border border-border-default bg-bg-base p-3 text-body-small shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          style={{
            left: Math.min(Math.max(x(active) + 12, 0), Math.max(0, width - 176)),
          }}
        >
          <p className="text-body-small-strong text-text-primary">{cur.label}</p>
          <p className="mt-1.5 flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-text-secondary">
              <span aria-hidden className="size-2 bg-info-strong" />
              Current
            </span>
            <span className="text-text-primary">{format(cur.value)}</span>
          </p>
          {prev && (
            <p className="mt-1 flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-text-secondary">
                <span aria-hidden className="size-2 bg-border-strong" />
                {prev.label}
              </span>
              <span className="text-text-primary">{format(prev.value)}</span>
            </p>
          )}
          {tipChange !== null && (
            <p
              className="mt-1.5 text-body-small text-text-secondary"
            >
              {tipChange >= 0 ? "+" : "-"}
              {Math.abs(tipChange * 100).toFixed(Math.abs(tipChange) >= 1 ? 0 : 1)}% vs previous
            </p>
          )}
        </div>
      )}

      {/* Wrapped: a table ignores width:1px and would widen the page on phones. */}
      {full && (
        <div className="sr-only">
          <table id={`${uid}-table`} className="sr-only">
            <caption>{ariaLabel}</caption>
            <thead>
              <tr>
                <th>Day</th>
                <th>Current</th>
                {previous && <th>Previous period</th>}
              </tr>
            </thead>
            <tbody>
              {data.map((d, i) => (
                <tr key={d.label + i}>
                  <td>{d.label}</td>
                  <td>{format(d.value)}</td>
                  {previous && <td>{format(previous[i]?.value ?? 0)}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
