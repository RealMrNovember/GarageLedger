import fs from 'fs'

const files = [
  new URL('../src/pages/HelpPage.tsx', import.meta.url),
]

for (const p of files) {
  let s = fs.readFileSync(p, 'utf8')
  s = s.replace(/<\/?motion-safe-label\b/g, (m) => (m.startsWith('</') ? '</div' : '<div'))
  fs.writeFileSync(p, s)
  console.log('fixed', p.pathname)
}
