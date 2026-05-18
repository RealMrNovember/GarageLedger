import fs from 'fs'

const p = new URL('../src/pages/TradeFormModal.tsx', import.meta.url)
let s = fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n')
const nl = '\n'

const d = 'div'
const from =
  '      <' +
  d +
  ` className="space-y-5">${nl}        <ModalSection title={t('tradeForm.sections.vehicle')}>${nl}        <` +
  d +
  ' className="grid grid-cols-1 gap-4 md:grid-cols-2">'

const to =
  '      <' +
  d +
  ` className="grid grid-cols-1 gap-5 xl:grid-cols-12 xl:items-start">${nl}        <` +
  d +
  ` className="space-y-5 xl:col-span-8">${nl}        <ModalSection title={t('tradeForm.sections.basic')}>${nl}        <` +
  d +
  ' className="grid grid-cols-12 gap-4">'

if (!s.includes(from)) {
  console.error('layout anchor missing')
  process.exit(1)
}
s = s.replace(from, to)

// model column span
s = s.replace(
  `          <${d}>
            <${d} className="text-xs font-medium text-slate-600">{t('tradeForm.fields.model')}</${d}>`,
  `          <${d} className="col-span-12 sm:col-span-6">
            <${d} className={modalLabelClass}>{t('tradeForm.fields.model')}</${d}>`,
)

// brand column span (first occurrence in basic section)
const brandOld = `          <${d}>
            <${d} className="text-xs font-medium text-slate-600">{t('tradeForm.fields.brand')}</${d}>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('tradeForm.fields.brandPlaceholder')}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/10 dark:bg-gray-900 dark:focus:border-white/30"
            />
          </${d}>`

const brandNew = `          <${d} className="col-span-12 sm:col-span-6">
            <${d} className={modalLabelClass}>{t('tradeForm.fields.brand')}</${d}>
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder={t('tradeForm.fields.brandPlaceholder')}
              className={\`\${fieldClass} mt-2\`}
            />
          </${d}>`

if (s.includes(brandOld)) s = s.replace(brandOld, brandNew)

// model input class
s = s.replace(
  `              placeholder={t('tradeForm.fields.modelPlaceholder')}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/10 dark:bg-gray-900 dark:focus:border-white/30"`,
  `              placeholder={t('tradeForm.fields.modelPlaceholder')}
              className={\`\${fieldClass} mt-2\`}`,
)

// Replace year/engine 2-col grid with 3-col + plate
const yearGridFrom = `        <${d} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <${d}>
            <${d} className="text-xs font-medium text-slate-600">{t('tradeForm.fields.year')}</${d}>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={t('tradeForm.fields.yearPlaceholder')}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/10 dark:bg-gray-900 dark:focus:border-white/30"
            />
          </${d}>
          <${d}>
            <${d} className="text-xs font-medium text-slate-600">{t('tradeForm.fields.engine')}</${d}>
            <input
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder={t('tradeForm.fields.enginePlaceholder')}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400 dark:border-white/10 dark:bg-gray-900 dark:focus:border-white/30"
            />
          </${d}>
        </${d}>`

const yearGridTo = `          <${d} className="col-span-12 sm:col-span-4">
            <${d} className={modalLabelClass}>{t('tradeForm.fields.year')}</${d}>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={t('tradeForm.fields.yearPlaceholder')}
              className={\`\${fieldClass} mt-2\`}
            />
          </${d}>
          <${d} className="col-span-12 sm:col-span-4">
            <${d} className={modalLabelClass}>{t('tradeForm.fields.engine')}</${d}>
            <input
              value={engine}
              onChange={(e) => setEngine(e.target.value)}
              placeholder={t('tradeForm.fields.enginePlaceholder')}
              className={\`\${fieldClass} mt-2\`}
            />
          </${d}>
          <${d} className="col-span-12 sm:col-span-4">
            <${d} className={modalLabelClass}>{t('tradeForm.fields.plate')}</${d}>
            <input
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder={t('tradeForm.fields.platePlaceholder')}
              className={\`\${fieldClass} mt-2\`}
            />
          </${d}>`

