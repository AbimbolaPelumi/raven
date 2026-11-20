# Raven Payouts: hold prototype (build spec for Claude Code)

## What this is

A working web prototype for a take-home exercise about **one moment: a merchant in the first 24 hours after her payouts are put on hold.**

Raven is a made-up payments processor. The merchant is Tolu Adeyemi, owner of Tolu Atelier, a clothing brand in Lagos. Her Black Friday sales jumped about 10x, the system flagged it, and her payouts were paused on Fri, 27 Nov 2026 at 3:12pm. It's a false alarm: the sales are real. Salaries and a supplier are due Mon, 30 Nov.

**Main idea: Raven does the review.** By default she has nothing to do. Raven promises a date for the next update (Mon, 30 Nov), not a release date. She can add context if she knows why sales went up, and she's only asked for documents if Raven actually needs them.

The prototype covers:
1. The hold starts and she finds out (push, SMS, email, in-app banner), all saying the same thing
2. She opens the details: what's on hold, why, progress, what happens next
3. Optionally, she tells Raven what happened ("Expected this activity?")
4. The exception: Raven asks for more information (the only red state)
5. Raven clears the hold

It must feel like a real app on desktop and on her phone, and let the presenter move through each step live.

Design source of truth: Figma file `L50Kr8t31v51771stuErq0` (use the Figma MCP to read nodes). Where Figma and this spec disagree, follow Figma for visuals and this spec for behaviour and copy.

Copy rules: no em dashes anywhere. Dates use the Nigerian format, e.g. "Fri, 27 Nov 2026". Never show an exact payout time. Don't apologise for the hold.

---

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS, configured to read the CSS variables below (no raw hex values in components)
- **shadcn/ui as the component base**, restyled to match Figma: `button`, `badge`, `table`, `sheet`, `dialog`, `textarea`, `label`, `tooltip`, `dropdown-menu`, `sonner`, `skeleton`, `separator`, `avatar`.
- Zustand for prototype state
- Fonts from Google Fonts via `next/font`: **Instrument Sans** (400, 500) and **Hedvig Letters Serif** (400)
- Icons: lucide-react, stroke width 1.75
- Deploy on Vercel

Single app. No backend. All data is local fixtures.

---

## Design tokens

Two layers, matching Figma: **Primitives** (raw values, never used directly in components) and **Theme** (what components use), with light and dark modes.

### Primitives

```css
:root {
  /* gray */
  --gray-0: #FFFFFF; --gray-50: #F7F8FA; --gray-100: #F0F2F5; --gray-150: #E8EBEF;
  --gray-200: #E1E4E9; --gray-300: #CFD3DA; --gray-400: #A3A9B4; --gray-500: #858C98;
  --gray-600: #626976; --gray-700: #3A3F48; --gray-800: #24272E; --gray-850: #1C1F24;
  --gray-900: #15171B; --gray-950: #0C0D10;
  /* status */
  --green-100: #DDF1E4; --green-300: #3DDC97; --green-500: #00C969; --green-700: #00804F; --green-900: #0F2A1C;
  --red-100: #FEE4E2; --red-300: #FDA29B; --red-500: #F04438; --red-600: #D92D20; --red-700: #B42318; --red-900: #3A1412;
  --blue-100: #DDEBFF; --blue-300: #6EA8FE; --blue-500: #1F6FEB; --blue-700: #1A5FCC; --blue-900: #10213D;
}
```

### Theme (light, then dark)

| Token | Light | Dark |
|---|---|---|
| `--bg-base` | gray-0 | gray-950 |
| `--bg-subtle` | gray-50 | gray-900 |
| `--bg-muted` | gray-100 | gray-850 |
| `--bg-secondary` | gray-150 | gray-800 |
| `--border-default` | gray-200 | gray-800 |
| `--border-strong` | gray-300 | gray-700 |
| `--text-primary` | gray-950 | gray-50 |
| `--text-secondary` | gray-600 | gray-400 |
| `--text-head` | gray-600 | gray-400 |
| `--text-tertiary` | gray-500 | gray-500 |
| `--text-disabled` | gray-300 | gray-700 |
| `--text-inverse` | gray-0 | gray-950 |
| `--fill-inverse` | gray-900 | gray-50 |
| `--brand-primary` | gray-900 | gray-50 |
| `--brand-subtle` | gray-100 | gray-850 |
| `--brand-text` | gray-950 | gray-50 |
| `--brand-on` | gray-0 | gray-950 |
| `--success-bg` / `-dot` / `-text` / `-strong` | green-100 / green-500 / green-700 / green-700 | green-900 / green-500 / green-300 / green-700 |
| `--hold-bg` / `-dot` / `-text` / `-strong` | red-100 / red-500 / red-700 / red-600 | red-900 / red-500 / red-300 / red-600 |
| `--hold-on-strong` | gray-0 | gray-0 |
| `--danger-bg` / `-dot` / `-text` | red-100 / red-500 / red-700 | red-900 / red-500 / red-300 |
| `--info-bg` / `-dot` / `-text` / `-strong` | blue-100 / blue-500 / blue-700 / blue-500 | blue-900 / blue-500 / blue-300 / blue-500 |
| `--icon-primary` / `-secondary` / `-tertiary` | gray-950 / gray-600 / gray-500 | gray-50 / gray-400 / gray-500 |
| `--icon-inverse` | gray-0 | gray-950 |
| `--icon-on-strong` | gray-0 | gray-0 |
| `--icon-info` / `-success` / `-danger` | blue-700 / green-700 / red-700 | blue-300 / green-300 / red-300 |
| `--overlay` | gray-950 at 40% | gray-950 at 40% |

