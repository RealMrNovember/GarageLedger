/**
 * Patches the local electron.exe icon for dev taskbar branding (Windows).
 * Packaged builds use electron-builder embedded icon.
 */
import { createHash } from 'node:crypto'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const iconPath = path.join(root, 'build', 'icon.ico')
const stampPath = path.join(root, 'build', '.electron-icon-stamp')

if (!fs.existsSync(iconPath)) {
  console.error('Missing build/icon.ico — run: npm run icons')
  process.exit(1)
}

const iconHash = createHash('sha256').update(fs.readFileSync(iconPath)).digest('hex')
const prev = fs.existsSync(stampPath) ? fs.readFileSync(stampPath, 'utf8').trim() : ''
if (prev === iconHash) {
  console.log('Electron dev icon already patched')
  process.exit(0)
}

let electronExe
try {
  electronExe = require('electron')
} catch {
  console.error('electron package not found')
  process.exit(1)
}

if (process.platform !== 'win32') {
  console.log('Skip electron icon patch (not Windows)')
  process.exit(0)
}

const { rcedit } = await import('rcedit')
await rcedit(electronExe, { icon: iconPath })
fs.writeFileSync(stampPath, iconHash)
console.log('Patched electron.exe taskbar icon for dev')
