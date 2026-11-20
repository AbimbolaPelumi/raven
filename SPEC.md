# Raven Payouts: hold prototype (build spec for Claude Code)

## What this is

A working web prototype for a take-home exercise about **one moment: a merchant in the first 24 hours after her payouts are put on hold.**

Raven is a made-up payments processor. The merchant is Tolu Adeyemi, owner of Tolu Atelier, a clothing brand in Lagos. Her Black Friday sales jumped about 10x, the system flagged it, and her payouts were paused on Fri, 27 Nov 2026 at 3:12pm. It's a false alarm: the sales are real. Salaries and a supplier are due Mon, 30 Nov.

**Main idea: Raven does the review.** By default she has nothing to do. Raven promises a date for the next update (within 24 hrs of the hold), shown in hours, not a date, not a release date. She can add context if she knows of anything that explains it, (Raven asking for more information is out of scope for this prototype).

The prototype covers:
1. The hold starts and she finds out (push, SMS, email, in-app banner), all saying the same thing
2. She opens the details: what's on hold, why, progress, what happens next
3. Optionally, she tells Raven what happened ("Expected this activity?")
4. Raven clears the hold

Out of scope: Raven asking her for more information or documents (an information-required state). Removed from the prototype.

It must feel like a real app on desktop and on her phone, and let the presenter move through each step live.

Design source of truth: Figma file `L50Kr8t31v51771stuErq0` (use the Figma MCP to read nodes). Where Figma and this spec disagree, follow Figma for visuals and this spec for behaviour and copy.

Copy rules: no em dashes anywhere. **Never hint at what the unusual activity was** (no "sales went up", "increase", "spike"): the app only ever says "unusual activity" or "recent activity on your account". Use concrete timings ("within 24 hrs"); updates are promised in hours, never as a date. Live surfaces (banner, timeline) count down to 24 hrs after the hold (day two at 9:30am shows "within 6 hrs"), never above 24 hrs and only once a hold is placed; the alerts always say "within 24 hrs", never "one working day". Dates use the Nigerian format, e.g. "Fri, 27 Nov 2026". Never show an exact payout time. Don't apologise for the hold.

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
  --yellow-100: #FEF0C7; --yellow-300: #FEC84B; --yellow-500: #F79009; --yellow-700: #B54708; --yellow-900: #3D2A07;
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
| `--pending-bg` / `-dot` / `-text` | yellow-100 / yellow-500 / yellow-700 | yellow-900 / yellow-500 / yellow-300 |
| `--icon-info` / `-success` / `-danger` / `-pending` | blue-700 / green-700 / red-700 / yellow-700 | blue-300 / green-300 / red-300 / yellow-300 |
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
| StatusPill | shadcn `badge`: paid (green), on-hold (red), pending (yellow). Dot plus text, never colour alone |
| SummaryCard | custom: title on top, value, then a plain secondary sentence, not clickable |
| Banner | custom, one component on every page (see Banner) |
| PayoutsTable | shadcn `table` from 768px up (Recipient hidden below 1024px), a list below it. No row menu: an On hold row opens the drawer on click. Hovering a Reference cell (Paid rows) reveals a small round copy button at its right edge (also shown on keyboard focus, and always on touch screens); copying shows "Reference copied" and the icon briefly turns into a check. Proportional columns, all left-aligned |
| Review drawer | shadcn `sheet`: right side, 480px from 768px up, full-screen sheet below. Sticky header (title, close), scrolling body, sticky footer. Overlay `--overlay` with a slight blur |
| ReviewTimeline | custom vertical timeline with connected markers |
| Context form, file upload | `textarea`, `label`, native radios in a `fieldset`; shared drop zone and file rows |
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
- **Payout**: a transfer to her bank for **one day's sales**, paid automatically on the next working day. Payouts are never summed across days, so each one reconciles to exactly one day of sales. Fri, Sat and Sun sales are three separate payouts, all on Monday.
- **On hold**: a payout that would normally go out but is paused.

What a hold does: payouts stop and her payout balance keeps growing. Nothing leaves her balance. Sales she makes during the hold join the balance and pay out once the review ends.