if (s.includes(yearGridFrom)) s = s.replace(yearGridFrom, yearGridTo)

// VIN row grid
const vinFrom = `        <${d}>
          <${d} className="flex items-center justify-between gap-3">
            <${d} className="text-xs font-medium text-slate-600">{t('vinDecoder.vinLabel')}</${d}>`

const vinTo = `          <${d} className="col-span-12 lg:col-span-10">
            <${d} className="flex items-center justify-between gap-3">
              <${d} className={modalLabelClass}>{t('vinDecoder.vinLabel')}</${d}>`

if (s.includes(vinFrom)) s = s.replace(vinFrom, vinTo)

s = s.replace(
  `              className="w-full rounded-2xl border border-[var(--tf-border)] bg-[var(--tf-surface)]/70 px-4 py-3 text-sm text-[var(--tf-ink)] outline-none placeholder:text-[var(--tf-ink-muted)] focus:border-black/20 dark:focus:border-white/20"
            />
            <button
              type="button"
              onClick={() => void decodeVin()}
              disabled={vinLoading || vin.trim().length < 5}
              className={[
                'inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border px-4 text-sm font-semibold transition duration-200',`,
  `              className={\`\${fieldClass} mt-2\`}
            />
          </${d}>
          <${d} className="col-span-12 flex items-end lg:col-span-2">
            <button
              type="button"
              onClick={() => void decodeVin()}
              disabled={vinLoading || vin.trim().length < 5}
              className={[
                'inline-flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl border text-sm font-semibold transition duration-200',`,
)

// Close vin grid cell - fix structure after button block
s = s.replace(
  `            </button>
          </${d}>
        </${d}>
        </ModalSection>

        <ModalSection title={t('tradeForm.sections.parties')}>`,
  `            </button>
          </${d}>
        </${d}>
        </ModalSection>

        <${d} className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ModalSection title={t('tradeForm.sections.parties')}>`,
)

// Split finance/status - remove status from finance row
const statusInFinance = `          <${d}>
            <${d} className="text-xs font-medium text-slate-600">{t('tradeForm.fields.purchasePrice')}</${d}>
            <input
              type="number"
              value={Number.isFinite(purchasePrice) ? purchasePrice : 0}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
            />
          </${d}>

          <${d}>
            <${d} className="text-xs font-medium text-slate-600">{t('tradeForm.fields.status')}</${d}>
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'in_stock' || v === 'reserved' || v === 'sold') setStatus(v)
              }}
              className="mt-2 w-full rounded-2xl border border-[var(--tf-border)] bg-white/70 px-4 py-3 text-sm outline-none"
            >
              <option value="in_stock">{t('tradeForm.status.inStock')}</option>
              <option value="reserved">{t('tradeForm.status.reserved')}</option>
              <option value="sold">{t('tradeForm.status.sold')}</option>
            </select>
          </${d}>
        </${d}>

        {status === 'reserved'`

const statusInFinanceTo = `          <${d}>
            <${d} className={modalLabelClass}>{t('tradeForm.fields.purchasePrice')}</${d}>
            <input
              type="number"
              value={Number.isFinite(purchasePrice) ? purchasePrice : 0}
              onChange={(e) => setPurchasePrice(Number(e.target.value))}
              className={\`\${fieldClass} mt-2\`}
            />
          </${d}>
        </${d}>
        </ModalSection>
        </${d}>

        <ModalSection title={t('tradeForm.sections.status')}>
        <${d} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <${d}>
            <${d} className={modalLabelClass}>{t('tradeForm.fields.status')}</${d}>
            <select
              value={status}
              onChange={(e) => {
                const v = e.target.value
                if (v === 'in_stock' || v === 'reserved' || v === 'sold') setStatus(v)
              }}
              className={\`\${fieldClass} mt-2\`}
            >
              <option value="in_stock">{t('tradeForm.status.inStock')}</option>
              <option value="reserved">{t('tradeForm.status.reserved')}</option>
              <option value="sold">{t('tradeForm.status.sold')}</option>
            </select>
          </${d}>
        </${d}>

        {status === 'reserved'`

