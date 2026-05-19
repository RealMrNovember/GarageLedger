import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const projectDir = process.cwd()
const svgPath = path.resolve(projectDir, 'GarageLedger.svg')
const outDir = path.resolve(projectDir, 'build')
const outPng = path.resolve(outDir, 'icon.png')
const outIco = path.resolve(outDir, 'icon.ico')

const sizes = [16, 24, 32, 48, 64, 128, 256]

if (!fs.existsSync(svgPath)) {
  console.error(`Missing source SVG: ${svgPath}`)
  process.exit(1)
}

fs.mkdirSync(outDir, { recursive: true })

const svg = fs.readFileSync(svgPath)

const pngBuffers = await Promise.all(
  sizes.map((size) =>
    sharp(svg)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer(),
  ),
)

await sharp(pngBuffers[pngBuffers.length - 1]).toFile(outPng)

const icoBuffer = await pngToIco(pngBuffers)
fs.writeFileSync(outIco, icoBuffer)

process.stdout.write(`Generated ${outPng}\nGenerated ${outIco} (${sizes.join(', ')}px)\n`)
