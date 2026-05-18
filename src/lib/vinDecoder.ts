export type PowertrainType = '' | 'petrol' | 'diesel' | 'hybrid' | 'phev' | 'electric' | 'lpg' | 'other'

export type VinDecodeResult = {
  brand: string
  model: string
  year: number | null
  engine: string
  fuel: string
  powertrain: PowertrainType
  transmission: string
  vehiclePackage: string
  filledCount: number
}

function pick(row: Record<string, string | null | undefined>, key: string): string {
  const v = row[key]
  if (v == null) return ''
  const s = String(v).trim()
  if (!s || s.toLowerCase() === 'not applicable' || s === 'N/A') return ''
  return s
}

export function mapPowertrain(electrification: string, fuelPrimary: string, fuelSecondary: string): PowertrainType {
  const e = electrification.toLowerCase()
  const f1 = fuelPrimary.toLowerCase()
  const f2 = fuelSecondary.toLowerCase()

  if (e.includes('bev') || e.includes('battery electric') || f1.includes('electric') || f2.includes('electric')) {
    if (e.includes('phev') || e.includes('plug-in') || e.includes('plugin')) return 'phev'
    if (e.includes('hev') || e.includes('hybrid') || f1.includes('hybrid') || f2.includes('hybrid')) return 'hybrid'
    return 'electric'
  }
  if (e.includes('phev') || e.includes('plug-in') || e.includes('plugin')) return 'phev'
  if (e.includes('hev') || e.includes('hybrid') || e.includes('mhev') || f1.includes('hybrid') || f2.includes('hybrid')) {
    return 'hybrid'
  }
  if (e.includes('fcev') || e.includes('fuel cell')) return 'electric'
  if (f1.includes('diesel') || f2.includes('diesel')) return 'diesel'
  if (f1.includes('lpg') || f1.includes('cng') || f1.includes('liquefied')) return 'lpg'
  if (f1.includes('gasoline') || f1.includes('petrol') || f1.includes('gas') || f1.includes('flexible')) return 'petrol'
  if (f1.includes('electric')) return 'electric'
  return ''
}

function joinParts(parts: string[]): string {
  return parts.filter(Boolean).join(' · ')
}

export function parseNhtsaVinRow(row: Record<string, string | null | undefined>): VinDecodeResult | null {
  const errorCode = pick(row, 'ErrorCode')
  if (errorCode && !['0', '1'].includes(errorCode)) {
    const make = pick(row, 'Make')
    const model = pick(row, 'Model')
    if (!make && !model) return null
  }

  const brand = pick(row, 'Make')
  const model = pick(row, 'Model')
  const yearRaw = pick(row, 'ModelYear')
  const parsedYear = Number(yearRaw)
  const year = Number.isFinite(parsedYear) && parsedYear > 1900 ? parsedYear : null

  const displacement = pick(row, 'DisplacementL')
  const cylinders = pick(row, 'EngineCylinders')
  const hp = pick(row, 'EngineHP')
  const engineConfig = pick(row, 'EngineConfiguration')
  const engineModel = pick(row, 'EngineModel')

  const fuelPrimary = pick(row, 'FuelTypePrimary')
  const fuelSecondary = pick(row, 'FuelTypeSecondary')
  const electrification = pick(row, 'ElectrificationLevel')

  const transmissionStyle = pick(row, 'TransmissionStyle')
  const driveType = pick(row, 'DriveType')

  const trim = pick(row, 'Trim')
  const series = pick(row, 'Series')
  const bodyClass = pick(row, 'BodyClass')
  const vehicleType = pick(row, 'VehicleType')

  const engineParts: string[] = []
  if (displacement) engineParts.push(`${displacement}L`)
  if (cylinders) engineParts.push(`${cylinders} cyl`)
  if (hp) engineParts.push(`${hp} HP`)
  if (engineConfig) engineParts.push(engineConfig)
  if (engineModel) engineParts.push(engineModel)
  const engine = joinParts(engineParts)

  const fuel = joinParts([fuelPrimary, fuelSecondary, electrification].filter((x, i, a) => a.indexOf(x) === i))
  const powertrain = mapPowertrain(electrification, fuelPrimary, fuelSecondary)
  const transmission = joinParts([transmissionStyle, driveType])
  const vehiclePackage = joinParts([trim, series, bodyClass, vehicleType])

  const filled = [brand, model, year != null ? 'y' : '', engine, fuel, powertrain, transmission, vehiclePackage].filter(
    Boolean,
  ).length

  if (!filled) return null

  return {
    brand,
    model,
    year,
    engine,
    fuel,
    powertrain,
    transmission,
    vehiclePackage,
    filledCount: filled,
  }
}

export async function decodeVinFromNhtsa(vin: string, signal?: AbortSignal): Promise<VinDecodeResult | null> {
  const v = vin.trim().toUpperCase()
  if (v.length < 11) return null

  const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${encodeURIComponent(v)}?format=json`, {
    signal,
    headers: { Accept: 'application/json' },
  })
  if (!res.ok) return null

  const json = (await res.json()) as { Results?: Array<Record<string, string | null | undefined>> }
  const row = json?.Results?.[0]
  if (!row || typeof row !== 'object') return null

  return parseNhtsaVinRow(row)
}
