/**
 * NSIS installer branding placeholders (sidebar/header BMP + optional wizard GIF).
 * Replace build/installer/wizard.gif with your own animation when ready.
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import sharp from 'sharp'

const root = process.cwd()
const outDir = path.join(root, 'build', 'installer')
fs.mkdirSync(outDir, { recursive: true })

const sidebarSvg = `
<svg width="164" height="314" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0f1419"/>
      <stop offset="100%" stop-color="#1a2332"/>
    </linearGradient>
  </defs>
  <rect width="164" height="314" fill="url(#bg)"/>
  <rect x="0" y="0" width="4" height="314" fill="#c9a227"/>
  <text x="22" y="48" fill="#f5f0e6" font-family="Segoe UI, Arial" font-size="15" font-weight="600">GarageLedger</text>
  <text x="22" y="72" fill="#9ca3af" font-family="Segoe UI, Arial" font-size="10">Premium ERP</text>
  <text x="22" y="260" fill="#6b7280" font-family="Segoe UI, Arial" font-size="9">Cicibyte Corp</text>
</svg>`

const headerSvg = `
<svg width="150" height="57" xmlns="http://www.w3.org/2000/svg">
  <rect width="150" height="57" fill="#fafafa"/>
  <rect x="0" y="54" width="150" height="3" fill="#c9a227"/>
  <text x="12" y="34" fill="#111827" font-family="Segoe UI, Arial" font-size="14" font-weight="600">GarageLedger</text>
</svg>`

const sidebarPng = path.join(outDir, 'sidebar.png')
const headerPng = path.join(outDir, 'header.png')
const sidebarBmp = path.join(outDir, 'sidebar.bmp')
const headerBmp = path.join(outDir, 'header.bmp')

await sharp(Buffer.from(sidebarSvg)).resize(164, 314).png().toFile(sidebarPng)
await sharp(Buffer.from(headerSvg)).resize(150, 57).png().toFile(headerPng)

function pngToBmp(pngPath, bmpPath) {
  const ps = [
    'Add-Type -AssemblyName System.Drawing',
    `$i=[System.Drawing.Image]::FromFile('${pngPath.replace(/'/g, "''")}')`,
    `$i.Save('${bmpPath.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Bmp)`,
    '$i.Dispose()',
  ].join('; ')
  execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'pipe' })
}

if (process.platform === 'win32') {
  pngToBmp(sidebarPng, sidebarBmp)
  pngToBmp(headerPng, headerBmp)
  fs.unlinkSync(sidebarPng)
  fs.unlinkSync(headerPng)
} else {
  fs.copyFileSync(sidebarPng, sidebarBmp)
  fs.copyFileSync(headerPng, headerBmp)
  console.warn('Non-Windows: copied PNG as BMP placeholder — regenerate on Windows before release.')
}

const frameCount = 8
const frames = []
for (let i = 0; i < frameCount; i += 1) {
  const x = 40 + i * 14
  const carSvg = `
  <svg width="200" height="120" xmlns="http://www.w3.org/2000/svg">
    <rect width="200" height="120" fill="#0f1419"/>
    <rect x="0" y="100" width="200" height="20" fill="#1f2937"/>
    <rect x="${x}" y="52" width="48" height="22" rx="4" fill="#c9a227"/>
    <circle cx="${x + 10}" cy="78" r="7" fill="#374151"/>
    <circle cx="${x + 38}" cy="78" r="7" fill="#374151"/>
    <text x="12" y="28" fill="#9ca3af" font-family="Segoe UI, Arial" font-size="11">GarageLedger Setup</text>
  </svg>`
  frames.push(await sharp(Buffer.from(carSvg)).png().toBuffer())
}

await sharp(frames, { animated: true }).gif({ loop: 0, delay: 120 }).toFile(path.join(outDir, 'wizard.gif'))

process.stdout.write(`Generated ${path.join(outDir, 'sidebar.bmp')}\n`)
process.stdout.write(`Generated ${path.join(outDir, 'header.bmp')}\n`)
process.stdout.write(`Generated ${path.join(outDir, 'wizard.gif')} (placeholder — replace with your animation)\n`)