if (s.includes(statusInFinance)) s = s.replace(statusInFinance, statusInFinanceTo)

// Close parties+finance wrapper before status - need to close finance section properly
// Insert optional accordion before expenses
const expensesMarker = `        <ModalSection
          title={t('tradeForm.sections.expenses')}`

const optionalBlock = `        <TradeFormAccordion
          title={t('tradeForm.sections.optional')}
          description={t('tradeForm.optional.subtitle')}
          open={optionalOpen}
          onToggle={() => setOptionalOpen((v) => !v)}
        >
          <${d} className="grid grid-cols-12 gap-4">
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.package')}</${d}>
              <input value={vehiclePackage} onChange={(e) => setVehiclePackage(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.fuel')}</${d}>
              <input value={fuel} onChange={(e) => setFuel(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.transmission')}</${d}>
              <input value={transmission} onChange={(e) => setTransmission(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.mileage')}</${d}>
              <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value === '' ? '' : Number(e.target.value))} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.color')}</${d}>
              <input value={color} onChange={(e) => setColor(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.location')}</${d}>
              <input value={location} onChange={(e) => setLocation(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.tax')}</${d}>
              <input type="number" value={tax} onChange={(e) => setTax(e.target.value === '' ? '' : Number(e.target.value))} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.commission')}</${d}>
              <input type="number" value={commission} onChange={(e) => setCommission(e.target.value === '' ? '' : Number(e.target.value))} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.keyCount')}</${d}>
              <input type="number" value={keyCount} onChange={(e) => setKeyCount(e.target.value === '' ? '' : Number(e.target.value))} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12 sm:col-span-6">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.inspection')}</${d}>
              <input value={inspection} onChange={(e) => setInspection(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.damage')}</${d}>
              <input value={damage} onChange={(e) => setDamage(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.tramer')}</${d}>
              <input value={tramer} onChange={(e) => setTramer(e.target.value)} className={\`\${fieldClass} mt-2\`} />
            </${d}>
            <${d} className="col-span-12">
              <${d} className={modalLabelClass}>{t('tradeForm.fields.notes')}</${d}>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className={\`\${fieldClass} mt-2 resize-none\`} />
            </${d}>
          </${d}>
        </TradeFormAccordion>

        `

if (s.includes(expensesMarker) && !s.includes('TradeFormAccordion')) {
  s = s.replace(expensesMarker, optionalBlock + expensesMarker)
}

// Close main column + profit card before modal inner close
const closeBeforeModal = `        </ModalSection>
      </${d}>
    </Modal>`

const closeWithProfit = `        </ModalSection>
        </${d}>
        <${d} className="xl:col-span-4">
          <${d} className="xl:sticky xl:top-2">
            <TradeFormProfitCard profit={estimatedProfit} currency={currency} status={status} />
          </${d}>
        </${d}>
      </${d}>
    </Modal>`

// Only replace last occurrence before contact modal
const idx = s.lastIndexOf(`        </ModalSection>\n      </${d}>\n    </Modal>\n\n    <Modal\n      title={t('tradeForm.addContactTitle')}`)
if (idx >= 0 && !s.includes('TradeFormProfitCard')) {
  s =
    s.slice(0, idx) +
    `        </ModalSection>
        </${d}>
        <${d} className="xl:col-span-4">
          <${d} className="xl:sticky xl:top-2">
            <TradeFormProfitCard profit={estimatedProfit} currency={currency} status={status} />
          </${d}>
        </${d}>
      </${d}>
    </Modal>

    <Modal
      title={t('tradeForm.addContactTitle')}` +
    s.slice(idx + `        </ModalSection>\n      </${d}>\n    </Modal>\n\n    <Modal\n      title={t('tradeForm.addContactTitle')}`.length)
}

fs.writeFileSync(p, s)
console.log('patched')
