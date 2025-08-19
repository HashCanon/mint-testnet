// hooks/useMint.ts
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useAccount, useChainId } from 'wagmi'
import { parseEther, type Abi } from 'viem'
import { CONTRACTS } from '../constants'
import { getTokenURI } from '../logic'

// ABI array only
import artifact from '../HashCanonNFT.json'
const HASHCANON_ABI = (artifact as { abi: Abi }).abi

// Low-level wagmi actions (no React mutation layer)
import {
  getPublicClient,
  getWalletClient,
  watchContractEvent,
  writeContract,
} from 'wagmi/actions'
import { wagmiConfig } from '../wagmi'

type Options = {
  onSuccess(meta: any): void
  onAfterSuccess?(): Promise<number | undefined> | number | undefined
}

export function useMint({ onSuccess, onAfterSuccess }: Options) {
  const { address } = useAccount()
  const chainId = useChainId()
  const nftAddress = (CONTRACTS[chainId] ?? '') as `0x${string}`
  const my = (address ?? '').toLowerCase()

  const [busy, setBusy] = useState(false)

  // One-shot guards / refs
  const handledTxRef = useRef<`0x${string}` | null>(null)
  const txHashRef    = useRef<`0x${string}` | null>(null)

  // Active event watcher
  const unwatchRef = useRef<null | (() => void)>(null)
  const stopWatch = () => { try { unwatchRef.current?.() } finally { unwatchRef.current = null } }

  // Toast ids
  const confirmToast = useRef<number | string | null>(null)
  const miningToast  = useRef<number | string | null>(null)

  // Unified success handler (by event or receipt)
  const handleSuccessOnce = async (maybeTokenId?: number) => {
    const k = (txHashRef.current ?? '0x') as `0x${string}`
    if (handledTxRef.current === k) return
    handledTxRef.current = k

    stopWatch()
    if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
    if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }

    toast.success('Mint successful!')

    let newId = maybeTokenId
    if (typeof newId !== 'number' && onAfterSuccess) {
      try {
        const n = await onAfterSuccess()
        if (typeof n === 'number') newId = n
      } catch {
        toast.error('Failed to update total supply — token may be hidden')
      }
    }

    if (typeof newId === 'number') {
      try {
        const meta = await getTokenURI(newId)
        onSuccess(meta)
      } catch {
        toast.error('Metadata fetch failed — try reload')
      }
    }

    txHashRef.current = null
    setBusy(false)
  }

  // Cleanup on unmount
  useEffect(() => stopWatch, [])

  // Click handler
  const mint = async () => {
    if (!nftAddress) return toast.error('Wrong network')
    if (!address)    return toast.error('Wallet not connected')
    if (busy)        return

    setBusy(true)
    handledTxRef.current = null
    txHashRef.current    = null
    stopWatch()

    // Show "Waiting…" immediately when we hand control to wallet
    confirmToast.current = toast.info('Waiting for wallet confirmation…', { duration: Infinity })

    try {
      // Prepare clients
      const wallet = await getWalletClient(wagmiConfig)
      if (!wallet) throw new Error('Wallet not found')
      const publicClient = getPublicClient(wagmiConfig, { chainId })

      // Start Transfer watcher BEFORE sending tx
      const fromBlock = await publicClient.getBlockNumber()
      unwatchRef.current = watchContractEvent(wagmiConfig, {
        address: nftAddress,
        abi: HASHCANON_ABI,
        eventName: 'Transfer',
        fromBlock,
        onLogs: (logs) => {
          const hit = logs.find(l => String(l.args?.to ?? '').toLowerCase() === my)
          if (!hit) return
          const tokenId = Number(hit.args?.tokenId)
          handleSuccessOnce(Number.isFinite(tokenId) ? tokenId : undefined)
        },
      })

      // Simulate to build a concrete request (helps MM mobile to always open sign screen)
      const { request } = await publicClient.simulateContract({
        account: wallet.account,
        address: nftAddress,
        abi: HASHCANON_ABI,
        functionName: 'mint',
        value: parseEther('0.002'),
      })

      // Send — at this moment MetaMask should always show confirmation UI
      const hash = await writeContract(wagmiConfig, request)
      txHashRef.current = hash

      // Switch to "Minting…" only after we actually got a tx hash
      if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
      miningToast.current = toast.info('Minting…', { duration: Infinity })

      // Fallback: if event is missed, finish on mined receipt
      await publicClient.waitForTransactionReceipt({ hash })
      await handleSuccessOnce()
    } catch (err: any) {
      // User rejected / transport error before hash
      stopWatch()
      if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
      if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
      toast.error(err?.shortMessage ?? err?.message ?? 'Transaction failed')
      txHashRef.current = null
      handledTxRef.current = null
      setBusy(false)
    }
  }

  return { mint, busy }
}
