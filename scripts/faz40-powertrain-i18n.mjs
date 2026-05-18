import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/locales')

const patch = {
  en: {
    powertrain: 'Powertrain',
    powertrainTypes: {
      petrol: 'Petrol / Gasoline',
      diesel: 'Diesel',
      hybrid: 'Hybrid (HEV)',
      phev: 'Plug-in hybrid (PHEV)',
      electric: 'Electric (BEV)',
      lpg: 'LPG / CNG',
      other: 'Other',
    },
    fuelDetail: 'Fuel type (from VIN / notes)',
    vinSuccess: '{{count}} fields filled from VIN',
    vinInvalid: 'Enter a valid VIN (11–17 characters)',
  },
  tr: {
    powertrain: 'Güç aktarımı',
    powertrainTypes: {
      petrol: 'Benzin',
      diesel: 'Dizel',
      hybrid: 'Hibrit (HEV)',
      phev: 'Şarj edilebilir hibrit (PHEV)',
      electric: 'Elektrik (BEV)',
      lpg: 'LPG / CNG',
      other: 'Diğer',
    },
    fuelDetail: 'Yakıt tipi (VIN / not)',
    vinSuccess: 'VIN ile {{count}} alan dolduruldu',
    vinInvalid: 'Geçerli VIN girin (11–17 karakter)',
  },
  az: {
    powertrain: 'Ötürücü tipi',
    powertrainTypes: {
      petrol: 'Benzin',
      diesel: 'Dizel',
      hybrid: 'Hibrid (HEV)',
      phev: 'Şarj olunan hibrid (PHEV)',
      electric: 'Elektrik (BEV)',
      lpg: 'LPG / CNG',
      other: 'Digər',
    },
    fuelDetail: 'Yanacaq növü (VIN / qeyd)',
    vinSuccess: 'VIN ilə {{count}} sahə dolduruldu',
    vinInvalid: 'Düzgün VIN daxil edin (11–17 simvol)',
  },
  ru: {
    powertrain: 'Силовая установка',
    powertrainTypes: {
      petrol: 'Бензин',
      diesel: 'Дизель',
      hybrid: 'Гибрид (HEV)',
      phev: 'Подключаемый гибрид (PHEV)',
      electric: 'Электро (BEV)',
      lpg: 'ГБО / КПГ',
      other: 'Другое',
    },
    fuelDetail: 'Тип топлива (VIN / заметка)',
    vinSuccess: 'По VIN заполнено полей: {{count}}',
    vinInvalid: 'Введите корректный VIN (11–17 символов)',
  },
}

for (const [lng, p] of Object.entries(patch)) {
  const file = path.join(dir, `${lng}.json`)
  const json = JSON.parse(fs.readFileSync(file, 'utf8'))
  json.tradeForm.fields.powertrain = p.powertrain
  json.tradeForm.fields.fuelDetail = p.fuelDetail
  json.tradeForm.powertrain = p.powertrainTypes
  json.vinDecoder.success = p.vinSuccess
  json.vinDecoder.invalid = p.vinInvalid
  fs.writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`, 'utf8')
  console.log('ok', lng)
}
