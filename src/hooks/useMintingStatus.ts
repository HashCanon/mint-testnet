import { useEffect, useState } from 'react'
import { getMintingStatus } from '../logic'
import { MINT_START_TIME } from '../constants'

export function useMintingStatus() {
  const [mintingEnabled, setMintingEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    let first = true
    const id = setInterval(async () => {
      const ms = MINT_START_TIME.getTime() - Date.now()
      if (first || ms <= 60_000) {
        first = false
        try {
          const enabled = await getMintingStatus()
          setMintingEnabled(enabled)
          if (enabled) clearInterval(id)
        } catch {
          setMintingEnabled(true)
          clearInterval(id)
        }
      }
    }, 1_000)

    return () => clearInterval(id)
  }, [])

  return mintingEnabled
}
