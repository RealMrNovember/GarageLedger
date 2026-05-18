import { useEffect, useState } from 'react'
import { FX_UPDATED_EVENT, readFxRates, type FxRates } from './currency'

export function useFxSync(tick = 0): FxRates | null {
  const [fx, setFx] = useState<FxRates | null>(() => readFxRates())

  useEffect(() => {
    setFx(readFxRates())
  }, [tick])

  useEffect(() => {
    const onUpdate = (e: Event) => {
      const detail = (e as CustomEvent<FxRates>).detail
      if (detail?.fetchedAt) {
        setFx(detail)
        return
      }
      setFx(readFxRates())
    }
    window.addEventListener(FX_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(FX_UPDATED_EVENT, onUpdate)
  }, [])

  return fx
}
