# FinFlow — Personal Finance App

A modern, mobile-friendly personal finance app converted from the "BUDGET SPREADSHEET 2025" Google Sheets template. Dark theme by default, installable as a PWA, works on laptop and phone.

## What it does

- **Dashboard** — total balance, monthly income/expenses, left-to-spend, budget progress with alerts, upcoming bills, recent transactions, savings progress, and a plain-English financial health summary.
- **Income** — source, amount, date, recurring/one-time, notes, icons.
- **Expenses** — category, amount, date, payment method, merchant, recurring, notes, receipt photo upload (compressed and stored locally), icons, category filter.
- **Budget** — monthly limit per category, spent/remaining, progress bars, near-limit and over-limit alerts (threshold configurable in Settings).
- **Bills & subscriptions** — name, amount, due day, weekly/monthly/yearly schedule, per-month paid checkboxes (like the spreadsheet), due-soon reminders, icons.
- **Savings goals** — target, saved, deadline, priority, progress bar, quick "add money" (negative = withdrawal, matching the Goal Tracker tab's behavior).
- **Debt** — total owed, paid, minimum payment, interest rate, due day, payoff progress, quick "log payment."
- **Reports** — income vs expenses (6 months), category pie, net cash flow line, budget planned vs actual, savings by goal, CSV export.
- **Settings** — currency symbol (same list as the spreadsheet), dark/light theme, alert threshold, JSON backup/restore, delete all data.

## How the spreadsheet maps to the app

| Spreadsheet | App |
|---|---|
| Budget period + Financial Overview (Rollover + Income − Expenses − Bills − Savings − Debt = Left) | Dashboard stats, computed per current month |
| Planned vs Actual columns | Budget page (planned = limit, actual = summed expenses) + Reports "Budget performance" |
| Progress sparklines (`actual/planned`) | Progress bars everywhere |
| Bill/Debt paid checkboxes | Paid toggle per month on Bills; payment log on Debt |
| Goal Tracker `Saved = SUMIFS(transactions)` | "Add money" contributions per goal |
| Currency cell | Settings → currency symbol |
| Category lists (Salary, Groceries, Netflix, Mortgage…) | Seeded into dropdowns in `src/store.jsx` |

## Architecture

```
UI (React pages)  →  Store (React Context)  →  localStorage (auto-persist)
                        ↑ derived selectors (monthly totals, budget usage)
Recharts (charts)    lucide-react (icons)    Service worker + manifest (PWA)
```

- **Local-first**: all data is saved to `localStorage` automatically on every change. No account needed, nothing leaves your device.
- **Single source of truth**: `src/store.jsx` holds all data and CRUD; pages never touch storage directly. Swapping localStorage for Supabase later means changing one file.

## Data schema

```
settings  { currency, theme, budgetAlertPct }
incomes   [{ id, source, amount, date, recurring, notes, icon }]
expenses  [{ id, category, amount, date, method, merchant, recurring, notes, icon, receipt }]
budgets   [{ id, category, limit, icon }]
bills     [{ id, name, amount, dueDay, frequency, icon, notes, paidMonths: ["YYYY-MM"] }]
goals     [{ id, name, target, saved, deadline, priority, icon }]
debts     [{ id, name, total, paid, minPayment, interestRate, dueDay, icon }]
```

This maps 1:1 to SQL tables if/when you move to Supabase (add a `user_id` column to each).

## File structure

```
finflow/
├── index.html               PWA meta + service worker registration
├── vite.config.js
├── package.json
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js                offline caching
│   └── icons/               app icons (192 & 512)
└── src/
    ├── main.jsx             entry
    ├── App.jsx              page routing
    ├── store.jsx            data model + persistence + seed categories
    ├── utils.js             money/date formatting, CSV/JSON export, recurrence
    ├── styles.css           design system (dark default + light theme)
    ├── components/
    │   ├── Layout.jsx       sidebar (desktop) + bottom nav (mobile)
    │   └── ui.jsx           Card, StatCard, ProgressBar, Modal, IconPicker
    └── pages/               Dashboard, Income, Expenses, Budget, Bills,
                             Savings, Debt, Reports, Settings
```

## Run it locally

Requires Node.js 18+ (https://nodejs.org).

```bash
cd finflow
npm install
npm run dev
```

Open http://localhost:5173. To test on your phone on the same Wi-Fi: `npm run dev -- --host` and open the network URL it prints.

## Deploy online (Vercel — same workflow as your MoneyTrack project)

1. Push the folder to a GitHub repo.
2. In Vercel: **Add New Project → Import** the repo. Vercel auto-detects Vite.
3. Build command `npm run build`, output directory `dist` (auto-filled). Deploy.

Every git push redeploys automatically.

## Install as an app (PWA)

The manifest, icons, and service worker are already wired up. Once deployed over HTTPS (Vercel gives you this for free):

- **Android/Chrome**: menu → "Add to Home screen" / "Install app."
- **iPhone/Safari**: Share → "Add to Home Screen."
- **Laptop (Chrome/Edge)**: install icon in the address bar.

It opens fullscreen with the app icon and works offline (data is local anyway).

## Phase 2: accounts + cloud sync with Supabase

When you want your data to follow you across devices:

1. Create a Supabase project; make one table per collection (incomes, expenses, budgets, bills, goals, debts) using the schema above plus `user_id uuid references auth.users`.
2. Turn on **Row Level Security** with a policy like `user_id = auth.uid()` on every table — this is what makes it secure.
3. Add Supabase Auth (email magic link is easiest) and the `@supabase/supabase-js` client.
4. In `src/store.jsx`, replace the `load()` function and the persistence `useEffect` with Supabase reads/writes. The rest of the app doesn't change.
5. Move receipt images to Supabase Storage instead of base64.

Keep the JSON export feature either way — backups are always good.

## Notes & limits (current version)

- Data is per-browser. Clearing site data clears the app — export backups.
- Receipt photos are compressed (~900px JPEG) to fit localStorage; a handful of receipts is fine, hundreds will fill the ~5MB quota. Supabase Storage solves this in phase 2.
- "Total balance" = all income − all expenses − paid bills − savings contributions − debt payments (the spreadsheet's rollover idea, automated).
