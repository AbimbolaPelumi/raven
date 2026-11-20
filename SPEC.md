# Raven Payouts: hold prototype

## What this is

A working web prototype about **one moment: a merchant in the first 24 hours after her payouts are put on hold.**

Raven is a made-up payments processor. Tolu Adeyemi runs Tolu Atelier, a clothing brand in Lagos. Her Black Friday sales jumped, the system flagged it, and her payouts were paused on Fri, 27 Nov 2026 at 3:12pm. It's a false alarm. Salaries and a supplier are due Mon, 30 Nov.

**Main idea: Raven does the review.** By default she has nothing to do. Raven promises an update within 24 hrs, not a release. She can add context if she knows what explains the activity.

The prototype covers:
1. The hold starts and she finds out (push, SMS, email, banner), all saying the same thing
2. She opens the details: what's on hold, why, progress
3. Optionally, she tells Raven what happened ("Expected this activity?")
4. Raven clears the hold

It must work on desktop and on her phone, and let a presenter move through each step live.

Design: Figma file `L50Kr8t31v51771stuErq0`. Its tokens are the source of truth; its screens are partly outdated, so this spec wins on behaviour and copy.

### Copy rules

- No em dashes.
- **Never hint at what the activity was** (no "sales went up", "increase", "spike"). Only "unusual activity" or "recent activity on your account".
- The activity is under review, not the payouts: "Payouts paused", never "payouts under review".
- Updates are promised in hours, never as a date. Banner and timeline count down from 24 hrs (never above 24, only while a hold is on); alerts always say "within 24 hrs".
- Dates: "Fri, 27 Nov 2026". Never show a payout time. Don't apologise for the hold.

---

## Stack

Next.js (App Router) + TypeScript, Tailwind CSS v4, shadcn/ui restyled to the design, Zustand, lucide-react icons (stroke 1.75). Fonts via `next/font`: Instrument Sans (400, 500), Hedvig Letters Serif (400). No backend; all data is local fixtures.

---

## Design tokens

`app/globals.css` mirrors the Figma variables. Two layers:

- **Primitives**: raw values (gray, purple, green, orange, blue, red scales; spacing; radius; font sizes and families). Never used directly in components.
- **Theme** (Light and Dark): what components use, named `color/{bg,border,text,icon}/<name>`. In code: `--bg-default` → `bg-bg-default`, `--text-primary` → `text-text-primary`, `--icon-success` → `bg-icon-success`.

| Group | Tokens |
|---|---|
| bg | default, subtle, muted, emphasis, inverse, overlay (used at 40%), success-subtle, success, critical-subtle, critical, info-subtle, info |
| border | default, strong, selected, focus, info, success, critical |
| text | primary, secondary, tertiary, disabled, inverse, success, critical, info, on-critical |
| icon | primary, secondary, tertiary, disabled, inverse, neutral, success, critical, info, on-critical |

**Code only (not in Figma yet):** a `warning` family from the orange primitives for Pending: `bg/warning-subtle`, `text/warning`, `icon/warning`, `border/warning`.

Usage: dots and icons use `icon/*`; tinted pills use `bg/*-subtle` + `text/*`; filled banners use `bg/critical` or `bg/success` + `text/on-critical`; primary buttons use `bg/inverse` + `text/inverse`; focus rings use `border/focus`. Components use Theme tokens only.

Radius 0 everywhere except pills, status icons, timeline markers, bell and avatar (fully round). Dark mode via `class="dark"`; follows the system by default.

### Text styles

| Style | Font | Size / line height |
|---|---|---|
| Display/Large · Medium · Small | Hedvig Letters Serif 400 | 36/120% · 28/120% · 24/125% |
| Heading/Large | Instrument Sans 400 | 24/125% |
| Heading/Medium *(code only)* | Instrument Sans 500 | 18/140% |
| Heading/Small | Instrument Sans 500 | 16/140% |
| Body/Large | Instrument Sans 400 | 16/145% |
| Body/Medium · Medium Strong | Instrument Sans 400 · 500 | 14/145% |
| Body/Small · Small Strong | Instrument Sans 400 · 500 | 12/140% |
| Label/XSmall · XSmall Strong | Instrument Sans 400 · 500 | 11/140% |

