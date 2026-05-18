import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/locales')

const patches = {
  en: {
    commonYes: 'Yes',
    commonNo: 'No',
    fxNever: 'Rates not loaded',
    fxSidebarUpdated: 'FX · {{time}}',
    fxSidebarCached: 'Cached · {{time}}',
    fxSidebarStale: 'Stale · {{time}}',
    bgWarning:
      'Payment reminders and automatic FX updates may run in the background while the app is open.',
    reminders: {
      title: 'Payment reminders',
      subtitle: 'Notify before installment due dates.',
      enabled: 'Enable reminders',
      notifyHour: 'Notification hour',
      daysBefore: 'Days before due',
    },
    fxUpdates: {
      title: 'Currency update',
      subtitle: 'How often exchange rates refresh when online.',
      provider: 'Provider',
      interval: 'Update interval',
      m15: 'Every 15 minutes',
      m30: 'Every 30 minutes',
      h1: 'Every hour',
      manual: 'Manual only',
      internet: 'Internet',
      online: 'Online',
      offline: 'Offline',
      cache: 'Cached rates',
      cacheAt: 'Cache time',
    },
  },
  tr: {
    commonYes: 'Evet',
    commonNo: 'Hayır',
    fxNever: 'Kur yüklenmedi',
    fxSidebarUpdated: 'Kur · {{time}}',
    fxSidebarCached: 'Önbellek · {{time}}',
    fxSidebarStale: 'Eski · {{time}}',
    bgWarning:
      'Ödeme hatırlatıcıları ve otomatik kur güncellemeleri uygulama açıkken arka planda çalışabilir.',
    reminders: {
      title: 'Ödeme hatırlatıcıları',
      subtitle: 'Taksit vadesinden önce bildirim gönder.',
      enabled: 'Hatırlatıcıları aç',
      notifyHour: 'Bildirim saati',
      daysBefore: 'Kaç gün önce',
    },
    fxUpdates: {
      title: 'Kur güncelleme',
      subtitle: 'Çevrimiçiyken döviz kurlarının ne sıklıkla yenileneceği.',
      provider: 'Sağlayıcı',
      interval: 'Güncelleme aralığı',
      m15: 'Her 15 dakika',
      m30: 'Her 30 dakika',
      h1: 'Her saat',
      manual: 'Yalnızca manuel',
      internet: 'İnternet',
      online: 'Çevrimiçi',
      offline: 'Çevrimdışı',
      cache: 'Önbellekte kur',
      cacheAt: 'Önbellek zamanı',
    },
  },
  az: {
    commonYes: 'Bəli',
    commonNo: 'Xeyr',
    fxNever: 'Məzənnə yüklənməyib',
    fxSidebarUpdated: 'Kur · {{time}}',
    fxSidebarCached: 'Keş · {{time}}',
    fxSidebarStale: 'Köhnə · {{time}}',
    bgWarning:
      'Ödəniş xatırladıcıları və avtomatik məzənnə yeniləmələri tətbiq açıq olanda arxa fonda işləyə bilər.',
    reminders: {
      title: 'Ödəniş xatırladıcıları',
      subtitle: 'Taksit tarixindən əvvəl bildiriş göndər.',
      enabled: 'Xatırladıcıları aktiv et',
      notifyHour: 'Bildiriş saatı',
      daysBefore: 'Neçə gün əvvəl',
    },
    fxUpdates: {
      title: 'Məzənnə yeniləməsi',
      subtitle: 'Onlayn olanda məzənnələrin nə tez-tez yenilənəcəyi.',
      provider: 'Provayder',
      interval: 'Yeniləmə intervalı',
      m15: 'Hər 15 dəqiqə',
      m30: 'Hər 30 dəqiqə',
      h1: 'Hər saat',
      manual: 'Yalnız əl ilə',
      internet: 'İnternet',
      online: 'Onlayn',
      offline: 'Oflayn',
      cache: 'Keşdə məzənnə',
      cacheAt: 'Keş vaxtı',
    },
  },
  ru: {
    commonYes: 'Да',
    commonNo: 'Нет',
    fxNever: 'Курсы не загружены',
    fxSidebarUpdated: 'Курс · {{time}}',
    fxSidebarCached: 'Кэш · {{time}}',
    fxSidebarStale: 'Устарело · {{time}}',
    bgWarning:
      'Напоминания об оплате и автообновление курсов могут работать в фоне, пока приложение открыто.',
    reminders: {
      title: 'Напоминания об оплате',
      subtitle: 'Уведомлять до даты платежа по рассрочке.',
      enabled: 'Включить напоминания',
      notifyHour: 'Час уведомления',
      daysBefore: 'За сколько дней',
    },
    fxUpdates: {
      title: 'Обновление курсов',
      subtitle: 'Как часто обновлять курсы при подключении к сети.',
      provider: 'Провайдер',
      interval: 'Интервал обновления',
      m15: 'Каждые 15 минут',
      m30: 'Каждые 30 минут',
      h1: 'Каждый час',
      manual: 'Только вручную',
      internet: 'Интернет',
      online: 'Онлайн',
      offline: 'Офлайн',
      cache: 'Кэш курсов',
      cacheAt: 'Время кэша',
    },
  },
}

for (const [lng, p] of Object.entries(patches)) {
  const file = path.join(dir, `${lng}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))

  json.common = json.common || {}
  json.common.yes = p.commonYes
  json.common.no = p.commonNo

  json.settings = json.settings || {}
  json.settings.fx = {
    ...json.settings.fx,
    never: p.fxNever,
    sidebarUpdated: p.fxSidebarUpdated,
    sidebarCached: p.fxSidebarCached,
    sidebarStale: p.fxSidebarStale,
  }
  json.settings.reminders = p.reminders
  json.settings.fxUpdates = {
    title: p.fxUpdates.title,
    subtitle: p.fxUpdates.subtitle,
    provider: p.fxUpdates.provider,
    interval: p.fxUpdates.interval,
    intervals: {
      m15: p.fxUpdates.m15,
      m30: p.fxUpdates.m30,
      h1: p.fxUpdates.h1,
      manual: p.fxUpdates.manual,
    },
    internet: p.fxUpdates.internet,
    online: p.fxUpdates.online,
    offline: p.fxUpdates.offline,
    cache: p.fxUpdates.cache,
    cacheAt: p.fxUpdates.cacheAt,
  }
  json.settings.backgroundWarning = p.bgWarning

  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  console.log('patched', lng)
}
