/**
 * Windows 7 / legacy desktop compatibility checks (config + main-process patterns).
 * Does not replace testing on a real Win7 SP1 machine.
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.dirname(fileURLToPath(import.meta.url))
const pkgPath = path.join(root, '..', 'package.json')
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'))

const errors = []
const warnings = []

const electronVer = pkg.devDependencies?.electron ?? ''
const electronMajor = Number(String(electronVer).replace(/^[^\d]*/, '').split('.')[0])

if (electronMajor !== 22) {
  errors.push(`electron must stay on 22.x for Windows 7 (found: ${electronVer})`)
}

const winTargets = pkg.build?.win?.target
const arches = []
if (Array.isArray(winTargets)) {
  for (const t of winTargets) {
    if (t?.arch) arches.push(...t.arch)
  }
}
if (!arches.includes('x64')) errors.push('electron-builder win target missing x64')
if (!arches.includes('ia32')) errors.push('electron-builder win target missing ia32 (32-bit Windows 7)')

const electronDir = path.join(root, '..', 'electron')
const mainFiles = fs.readdirSync(electronDir).filter((f) => f.endsWith('.cjs') || f.endsWith('.mjs'))
for (const file of mainFiles) {
  const src = fs.readFileSync(path.join(electronDir, file), 'utf8')
  if (/\bfetch\s*\(/.test(src)) {
    errors.push(`${file}: uses fetch() in main process (not available on Electron 22 main)`)
  }
}

const dbPath = path.join(electronDir, 'db.cjs')
if (fs.existsSync(dbPath)) {
  const dbSrc = fs.readFileSync(dbPath, 'utf8')
  if (!dbSrc.includes('structuredClone')) {
    warnings.push('db.cjs: no structuredClone guard (optional)')
  } else if (!dbSrc.includes('JSON.parse(JSON.stringify')) {
    warnings.push('db.cjs: structuredClone without JSON fallback')
  }
}

if (errors.length) {
  console.error('Windows 7 verify FAILED:\n' + errors.map((e) => `  - ${e}`).join('\n'))
  if (warnings.length) {
    console.error('\nWarnings:\n' + warnings.map((w) => `  - ${w}`).join('\n'))
  }
  process.exit(1)
}

console.log('Windows 7 verify OK')
console.log(`  - Electron ${electronVer} (Chromium 108 — last Win7-supported line)`)
console.log(`  - NSIS arches: ${[...new Set(arches)].join(', ')}`)
console.log('  - Main process: no fetch(); https/net used for network')
if (warnings.length) {
  console.log('\nWarnings:\n' + warnings.map((w) => `  - ${w}`).join('\n'))
}
console.log('\nOn Windows 7 SP1: install all updates; use ia32 installer on 32-bit OS.')
