# Anna's Pages

A mobile-first web app for tracking book purchases, deliveries and spending —
a replacement for tracking everything in a spreadsheet.

## Features

- Record purchases (store, 3rd-party, or part of a subscription) with full
  details: date, title, edition, author, genre, store, order #, price,
  shipping, total cost, expected delivery, payment method and notes.
- Dashboard with upcoming deliveries and spending summary.
- Mark a purchase as delivered — delivered books appear in your **Library**.
- Track subscriptions as separate records with monthly cost and billing day.
- Export all data as a JSON backup.
- Installable PWA — add it to your phone's home screen.

## Data storage

The app works in two modes:

- **Local-only** (no Supabase configured) — data is stored in the browser
  (`localStorage`), no login.
- **Cloud** (Supabase configured) — passwordless email sign-in; each user's
  library is saved to their account and synced across their devices. Data is
  cached locally too, so the app loads instantly and survives brief offline
  periods.

To enable cloud mode and login, follow [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md).

Use **Settings → Export data** any time to download a JSON backup, and
**Restore from backup** to load one.

## Run locally

```bash
npm install
npm run dev      # development server
npm run build    # production build
npm run preview  # preview the production build
```

## Tech

React + TypeScript + Vite, React Router, vite-plugin-pwa.
