import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'

const root = process.cwd()
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const version = String(pkg.version ?? '').trim()

if (!version) {
  console.error('package.json version is missing')
  process.exit(1)
}

const releasesPath = path.join(root, 'releases.json')
const releases = JSON.parse(fs.readFileSync(releasesPath, 'utf8'))
const top = releases?.releases?.[0]?.version

if (top !== version) {
  console.error(`Version mismatch: package.json=${version} releases.json[0]=${top ?? 'none'}`)
  process.exit(1)
}

const iconIco = path.join(root, 'build', 'icon.ico')
if (!fs.existsSync(iconIco)) {
  console.error('Missing build/icon.ico — run: npm run icons')
  process.exit(1)
}

console.log(`Release verify OK — v${version}`)
console.log('- package.json and releases.json aligned')
console.log('- build/icon.ico present')

if (process.argv.includes('--build')) {
  console.log('\nRunning npm run build...')
  execSync('npm run build', { stdio: 'inherit', cwd: root })
  console.log('Build OK')
}
