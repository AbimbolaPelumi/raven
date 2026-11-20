/** Chart legend: square swatches, dashed line for the average. */
export function ChartLegend({ average = true }: { average?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-body-small text-text-secondary">
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 bg-bg-info" />
        Current
      </span>
      <span className="flex items-center gap-1.5">
        <span aria-hidden className="size-2 bg-border-strong" />
        Previous
      </span>
      {average && (
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="w-3 border-t border-dashed border-text-tertiary" />
          Average
        </span>
      )}
    </div>
  )
}
