# 🚗📒 GarageLedger

Offline inventory + finance tracking desktop app built with React, Vite, Tailwind CSS and Electron.

Screenshot (placeholder): add a screenshot here once the first release UI is finalized.

## ✨ Highlights

- 🌐 Multi-language: AZ (default), TR, EN, RU
- 💱 Multi-currency: AZN (default), USD, EUR (instant UI update)
- 📊 Dashboard: weekly/monthly profit charts + key stat widgets
- 📦 Inventory table: in-stock badge, profit/loss, categories + advanced filtering
- 💾 Offline local DB: LowDB JSON in Electron userData (no internet required)
- 🔄 Auto-update ready: electron-updater + GitHub releases (NSIS target)

## 🧱 Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4 (Vite plugin)
- Electron + electron-builder
- Recharts
- i18next / react-i18next

## 🚀 Getting Started (Dev)

```bash
cd GarageLedger
npm install
npm run dev
```

## 🏗️ Build

```bash
cd GarageLedger
npm run build
```

## 📦 Packaging (Windows)

- Portable (single .exe):

```bash
cd GarageLedger
npm run dist
```

- NSIS Installer (recommended for auto-update):

```bash
cd GarageLedger
npm run dist:installer
```

## 🧭 Data Storage

Data is stored locally in a JSON database file inside Electron userData directory:

- Windows: `%AppData%\\GarageLedger\\garageledger.json` (path may vary depending on profile)

## 🔄 Release / Publishing Guide (GitHub Releases)

Auto-update works best with the NSIS installer target. A typical release flow:

1) Bump `version` in `GarageLedger/package.json`
2) Commit and tag the version
3) Create a GitHub Release and upload the generated NSIS artifacts (or use publish command if configured)

Commands:

```bash
cd GarageLedger
npm run dist:installer
```

## 🏷️ Repository Description (Suggested)

GarageLedger — Offline inventory & finance tracker (Electron + React). Multi-language, multi-currency, local DB, dashboard, and auto-update via GitHub Releases.

## 🧷 GitHub Repo (CLI Notes)

If you want to set the repository description from terminal (optional):

```bash
"C:\Program Files\GitHub CLI\gh.exe" auth login --web
"C:\Program Files\GitHub CLI\gh.exe" repo edit RealMrNovember/GarageLedger --description "GarageLedger — Offline inventory & finance tracker (Electron + React). Multi-language, multi-currency, local DB, dashboard, and auto-update via GitHub Releases."
```
