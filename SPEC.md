# Raven Payouts: hold prototype (build spec for Claude Code)

## What this is

A working web prototype for a take-home exercise: **a merchant's payout is put on hold, designed for the moment the hold starts.**

Raven is a made-up payments processor. The merchant is Tolu Adeyemi, owner of Tolu Atelier, a clothing brand in Lagos. Her Black Friday sales spiked, the system flagged it as unusual, and her payouts were paused on Fri, 27 Nov 2026 at 3:12pm. The hold is a false alarm she can clear by explaining what happened.

The prototype covers only this moment:
1. The hold starts and she finds out (push notification, email, in-app banner)
2. She shares details
3. We review, and the false alarm is cleared

It must feel like a real app, and let the presenter move through each step live.

Design source of truth: Figma file `L50Kr8t31v51771stuErq0` (use the Figma MCP to read nodes).

| Screen | Node |
|---|---|
| Payouts, hold active (light) | `3:573` |
| Payouts, hold active (dark) | `25:694` |
| Hold details drawer | `53:2938` |
| Hold started today | `42:2855` |
| Details sent | `42:3198` |
| Hold lifted | `42:3528` |
| Components | `3:452` |

When Figma and this spec disagree, follow Figma for visuals and this spec for behaviour and copy. Ignore any other frames in the Figma file.

---

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS, configured to read the CSS variables below (no raw hex values in components)
- **shadcn/ui as the component base.** Install with `npx shadcn@latest init`, then add only what is needed: `button`, `badge`, `table`, `sheet`, `textarea`, `label`, `tooltip`, `dropdown-menu`, `sonner`, `skeleton`, `separator`, `avatar`. Restyle them to match Figma; do not ship default shadcn looks.
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
| `--overlay` | gray-950 at 40% | gray-950 at 40% |

Dark mode: `class="dark"` on `<html>`, toggled from the demo controls.

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
- Fully round: status pills, bell button, user avatar.

### Text styles

| Style | Font | Size / line height |
|---|---|---|
| Display/Large | Hedvig Letters Serif 400 | 36 / 120% |
| Display/Medium | Hedvig Letters Serif 400 | 28 / 120% |
| Heading/Large | Instrument Sans 400 | 24 / 125% |
| Heading/Small | Instrument Sans 500 | 16 / 140% |
| Body/Medium | Instrument Sans 400 | 14 / 145% |
| Body/Medium Strong | Instrument Sans 500 | 14 / 145% |
| Body/Small | Instrument Sans 400 | 12 / 140% |
| Body/Small Strong | Instrument Sans 500 | 12 / 140% |
| Label/XSmall Strong | Instrument Sans 500 | 11 / 140% |

Make sure the naira sign (₦) renders in both fonts.

---

## Components

Build each once and reuse. Names match Figma. Where a shadcn component exists, extend it rather than writing from scratch:

| Component | shadcn base |
|---|---|
| Button | `button` (variants: default = primary, outline, ghost; add sizes md/sm) |
| StatusPill | `badge` (add variants paid, on-hold, scheduled; rounded-full) |
| PayoutsTable | `table` |
| Drawer | `sheet` (side right, full height, no inset, custom overlay) |
| Reason field | `textarea` + `label` |
| Toast | `sonner` |
| Tooltip | `tooltip` |
| Business switcher, filters | `dropdown-menu` |
| Avatars | `avatar` |
| Loading bars | `skeleton` (square) |

Banner, SummaryCard, DetailRow, Sidebar, Header, SystemNotification, drop zone and the demo controls are custom.

- **Button**: `variant` primary | outline | ghost, `size` md (36px) | sm (32px), `disabled`, optional leading and trailing icon. Outline has a `--bg-base` background and `--border-default` border. Hover: outline and ghost use `--bg-subtle`.
- **StatusPill**: paid | on-hold | scheduled. Rounded, tinted background, small dot, 11px medium label.
- **Banner**: full-width strip under the header. States below.
- **SummaryCard**: value, label, optional description, `tone` default | muted.
- **PayoutRow / PayoutsTable**: columns Payout for, Status, Settled amount, Payout amount, Recipient, Reference, actions (···). 44px rows, lines between rows only, no vertical lines. Clicking an On hold row opens the hold drawer.
- **Sidebar**: 240px. Business switcher at top (Tolu Atelier, email), main links (Home, Payments, Payouts, Customers, Disputes, Refunds), bottom group (Developers, Settings). Active item: `--brand-subtle` background.
- **Header**: 70px, "Find anything..." search, round bell with unread dot, user avatar.
- **Drawer**: full viewport height, 520px wide, right edge, `--bg-base`, left border. Fixed header (title, close), scrolling body, fixed footer. Overlay `--overlay`. Closes on Esc, overlay click and close button. Traps focus.
- **DetailRow**: label left (secondary), value right (primary).
- **SystemNotification** and **Toast**: see Alerts.

