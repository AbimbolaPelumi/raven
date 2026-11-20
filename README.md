# Raven Payouts: hold prototype

A working prototype of the first 24 hours after a merchant's payouts are put on hold. Raven does
the review: by default she has nothing to do, Raven promises a date for its next update, and she
can add context if she knows why sales went up. Build spec: [SPEC.md](SPEC.md). All data is local
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

1. Normal Home (`/`) and Payouts, Friday afternoon
2. **Place hold**: push notification, bell dot, blue banner. **Show alerts** previews the push,
   SMS and email; each **Open** lands on `/payouts?hold=open` with the drawer open
3. Drawer: what's on hold, progress, what happens next. Nothing to do
4. "Tell us what happened": pick a reason, send. The timeline updates; nothing else changes
5. **Next day**: day-two banner, the balance includes Saturday's sales
6. Optional: **Request information** (the only red state), reply, **Submit**, banner back to blue
7. **Clear hold**: green banner, the Mon, 30 Nov payout is Scheduled

The panel also has: theme (system by default, or force light/dark), simulate upload failure,
simulate submit failure and **Reset**. State is kept in `localStorage`, so a full page reload
keeps your place. Below 768px the sidebar moves behind the header menu and the drawer is full screen.

## Where things live

- `lib/proto.ts`: types, simulated time, the money model (`salesFor`), alert copy and `derive()`.
  Banner, cards, table rows, drawer and the Home chart all read from here, so every number agrees.
- `lib/store.ts`: the Zustand store (hold state machine, simulated uploads and sending).
- `app/(app)/layout.tsx` + `components/app-shell.tsx`: the chrome shared by Home (`/`) and Payouts
  (`/payouts`): sidebar, header, banner and the review drawer (`components/hold-drawer.tsx`), plus the `?hold=open` URL sync.
- `lib/dashboard.ts`: Home data. Daily volume comes from `salesFor`, the same source as the Payouts
  table; earlier days are deterministic filler.
- `app/globals.css`: primitive and theme tokens, shadcn variable mapping, text styles.
- `components/`: app components. `components/ui/` is shadcn, restyled to the design.
