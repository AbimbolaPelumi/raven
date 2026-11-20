import { HOLD_HREF, HOLD_REF } from "@/lib/proto"

/**
 * Email-safe HTML: table layout, inline styles only, system fonts, no external
 * assets. Black text on white, one black button. Never shows an amount.
 * The anchor carries data-internal so the inbox can route it client-side
 * without losing prototype state.
 */
export type HoldEmailKind = "hold-paused" | "info-needed"

const COPY: Record<
  HoldEmailKind,
  { heading: string; paragraphs: string[]; cta: string; href: string }
> = {
  // Scenario 1: processor-led review, nothing is asked of the merchant.
  "hold-paused": {
    heading: "Your payouts are paused",
    paragraphs: [
      "We've temporarily paused your payouts while we review recent activity on your account. Your money is safe, and customers can still pay you.",
      "No action is needed right now. We'll contact you if we need any additional information.",
    ],
    cta: "View details",
    href: HOLD_HREF,
  },
  // Scenario 2: the processor needs something.
  "info-needed": {
    heading: "We need additional information",
    paragraphs: [
      "We need some additional information to continue reviewing your payouts.",
      "Your payouts remain paused while we complete our review. Customers can still pay you.",
    ],
    cta: "Provide details",
    href: `${HOLD_HREF}&view=form`,
  },
}

export function holdEmailHtml(kind: HoldEmailKind = "hold-paused") {
  const c = COPY[kind]
  const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif"
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">
        <tr>
          <td style="font-family:${font};font-size:13px;line-height:18px;letter-spacing:0.08em;text-transform:uppercase;color:#000000;padding-bottom:32px;">
            <strong>Raven</strong>
          </td>
        </tr>
        <tr>
          <td style="font-family:${font};font-size:26px;line-height:32px;font-weight:600;color:#000000;padding-bottom:16px;">
            ${c.heading}
          </td>
        </tr>
        ${c.paragraphs
          .map(
            (p) => `<tr>
          <td style="font-family:${font};font-size:16px;line-height:24px;color:#000000;padding-bottom:16px;">
            ${p}
          </td>
        </tr>`
          )
          .join("\n")}
        <tr>
          <td style="padding:12px 0 32px;">
            <a href="${c.href}" data-internal="true" style="display:inline-block;background:#000000;color:#ffffff;font-family:${font};font-size:16px;line-height:24px;font-weight:500;text-decoration:none;padding:12px 24px;">${c.cta}</a>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #d9d9d9;padding-top:16px;font-family:${font};font-size:13px;line-height:20px;color:#595959;">
            Hold reference ${HOLD_REF} &middot; Questions? <a href="#" data-contact="true" style="color:#000000;text-decoration:underline;">Contact support</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`
}