---

## Routes

- `/payouts`: main screen. `?hold=open` opens the drawer.
- `/inbox`: a simple made-up mail view (not imitating any real email brand) listing Raven emails.
- `/inbox/[id]`: one email, rendered from real email-safe HTML so it also looks right at 375px.
- `/`: Home dashboard (volume chart, balance snapshot, overview cards). The hold banner and review modal appear here too, via the shared app shell.

---

## Prototype state

One store drives everything:

```ts
type HoldState =
  | 'none'          // before the hold
  | 'paused'        // hold started, waiting for the merchant
  | 'reviewing'     // merchant sent details
  | 'resumed';      // false alarm cleared

interface ProtoState {
  now: string;              // simulated date and time
  hold: HoldState;
  drawerOpen: boolean;
  form: { reason: string; files: UploadFile[] };
  notifications: Notification[];
  emails: Email[];
  theme: 'light' | 'dark';
  simulateUploadError: boolean;
  simulateSendError: boolean;
}
```

Banner, cards, table rows and drawer content are all derived from this state. Never hard-code per-screen copies.

---

## Data

Merchant: Tolu Atelier. Recipient on every row: `GTBank •••• 4821`. Hold reference: `HLD-261127-0412`.

Rows (newest first):

| Payout for | Settled | Payout | Reference |
|---|---|---|---|
| Fri, 27 Nov 2026 | ₦3,457,350.00 | ₦3,457,350.00 | (set by state) |
| Thu, 26 Nov 2026 | ₦339,825.00 | ₦339,825.00 | PO-261127-0487 |
| Wed, 25 Nov 2026 | ₦369,375.00 | ₦369,375.00 | PO-261126-0451 |
| Tue, 24 Nov 2026 | ₦325,050.00 | ₦325,050.00 | PO-261125-0419 |
| Mon, 23 Nov 2026 | ₦354,600.00 | ₦354,600.00 | PO-261124-0388 |
| Sun, 22 Nov 2026 | ₦221,625.00 | ₦221,625.00 | PO-261123-0352 |
| Sat, 21 Nov 2026 | ₦369,375.00 | ₦369,375.00 | PO-261123-0351 |
| Fri, 20 Nov 2026 | ₦443,250.00 | ₦443,250.00 | PO-261121-0318 |

All rows except Fri 27 are Paid.

Rules:
- Payouts are automatic and go out the next working day for the previous day's sales. There is no row for today's sales.
- The Payout balance card equals the sum of On hold rows. Every amount on screen must agree.
- Dates use the Nigerian format with weekday and year: `Fri, 27 Nov 2026`.
- Never show an exact payout time.

By state:

