"use client"

import { useMemo, useState } from "react"

import { BarChart } from "@/components/bar-chart"
import { LineChart, type ChartPoint } from "@/components/line-chart"
import { OverviewCard } from "@/components/overview-card"
import { PeriodControl } from "@/components/period-control"
import { PaymentStatusPill } from "@/components/status-pill"
import { SummaryCard } from "@/components/summary-card"
import {
  RECENT_PAYMENTS,
  TOP_CUSTOMERS,
  change,
  fmtChange,
  fmtCompactNaira,
  paymentTime,
  periodStats,
  shortDate,
  type Period,
} from "@/lib/dashboard"
import { derive, fmtNaira } from "@/lib/proto"
import { useProto } from "@/lib/store"

function tone(c: number | null): "up" | "down" | "flat" {
  return c === null ? "flat" : c >= 0 ? "up" : "down"
}

const int = (n: number) => n.toLocaleString("en-US")

/** Home: volume hero + balance snapshot, then a Stripe-style grid of overview cards. */
export function HomeView() {
  const hold = useProto((s) => s.hold)
  const now = useProto((s) => s.now)
  const bannerDismissed = useProto((s) => s.bannerDismissed)
  const openDrawer = useProto((s) => s.openDrawer)

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
    { key: "refunded", label: "Refunded", count: cur.refundedCount, amount: cur.refundedAmount, swatch: "bg-text-tertiary" },
    { key: "failed", label: "Failed", count: cur.failedCount, amount: cur.failedAmount, swatch: "bg-danger-dot" },
  ]

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-display-medium text-text-primary">Home</h1>
        <PeriodControl value={period} onChange={setPeriod} />
      </div>

      {/* Hero: volume over time + balance snapshot */}
      <div className="grid gap-4 md:gap-6 xl:grid-cols-3">
        <OverviewCard
          title="Gross volume"
          value={fmtNaira(cur.volume)}
          delta={fmtChange(cVolume)}
          deltaTone={tone(cVolume)}
          className="xl:col-span-2"
        >
          <LineChart
            data={volume}
            previous={prevVolume}
            format={fmtNaira}
            formatAxis={fmtCompactNaira}
            ariaLabel={`Gross volume per day, ${shortDate(stats.range.from)} to ${shortDate(stats.range.to)}, compared with the previous ${period} days`}
          />
          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-body-small text-text-secondary">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="h-0.5 w-4 bg-info-strong" />
              {shortDate(stats.range.from)} – {shortDate(stats.range.to)}
            </span>
            <span className="flex items-center gap-1.5">
              <span
                aria-hidden
                className="h-0 w-4 border-t-2 border-dashed border-text-tertiary"
              />
              Previous period ({shortDate(stats.range.prevFrom)} – {shortDate(stats.range.prevTo)})
            </span>
          </div>
        </OverviewCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-1 xl:grid-rows-2">
          <SummaryCard
            value={vm.balance.value}
            label={vm.balance.label}
            description={vm.balance.description}
            status={vm.balance.status}
          />
          <SummaryCard
            value={vm.nextPayout.value}
            label={vm.nextPayout.label}
            description={vm.nextPayout.description}
            // While a review is running the card opens the review details.
            onActivate={hold === "none" || hold === "resumed" ? undefined : () => openDrawer()}
          />
        </div>
      </div>

      {/* Your overview */}
      <div className="flex items-baseline justify-between gap-4 pt-2">
        <h2 className="text-heading-medium text-text-primary">Your overview</h2>
        <p className="text-body-small text-text-tertiary">Compared to previous period</p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
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
                <span aria-hidden className={`size-2 shrink-0 rounded-full ${b.swatch}`} />
                <span className="flex-1 text-text-primary">{b.label}</span>
                <span className="text-text-secondary">{int(b.count)}</span>
                <span className="w-32 text-right text-text-primary">{fmtNaira(b.amount)}</span>
              </li>
            ))}
          </ul>
        </OverviewCard>

        <OverviewCard
          title="Successful payments"
          value={int(cur.payments)}
          delta={fmtChange(cPayments)}
          deltaTone={tone(cPayments)}
        >
          <LineChart
            variant="mini"
            height={112}
            data={toPoints(current, (d) => d.payments)}
            format={int}
            ariaLabel="Successful payments per day"
          />
        </OverviewCard>

        <OverviewCard
          title="Average order value"
          value={fmtNaira(cur.aov)}
          delta={fmtChange(cAov)}
          deltaTone={tone(cAov)}
        >
          <LineChart
            variant="mini"
            height={112}
            data={toPoints(current, (d) => d.aov)}
            format={fmtNaira}
            ariaLabel="Average order value per day"
          />
        </OverviewCard>

        <OverviewCard
          title="Recent payments"
          footer={{ text: "Updated just now", action: "View all" }}
        >
          <ul className="flex flex-col divide-y divide-border-default">
            {RECENT_PAYMENTS.slice(0, 5).map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-body-medium text-text-primary">{fmtNaira(p.amount)}</p>
                  <p className="truncate text-body-small text-text-tertiary">
                    {paymentTime(p, now)} · {p.name}
                  </p>
                </div>
                <PaymentStatusPill status={p.status} />
              </li>
            ))}
          </ul>
        </OverviewCard>

        <OverviewCard
          title="New customers"
          value={int(cur.newCustomers)}
          delta={fmtChange(cCustomers)}
          deltaTone={tone(cCustomers)}
        >
          <BarChart values={current.map((d) => d.newCustomers)} height={112} />
        </OverviewCard>

        <OverviewCard
          title="Top customers by spend"
          footer={{ text: "Updated yesterday", action: "View all" }}
        >
          <ul className="flex flex-col divide-y divide-border-default">
            {TOP_CUSTOMERS.map((c) => (
              <li key={c.email} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-body-medium text-text-primary">{c.name}</p>
                  <p className="truncate text-body-small text-text-tertiary">{c.email}</p>
                </div>
                <p className="text-body-medium text-text-primary">{fmtNaira(c.amount)}</p>
              </li>
            ))}
          </ul>
        </OverviewCard>
      </div>
    </>
  )
}
