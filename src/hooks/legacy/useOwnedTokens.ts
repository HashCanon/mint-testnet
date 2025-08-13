// hooks/useOwnedTokens.ts
// deprecated
import { useEffect, useRef, useState } from 'react'
import { useAccount } from 'wagmi'
import { getOwnedTokenIds, getTokenURI } from '../logic'
import { toast } from 'sonner'

export function useOwnedTokens() {
  const { address, isConnected } = useAccount()
  const [tokens,  setTokens ] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  /** remember current toast so we don’t create duplicates */
  const toastRef = useRef<string | number | null>(null)

  useEffect(() => {
    // wallet disconnected → clean up and close toast
    if (!isConnected || !address) {
      setTokens([])
      if (toastRef.current) {
        toast.dismiss(toastRef.current)
        toastRef.current = null
      }
      return
    }

    setLoading(true)

    // show “Loading…” toast only once
    if (!toastRef.current)
      toastRef.current = toast.info('Loading your mandalas…', { duration: Infinity })

    ;(async () => {
      try {
        const ids = await getOwnedTokenIds(address)
        const metas = await Promise.all(
          ids.map(async raw => {
            const id   = typeof raw === 'bigint' ? Number(raw) : raw
            const meta = await getTokenURI(id)
            return { ...meta, _id: id }
          }),
        )
        metas.sort((a, b) => b._id - a._id)
        setTokens(metas)
      } catch (err) {
        console.error('useOwnedTokens:', err)
        toast.error('Failed to load mandalas')
      } finally {
        setLoading(false)
        if (toastRef.current) {
          toast.dismiss(toastRef.current)
          toastRef.current = null
        }
      }
    })()
  }, [isConnected, address])

  return { tokens, loading }
}
