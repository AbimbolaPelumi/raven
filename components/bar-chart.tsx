/** Tiny decorative bar chart. The card's value text is the accessible content. */
export function BarChart({ values, height = 64 }: { values: number[]; height?: number }) {
  const max = Math.max(...values, 1)
  const w = 100
  // Gap shrinks as bars multiply so the bar width can never go negative (90 days).
  const gap = Math.min(1.2, w / (values.length * 3))
  const bar = (w - gap * (values.length - 1)) / values.length
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      className="block w-full"
      style={{ height }}
    >
      {values.map((v, i) => {
        const h = Math.max(1, (v / max) * (height - 2))
        return (
          <rect
            key={i}
            x={i * (bar + gap)}
            y={height - h}
            width={bar}
            height={h}
            className="fill-info-strong"
          />
        )
      })}
    </svg>
  )
}
