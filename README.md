# GarageLedger

![GarageLedger](./GarageLedger.svg)

GarageLedger is a premium, offline-first desktop app for garages and vehicle trading teams that want clean inventory tracking and reliable financial analytics, without losing cost history.

“Garage” represents the day-to-day inventory reality. “Ledger” represents the finance truth behind every buy/sell.

## Design Philosophy (Quiet Luxury)

GarageLedger follows a “Quiet Luxury / Digital Boutique” design approach:

- Deep whites and soft beiges for calm, high-trust screens
- Minimal chrome, subtle borders, soft shadows
- Focus on clarity and confidence: numbers first, noise last

## Tech Stack

- Electron + electron-builder (Windows NSIS installer)
- React + TypeScript + Vite
- Tailwind CSS v4
- LowDB (local JSON DB under userData)
- Recharts (analytics charts)
- i18next / react-i18next (AZ default + TR/EN/RU)

## Key Features

- Multi-language: AZ (default), TR, EN, RU
- Multi-currency: AZN (default), USD, EUR
- Offline local database: works without internet
- Auto-update: background update check/download via GitHub Releases (NSIS)
- Local backups: daily automatic + manual backup/restore from Settings
- Financial analytics:
  - Monthly summary (bought count, investment paid, gross sales, net profit)
  - Last 6 months comparison chart (sold count + profit)
- Sold items keep cost history: sold records stay in the DB (not deleted)

## Screenshots

Placeholders:

- Dashboard (placeholder)
- Inventory (placeholder)
- Settings (updates + backups) (placeholder)

## Installation (Client / End-User)

1) Open the GitHub Releases page and download the latest Windows installer:
   - `GarageLedger Setup x.y.z.exe`
2) Run the installer wizard.
3) If Windows asks for admin permission, allow it (per-machine install).
4) Launch GarageLedger from Start Menu.

Important:

- Your data is stored locally on the same Windows user profile and is not uploaded anywhere.
- Updates do not wipe your data. Daily automatic backups add extra safety.

## Data Storage & Backups

GarageLedger uses Electron userData storage.

- Main DB file: `garageledger.json`
- Backups folder: `backups/` (date-stamped JSON backups)

You can manage backups inside the app:

- Settings → Backups: Create / Refresh / Open Folder / Restore

## Development

```bash
npm install
npm run dev
```

## Build (Installer)

```bash
npm run dist
```

## Release (Auto GitHub Release)

The release flow is automated:

1) Ensure the working tree is clean (commit your changes first).
2) Ensure a GitHub token is available for electron-builder publishing:

```powershell
$env:GH_TOKEN="YOUR_GITHUB_TOKEN"
```

3) Run:

```bash
npm run release
```

This will:

- bump patch version (`npm version patch`)
- push commits and tags (`git push --follow-tags`)
- build and publish NSIS installer to GitHub Releases (`electron-builder --publish always`)
