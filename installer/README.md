# Installer branding assets

Generated at build time into `build/installer/`:

| File | Source | Role |
|------|--------|------|
| `wizard.gif` | `../animation/car.gif` | Installer animation (welcome hero + resources) |
| `welcome-hero.bmp` | Composed | Welcome page — logo + car together |
| `sidebar.bmp` | Composed | Left panel — logo on top, car preview below |
| `header.bmp` | Composed | Top strip — logo + GarageLedger title |
| `logo.png` | `build/icon.png` | Official app logo (never replaced by animation) |

Regenerate: `npm run installer-assets` (runs `sync-assets` first).

Replace `../animation/car.gif` with your final animation, then rebuild.
