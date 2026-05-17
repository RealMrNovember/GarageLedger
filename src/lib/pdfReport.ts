import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
export type PdfTranslate = (key: string, params?: Record<string, unknown>) => string
import { convertFromAzn } from './currency'
import type { CurrencyCode } from './currency'
import { parseIsoDate } from './dates'
import type { GarageLedgerSettings } from './types'

export type PdfPaper = 'a4' | 'letter'
export type PdfTheme = 'light' | 'dark'
export type PdfDateFormat = 'iso' | 'dmy' | 'mdy' | 'locale'
export type PdfLanguage = 'az' | 'tr' | 'en' | 'ru'

export type PdfExportOptions = {
  language: PdfLanguage
  currency: CurrencyCode
  paper: PdfPaper
  theme: PdfTheme
  dateFormat: PdfDateFormat
}

export type PdfMovementRow = {
  date: string
  typeLabel: string
  vehicle: string
  purchasePrice: string
  sellPrice: string
  expenses: string
  expenseNotes: string
  profit: string
}

export type PdfReportInput = {
  opts: PdfExportOptions
  tr: PdfTranslate
  range: { from: string; to: string }
  totals: { investment: number; revenue: number; netProfit: number }
  rows: PdfMovementRow[]
  companyProfile?: GarageLedgerSettings['companyProfile']
  fileName: string
}

type PdfColors = {
  pageBg: [number, number, number]
  ink: [number, number, number]
  muted: [number, number, number]
  headFill: [number, number, number]
  headText: [number, number, number]
  grid: [number, number, number]
  softFill: [number, number, number]
  summaryFill: [number, number, number]
  summaryBorder: [number, number, number]
}

const MARGIN_LEFT = 48
const MARGIN_RIGHT = 48
const MARGIN_TOP = 36
const FOOTER_HEIGHT = 42
const LOGO_SIZE = 44
const LOGO_GAP = 14
const SECTION_GAP = 16
const SUMMARY_HEIGHT = 58
const COMPACT_HEADER_HEIGHT = 52

function lineHeight(fontSize: number): number {
  return fontSize * 1.28
}

function themeColors(theme: PdfTheme): PdfColors {
  if (theme === 'dark') {
    return {
      pageBg: [15, 23, 42],
      ink: [241, 245, 249],
      muted: [148, 163, 184],
      headFill: [30, 41, 59],
      headText: [248, 250, 252],
      grid: [51, 65, 85],
      softFill: [30, 41, 59],
      summaryFill: [30, 41, 59],
      summaryBorder: [51, 65, 85],
    }
  }
  return {
    pageBg: [255, 255, 255],
    ink: [15, 23, 42],
    muted: [71, 85, 105],
    headFill: [245, 240, 232],
    headText: [15, 23, 42],
    grid: [226, 232, 240],
    softFill: [250, 250, 250],
    summaryFill: [250, 250, 250],
    summaryBorder: [226, 232, 240],
  }
}

function formatMoneyPdf(value: number, currency: CurrencyCode): string {
  const amount = Number.isFinite(value) ? value : 0
  const converted = convertFromAzn(amount, currency)
  const formatted = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(converted)
  return `${formatted} ${currency}`
}

