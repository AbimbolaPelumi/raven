import { Badge } from "@/components/ui/badge"
import type { PayoutStatus } from "@/lib/proto"

const LABEL: Record<PayoutStatus, string> = {
  paid: "Paid",
  "on-hold": "On hold",
  pending: "Pending",
}

const DOT: Record<PayoutStatus, string> = {
  paid: "bg-success-dot",
  "on-hold": "bg-hold-dot",
  pending: "bg-pending-dot",
}

/** Status is always conveyed by text, not colour alone. */
export function StatusPill({ status }: { status: PayoutStatus }) {
  return (
    <Badge variant={status}>
      <span aria-hidden className={`size-[5px] rounded-full ${DOT[status]}`} />
      {LABEL[status]}
    </Badge>
  )
}

type PaymentStatus = "succeeded" | "refunded" | "failed"

const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  succeeded: "Succeeded",
  refunded: "Refunded",
  failed: "Failed",
}

const PAYMENT_DOT: Record<PaymentStatus, string> = {
  succeeded: "bg-success-dot",
  refunded: "bg-info-dot",
  failed: "bg-danger-dot",
}

export function PaymentStatusPill({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant={status}>
      <span aria-hidden className={`size-[5px] rounded-full ${PAYMENT_DOT[status]}`} />
      {PAYMENT_LABEL[status]}
    </Badge>
  )
}
