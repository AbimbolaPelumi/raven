"use client"

import { useMemo, useState } from "react"

import { BarChart } from "@/components/bar-chart"
import { ChartLegend } from "@/components/chart-legend"
import { LineChart, type ChartPoint } from "@/components/line-chart"
import { OverviewCard } from "@/components/overview-card"
import { PeriodControl } from "@/components/period-control"
import { SummaryCard } from "@/components/summary-card"
import {
  change,
  fmtChange,
  fmtCompactNaira,
  periodStats,
  shortDate,
  type Period,
} from "@/lib/dashboard"
import { derive, fmtNaira } from "@/lib/proto"
import { useProto } from "@/lib/store"

const int = (n: number) => n.toLocaleString("en-US")

/** Home: one grid of cards (volume, next payout, payments, customers). */
export function HomeView() {
  const hold = useProto((s) => s.hold)
  const now = useProto((s) => s.now)
  const bannerDismissed = useProto((s) => s.bannerDismissed)

  const [period, setPeriod] = useState<Period>(30)

  const vm = useMemo(() => derive({ hold, now, bannerDismissed }), [hold, now, bannerDismissed])
  const stats = useMemo(() => periodStats(period, now), [period, now])
  const { current, previous, now: cur, before } = stats

  const toPoints = (days: typeof current, pick: (d: (typeof current)[number]) => number): ChartPoint[] =>
    days.map((d) => ({ label: shortDate(d.day), value: pick(d) }))

  const volume = toPoints(current, (d) => d.volume)
  const prevVolume = toPoints(previous, (d) => d.volume)

  const cVolume = change(cur.volume, before.volume)
  const cPayments = change(cur.payments, before.payments)
  const cAov = change(cur.aov, before.aov)
  const cCustomers = change(cur.newCustomers, before.newCustomers)

  const succeededCount = cur.payments - cur.refundedCount
  const succeededAmount = cur.volume - cur.refundedAmount
  const attempted = succeededCount + cur.refundedCount + cur.failedCount
  const breakdown = [
    { key: "succeeded", label: "Succeeded", count: succeededCount, amount: succeededAmount, swatch: "bg-success-dot" },
    { key: "refunded", label: "Refunded", count: cur.refundedCount, amount: cur.refundedAmount, swatch: "bg-info-dot" },
    { key: "failed", label: "Failed", count: cur.failedCount, amount: cur.failedAmount, swatch: "bg-danger-dot" },
  ]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-medium text-text-primary">Home</h1>
        <PeriodControl value={period} onChange={setPeriod} />
      </div>

      {/*
        One grid, no section headings. Wide screens (3 columns):
          Gross volume (2 cols x 2 rows) | Next payout
                                         | Payments
          Successful payments | Average order value | New customers
        Two columns fill densely so no gaps are left; one column stacks.
      */}
      <div className="grid grid-cols-1 gap-4 md:grid-flow-row-dense md:grid-cols-2 md:gap-6 xl:grid-cols-3">
        <OverviewCard
          title="Gross volume"
          value={fmtNaira(cur.volume)}
          delta={fmtChange(cVolume)}
          className="md:col-span-2 xl:row-span-2"
        >
          <ChartLegend />
          <LineChart
            data={volume}
            previous={prevVolume}
            format={fmtNaira}
            formatAxis={fmtCompactNaira}
            ariaLabel={`Gross volume per day, ${shortDate(stats.range.from)} to ${shortDate(stats.range.to)}, compared with the previous ${period} days`}
          />
        </OverviewCard>

        <SummaryCard
          value={vm.nextPayout.value}
          label={vm.nextPayout.label}
          description={vm.nextPayout.description}
        />

        <OverviewCard title="Payments">
          <div
            role="img"
            aria-label={`${int(attempted)} payments: ${int(succeededCount)} succeeded, ${int(cur.refundedCount)} refunded, ${int(cur.failedCount)} failed`}
            className="flex h-2 w-full gap-px overflow-hidden"
          >
            {breakdown.map((b) => (
              <div
                key={b.key}
                className={b.swatch}
                style={{ width: `${(b.count / attempted) * 100}%`, minWidth: b.count ? 2 : 0 }}
              />
            ))}
          </div>
          <ul className="flex flex-col divide-y divide-border-default">
            {breakdown.map((b) => (
              <li key={b.key} className="flex items-center gap-3 py-2.5 text-body-medium">
                <span aria-hidden className={`size-2 shrink-0 ${b.swatch}`} />
                <span className="flex-1 text-text-primary">{b.label}</span>
                <span className="text-text-secondary">{int(b.count)}</span>
                <span className="w-32 text-right text-text-primary">{fmtNaira(b.amount)}</span>
              </li>
            ))}
          </ul>
        </OverviewCard>

        <OverviewCard title="Successful payments" value={int(cur.payments)} delta={fmtChange(cPayments)}>
          <LineChart
            variant="mini"
            height={112}
            data={toPoints(current, (d) => d.payments)}
            format={int}
            ariaLabel="Successful payments per day"
          />
        </OverviewCard>

        <OverviewCard title="Average order value" value={fmtNaira(cur.aov)} delta={fmtChange(cAov)}>
          <LineChart
            variant="mini"
            height={112}
            data={toPoints(current, (d) => d.aov)}
            format={fmtNaira}
            ariaLabel="Average order value per day"
          />
        </OverviewCard>

        <OverviewCard title="New customers" value={int(cur.newCustomers)} delta={fmtChange(cCustomers)}>
          <BarChart values={current.map((d) => d.newCustomers)} height={112} />
        </OverviewCard>

      </div>
    </>
  )
}
