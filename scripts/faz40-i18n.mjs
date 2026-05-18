import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/locales')

const patch = {
  en: {
    basic: 'Basic information',
    status: 'Status & sale',
    optional: 'Optional details',
    optionalSub: 'Package, mileage, notes and other fields you can fill later.',
    plate: 'Plate',
    platePh: 'e.g. 10-XX-000',
    package: 'Package / trim',
    fuel: 'Fuel',
    transmission: 'Transmission',
    mileage: 'Mileage (km)',
    color: 'Color',
    damage: 'Damage notes',
    tramer: 'Insurance / Tramer',
    notes: 'Notes',
    location: 'Location',
    keyCount: 'Key count',
    inspection: 'Inspection',
    tax: 'Tax',
    commission: 'Commission',
    profit: {
      kicker: 'Live',
      title: 'Estimated net profit',
      subtitle: 'Updates as you change prices, status and expenses.',
      amount: 'Net profit',
      hintInStock: 'Set status to Reserved or Sold and enter a sale price to estimate profit.',
      hintNeedPrice: 'Enter a valid sale price to see an estimate.',
      formula: 'Sale − (purchase + expenses + tax + commission)',
    },
  },
  tr: {
    basic: 'Temel bilgiler',
    status: 'Durum ve satış',
    optional: 'Opsiyonel detaylar',
    optionalSub: 'Paket, kilometre, notlar ve diğer isteğe bağlı alanlar.',
    plate: 'Plaka',
    platePh: 'örn. 34 ABC 123',
    package: 'Paket / donanım',
    fuel: 'Yakıt',
    transmission: 'Vites',
    mileage: 'Kilometre',
    color: 'Renk',
    damage: 'Hasar notu',
    tramer: 'Tramer / sigorta',
    notes: 'Notlar',
    location: 'Konum',
    keyCount: 'Anahtar sayısı',
    inspection: 'Ekspertiz',
    tax: 'Vergi',
    commission: 'Komisyon',
    profit: {
      kicker: 'Canlı',
      title: 'Tahmini net kâr',
      subtitle: 'Fiyat, durum ve masraflar değiştikçe güncellenir.',
      amount: 'Net kâr',
      hintInStock: 'Tahmin için durumu Rezerve veya Satıldı yapın ve satış fiyatı girin.',
      hintNeedPrice: 'Tahmin için geçerli bir satış fiyatı girin.',
      formula: 'Satış − (alış + masraflar + vergi + komisyon)',
    },
  },
  az: {
    basic: 'Əsas məlumat',
    status: 'Status və satış',
    optional: 'Opsional detallar',
    optionalSub: 'Paket, yürüş, qeydlər və digər istəyə bağlı sahələr.',
    plate: 'Nömrə',
    platePh: 'məs. 10-XX-000',
    package: 'Paket',
    fuel: 'Yanacaq',
    transmission: 'Ötürücü',
    mileage: 'Yürüş (km)',
    color: 'Rəng',
    damage: 'Zərər qeydi',
    tramer: 'Sığorta / tramer',
    notes: 'Qeydlər',
    location: 'Yerləşmə',
    keyCount: 'Açar sayı',
    inspection: 'Ekspertiza',
    tax: 'Vergi',
    commission: 'Komissiya',
    profit: {
      kicker: 'Canlı',
      title: 'Təxmini xalis mənfəət',
      subtitle: 'Qiymət, status və xərclər dəyişdikcə yenilənir.',
      amount: 'Xalis mənfəət',
      hintInStock: 'Təxmin üçün statusu Rezerv və ya Satılıb edin və satış qiyməti daxil edin.',
      hintNeedPrice: 'Təxmin üçün etibarlı satış qiyməti daxil edin.',
      formula: 'Satış − (alış + xərclər + vergi + komissiya)',
    },
  },
  ru: {
    basic: 'Основная информация',
    status: 'Статус и продажа',
    optional: 'Дополнительно',
    optionalSub: 'Комплектация, пробег, заметки и другие необязательные поля.',
    plate: 'Номер',
    platePh: 'напр. А123ВС77',
    package: 'Комплектация',
    fuel: 'Топливо',
    transmission: 'КПП',
    mileage: 'Пробег (км)',
    color: 'Цвет',
    damage: 'Повреждения',
    tramer: 'Страховка / трамер',
    notes: 'Заметки',
    location: 'Локация',
    keyCount: 'Ключей',
    inspection: 'Осмотр',
    tax: 'Налог',
    commission: 'Комиссия',
    profit: {
      kicker: 'Онлайн',
      title: 'Оценка чистой прибыли',
      subtitle: 'Обновляется при изменении цен, статуса и расходов.',
      amount: 'Чистая прибыль',
      hintInStock: 'Для оценки выберите статус «Резерв» или «Продано» и укажите цену продажи.',
      hintNeedPrice: 'Введите цену продажи для оценки.',
      formula: 'Продажа − (закупка + расходы + налог + комиссия)',
    },
  },
}

for (const [lng, p] of Object.entries(patch)) {
  const file = path.join(dir, `${lng}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  const tf = json.tradeForm
  tf.sections.basic = p.basic
  tf.sections.status = p.status
  tf.sections.optional = p.optional
  tf.optional = { subtitle: p.optionalSub }
  tf.fields.plate = p.plate
  tf.fields.platePlaceholder = p.platePh
  tf.fields.package = p.package
  tf.fields.fuel = p.fuel
  tf.fields.transmission = p.transmission
  tf.fields.mileage = p.mileage
  tf.fields.color = p.color
  tf.fields.damage = p.damage
  tf.fields.tramer = p.tramer
  tf.fields.notes = p.notes
  tf.fields.location = p.location
  tf.fields.keyCount = p.keyCount
  tf.fields.inspection = p.inspection
  tf.fields.tax = p.tax
  tf.fields.commission = p.commission
  tf.profit = p.profit
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  console.log('ok', lng)
}