| | none / paused (Fri 27, same day) | reviewing (same day or next) | resumed (Sat 28) |
|---|---|---|---|
| Fri 27 row | not shown (today's sales) | shown as On hold, reference "–" once it is Sat 28 | Scheduled, reference "Assigned when sent" |
| Payout balance card | ₦0.00, muted | ₦3,457,350.00, "On hold" once it is Sat 28 | ₦3,457,350.00, "Scheduled" |
| Next payout card | none: normal date / paused: "Paused", "Currently paused due to a hold on your account" | "Paused", "We're reviewing your details" | "Mon, 30 Nov 2026", "Payouts are back on" |

Open decision: the Payout balance description on the day the hold starts. Leave it empty until the designer confirms.

---

## Payouts page layout

1. Banner (if any)
2. Title "Payouts" (Display/Medium) and subtitle "Money from your sales, sent to your account."
3. Two summary cards: **Payout balance** and **Next payout**
4. Toolbar: left "Last 30 days" (calendar icon, chevron) and "Status: All" (chevron) as outline buttons; right "Export" outline button with download icon
5. Payouts table

---

## Banner copy

| State | Colour | Text | Action |
|---|---|---|---|
| paused, same day | hold-strong | **Payouts paused.** Share a few details so we can review and resume them. | Share details (opens drawer) |
| paused, from the next day | hold-strong | **Payouts paused since Fri, 27 Nov 2026.** Share a few details so we can review and resume them. | Share details |
| reviewing | info-strong | **We're reviewing your details.** We'll reply within one working day. | View details |
| resumed | success-strong | **Payouts resumed.** Your next payout goes out on Mon, 30 Nov 2026. | Dismiss (x) |

Text on strong colours is always `--hold-on-strong` (white), in both themes. Show the start date only from the day after the hold started.

---

## Hold details drawer

Opened from the banner, an On hold row, the push notification or the email.

- **Header:** "Payout hold", close button
- **Amount:** the Payout balance (Display/Large), "Payout balance on hold"
- **Details:** Paused since `Fri, 27 Nov 2026, 3:12pm`; Reason `Unusual activity on your account`
- **Help us clear this faster**
  - Field "What caused the change?" (textarea), placeholder "For example, a sale, a campaign or a large order"
  - "Supporting files" (Optional): drop zone, "Drop files here or browse", "PDF, JPG or PNG, up to 10MB each"
- **What happens next:** "We'll reply within one working day, including weekends."
- "Questions? Contact support · Ref HLD-261127-0412"
- **Footer:** Cancel (outline), Submit (primary)

Drawer states:
- **Empty:** Submit disabled until the reason has text.
- **Uploading:** file row with progress; can remove.
- **Upload failed:** file row in danger colours, "Couldn't upload. Try again." with Retry. File too large: "This file is over 10MB."
- **Sending:** button shows a spinner, fields locked.
- **Submit failed:** inline error above the footer, "We couldn't submit your details. Try again.", details kept.
- **Submitted:** drawer closes, toast "Details submitted. We'll reply within one working day.", banner switches to reviewing.
- **Reviewing (reopened):** read-only summary of what she submitted, with the time it was submitted.
- **Resumed (reopened):** "Hold lifted" with the date, next payout date, no form.

Copy stays generic: it must make sense for any business, not just a clothing brand. Do not apologise for the hold; the check was working as intended.

---

## Alerts

### Push notification (in-app system notification)

Appears top right when the hold starts, styled like a desktop system notification but without any real OS or brand look.

- **Title:** Payouts paused
- **Body:** Share a few details so we can review and resume them.
- Click: navigates to `/payouts?hold=open`.
- At the same time: bell gets an unread dot, banner appears, email arrives in `/inbox`.

When the hold is lifted, a second notification: **Payouts resumed**, "Your next payout goes out on Mon, 30 Nov 2026."

### Email

- **From:** Raven
- **Subject:** Your payouts are paused
- **Preview:** Share a few details so we can resume them
- **Body:**
  - Heading: Your payouts are paused
  - We're reviewing recent activity on your account. Your money is safe, and customers can still pay you.
  - Help us review it faster by telling us what caused the change, for example a sale, a campaign or a large order.
  - Button: Share details (links to `/payouts?hold=open`)
  - We'll reply within one working day, including weekends.
  - Footer: Hold reference HLD-261127-0412 · Questions? Contact support
- **Never show an amount** in the alert. On the day of the hold no payout is on hold yet, so any number would disagree with the dashboard.
- Black text on white, one black button.

---

## Demo controls

A small floating panel, hidden by default, toggled with `Shift + D`. Not part of the product; the presenter uses it.

- **Place hold** (sets now to Fri, 27 Nov 2026, 3:12pm; fires push + email; banner paused)
- **Clear hold** (acts as the reviewer; sets now to Sat, 28 Nov 2026, 10:05am; hold resumed; fires the resumed notification)
- Toggles: light/dark, simulate upload failure, simulate submit failure
- **Reset** (back to none, Fri, 27 Nov 2026, 3:00pm)

Demo script:
1. Normal Payouts page, Friday afternoon
2. Place hold: notification, bell dot, banner
3. Open `/inbox`, open the email, Share details
4. Drawer: type a reason, upload a file, Send
5. Banner: reviewing
6. Clear hold: banner resumed, Fri 27 row Scheduled, Next payout Mon, 30 Nov 2026

---

## Quality bar

- Every number agrees across banner, cards, table and drawer
- Keyboard: everything reachable, visible focus, Esc closes drawer
- Screen readers: banner is `role="status"`, drawer is a labelled dialog, status pills have text
- Contrast: white on strong colours passes AA
- Works at 1440px and down to 1024px; the email works at 375px
- No layout shift when switching states

## Out of scope

- Anything after the hold starts beyond the first review: reminders, more information requests, holds that stay, several days on hold
- Failed payouts, loading, empty states
- Other hold reasons (refunds, missing documents, bank change)
- The internal reviewer tool (the demo controls stand in for it)
- Instant or early payouts
- Mobile layout of the dashboard
- Real email sending

## Deploy

1. `npx create-next-app@latest raven-payouts --ts --tailwind --app`
2. Build as above
3. Push to GitHub, import the repo in Vercel, deploy with defaults
4. Share the Vercel URL and the Figma link in the submission
