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

Data is currently stored **locally in the browser** (`localStorage`). All
persistence goes through `src/data/repository.ts`, so a cloud backend (with
login and cross-device sync) can be added later without changing the UI.

Use **Settings → Export data** regularly to back up your records.

## Run locally

```bash
npm install
npm run dev      # development server
npm run build    # production build
npm run preview  # preview the production build
```

## Tech

React + TypeScript + Vite, React Router, vite-plugin-pwa.
