import fs from 'fs'

const p = new URL('../src/pages/TradeFormModal.tsx', import.meta.url)
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const d = 'motion-safe-label'.replace('motion-safe-label', 'div')

// 1) Keep grid open after model row
s = s.replace(
  `          </${d}>
        </${d}>

          <${d} className="col-span-12 sm:col-span-4">`,
  `          </${d}>

          <${d} className="col-span-12 sm:col-span-4">`,
)

// 2) Fix VIN block
const vinOld = `          <${d} className="col-span-12 lg:col-span-10">
            <${d} className="flex items-center justify-between gap-3">
              <${d} className={modalLabelClass}>{t('vinDecoder.vinLabel')}</${d}>
            {vinToast ? <${d} className="text-xs font-medium text-[var(--tf-ink-muted)]">{vinToast}</${d}> : null}
          </${d}>
          <${d} className="mt-2 flex items-stretch gap-2">
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder={t('vinDecoder.vinPlaceholder')}
              className={\`\${fieldClass} mt-2\`}
            />
          </${d}>
          <${d} className="col-span-12 flex items-end lg:col-span-2">`

const vinNew = `          <${d} className="col-span-12 lg:col-span-10">
            <${d} className="flex items-center justify-between gap-3">
              <${d} className={modalLabelClass}>{t('vinDecoder.vinLabel')}</${d}>
              {vinToast ? <${d} className="text-xs font-medium text-[var(--tf-ink-muted)]">{vinToast}</${d}> : null}
            </${d}>
            <input
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder={t('vinDecoder.vinPlaceholder')}
              className={\`\${fieldClass} mt-2\`}
            />
          </${d}>
          <${d} className="col-span-12 flex items-end lg:col-span-2">`

if (s.includes(vinOld)) s = s.replace(vinOld, vinNew)

// 3) Insert optional accordion before expenses if missing
if (!s.includes('TradeFormAccordion')) {
  const exp = `        <ModalSection
          title={t('tradeForm.sections.expenses')}`
  const accordion = `        <TradeFormAccordion
          title={t('tradeForm.sections.optional')}
          description={t('tradeForm.optional.subtitle')}
          open={optionalOpen}
          onToggle={() => setOptionalOpen((v) => !v)}
        >
          <${d} className="grid grid-cols-12 gap-4">
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.package')}</${d}><input value={vehiclePackage} onChange={(e) => setVehiclePackage(e.target.value)} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.fuel')}</${d}><input value={fuel} onChange={(e) => setFuel(e.target.value)} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.transmission')}</${d}><input value={transmission} onChange={(e) => setTransmission(e.target.value)} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.mileage')}</${d}><input type="number" value={mileage} onChange={(e) => setMileage(e.target.value === '' ? '' : Number(e.target.value))} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.color')}</${d}><input value={color} onChange={(e) => setColor(e.target.value)} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.location')}</${d}><input value={location} onChange={(e) => setLocation(e.target.value)} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.tax')}</${d}><input type="number" value={tax} onChange={(e) => setTax(e.target.value === '' ? '' : Number(e.target.value))} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.commission')}</${d}><input type="number" value={commission} onChange={(e) => setCommission(e.target.value === '' ? '' : Number(e.target.value))} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.keyCount')}</${d}><input type="number" value={keyCount} onChange={(e) => setKeyCount(e.target.value === '' ? '' : Number(e.target.value))} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12 sm:col-span-6"><${d} className={modalLabelClass}>{t('tradeForm.fields.inspection')}</${d}><input value={inspection} onChange={(e) => setInspection(e.target.value)} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12"><${d} className={modalLabelClass}>{t('tradeForm.fields.damage')}</${d}><input value={damage} onChange={(e) => setDamage(e.target.value)} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12"><${d} className={modalLabelClass}>{t('tradeForm.fields.tramer')}</${d}><input value={tramer} onChange={(e) => setTramer(e.target.value)} className={\`\${fieldClass} mt-2\`} /></${d}>
            <${d} className="col-span-12"><${d} className={modalLabelClass}>{t('tradeForm.fields.notes')}</${d}><textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={\`\${fieldClass} mt-2 resize-none\`} /></${d}>
          </${d}>
        </TradeFormAccordion>

        `
  s = s.replace(exp, accordion + exp)
}

// 4) Close layout + profit card
const tail = `        </ModalSection>
      </${d}>
    </Modal>

    <Modal
      title={t('tradeForm.addContactTitle')}`

const tailNew = `        </ModalSection>
        </${d}>
        <${d} className="xl:col-span-4">
          <${d} className="xl:sticky xl:top-2">
            <TradeFormProfitCard profit={estimatedProfit} currency={currency} status={status} />
          </${d}>
        </${d}>
      </${d}>
    </Modal>

    <Modal
      title={t('tradeForm.addContactTitle')}`

if (s.includes(tail) && !s.includes('TradeFormProfitCard profit')) {
  s = s.replace(tail, tailNew)
}

fs.writeFileSync(p, s)
console.log('fixed jsx')