function formatDatePdf(iso: string, lng: string, fmt: PdfDateFormat): string {
  const d = parseIsoDate(iso)
  if (fmt === 'iso') return iso
  if (fmt === 'dmy') {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${dd}.${mm}.${d.getFullYear()}`
  }
  if (fmt === 'mdy') {
    const dd = String(d.getDate()).padStart(2, '0')
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    return `${mm}/${dd}/${d.getFullYear()}`
  }
  return new Intl.DateTimeFormat(lng, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(d)
}

async function loadPdfFont(doc: jsPDF): Promise<string> {
  const fontRes = await window.GarageLedger?.pdf?.getFont?.()
  if (fontRes?.ok && fontRes.base64 && fontRes.fileName) {
    const fontFamily = 'GarageLedgerFont'
    doc.addFileToVFS(fontRes.fileName, fontRes.base64)
    doc.addFont(fontRes.fileName, fontFamily, 'normal', 'Identity-H')
    doc.setFont(fontFamily, 'normal')
    return fontFamily
  }
  doc.setFont('helvetica', 'normal')
  return 'helvetica'
}

function paintPageBackground(doc: jsPDF, colors: PdfColors): void {
  const w = doc.internal.pageSize.getWidth()
  const h = doc.internal.pageSize.getHeight()
  doc.setFillColor(colors.pageBg[0], colors.pageBg[1], colors.pageBg[2])
  doc.rect(0, 0, w, h, 'F')
}

type HeaderLayout = {
  headerBottomY: number
  firstPageBodyStartY: number
  logo: string | null
  companyName: string
  companyLines: string[]
  contactLine: string
  reportTitle: string
  rangeLabel: string
  currencyLabel: string
  exportedAtLabel: string
}

function measureHeader(
  doc: jsPDF,
  fontFamily: string,
  pageWidth: number,
  profile: NonNullable<GarageLedgerSettings['companyProfile']> | undefined,
  meta: { reportTitle: string; rangeLabel: string; currencyLabel: string; exportedAtLabel: string },
): HeaderLayout {
  const left = MARGIN_LEFT
  const right = MARGIN_RIGHT
  const top = MARGIN_TOP
  const contentRight = pageWidth - right

  const logo = String(profile?.logoDataUrl ?? '').trim()
  const hasLogo = logo.startsWith('data:image/')
  const headX = left + (hasLogo ? LOGO_SIZE + LOGO_GAP : 0)
  const headMaxW = contentRight - headX - 160

  const companyName = String(profile?.name ?? '').trim() || 'GarageLedger'
  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(15)
  const companyLines = doc.splitTextToSize(companyName, Math.max(120, headMaxW)) as string[]

  const contactParts = [profile?.address, [profile?.phone, profile?.email, profile?.website].filter(Boolean).join(' · ')]
    .map((x) => String(x ?? '').trim())
    .filter(Boolean)
  const contactLine = contactParts.join(' · ')
  doc.setFontSize(9)
  const contactLines = contactLine ? (doc.splitTextToSize(contactLine, pageWidth - left - right) as string[]) : []
  const contactHeight = contactLines.length ? lineHeight(9) * Math.min(contactLines.length, 2) + 6 : 0

  doc.setFontSize(9.5)
  const metaLines = 4
  const metaBlockH = lineHeight(9.5) * metaLines + 4

  const leftBlockH =
    Math.max(hasLogo ? LOGO_SIZE : 0, lineHeight(15) * companyLines.length + lineHeight(10) + contactHeight) + 8
  const headerBottomY = top + Math.max(leftBlockH, metaBlockH) + SECTION_GAP
  const firstPageBodyStartY = headerBottomY + SUMMARY_HEIGHT + SECTION_GAP

  return {
    headerBottomY,
    firstPageBodyStartY,
    logo: hasLogo ? logo : null,
    companyName,
    companyLines,
    contactLine: contactLines.slice(0, 2).join(' '),
    reportTitle: meta.reportTitle,
    rangeLabel: meta.rangeLabel,
    currencyLabel: meta.currencyLabel,
    exportedAtLabel: meta.exportedAtLabel,
  }
}

function drawFullHeader(
  doc: jsPDF,
  fontFamily: string,
  colors: PdfColors,
  pageWidth: number,
  layout: HeaderLayout,
): void {
  const left = MARGIN_LEFT
  const right = MARGIN_RIGHT
  const top = MARGIN_TOP
  const contentRight = pageWidth - right
  const headX = left + (layout.logo ? LOGO_SIZE + LOGO_GAP : 0)

  if (layout.logo) {
    const mime = layout.logo.slice(5, layout.logo.indexOf(';'))
    const fmt = mime === 'image/png' ? 'PNG' : mime === 'image/jpeg' ? 'JPEG' : null
    if (fmt) doc.addImage(layout.logo, fmt, left, top, LOGO_SIZE, LOGO_SIZE)
  }

  doc.setFont(fontFamily, 'normal')
  doc.setTextColor(colors.ink[0], colors.ink[1], colors.ink[2])

  doc.setFontSize(15)
  doc.text(layout.companyLines, headX, top + lineHeight(15))

  doc.setFontSize(10)
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2])
  doc.text(layout.reportTitle, headX, top + lineHeight(15) * layout.companyLines.length + lineHeight(10))

  if (layout.contactLine) {
    doc.setFontSize(9)
    doc.text(layout.contactLine, left, layout.headerBottomY - SECTION_GAP + 2, { maxWidth: pageWidth - left - right })
  }

  const metaX = contentRight
  let metaY = top + lineHeight(9.5)
  doc.setFontSize(9.5)
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2])
  doc.text(layout.rangeLabel, metaX, metaY, { align: 'right' })
  metaY += lineHeight(9.5)
  doc.text(layout.currencyLabel, metaX, metaY, { align: 'right' })
  metaY += lineHeight(9.5)
  doc.text(layout.exportedAtLabel, metaX, metaY, { align: 'right' })

  doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2])
  doc.setLineWidth(0.75)
  doc.line(left, layout.headerBottomY, contentRight, layout.headerBottomY)
}

function drawSummary(
  doc: jsPDF,
  fontFamily: string,
  colors: PdfColors,
  pageWidth: number,
  layout: HeaderLayout,
  labels: { investment: string; revenue: string; netProfit: string },
  values: { investment: string; revenue: string; netProfit: string },
): void {
  const left = MARGIN_LEFT
  const right = MARGIN_RIGHT
  const boxTop = layout.headerBottomY + 8
  const boxW = pageWidth - left - right
  const boxH = SUMMARY_HEIGHT - 8

  doc.setFillColor(colors.summaryFill[0], colors.summaryFill[1], colors.summaryFill[2])
  doc.setDrawColor(colors.summaryBorder[0], colors.summaryBorder[1], colors.summaryBorder[2])
  doc.setLineWidth(0.75)
  doc.roundedRect(left, boxTop, boxW, boxH, 8, 8, 'FD')

  const colW = (boxW - 24) / 3
  const labelY = boxTop + 16
  const valueY = boxTop + 34

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2])
  doc.text(labels.investment, left + 12, labelY)
  doc.text(labels.revenue, left + 12 + colW, labelY)
  doc.text(labels.netProfit, left + 12 + colW * 2, labelY)

  doc.setFontSize(11)
  doc.setTextColor(colors.ink[0], colors.ink[1], colors.ink[2])
  doc.text(values.investment, left + 12, valueY)
  doc.text(values.revenue, left + 12 + colW, valueY)
  doc.text(values.netProfit, left + 12 + colW * 2, valueY)
}

function drawCompactHeader(
  doc: jsPDF,
  fontFamily: string,
  colors: PdfColors,
  pageWidth: number,
  layout: Pick<HeaderLayout, 'companyName' | 'reportTitle' | 'rangeLabel'>,
): number {
  const left = MARGIN_LEFT
  const right = MARGIN_RIGHT
  const top = MARGIN_TOP
  const contentRight = pageWidth - right
  const bottomY = top + COMPACT_HEADER_HEIGHT - 8

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(11)
  doc.setTextColor(colors.ink[0], colors.ink[1], colors.ink[2])
  doc.text(layout.companyName, left, top + lineHeight(11))

  doc.setFontSize(9)
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2])
  doc.text(`${layout.reportTitle} · ${layout.rangeLabel}`, left, top + lineHeight(11) + lineHeight(9) + 2, {
    maxWidth: pageWidth - left - right,
  })

  doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2])
  doc.setLineWidth(0.75)
  doc.line(left, bottomY, contentRight, bottomY)

  return bottomY + SECTION_GAP
}

function drawFooter(
  doc: jsPDF,
  fontFamily: string,
  colors: PdfColors,
  pageWidth: number,
  pageHeight: number,
  pageLabel: string,
  exportedAtShort: string,
): void {
  const left = MARGIN_LEFT
  const right = MARGIN_RIGHT
  const y = pageHeight - FOOTER_HEIGHT

  doc.setDrawColor(colors.grid[0], colors.grid[1], colors.grid[2])
  doc.setLineWidth(0.75)
  doc.line(left, y, pageWidth - right, y)

  doc.setFont(fontFamily, 'normal')
  doc.setFontSize(9)
  doc.setTextColor(colors.muted[0], colors.muted[1], colors.muted[2])
  doc.text(pageLabel, left, pageHeight - 18)
  doc.text(exportedAtShort, pageWidth / 2, pageHeight - 18, { align: 'center' })
  doc.text('GarageLedger | Cicibyte Corp', pageWidth - right, pageHeight - 18, { align: 'right' })
}

export async function generateGarageLedgerPdf(input: PdfReportInput): Promise<void> {
  const { opts, tr, range, totals, rows, companyProfile, fileName } = input
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: opts.paper })
  const fontFamily = await loadPdfFont(doc)
  const colors = themeColors(opts.theme)

  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()

  const reportTitle = tr('reports.pdf.title')
  const rangeLabel = tr('reports.pdf.range', {
    from: formatDatePdf(range.from, opts.language, opts.dateFormat),
    to: formatDatePdf(range.to, opts.language, opts.dateFormat),
  })
  const currencyLabel = tr('reports.pdf.currency', { currency: opts.currency })
  const exportedAt = new Date()
  const exportedAtLabel = tr('reports.pdf.exportedAt', {
    value: new Intl.DateTimeFormat(opts.language, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(exportedAt),
  })
  const exportedAtShort = new Intl.DateTimeFormat(opts.language, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(exportedAt)

  const layout = measureHeader(doc, fontFamily, pageWidth, companyProfile, {
    reportTitle,
    rangeLabel,
    currencyLabel,
    exportedAtLabel,
  })

  const summaryLabels = {
    investment: tr('reports.summary.investment'),
    revenue: tr('reports.summary.revenue'),
    netProfit: tr('reports.summary.netProfit'),
  }
  const summaryValues = {
    investment: formatMoneyPdf(totals.investment, opts.currency),
    revenue: formatMoneyPdf(totals.revenue, opts.currency),
    netProfit: formatMoneyPdf(totals.netProfit, opts.currency),
  }

  const tableHead = [
    tr('reports.table.date'),
    tr('reports.table.type'),
    tr('reports.table.vehicle'),
    tr('reports.table.purchase'),
    tr('reports.table.sale'),
    tr('reports.table.expenses'),
    tr('reports.table.expenseNotes'),
    tr('reports.table.profit'),
  ]

  const tableBody = rows.map((r) => [
    r.date,
    r.typeLabel,
    r.vehicle,
    r.purchasePrice,
    r.sellPrice,
    r.expenses,
    r.expenseNotes,
    r.profit,
  ])

  const usableWidth = pageWidth - MARGIN_LEFT - MARGIN_RIGHT

  autoTable(doc, {
    startY: layout.firstPageBodyStartY,
    head: [tableHead],
    body: tableBody,
    tableWidth: usableWidth,
    styles: {
      font: fontFamily,
      fontSize: 9,
      textColor: colors.ink,
      cellPadding: 5,
      overflow: 'linebreak',
      cellWidth: 'wrap',
      lineColor: colors.grid,
      lineWidth: 0.25,
    },
    headStyles: {
      fillColor: colors.headFill,
      textColor: colors.headText,
      fontStyle: 'normal',
    },
    alternateRowStyles: { fillColor: colors.softFill },
    columnStyles: {
      0: { cellWidth: usableWidth * 0.09 },
      1: { cellWidth: usableWidth * 0.09 },
      2: { cellWidth: usableWidth * 0.22 },
      3: { cellWidth: usableWidth * 0.1, halign: 'right' },
      4: { cellWidth: usableWidth * 0.1, halign: 'right' },
      5: { cellWidth: usableWidth * 0.1, halign: 'right' },
      6: { cellWidth: usableWidth * 0.18 },
      7: { cellWidth: usableWidth * 0.12, halign: 'right' },
    },
    margin: {
      left: MARGIN_LEFT,
      right: MARGIN_RIGHT,
      top: layout.firstPageBodyStartY,
      bottom: FOOTER_HEIGHT + 14,
    },
    willDrawPage: (data) => {
      paintPageBackground(doc, colors)

      if (data.pageNumber === 1) {
        data.settings.margin.top = layout.firstPageBodyStartY
        drawFullHeader(doc, fontFamily, colors, pageWidth, layout)
        drawSummary(doc, fontFamily, colors, pageWidth, layout, summaryLabels, summaryValues)
      } else {
        const continuationTop = drawCompactHeader(doc, fontFamily, colors, pageWidth, layout)
        data.settings.margin.top = continuationTop
      }
    },
    didDrawPage: (data) => {
      const pageCount = doc.getNumberOfPages()
      const pageLabel = tr('reports.pdf.pageXofY', { x: data.pageNumber, y: pageCount })
      drawFooter(doc, fontFamily, colors, pageWidth, pageHeight, pageLabel, exportedAtShort)
    },
  })

  doc.save(fileName)
}

export { formatDatePdf, formatMoneyPdf }
