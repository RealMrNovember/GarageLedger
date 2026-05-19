/**
 * Sync branding animations from repo-root ../animation into GarageLedger build paths.
 */
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const animRoot = path.join(root, '..', 'animation')

const pairs = [
  [path.join(animRoot, 'car.gif'), path.join(root, 'build', 'installer', 'wizard.gif')],
  [path.join(animRoot, 'car.webm'), path.join(root, 'electron', 'splash', 'car.webm')],
  [path.join(animRoot, 'car.gif'), path.join(root, 'electron', 'splash', 'car.gif')],
  [path.join(animRoot, 'car.lottie'), path.join(root, 'electron', 'splash', 'car.lottie')],
]

const iconPng = path.join(root, 'build', 'icon.png')
const logoSvg = path.join(root, 'GarageLedger.svg')
const splashDir = path.join(root, 'electron', 'splash')

fs.mkdirSync(path.join(root, 'build', 'installer'), { recursive: true })
fs.mkdirSync(splashDir, { recursive: true })

for (const [src, dest] of pairs) {
  if (!fs.existsSync(src)) {
    console.warn(`[sync-animation] missing: ${src}`)
    continue
  }
  fs.copyFileSync(src, dest)
  console.log(`[sync-animation] ${path.relative(root, dest)}`)
}

if (fs.existsSync(iconPng)) {
  fs.copyFileSync(iconPng, path.join(splashDir, 'logo.png'))
  fs.copyFileSync(iconPng, path.join(root, 'build', 'installer', 'logo.png'))
}
if (fs.existsSync(logoSvg)) {
  fs.copyFileSync(logoSvg, path.join(splashDir, 'garageledger.svg'))
}
