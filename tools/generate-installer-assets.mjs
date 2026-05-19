/**
 * Premium NSIS installer visuals: official logo + car animation (logo never removed).
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import sharp from 'sharp'

const root = process.cwd()
const outDir = path.join(root, 'build', 'installer')
const logoPath = path.join(outDir, 'logo.png')
const carGif = path.join(outDir, 'wizard.gif')
const animCarGif = path.join(root, '..', 'animation', 'car.gif')

fs.mkdirSync(outDir, { recursive: true })

if (fs.existsSync(animCarGif)) {
  fs.copyFileSync(animCarGif, carGif)
} else if (!fs.existsSync(carGif)) {
  console.warn('[installer-assets] animation/car.gif not found — run npm run sync-assets')
}

if (!fs.existsSync(logoPath) && fs.existsSync(path.join(root, 'build', 'icon.png'))) {
  fs.copyFileSync(path.join(root, 'build', 'icon.png'), logoPath)
}

const logoBuf = fs.existsSync(logoPath) ? await sharp(logoPath).resize(96, 96, { fit: 'contain' }).png().toBuffer() : null
const logoHeaderBuf = logoBuf ? await sharp(logoBuf).resize(36, 36).png().toBuffer() : null
const logoHeroBuf = logoBuf ? await sharp(logoBuf).resize(88, 88).png().toBuffer() : null
const carFrameBuf = fs.existsSync(carGif)
  ? await sharp(carGif, { animated: true, page: 0 }).resize(220, 120, { fit: 'contain' }).png().toBuffer()
  : null
const carSidebarBuf = carFrameBuf
  ? await sharp(carFrameBuf).resize(140, 80, { fit: 'inside' }).png().toBuffer()
  : null
const carHeroBuf = carFrameBuf
  ? await sharp(carFrameBuf).resize(200, 110, { fit: 'inside' }).png().toBuffer()
  : null

async function composePng(width, height, draw) {
  const base = sharp({
    create: { width, height, channels: 4, background: { r: 17, g: 17, b: 17, alpha: 1 } },
  })
  const layers = draw()
  if (!layers.length) return base.png().toBuffer()
  return base.composite(layers).png().toBuffer()
}

function pngToBmp(pngPath, bmpPath) {
  const ps = [
    'Add-Type -AssemblyName System.Drawing',
    `$i=[System.Drawing.Image]::FromFile('${pngPath.replace(/'/g, "''")}')`,
    `$i.Save('${bmpPath.replace(/'/g, "''")}', [System.Drawing.Imaging.ImageFormat]::Bmp)`,
    '$i.Dispose()',
  ].join('; ')
  execSync(`powershell -NoProfile -Command "${ps}"`, { stdio: 'pipe' })
}

async function writeBmp(pngBuffer, bmpPath) {
  const pngPath = `${bmpPath}.png`
  await sharp(pngBuffer).png().toFile(pngPath)
  if (process.platform === 'win32') {
    pngToBmp(pngPath, bmpPath)
    fs.unlinkSync(pngPath)
  } else {
    fs.copyFileSync(pngPath, bmpPath)
  }
}

const sidebarPng = await composePng(164, 314, () => {
  const layers = [{ input: Buffer.from('<svg width="164" height="314"><rect width="164" height="314" fill="#111111"/><rect x="0" y="0" width="3" height="314" fill="#c9a227"/></svg>'), top: 0, left: 0 }]
  if (logoBuf) layers.push({ input: logoBuf, top: 28, left: 34 })
  if (carSidebarBuf) layers.push({ input: carSidebarBuf, top: 150, left: 12 })
  layers.push({
    input: Buffer.from(
      '<svg width="164" height="314"><text x="22" y="290" fill="#6b7280" font-family="Segoe UI" font-size="9">Cicibyte Corp</text></svg>',
    ),
    top: 0,
    left: 0,
  })
  return layers
})

const headerPng = await composePng(150, 57, () => {
  const layers = [{ input: Buffer.from('<svg width="150" height="57"><rect width="150" height="57" fill="#fafafa"/><rect x="0" y="54" width="150" height="3" fill="#c9a227"/></svg>'), top: 0, left: 0 }]
  if (logoHeaderBuf) layers.push({ input: logoHeaderBuf, top: 10, left: 10 })
  layers.push({
    input: Buffer.from(
      '<svg width="150" height="57"><text x="54" y="34" fill="#111827" font-family="Segoe UI" font-size="13" font-weight="600">GarageLedger</text></svg>',
    ),
    top: 0,
    left: 0,
  })
  return layers
})

const heroPng = await composePng(500, 300, () => {
  const layers = [{ input: Buffer.from('<svg width="500" height="300"><rect width="500" height="300" fill="#111111"/></svg>'), top: 0, left: 0 }]
  if (logoHeroBuf) layers.push({ input: logoHeroBuf, top: 36, left: 48 })
  if (carHeroBuf) layers.push({ input: carHeroBuf, top: 58, left: 248 })
  layers.push({
    input: Buffer.from(
      '<svg width="500" height="300"><text x="48" y="150" fill="#f5f0e6" font-family="Segoe UI" font-size="18" font-weight="600">GarageLedger</text><text x="48" y="175" fill="#9ca3af" font-family="Segoe UI" font-size="11">Premium garage ERP</text></svg>',
    ),
    top: 0,
    left: 0,
  })
  return layers
})

await writeBmp(sidebarPng, path.join(outDir, 'sidebar.bmp'))
await writeBmp(headerPng, path.join(outDir, 'header.bmp'))
await writeBmp(heroPng, path.join(outDir, 'welcome-hero.bmp'))

process.stdout.write(`Generated installer assets in ${outDir}\n`)
process.stdout.write('- sidebar.bmp (logo + car preview + brand)\n')
process.stdout.write('- header.bmp (logo + title)\n')
process.stdout.write('- welcome-hero.bmp (logo + car for welcome page)\n')
process.stdout.write(`- wizard.gif (${fs.existsSync(carGif) ? 'from animation/car.gif' : 'missing'})\n`)
