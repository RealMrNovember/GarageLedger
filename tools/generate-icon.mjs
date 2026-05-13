import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const projectDir = process.cwd()
const svgPath = path.resolve(projectDir, '..', 'GarageLedger.svg')
const outDir = path.resolve(projectDir, 'build')
const outPng = path.resolve(outDir, 'icon.png')
const outIco = path.resolve(outDir, 'icon.ico')

fs.mkdirSync(outDir, { recursive: true })

const svg = fs.readFileSync(svgPath)

await sharp(svg)
  .resize(256, 256, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toFile(outPng)

const icoBuffer = await pngToIco(outPng)
fs.writeFileSync(outIco, icoBuffer)

process.stdout.write(`Generated ${outPng}\nGenerated ${outIco}\n`)

