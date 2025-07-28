// hooks/useMint.ts
import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { sendMintTx as mintNFT, getTokenURI } from '../logic'
import { getPublicClient } from 'wagmi/actions'
import { wagmiConfig } from '../wagmi'

interface Options {
  /** Fired when SVG metadata has been loaded successfully */
  onSuccess(meta: any): void
  /**
   * Fired right after the tx is mined.  
   * Should return the freshly updated totalSupply or tokenId.  
   * May throw or return undefined – both cases are handled.
   */
  onAfterSuccess?(): Promise<number | undefined> | number | undefined
}

/**
 * Full mint workflow:
 * 1. wait for wallet confirmation
 * 2. obtain tx hash
 * 3. wait for mining
 * 4. refresh totals → get new tokenId
 * 5. fetch tokenURI
 * 6. call onSuccess(meta)
 *
 * All user-facing messages are handled via toast notifications.
 */
export function useMint({ onSuccess, onAfterSuccess }: Options) {
  const [busy, setBusy] = useState(false)

  /* refs for long-living toasts so we can dismiss them later */
  const confirmToastRef = useRef<string | number | null>(null)
  const hashSeenRef     = useRef(false)

  const mint = async () => {
    if (busy) return
    setBusy(true)

    /* ────────────────────────────────────────────── */
    /* 1 — wallet confirmation                        */
    /* ────────────────────────────────────────────── */
    const confirmId = toast.info('Waiting for wallet confirmation…', {
      duration: Infinity,
    })
    confirmToastRef.current = confirmId

    /* show reminder for mobile MetaMask users */
    let reminderId: string | number | null = null
    const reminderTimer = document.hidden
      ? setTimeout(() => {
          reminderId = toast.info('↩︎ Return to the browser after signing.', {
            duration: Infinity,
          })
        }, 15_000)
      : undefined

    let progressId: string | number | null = null

    try {
      /* ────────────────────────────────────────── */
      /* 2 — user signed, got tx hash               */
      /* ────────────────────────────────────────── */
      const { hash, chainId } = await mintNFT()
      hashSeenRef.current = true

      if (reminderTimer) clearTimeout(reminderTimer)
      toast.dismiss(confirmId)
      if (reminderId) toast.dismiss(reminderId)

      /* ────────────────────────────────────────── */
      /* 3 — wait for mining                        */
      /* ────────────────────────────────────────── */
      progressId = toast.info('Minting…', { duration: Infinity })
      const client = getPublicClient(wagmiConfig, { chainId })
      await client.waitForTransactionReceipt({ hash })

      toast.dismiss(progressId)
      toast.success('Mint successful!')

      /* ────────────────────────────────────────── */
      /* 4 — refresh totals → get new tokenId       */
      /* ────────────────────────────────────────── */
      let newId: number | undefined

      if (onAfterSuccess) {
        try {
          const result = await onAfterSuccess()
          if (typeof result === 'number') newId = result
        } catch (err) {
          console.error('onAfterSuccess error:', err)
          toast.error('Failed to update total supply — token may be hidden')
        }
      }

      /* ────────────────────────────────────────── */
      /* 5 — load metadata (if we know tokenId)     */
      /* ────────────────────────────────────────── */
      if (typeof newId === 'number') {
        try {
          const meta = await getTokenURI(newId)
          onSuccess(meta)
        } catch (err) {
          console.error('getTokenURI error:', err)
          toast.error('Metadata fetch failed — try reload')
        }
      } else {
        toast.error('Mint done, but token ID not received — refresh later')
      }
    } catch (err: any) {
      /* any failure before tx is mined */
      if (reminderTimer) clearTimeout(reminderTimer)
      toast.dismiss(confirmId)
      if (progressId) toast.dismiss(progressId)
      if (reminderId) toast.dismiss(reminderId)

      toast.error(
        err?.shortMessage ??
        err?.message ??
        'Transaction failed'
      )
    } finally {
      setBusy(false)
      confirmToastRef.current = null
      hashSeenRef.current     = false
    }
  }

  return { mint, busy }
}