Components use theme tokens only (bg, text, icon, border). **Icons only use `icon-*` tokens.**

Dark mode: `class="dark"` on `<html>`. Theme follows the system by default; the header theme switcher and the demo controls can force light or dark.

### Mapping to shadcn variables

shadcn reads its own variable names. Point them at the theme tokens above so every shadcn component picks up the design:

| shadcn variable | Theme token |
|---|---|
| `--background` | `--bg-base` |
| `--foreground` | `--text-primary` |
| `--card`, `--popover` | `--bg-base` |
| `--card-foreground`, `--popover-foreground` | `--text-primary` |
| `--primary` | `--brand-primary` |
| `--primary-foreground` | `--brand-on` |
| `--secondary`, `--muted`, `--accent` | `--bg-subtle` |
| `--secondary-foreground`, `--accent-foreground` | `--text-primary` |
| `--muted-foreground` | `--text-secondary` |
| `--border`, `--input` | `--border-default` |
| `--ring` | `--text-primary` |
| `--destructive` | `--hold-strong` |
| `--radius` | `0rem` |

Keep the extra tokens (hold, success, info, overlay, text-head, text-tertiary) as additional Tailwind colours.

### Spacing and radius

- Spacing scale (px): 0, 2, 4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 64. Use only these.
- Radius: `none` 0, `sm` 4, `md` 8, `full` 999.
- Cards, tables, inputs, buttons, banners, drawer: **square** (radius 0).
- Fully round also: timeline markers.
- Fully round: status pills, bell button, user avatar.

### Text styles

| Style | Font | Size / line height |
|---|---|---|
| Display/Large | Hedvig Letters Serif 400 | 36 / 120% |
| Display/Medium | Hedvig Letters Serif 400 | 28 / 120% |
| Heading/Large | Instrument Sans 400 | 24 / 125% |
| Heading/Medium | Instrument Sans 500 | 18 / 140% |
| Heading/Small | Instrument Sans 500 | 16 / 140% |
| Body/Medium | Instrument Sans 400 | 14 / 145% |
| Body/Medium Strong | Instrument Sans 500 | 14 / 145% |
| Body/Small | Instrument Sans 400 | 12 / 140% |
| Body/Small Strong | Instrument Sans 500 | 12 / 140% |
| Label/XSmall Strong | Instrument Sans 500 | 11 / 140% |

Make sure the naira sign (₦) renders in both fonts.

---

## Components

Build each once and reuse. Names match Figma.

| Component | Base |
|---|---|
| Button | shadcn `button` (default = primary, outline, ghost; sizes md 36px / sm 32px; optional leading and trailing icon) |
| StatusPill | shadcn `badge`: paid (green), on-hold (blue), scheduled (grey). Dot plus text, never colour alone |
| SummaryCard | custom: value, label, optional status pill next to the label, optional description, `tone` default or muted, optional `onActivate` (whole card becomes a button) |
| Banner | custom, one component on every page (see Banner) |
| PayoutsTable | shadcn `table` from 768px up, a list below it |
| Review drawer | shadcn `sheet`: right side, 480px from 768px up, full-screen sheet below. Sticky header (title, close), scrolling body, sticky footer. Overlay `--overlay` with a slight blur |
| ReviewTimeline | custom vertical timeline with connected markers |
| Context form, reply form, file upload | `textarea`, `label`, native radios in a `fieldset`; shared drop zone and file rows |
| Sidebar | custom: 240px from 1280px, icon rail 768 to 1279px, hidden below 768px behind a header menu button (left sheet) |
| Header | custom: menu button (mobile), "Find anything..." search (768px up), theme switcher, bell with unread dot (blue), avatar |
| Alerts preview | shadcn `dialog`, full screen on mobile |
| Push notification, Toast | custom card top right; `sonner` |