---

## Colour by status

- **Red**: On hold (pill, and the banner while on hold). Also errors.
- **Orange**: Pending.
- **Green**: Paid, and the resumed banner.
- **Blue**: charts (current period), Refunded, the current timeline step.

---

## Money model

- **Payout**: one day's sales, paid automatically on the next working day. Never combined across days; no payout for the current day.
- **On hold**: a payout that would normally go out but is paused. New sales keep coming in and pay out after the review.
- **Payout balance** equals the total of the On hold rows (Pending rows when there's no hold). Every amount on screen must agree.

At the hold, Friday's payout (₦3,457,350.00) is On hold; earlier days are Paid. After **Next day** (Sat) there's still only Friday's payout, and its amount doesn't change.

Payouts table, newest first, one row per day. Columns: Payout for, Status, Amount, Recipient (`GTBank •••• 4821`), Reference (only once Paid, otherwise "-"):

| Payout for | Amount | Status | Reference |
|---|---|---|---|
| Fri, 27 Nov 2026 | ₦3,457,350.00 | On hold (Pending without a hold) | - |
| Thu, 26 Nov 2026 | ₦339,825.00 | Paid | PO-261127-0487 |
| Wed, 25 Nov 2026 | ₦369,375.00 | Paid | PO-261126-0451 |
| Tue, 24 Nov 2026 | ₦325,050.00 | Paid | PO-261125-0419 |
| Mon, 23 Nov 2026 | ₦354,600.00 | Paid | PO-261124-0388 |
| Sun, 22 Nov 2026 | ₦221,625.00 | Paid | PO-261123-0352 |
| Sat, 21 Nov 2026 | ₦369,375.00 | Paid | PO-261123-0351 |
| Fri, 20 Nov 2026 | ₦443,250.00 | Paid | PO-261123-0350 |

Hold reference: `HLD-261127-0412`. All screens derive from one store (`lib/store.ts`) through `derive()` in `lib/proto.ts`; nothing is hard-coded per screen.

---

## Screens

Routes: `/` Home, `/payouts` Payouts, `/inbox` (made-up mail view). `?hold=open` opens the drawer on any page; every alert links to `/payouts?hold=open`. Sidebar, header, banner and drawer live in a shared shell; header and banner stay pinned while scrolling.

### Payouts

Title, the **Next payout** card (full width), toolbar ("Last 30 days", "Status: All", Export), payouts table.

- **Next payout card**: title "Next payout", the amount, then a plain grey sentence: "You have 1 payout on hold" / "You have 1 pending payout, due Mon, 30 Nov 2026" / "You have no pending payouts". Not clickable.
- **Table**: no row menu; an On hold row opens the drawer. Hovering a Paid reference shows a round copy button ("Reference copied").

### Home

Title with a "Last 30 days" dropdown, then one grid: Gross volume (2 columns × 2 rows) beside Next payout and Payments; then Successful payments, Average order value, New customers. Charts: current period blue, previous light grey, dashed average and grid, legend "Current / Previous / Average", change as grey text ("+29.9% vs previous period"). Payments breakdown: Succeeded green, Refunded blue, Failed red.

### Banner

Filled colour, white text, `role="status"`. Wraps on narrow screens; the link stays visible. Link underline sweeps out and back in on hover (mouse only).

| State | Colour | Text | Link |
|---|---|---|---|
| Paused, day one | red | Payouts paused while we review recent activity on your account. No action needed. We'll update you within 24 hrs. | View details |
| Paused, next day | red | Payouts paused since Fri, 27 Nov 2026. We're still reviewing. We'll update you within 6 hrs. | View details |
| Resumed | green | Payouts resumed. Your next payout goes out on Mon, 30 Nov 2026. | Dismiss (x) |

### Review drawer

Right side, 480px (full-screen sheet on mobile). Sticky header and footer. Traps focus, Esc closes, focus returns to the opener.

1. **Title**: "Payouts paused"
2. **Money**: "₦3,457,350.00 on hold", then "1 payout, for Fri, 27 Nov" (with more days: "5 payouts, for Fri, 27 Nov to Tue, 1 Dec"), then "You can keep accepting payments as usual, and new sales are paid out after the review."
3. **Details**: Paused since Fri, 27 Nov 2026, 3:12pm · Reason: Unusual activity on your account · Reference: HLD-261127-0412
4. **Progress**: Payouts paused (done) → You added context (done, only after she sends it) → Reviewing account activity (current, blue ring with a soft ripple) → Next update, Within 24 hrs (upcoming). Solid connector up to the current step, dotted after.
5. **Expected this activity?** (below)
6. **Footer**: "Contact support" opens her email app pre-filled (to support@raven.ng, subject and body with the reference); "Close".

When the hold is lifted the drawer shows "Hold lifted": the balance, the lift date and the next payout date.

### Expected this activity?

Her way to say the hold is a mistake without disputing it. Optional; changes nothing about her status.

- In the drawer: "If something recent explains the activity on your account, you can tell us." and a "Tell us what happened" button.
- The button opens a **modal over the drawer**: required radios "What might explain it?" (A promotion or campaign, A new product or service, A change to how I sell, Something else), optional "Anything else we should know?", optional Attachments upload. Cancel and Submit (disabled until a reason is picked).
- On Submit the modal closes, toast "Sent. We've added this to your review.", and the drawer shows "You told us: …" with the time, note and files, plus the "You added context" timeline step.
- On failure: keep what she typed and show "Couldn't send. Try again."

### Alerts

Same message as the day-one banner. **No amount**: lock screens show them.

- **Push**: "Payouts paused" / "We're reviewing recent activity on your account. No action needed. We'll update you within 24 hrs."
- **SMS** (≤160 characters): "Raven: Payouts paused while we review recent activity on your account. No action needed. We'll update you within 24 hrs. raven.ng/h/HLD-261127-0412"
- **Email**: subject "Your payouts are paused", same message, the reference and a "View details" button. Black on white.

Each opens `/payouts?hold=open` with the drawer open.

### Mobile (below 768px)

- Sidebar behind a header menu button.
- Payouts table becomes a grouped list ("Upcoming", "Paid") in bordered containers. Each row: round status icon (Paid check green, On hold pause red, Pending clock orange), amount with "Status • reference", date on the right without the weekday ("27 Nov 2026").
- Cards stack; the drawer is full screen. No horizontal scroll at 390px.

---

## Demo controls

Hidden panel, toggled with `Shift + D`. Not part of the product.

- **Place hold**: Fri, 27 Nov 2026, 3:12pm; fires push, email and notification
- **Clear hold**: acts as the reviewer; hold resumed
- **Next day**: Sat, 28 Nov 2026, 9:30am, hold still on; day-two banner
- **Show alerts**: push on a lock screen, SMS thread and email, each with "Open"
- Theme, simulate upload failure, simulate submit failure, **Reset**

Demo script: normal Home and Payouts → Place hold (alerts, red banner, card On hold) → open the drawer → "Tell us what happened" → Next day → Clear hold (green banner, payout back to Pending).

---

## Quality bar

- Banner, card, table, drawer and alerts tell the same story; the balance equals the On hold rows.
- Keyboard and screen reader friendly: focus trapped in the drawer and modal, labelled forms, timeline steps announce done / in progress / upcoming, pills have text.
- Light and dark; 1024 to 1440px and 390px mobile.

## Out of scope

Raven asking for more information or documents; anything after the first review (reminders, holds that stay); failed payouts; other hold reasons; the reviewer tool (the demo controls stand in for it); instant payouts; real email, SMS or support messaging.
