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

// Import ABI array
import artifact from '../HashCanonNFT.json'
const HASHCANON_ABI = (artifact as { abi: Abi }).abi

// Low-level actions for event watching
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

  // One-shot guard per tx hash (StrictMode/HMR safe)
  const handledTxRef = useRef<`0x${string}` | null>(null)

  // Active event watcher unsubscribe
  const unwatchRef = useRef<null | (() => void)>(null)
  const stopWatch = () => { try { unwatchRef.current?.() } finally { unwatchRef.current = null } }

  // Write + mined receipt
  const {
    writeContractAsync,
    data: txHash,
    isPending: isSigning,
    reset: resetWrite,
  } = useWriteContract()

  const {
    isLoading: isMining,
    isSuccess: isMined,
    isError: isMineError,
    error: mineError,
  } = useWaitForTransactionReceipt({ hash: txHash as `0x${string}` | undefined })

  // Toast refs
  const confirmToast = useRef<number | string | null>(null)
  const miningToast  = useRef<number | string | null>(null)

  // Signing toast
  useEffect(() => {
    if (isSigning && !confirmToast.current) {
      confirmToast.current = toast.info('Waiting for wallet confirmation…', { duration: Infinity })
    }
    if (!isSigning && confirmToast.current) {
      toast.dismiss(confirmToast.current)
      confirmToast.current = null
    }
  }, [isSigning])

  // Minting toast (by hash or active watcher on resume)
  useEffect(() => {
    if (txHash && !isMined && !miningToast.current) {
      miningToast.current = toast.info('Minting…', { duration: Infinity })
    }
    if (isMined && miningToast.current) {
      toast.dismiss(miningToast.current)
      miningToast.current = null
    }
  }, [txHash, isMined])

  // On visibility back: if a watcher is active but no hash yet, show "Minting…"
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return
      if (unwatchRef.current && !txHash && !miningToast.current) {
        miningToast.current = toast.info('Minting…', { duration: Infinity })
      }
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [txHash])

  // Unified success handler (event or receipt)
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

    resetWrite()
  }

  // Fallback success by mined receipt
  useEffect(() => {
    if (!isMined) return
    handleSuccessOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMined])

  // Reset guard when no hash
  useEffect(() => {
    if (!txHash) handledTxRef.current = null
  }, [txHash])

  // Errors from mined stage
  useEffect(() => {
    if (!isMineError) return
    stopWatch()
    if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
    if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
    toast.error((mineError as any)?.shortMessage ?? (mineError as any)?.message ?? 'Transaction failed')
    handledTxRef.current = null
    resetWrite()
  }, [isMineError, mineError, resetWrite])

  // Cleanup
  useEffect(() => stopWatch, [])

  // Click handler
  const mint = async () => {
    if (!nftAddress) return toast.error('Wrong network')
    if (!address)    return toast.error('Wallet not connected')

    // If previous attempt is stuck, clean it before new one
    if (isSigning || unwatchRef.current) {
      stopWatch()
      handledTxRef.current = null
      resetWrite()
    }

    try {
      // Prepare on-chain event watcher BEFORE opening wallet
      const client = getPublicClient(wagmiConfig, { chainId })
      const fromBlock = await client.getBlockNumber()

      stopWatch()
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

      // Fire transaction (explicit account/chainId helps some mobile wallets)
      await writeContractAsync({
        account: address as `0x${string}`,
        chainId,
        address: nftAddress,
        abi: HASHCANON_ABI,
        functionName: 'mint',
        value: parseEther('0.002'),
      })
      // Flow continues via watcher or mined receipt
    } catch (err: any) {
      // User rejected / transport error before hash
      // Keep watcher running for a short while — but toasts must be cleaned
      if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
      if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
      toast.error(err?.shortMessage ?? err?.message ?? 'Transaction failed')
      handledTxRef.current = null
      // If the wallet rejected immediately, no event will come — stop watcher
      stopWatch()
      resetWrite()
    }
  }

  const busy = isSigning || isMining
  return { mint, busy }
}
