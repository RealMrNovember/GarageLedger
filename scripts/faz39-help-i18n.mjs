import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/locales')
const SPLIT = 6

const meta = {
  en: {
    guide: { kicker: 'Guide', title: 'Step-by-step', subtitle: 'Core workflows in the recommended order.' },
    faq: { kicker: 'FAQ', title: 'Topics & answers', subtitle: 'Finance, reporting, CRM and system reference.' },
    contactKicker: 'Support',
  },
  tr: {
    guide: { kicker: 'Kılavuz', title: 'Adım adım', subtitle: 'Önerilen sırayla temel iş akışları.' },
    faq: { kicker: 'SSS', title: 'Konular ve yanıtlar', subtitle: 'Finans, raporlama, CRM ve sistem referansı.' },
    contactKicker: 'Destek',
  },
  az: {
    guide: { kicker: 'Bələdçi', title: 'Addım-addım', subtitle: 'Tövsiyə olunan ardıcıllıqla əsas iş axınları.' },
    faq: { kicker: 'SSS', title: 'Mövzular və cavablar', subtitle: 'Maliyyə, hesabat, CRM və sistem istinadı.' },
    contactKicker: 'Dəstək',
  },
  ru: {
    guide: { kicker: 'Руководство', title: 'Пошагово', subtitle: 'Основные сценарии в рекомендуемом порядке.' },
    faq: { kicker: 'FAQ', title: 'Темы и ответы', subtitle: 'Финансы, отчёты, CRM и справка по системе.' },
    contactKicker: 'Поддержка',
  },
}

for (const lng of Object.keys(meta)) {
  const file = path.join(dir, `${lng}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const help = json.help || {}
  const sections = help.booklet?.sections
  if (!Array.isArray(sections)) {
    console.warn('skip', lng, 'no sections')
    continue
  }
  help.guide = meta[lng].guide
  help.faq = meta[lng].faq
  help.contact = help.contact || {}
  help.contact.kicker = meta[lng].contactKicker
  help.booklet = {
    guide: sections.slice(0, SPLIT),
    faq: sections.slice(SPLIT),
  }
  json.help = help
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  console.log('ok', lng, 'guide', help.booklet.guide.length, 'faq', help.booklet.faq.length)
}
