// hooks/useMint.ts
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import {
  useAccount,
  useChainId,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi'
import { parseEther, type Abi } from 'viem'
import { CONTRACTS } from '../constants'
import { getTokenURI } from '../logic'

// Load ABI array only (not the whole artifact object)
import artifact from '../HashCanonNFT.json'
const HASHCANON_ABI = (artifact as { abi: Abi }).abi

// Low-level actions to watch events / read chain state
import { getPublicClient, watchContractEvent } from 'wagmi/actions'
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

  // Ensure we handle each tx success only once (StrictMode/HMR safe)
  const handledTxRef = useRef<`0x${string}` | null>(null)

  // Keep an active event watcher (unsubscribe on success/error/unmount)
  const unwatchRef = useRef<null | (() => void)>(null)
  const stopWatch = () => {
    try { unwatchRef.current?.() } catch {}
    unwatchRef.current = null
  }

  // Start write; wagmi tracks "signing" state internally
  const {
    writeContractAsync,
    data: txHash,
    isPending: isSigning,
    reset: resetWrite,
  } = useWriteContract()

  // Wait for mining by tx hash; wagmi handles background/return-to-app
  const {
    isLoading: isMining,
    isSuccess: isMined,
    isError: isMineError,
    error: mineError,
  } = useWaitForTransactionReceipt({ hash: txHash as `0x${string}` | undefined })

  // Toast ids to avoid duplicates
  const confirmToast = useRef<number | string | null>(null)
  const miningToast  = useRef<number | string | null>(null)

  // Signing → show/dismiss "Waiting for wallet confirmation…"
  useEffect(() => {
    if (isSigning && !confirmToast.current) {
      confirmToast.current = toast.info('Waiting for wallet confirmation…', { duration: Infinity })
    }
    if (!isSigning && confirmToast.current) {
      toast.dismiss(confirmToast.current)
      confirmToast.current = null
    }
  }, [isSigning])

  // When hash appears → show "Minting…" until mined
  useEffect(() => {
    if (txHash && !isMined && !miningToast.current) {
      miningToast.current = toast.info('Minting…', { duration: Infinity })
    }
    if (isMined && miningToast.current) {
      toast.dismiss(miningToast.current)
      miningToast.current = null
    }
  }, [txHash, isMined])

  // Success: single handler (by event or by receipt)
  const handleSuccessOnce = async (maybeTokenId?: number) => {
    if (handledTxRef.current === (txHash ?? '0x')) return
    handledTxRef.current = (txHash ?? '0x') as `0x${string}`

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

    resetWrite() // allow the next mint
  }

  // Success by mined receipt (fallback if event missed)
  useEffect(() => {
    if (!isMined) return
    handleSuccessOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMined])

  // Reset guard when a new attempt starts (no hash yet)
  useEffect(() => {
    if (!txHash) handledTxRef.current = null
  }, [txHash])

  // Error: signing canceled OR mining failed
  useEffect(() => {
    if (!isMineError) return
    stopWatch()
    if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
    if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
    toast.error((mineError as any)?.shortMessage ?? (mineError as any)?.message ?? 'Transaction failed')
    handledTxRef.current = null
    resetWrite()
  }, [isMineError, mineError, resetWrite])

  // Mobile-specific: when returning from wallet, if we are still "signing" but have no txHash,
  // treat it as a dismissed signature and reset local state.
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (isSigning && !txHash) {
        // user likely canceled or wallet didn't respond
        stopWatch()
        if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
        if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
        handledTxRef.current = null
        resetWrite()
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [isSigning, txHash, resetWrite])

  // Clean up on unmount
  useEffect(() => stopWatch, [])

  // Click handler
  const mint = async () => {
    if (!nftAddress) return toast.error('Wrong network')
    if (!address)    return toast.error('Wallet not connected')

    // If previous signing is stuck, reset before new attempt
    if (isSigning) {
      stopWatch()
      handledTxRef.current = null
      resetWrite()
    }

    try {
      // Prepare an on-chain event watcher as a reliable fallback
      const client = getPublicClient(wagmiConfig, { chainId })
      const fromBlock = await client.getBlockNumber()

      stopWatch()
      unwatchRef.current = watchContractEvent(wagmiConfig, {
        address: nftAddress,
        abi: HASHCANON_ABI,
        eventName: 'Transfer',
        // Do not rely on checksum; filter manually inside onLogs
        fromBlock,
        onLogs: (logs) => {
          const hit = logs.find(l => String(l.args?.to ?? '').toLowerCase() === my)
          if (!hit) return
          const tokenId = Number(hit.args?.tokenId)
          handleSuccessOnce(Number.isFinite(tokenId) ? tokenId : undefined)
        },
      })

      // Fire the transaction (WC/MetaMask will open)
      await writeContractAsync({
        address: nftAddress,
        abi: HASHCANON_ABI,
        functionName: 'mint',
        value: parseEther('0.002'),
      })
      // Flow continues via event watcher or mined receipt
    } catch (err: any) {
      // User rejected / transport error before hash
      stopWatch()
      if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
      if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
      toast.error(err?.shortMessage ?? err?.message ?? 'Transaction failed')
      handledTxRef.current = null
      resetWrite()
    }
  }

  const busy = isSigning || isMining
  return { mint, busy }
}
