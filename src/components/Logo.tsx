export function Logo({ size = 28 }: { size?: number }) {
  return (
    <img
      src="/garageledger.svg"
      width={size}
      height={size}
      alt="GarageLedger"
      className="rounded-xl opacity-90"
    />
  )
}
