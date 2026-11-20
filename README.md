# Raven Payouts: hold prototype

A working prototype of a merchant's payout being put on hold: the hold starts, she shares
details, and the false alarm is cleared. Build spec: [SPEC.md](SPEC.md). All data is local
fixtures, there is no backend.

## Run

Needs Node 20.19+ or 22.12+ (Tailwind v4 requires it; Node 18 fails with a "require() of ES Module magic-string" error). `nvm use` picks up `.nvmrc`.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

## Presenting

Press **Shift + D** to show or hide the demo panel (it is ignored while you are typing in a field).

1. Normal Home dashboard (`/`) and Payouts page, Friday afternoon
2. **Place hold**: push notification, bell dot, banner
3. Open `/inbox`, open the email, **Share details**
4. Drawer: type a reason, upload a file, **Submit**
5. Banner switches to reviewing
6. **Clear hold**: banner resumed, Fri 27 row Scheduled, Next payout Mon, 30 Nov 2026

The panel also has: theme (system by default, or force light/dark), simulate upload failure, simulate submit failure and **Reset**. State is kept in
`localStorage`, so a full page reload keeps your place.

## Where things live

- `lib/proto.ts`: types, simulated time, fixtures and `derive()`. Banner, cards, table rows and
  drawer all read from this one function, so every number agrees.
- `lib/store.ts`: the Zustand store (hold state machine, simulated uploads and sending).
- `app/(app)/layout.tsx` + `components/app-shell.tsx`: the chrome shared by Home (`/`) and Payouts
  (`/payouts`): sidebar, header, hold banner and the review-details modal, plus the `?hold=open` URL sync.
- `lib/dashboard.ts`: Home data. Daily volume comes from the same payout fixtures as the Payouts
  table (so the numbers always agree); earlier days are deterministic filler.
- `app/globals.css`: primitive and theme tokens, shadcn variable mapping, text styles.
- `components/`: app components. `components/ui/` is shadcn, restyled to the design.