---

## Routes

- `/`: Home dashboard (volume chart, balance snapshot, overview cards).
- `/payouts`: Payouts page.
- `?hold=open` on either page opens the review drawer. Every alert links to `/payouts?hold=open`.
- `/inbox`, `/inbox/[id]`: a simple made-up mail view (not imitating any real email brand). The email is real email-safe HTML.

The banner and drawer live in the shared app shell, so they behave the same on every signed-in page.

---

## Money model

Use these terms the same way everywhere:

- **Payout balance**: money from sales that hasn't been paid out yet.
- **Payout**: a transfer to her bank. Each day's sales pay out automatically on the next working day (Fri, Sat and Sun sales pay out on Monday).
- **On hold**: a payout that would normally go out but is paused.

What a hold does: payouts stop and her payout balance keeps growing. Nothing leaves her balance. Sales she makes during the hold join the balance and pay out once the review ends.

At the time of the hold:
- Thu, 26 Nov sales (₦339,825.00) were paid out Fri morning. Paid, not affected.
- Fri, 27 Nov sales (₦3,457,350.00 so far) were due to pay out Mon, 30 Nov. That payout is On hold.
- Weekend sales would also have paid out Mon, 30 Nov. While the hold is on, they join the balance.

Sales figures (one source, `salesFor(day, now)` in `lib/proto.ts`, used by Payouts and the Home chart):

| Sales day | So far (that day) | Final |
|---|---|---|
| Fri, 27 Nov | ₦3,457,350.00 | ₦4,012,875.00 |
| Sat, 28 Nov | ₦586,500.00 | ₦3,120,000.00 |
| Thu 26 to Fri 20 Nov | | ₦339,825.00, ₦369,375.00, ₦325,050.00, ₦354,600.00, ₦221,625.00, ₦369,375.00, ₦443,250.00 |

Payouts table (newest first), keyed by payout date:

| Payout date | Sales from | Amount | Status | Reference |
|---|---|---|---|---|
| Mon, 30 Nov 2026 | Fri, 27 Nov sales, so far (day two: Fri, 27 Nov and Sat, 28 Nov sales, so far) | sum of those sales | On hold while held, otherwise Scheduled | - |
| Fri, 27 Nov 2026 | Thu, 26 Nov sales | ₦339,825.00 | Paid | PO-261127-0487 |
| Thu, 26 Nov 2026 | Wed, 25 Nov sales | ₦369,375.00 | Paid | PO-261126-0451 |
| Wed, 25 Nov 2026 | Tue, 24 Nov sales | ₦325,050.00 | Paid | PO-261125-0419 |
| Tue, 24 Nov 2026 | Mon, 23 Nov sales | ₦354,600.00 | Paid | PO-261124-0388 |
| Mon, 23 Nov 2026 | Fri, 20 Nov to Sun, 22 Nov sales | ₦1,034,250.00 | Paid | PO-261123-0352 |

Rules:
- **Payout balance equals the total of the On hold rows** (Scheduled rows when there is no hold). Every amount on screen must agree.
- Recipient on every row: `GTBank •••• 4821`. Hold reference: `HLD-261127-0412`.
- A reference exists only once a payout is sent (Paid). Otherwise show "-".

---

## Prototype state

One Zustand store (`lib/store.ts`), persisted to `localStorage`. Banner, cards, rows, drawer and the Home chart are all derived from it by `derive()` in `lib/proto.ts`. Never hard-code per-screen copies.

```ts
type HoldState =
  | 'none'          // before the hold
  | 'paused'        // under review: Raven is doing the work, no action needed
  | 'info-needed'   // exception: Raven asked for more information (red)
  | 'reviewing'     // she sent the requested details; under review again
  | 'resumed';      // hold cleared

interface ProtoState {
  now: string;                    // simulated date and time
  hold: HoldState;
  drawerOpen: boolean;
  drawerView: 'summary' | 'support';
  form: { choice; note; link; files };   // shared by the context form and the reply form
  context: ContextNote | null;    // what she volunteered ("Expected this activity?")
  submission: Submission | null;  // her reply to an information request
  notifications; emails; theme;
  simulateUploadError: boolean;
  simulateSendError: boolean;
}
```

Sending context does **not** change `hold`, the banner, the cards, the update date or "Action needed: None".

---

## Colour rule

