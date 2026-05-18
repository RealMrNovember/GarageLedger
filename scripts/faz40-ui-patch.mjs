import fs from 'fs'

const p = new URL('../src/pages/TradeFormModal.tsx', import.meta.url)
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const d = 'div'

s = s.replace(
  `{vinToast ? <${d} className="text-xs font-medium text-[var(--tf-ink-muted)]">{vinToast}</${d}> : null}`,
  `{vinToast ? (
                <${d}
                  className={[
                    'text-xs font-medium',
                    vinToastOk ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400',
                  ].join(' ')}
                >
                  {vinToast}
                </${d}>
              ) : null}`,
)

const fuelOld = `            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.fuel')}</${d}>
              <input value={fuel} onChange={(e) => setFuel(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.transmission')}</${d}>`

const fuelNew = `            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.powertrain')}</${d}>
              <select
                value={powertrain}
                onChange={(e) => setPowertrain(e.target.value as PowertrainType)}
                className={\`\${fieldClass} mt-2\`}
              >
                <option value="">—</option>
                {POWERTRAIN_OPTIONS.map((pt) => (
                  <option key={pt} value={pt}>
                    {t(\`tradeForm.powertrain.\${pt}\`)}
                  </option>
                ))}
              </select>
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.fuelDetail')}</${d}>
              <input value={fuel} onChange={(e) => setFuel(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.transmission')}</${d}>`

if (s.includes(fuelOld)) s = s.replace(fuelOld, fuelNew)
else console.warn('fuel block not found')

fs.writeFileSync(p, s)
console.log('done')
