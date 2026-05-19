# GarageLedger

<img src="./GarageLedger.svg" alt="GarageLedger" width="48" height="48" />

**GarageLedger** is an offline-first desktop ERP for small vehicle dealerships and garage trading teams. Built by **Mikail | Cicibyte Corp**, it unifies inventory, deals, CRM, finance, and reporting in one quiet, premium Windows application.

> **Garage** = your stock on the lot · **Ledger** = the financial truth behind every deal.

---

## Highlights

| Area | What you get |
|------|----------------|
| **Platform** | Windows 7 SP1 → 11 (x64 + ia32), Electron 22 LTS |
| **Data** | 100% local JSON — no cloud upload |
| **Languages** | AZ (default), TR, EN, RU |
| **Currencies** | AZN, USD, EUR, TRY + live/cached FX |
| **Design** | Quiet Luxury / Digital Boutique UI |

---

## Feature overview

### Inventory & vehicles

- Full vehicle records: brand, model, year, engine, plate, VIN, category, status (in stock / reserved / sold)
- **NHTSA VIN decoder** — auto-fill vehicle details from VIN
- Collapsible filter panel (search, category, status, profit/loss, purchase date range)
- Premium **inventory table**: sticky headers, icon actions, delete confirmation, horizontal scroll hints
- **Trade form** workspace layout: multi-column grid, optional fields accordion, live estimated net profit

### Finance & analytics

- Purchase price, sale price, expenses, tax, commission — **true net profit** per vehicle
- Dashboard KPI cards (monthly investment, revenue, net profit, purchase count)
- Weekly profit chart + 6-month sales/profit composed chart
- **Payment reminders** on dashboard: collect balance, snooze 1d / 3d / 1w

### Reports & PDF

- Date presets: today, this week, this month, last 30 days, custom range
- Movement table: purchases, reservations, sales with parties and profit
- **Professional PDF export** (`pdfReport` engine): company letterhead, multi-page tables, summary, footer
- Export options: language, currency, date format, A4/Letter, light/dark PDF theme

### CRM (customers)

- Contact book: buyer / seller / both roles
- Compact list UI with profile modal and deal history per contact
- Linked to inventory trades (seller/buyer contact IDs)

### Settings & operations

- **Language** — instant UI switch (AZ/TR/EN/RU)
- **Company profile** — white-label name, logo, address, phone, email, website for PDFs
- **Payment reminders** — enable, notification hour, days-before alert
- **App lock** — optional password (PBKDF2), unlock screen
- **FX updates** — provider interval (15m / 30m / 1h / manual), sidebar last-update timestamp
- **Backups** — daily / weekly / monthly / yearly / manual; auto-cleanup; restore from list; open backup folder
- **Updates** — GitHub Releases via `electron-updater`; silent background download; **persistent restart banner** when ready
- **Feedback** — send notes from settings
- **Background service** — system tray, hide-on-close, payment + FX notifications, in-app toasts

### Help & about

- Help center with accordion guide + FAQ + contact cards
- Release notes (“What’s New”) from `releases.json`
- About modal with email, GitHub, WhatsApp

### Desktop integration

- Custom **taskbar icon** (`AppUserModelID`, window icon, NSIS installer icons, dev `electron.exe` patch)
- System tray with show/quit
- Auto-update from GitHub (no code signature required for private builds)

---

## Tech stack

- **Runtime:** Electron 22.3.27, React 19, TypeScript, Vite 8
- **UI:** Tailwind CSS v4, Framer Motion
- **Data:** lowdb → `%APPDATA%/GarageLedger/db.json`
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable
- **i18n:** i18next / react-i18next
- **Updates:** electron-updater + electron-builder (NSIS)

---

## Windows compatibility

| OS | Installer |
|----|-----------|
| Windows 7/8/10/11 **64-bit** | `GarageLedger.Setup.<version>.x64.exe` |
| Windows 7 **32-bit** | `GarageLedger.Setup.<version>.ia32.exe` |

Requirements for Win7: SP1 + updates; TLS 1.2 for auto-update and live FX. Offline data and backups work without internet.

```bash
npm run verify:win7
```

---

## Install (end users)

1. Open [GitHub Releases](https://github.com/RealMrNovember/GarageLedger/releases)
2. Download the installer for your architecture (`x64` or `ia32`)
3. Run the wizard (per-machine install may require admin)
4. Launch **GarageLedger** from the Start Menu

Your data stays on your PC under:

- Database: `%APPDATA%/GarageLedger/db.json`
- Backups: `%APPDATA%/GarageLedger/backups/`

---

## Development

```bash
npm install
npm run dev
```

`npm run dev` starts Vite + Electron. On Windows dev builds, `tools/patch-electron-icon.mjs` applies the GarageLedger icon to `electron.exe` for correct taskbar branding.

---

## Build & release

```bash
npm run verify:release:build   # version sync + icon + production build
npm run dist                   # NSIS installers → release-build/
```

Publish to GitHub (requires `GH_TOKEN`):

```powershell
$env:GH_TOKEN="your_token"
npm run publish
```

Version **must** match between `package.json` and `releases.json[0].version`.

---

## Auto-update behavior

1. App checks GitHub Releases hourly (and on resume)
2. When an update is available, it **downloads silently** in the background
3. When download completes, a **non-dismissible amber banner** appears on every screen until the user clicks **Restart and update**
4. Settings → Updates still offers manual check / restart

---

## Project structure

```
GarageLedger/
├── electron/          # Main process (IPC, DB, backups, updater, tray, background)
├── src/               # React UI
├── tools/             # Icon generator, release/win7 verify, dev icon patch
├── build/             # Generated icon.ico / icon.png (npm run icons)
├── releases.json      # Changelog for What's New + verify:release
└── release-build/     # Installer output (gitignored)
```

---

## Contact

- **Developer:** Mikail | Cicibyte Corp
- **Email:** [mozkarci1991@gmail.com](mailto:mozkarci1991@gmail.com)
- **WhatsApp:** [+90 535 489 50 50](https://wa.me/905354895050)
- **GitHub:** [RealMrNovember/GarageLedger](https://github.com/RealMrNovember/GarageLedger)

---

## License

Private / proprietary — Cicibyte Corp. All rights reserved unless otherwise stated in the repository.