- **Blue (info)** means Raven is working on it and she doesn't need to do anything: the review banner, the On hold pill, the current timeline step.
- **Red** only means she needs to act. It appears only in the Information required state (banner). Failed uploads and failed sends use the danger colours as error messages.
- Green: Paid, and the resumed banner.

---

## Home and Payouts

Payouts page: title "Payouts", two summary cards, toolbar ("Last 30 days", "Status: All", Export), payouts table. Home: volume chart with the same two summary cards beside it, then overview cards. Both show the banner.

**Payout balance card**: value (e.g. ₦3,457,350.00), label "Payout balance", status pill (On hold / Scheduled), helper "Includes today's sales so far".

**Next payout card**:

| State | Value | Helper |
|---|---|---|
| none | Mon, 30 Nov 2026 | Sent automatically on the next working day |
| paused, reviewing | Under review | Was due Mon, 30 Nov 2026 |
| info-needed | Action required | Send the details we asked for |
| resumed | Mon, 30 Nov 2026 | Payouts are back on |

While a hold is on, the Next payout card and the On hold row open the drawer.

---

## Banner

One component on Home and Payouts, under the header. `role="status"`. Text wraps on narrow screens and the link always stays visible.

| State | Colour | Text | Link |
|---|---|---|---|
| paused, day one | blue tint | Payouts paused for review. No action needed. We'll update you by Mon, 30 Nov. | View details |
| paused, from the next day | blue tint | Payouts paused since Fri, 27 Nov 2026. We're still reviewing. We'll update you by Mon, 30 Nov. | View details |
| info-needed | solid red | We need more information to finish our review. | Provide details |
| reviewing (after her reply) | blue tint | Details received. We'll update you by Mon, 30 Nov. | View details |
| resumed | solid green | Payouts resumed. Your next payout goes out on Mon, 30 Nov 2026. | Dismiss (x) |

Every link opens the review drawer.

---

## Review drawer (under review)

Order, top to bottom:

1. **Title**: "Payouts under review"
2. **Money**: "₦3,457,350.00 on hold". Below: "Payout due Mon, 30 Nov 2026, from Fri, 27 Nov sales". Below that: "New sales are added to your balance and paid out after the review."
3. **Details**: Paused since "Fri, 27 Nov 2026, 3:12pm" (the hold time, not a payout time). Reason "Unusual activity on your account". Action needed "None". Reference "HLD-261127-0412".
4. **Progress timeline** (vertical, connected markers):
   - Payouts paused: Fri, 27 Nov, 3:12pm (done: filled marker with a check)
   - You added context: time (done; only after she sends context)
   - You sent details: time (done; only after an information reply)
   - Under review: "We're checking your recent activity" (current: blue ring with a dot, slow pulse, none with reduced motion)
   - Next update: By Mon, 30 Nov (upcoming: empty marker). Never "Decision".
5. **What you sent** (read-only; only after an information reply)
6. **Expected this activity?** (see below)
7. **What happens next**:
   - You can keep accepting payments as usual.
   - We'll update you by Mon, 30 Nov, even if we're still reviewing.
   - If we need anything from you, we'll ask.
   - No update by then? Contact support and we'll prioritise your review.
8. **Footer**: "Contact support" (ghost) left, "Close" (outline) right. Contact support switches the drawer to a pre-filled message that includes the hold reference (Back, Send message; sending shows a toast "Message sent. We'll reply by email.").

Keyboard: the drawer traps focus, Esc closes it, focus returns to whatever opened it (banner link, card, row).

### Expected this activity? (the mistake path)

How she says "this hold is a mistake" without disputing it. Optional. It doesn't change her status, doesn't turn anything red and doesn't promise a faster release.

- Heading "Expected this activity?". Body "If you know why your sales went up, tell us. It can help us finish the review." Button "Tell us what happened" (outline).
- The button expands an inline form in the drawer (focus moves to the first option):
  - Required radio group "What caused the increase?": A promotion or sale, Seasonal demand, A new product or launch, Something else
  - Optional textarea "Anything else we should know?"
  - Optional link and optional files (same upload component and states as everywhere)
  - Cancel, "Send to review team" (disabled until a reason is picked)
- After sending: toast "Sent. We've added this to your review."; the section becomes a read-only summary "You told us: A promotion or sale" with the time sent, the note and link; the timeline gets "You added context". Banner, cards, update date and "Action needed: None" stay the same.
- "Simulate submit failure": keep what she typed and show "Couldn't send. Try again."

### More information needed (exception, red)

