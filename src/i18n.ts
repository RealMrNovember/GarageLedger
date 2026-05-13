import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import az from './locales/az.json'
import en from './locales/en.json'
import ru from './locales/ru.json'
import tr from './locales/tr.json'

const STORAGE_KEY = 'garageledger.language'

const saved = localStorage.getItem(STORAGE_KEY)
const initialLanguage = saved === 'tr' || saved === 'en' || saved === 'az' || saved === 'ru' ? saved : 'az'

void i18n.use(initReactI18next).init({
  resources: {
    az: { translation: az },
    tr: { translation: tr },
    en: { translation: en },
    ru: { translation: ru },
  },
  lng: initialLanguage,
  fallbackLng: 'az',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (lng) => {
  localStorage.setItem(STORAGE_KEY, lng)
})

export { i18n }