At the time of the hold:
- Thu, 26 Nov sales (₦339,825.00) were paid out Fri morning. Paid, not affected.
- Fri, 27 Nov sales (₦3,457,350.00 so far) were due to pay out Mon, 30 Nov. That payout is On hold.
- Each day's sales are their own payout, made on the next working day. Payouts are never combined, and there is no payout for the current day: on Sat, 28 Nov only Friday's payout exists (Saturday's sales become a payout once the day is over). Friday's payout stays ₦3,457,350.00.

Sales figures (one source, `salesFor(day, now)` in `lib/proto.ts`, used by Payouts and the Home chart):

| Sales day | So far (that day) | Final |
|---|---|---|
| Fri, 27 Nov | ₦3,457,350.00 | ₦3,457,350.00 (fixed) |
| Sat, 28 Nov | ₦586,500.00 | ₦3,120,000.00 |
| Thu 26 to Fri 20 Nov | | ₦339,825.00, ₦369,375.00, ₦325,050.00, ₦354,600.00, ₦221,625.00, ₦369,375.00, ₦443,250.00 |

Payouts table (newest first): **one row per sales day**. Columns: Payout for (the sales day), Status, Amount, Recipient, Reference. No actions menu. The payout date isn't a column; each day's payout goes out on the next working day.

| Payout for | Amount | Status | Reference |
|---|---|---|---|
| Fri, 27 Nov 2026 | ₦3,457,350.00 (unchanged after Next day) | On hold while held, otherwise Pending | - |
| Thu, 26 Nov 2026 | ₦339,825.00 | Paid | PO-261127-0487 |
| Wed, 25 Nov 2026 | ₦369,375.00 | Paid | PO-261126-0451 |
| Tue, 24 Nov 2026 | ₦325,050.00 | Paid | PO-261125-0419 |
| Mon, 23 Nov 2026 | ₦354,600.00 | Paid | PO-261124-0388 |
| Sun, 22 Nov 2026 | ₦221,625.00 | Paid | PO-261123-0352 |
| Sat, 21 Nov 2026 | ₦369,375.00 | Paid | PO-261123-0351 |
| Fri, 20 Nov 2026 | ₦443,250.00 | Paid | PO-261123-0350 |

Rules:
- **Payout balance equals the total of the On hold rows** (Pending rows when there is no hold). Every amount on screen must agree.
- Recipient on every row: `GTBank •••• 4821`. Hold reference: `HLD-261127-0412`.
- A reference exists only once a payout is sent (Paid). Otherwise show "-".

---

## Prototype state

One Zustand store (`lib/store.ts`), persisted to `localStorage`. Banner, cards, rows, drawer and the Home chart are all derived from it by `derive()` in `lib/proto.ts`. Never hard-code per-screen copies.

```ts
type HoldState =
  | 'none'          // before the hold
  | 'paused'        // under review: Raven is doing the work, no action needed
  | 'resumed';      // hold cleared

interface ProtoState {
  now: string;                    // simulated date and time
  hold: HoldState;
  drawerOpen: boolean;
  drawerView: 'summary' | 'support';
  form: { choice; note; files };   // the context form
  context: ContextNote | null;    // what she volunteered ("Expected this activity?")
  notifications; emails; theme;
  simulateUploadError: boolean;
  simulateSendError: boolean;
}
```

Sending context does **not** change `hold`, the banner, the cards or the update date.

---

## Colour rule

Colour follows the payout status, and the banner matches it:

- **Red: On hold.** The On hold pill, and the banner while payouts are on hold (always filled solid red, never a tint). Failed uploads and sends also use the danger colours.
- **Yellow: Pending.** The Pending pill on a payout that is due and not on hold (replaces "Scheduled").
- **Green:** Paid, and the resumed banner.
- Blue is only used for the current step on the review timeline.

---

## Home and Payouts

Payouts page: title "Payouts", the Next payout card (full width), toolbar ("Last 30 days", "Status: All", Export), payouts table. Home: title "Home" with a "Last 30 days" outline dropdown (7 / 30 / 90 days), then one grid of cards with no section headings (3 columns wide: Gross volume spanning 2 columns and 2 rows beside Next payout and Payments; then Successful payments, Average order value, New customers. Recent payments and Top customers are hidden). Chart style: current period in brand blue (the only chart colour), previous period in light grey, dashed average line, dashed grid, square-swatch legend "Current / Previous / Average", the change shown as plain grey text after the value ("+29.9% vs previous period"), payment breakdown and payment pills use status colours that match each other (Succeeded green, Refunded blue, Failed red), no card footers. Both pages show the banner.

One summary card, **Next payout** (it replaces the separate Payout balance and Next payout cards):

- Title: "Next payout"
- Value: the amount of the next payout, i.e. the payout balance (e.g. ₦3,457,350.00, unchanged after Next day)
- Under the value, a plain secondary sentence (no colour, not a badge), counting the payouts:
  - On hold: "You have 1 payout on hold" (still 1 after Next day; it counts past sales days only)
  - No hold: "You have 1 pending payout, due Mon, 30 Nov 2026" (the due date only when not on hold)
  - Nothing due: "You have no pending payouts"

The card is not clickable. While a hold is on, the banner link and the On hold rows open the drawer.

---

## Banner

One component on Home and Payouts, under the header. The header and banner are pinned together at the top while the page scrolls. `role="status"`. Always a filled colour (white text), never a subtle tint. Text wraps on narrow screens and the link always stays visible. Links are underlined; on hover (mouse only) the underline sweeps out to the right and back in from the left (transform only, about 560ms), it never disappears or thickens.

| State | Colour | Text | Link |
|---|---|---|---|
| paused, day one | solid red | Payouts paused while we review recent activity on your account. No action needed. We'll update you within 24 hrs. | View details |
| paused, from the next day | solid red | Payouts paused since Fri, 27 Nov 2026. We're still reviewing. We'll update you within 6 hrs. | View details |
| resumed | solid green | Payouts resumed. Your next payout goes out on Mon, 30 Nov 2026. | Dismiss (x) |

Every link opens the review drawer.

---

## Review drawer (under review)

Order, top to bottom:

1. **Title**: "Payouts paused". The account activity is under review, never the payouts: copy never says "payouts under review" or "paused for review".
2. **Money**: "₦3,457,350.00 on hold" (the payout balance). Below: the count and the first to last day, which reads the same however long the hold lasts: "1 payout, for Fri, 27 Nov"; after Next day it is still "1 payout, for Fri, 27 Nov" (no payout for the current day); after five days it would be "5 payouts, for Fri, 27 Nov to Tue, 1 Dec". No due date: a held payout isn't due until the review ends. Below that, the only "what happens next" line: "You can keep accepting payments as usual, and new sales are paid out after the review."
3. **Details**: Paused since "Fri, 27 Nov 2026, 3:12pm" (the hold time, not a payout time). Reason "Unusual activity on your account". Reference "HLD-261127-0412".
4. **Progress timeline** (vertical, connected markers; the connector is solid up to the current step and dotted after it, with clearly spaced dots):
   - Payouts paused: Fri, 27 Nov, 3:12pm (done: filled marker with a check)
   - You added context: time (done; only after she sends context)
   - Reviewing account activity: "We're checking recent activity on your account" (current: blue ring with a dot and a soft one-way ripple every 2.4s, transform and opacity only, none with reduced motion)
   - Next update: Within 24 hrs (upcoming: empty marker). Never "Decision".
5. **Expected this activity?** (see below)
6. **Footer**: "Contact support" (ghost) left, "Close" (outline) right. Contact support is a `mailto:` link that opens her email app with the recipient (support@raven.ng), subject "Paused payouts (HLD-261127-0412)" and a short body including the reference pre-filled. It doesn't open anything inside the app. The email's "Contact support" link does the same.

Keyboard: the drawer traps focus, Esc closes it, focus returns to whatever opened it (banner link, card, row).

### Expected this activity? (the mistake path)

How she says "this hold is a mistake" without disputing it. Optional. It doesn't change her status, doesn't turn anything red and doesn't promise a faster release.

- Heading "Expected this activity?". Body "If something recent explains the activity on your account, you can tell us." Button "Tell us what happened" (outline).
- The button opens the form as a modal on top of the drawer (focus moves to the first option; Esc, Cancel or X closes it and returns focus to the button):
  - Required radio group "What might explain it?": A promotion or campaign, A new product or service, A change to how I sell, Something else
  - Optional textarea "Anything else we should know?"
  - Optional "Attachments" upload (same upload component and states as everywhere). No link field
  - Cancel, "Submit" (disabled until a reason is picked)
- After Submit: the modal closes, toast "Sent. We've added this to your review."; in the drawer the section becomes a read-only summary "You told us: A promotion or campaign" with the time sent, the note and any attachments; the timeline gets "You added context". Banner, cards and update date stay the same.
- "Simulate submit failure": keep what she typed and show "Couldn't send. Try again."

### Hold lifted

Drawer title "Hold lifted": the balance, "Payout pending", hold lifted date, next payout date. No form.

---

## Alerts

Same message as the day-one banner. **No amount, nothing sensitive**: lock screens show them.

- **Push**: title "Payouts paused", body "We're reviewing recent activity on your account. No action needed. We'll update you within 24 hrs."
- **SMS** (147 characters, fits one 160-character SMS): "Raven: Payouts paused while we review recent activity on your account. No action needed. We'll update you within 24 hrs. raven.ng/h/HLD-261127-0412"
- **Email**: subject "Your payouts are paused". Body says the same thing, plus the reference and a "View details" button. Black text on white, one black button.
- Tapping any of them opens `/payouts?hold=open`: banner visible, drawer open.


### Alerts preview

"Show alerts" in the demo controls opens a panel with the three alerts as she'd see them: push on a phone lock screen, SMS in a messages thread, and the email. Each has "Open", which goes to `/payouts?hold=open` with the drawer open.

---

## Mobile (below 768px)

- Sidebar hidden behind a menu button in the header (left sheet; closes after navigating).
- Banner text wraps; the link stays visible.
- Summary cards stack.
- Payouts table becomes a grouped list in the same style as the table and cards (each group a square bordered container with lines between rows): sections "Upcoming" (On hold and Pending) and "Paid". Each row: a round status icon on a tinted background (Paid: check, green; On hold: pause, red; Pending: clock, yellow), the amount with "Status • reference" under it (reference only once paid), and the "Payout for" date on the right without the weekday (e.g. "27 Nov 2026"). On hold rows open the drawer.
- The drawer is a full-screen sheet with a sticky header and footer.
- Checked at 390px wide with the drawer open, light and dark. No horizontal scroll.

---

## Demo controls

A small floating panel, hidden by default, toggled with `Shift + D` (ignored while typing). Not part of the product.

- **Place hold**: now = Fri, 27 Nov 2026, 3:12pm; fires push, email and notification; banner day one
- **Clear hold**: acts as the reviewer; now = Sat, 28 Nov 2026, 10:05am (or later); hold resumed
- **Next day**: now = Sat, 28 Nov 2026, 9:30am with the hold still on; day-two banner. No new payout row (Saturday is the current day), balance stays ₦3,457,350.00
- **Show alerts**: the alerts preview
- Theme (system, light, dark), simulate upload failure, simulate submit failure
- **Reset**: back to none, Fri, 27 Nov 2026, 3:00pm

Demo script:
1. Normal Home and Payouts, Friday afternoon
2. Place hold: push, bell dot, solid red banner, Next payout card On hold. Show alerts: push, SMS, email; Open one
3. Drawer: what's on hold, progress, what happens next. Nothing to do
4. "Tell us what happened": pick a reason, add a note, send. Timeline updates, nothing else changes
5. Next day: day-two banner; still one payout on hold (no payout for the current day)
6. Clear hold: green banner, the held payouts go back to Pending

---

## Quality bar

- Every surface tells the same story: banner, both cards, the table row, the drawer and all three alerts
- Payout balance equals the On hold rows
- No amount in any alert
- Colour follows status: On hold red (banner too), Pending yellow, Paid green
- Keyboard: drawer traps focus, Esc closes it, focus returns to the opener; forms fully usable by keyboard and labelled for screen readers
- Screen readers: banner is `role="status"`, drawer is a labelled dialog, timeline steps announce done / in progress / upcoming, status pills have text
- Light and dark; desktop (1024 to 1440px) and 390px mobile; no horizontal scroll
- No em dashes in copy

## Out of scope

- Raven asking for more information or documents (information-required state)
- Anything after the first review: reminders, holds that stay, a "continue restriction" outcome, several days on hold
- Failed payouts
- Other hold reasons (refunds, missing documents, bank change)
- The internal reviewer tool (the demo controls stand in for it)
- Instant or early payouts
- Real email or SMS sending, real support messaging

## Deploy

GitHub `AbimbolaPelumi/raven` (private), deployed on Vercel. Production builds use webpack (`next build`); Turbopack is used for `next dev` only.