- Banner turns red (see Banner). Next payout card: "Action required", "Send the details we asked for".
- Drawer title "More information needed":
  - What we need: "Tell us what caused the recent increase in activity, and add anything that shows it."
  - Why: "This helps us confirm the increase came from real customers."
  - After you send it: "We'll update you within one working day of receiving it."
  - Your reply: textarea (required) and files. If she already sent context, the reply starts from it ("We've added what you already told us. Edit it if you like.").
  - Footer: Contact support, Cancel, Submit.
- States: uploading with progress, upload failed with Retry, file rejected (type / over 10MB), sending (spinner, fields locked), send failed ("Couldn't send. Try again.", text kept).
- After sending: toast and banner "Details received. We'll update you by Mon, 30 Nov." (blue). The drawer shows what she sent, read-only, with "Action needed: None".

### Hold lifted

Drawer title "Hold lifted": the balance, "Payout scheduled", hold lifted date, next payout date. No form.

---

## Alerts

Same message as the day-one banner. **No amount, nothing sensitive**: lock screens show them.

- **Push**: title "Payouts paused for review", body "No action needed. We'll update you by Mon, 30 Nov."
- **SMS**: "Raven: Your payouts are paused for review. No action needed. We'll update you by Mon, 30 Nov. Details: raven.ng/h/HLD-261127-0412"
- **Email**: subject "Your payouts are paused for review". Body says the same thing, plus the reference and a "View details" button. Black text on white, one black button.
- Tapping any of them opens `/payouts?hold=open`: banner visible, drawer open.

When Raven asks for more information, a push and email "More information needed" also link to `/payouts?hold=open`. When the hold is lifted, a "Payouts resumed" notification.

### Alerts preview

"Show alerts" in the demo controls opens a panel with the three alerts as she'd see them: push on a phone lock screen, SMS in a messages thread, and the email. Each has "Open", which goes to `/payouts?hold=open` with the drawer open.

---

## Mobile (below 768px)

- Sidebar hidden behind a menu button in the header (left sheet; closes after navigating).
- Banner text wraps; the link stays visible.
- Summary cards stack.
- Payouts table becomes a list: date and status on the left, amount on the right, the sales note below. On hold items open the drawer.
- The drawer is a full-screen sheet with a sticky header and footer.
- Checked at 390px wide with the drawer open, light and dark. No horizontal scroll.

---

## Demo controls

A small floating panel, hidden by default, toggled with `Shift + D` (ignored while typing). Not part of the product.

- **Place hold**: now = Fri, 27 Nov 2026, 3:12pm; fires push, email and notification; banner day one
- **Request information**: the exception (only while under review); banner red
- **Clear hold**: acts as the reviewer; now = Sat, 28 Nov 2026, 10:05am (or later); hold resumed
- **Next day**: now = Sat, 28 Nov 2026, 9:30am with the hold still on; day-two banner, balance grows with Saturday's sales
- **Show alerts**: the alerts preview
- Theme (system, light, dark), simulate upload failure, simulate submit failure
- **Reset**: back to none, Fri, 27 Nov 2026, 3:00pm

Demo script:
1. Normal Home and Payouts, Friday afternoon
2. Place hold: push, bell dot, blue banner. Show alerts: push, SMS, email; Open one
3. Drawer: what's on hold, progress, what happens next. Nothing to do
4. "Tell us what happened": pick a reason, add a note, send. Timeline updates, nothing else changes
5. Next day: day-two banner, balance includes Saturday's sales
6. Optional: Request information (red), reply pre-filled from the context, Submit, banner back to blue
7. Clear hold: green banner, Mon, 30 Nov payout Scheduled

---

## Quality bar

- Every surface tells the same story: banner, both cards, the table row, the drawer and all three alerts
- Payout balance equals the On hold rows
- No amount in any alert
- Red only in the Information required state
- Keyboard: drawer traps focus, Esc closes it, focus returns to the opener; forms fully usable by keyboard and labelled for screen readers
- Screen readers: banner is `role="status"`, drawer is a labelled dialog, timeline steps announce done / in progress / upcoming, status pills have text
- Light and dark; desktop (1024 to 1440px) and 390px mobile; no horizontal scroll
- No em dashes in copy

## Out of scope

- Anything after the first review: reminders, holds that stay, a "continue restriction" outcome, several days on hold
- Failed payouts
- Other hold reasons (refunds, missing documents, bank change)
- The internal reviewer tool (the demo controls stand in for it)
- Instant or early payouts
- Real email or SMS sending, real support messaging

## Deploy

GitHub `AbimbolaPelumi/raven` (private), deployed on Vercel. Production builds use webpack (`next build`); Turbopack is used for `next dev` only.
