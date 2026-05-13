import logoUrl from '../assets/garageledger.svg'

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <img
      src={logoUrl}
      width={size}
      height={size}
      alt="GarageLedger"
      className="rounded-xl opacity-90"
    />
  )
}
