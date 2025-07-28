// hooks/useTotalMinted.ts
import { useCallback, useEffect, useState } from 'react'
import { getTotalMinted } from '../logic'

export function useTotalMinted() {
  const [totalMinted, setTotalMinted] = useState<number | null>(null)

  /**
   * Fetches fresh totalSupply from the contract.
   * Returns that number so the caller can treat it as tokenId.
   */
  const refresh = useCallback(async (): Promise<number | undefined> => {
    try {
      const n = await getTotalMinted()
      setTotalMinted(n)
      return n               // ← return the number!
    } catch {
      setTotalMinted(null)
      return undefined
    }
  }, [])

  /* on mount: get initial value */
  useEffect(() => {
    void refresh()
  }, [refresh])

  return { totalMinted, refresh }
}
