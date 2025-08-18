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
  /** Called after metadata has been fetched successfully */
  onSuccess(meta: any): void
  /**
   * Should return the freshly updated totalSupply or tokenId.
   * If your token IDs are 1-based, returning totalSupply is fine.
   */
  onAfterSuccess?(): Promise<number | undefined> | number | undefined
}

export function useMint({ onSuccess, onAfterSuccess }: Options) {
  const { address } = useAccount()
  const chainId = useChainId()
  const nftAddress = (CONTRACTS[chainId] ?? '') as `0x${string}`

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
    data: txHash,          // transaction hash when available
    isPending: isSigning,  // waiting for wallet confirmation
    reset: resetWrite,     // must be called to allow the next mint
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

  // Handle success via on-chain event or by receipt mining (single path)
  const handleSuccessOnce = async (maybeTokenId?: number) => {
    // Guard: if receipt already handled for this hash, ignore
    if (handledTxRef.current && handledTxRef.current === txHash) return
    handledTxRef.current = (txHash ?? '0x') as `0x${string}`

    stopWatch()
    if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
    if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }

    toast.success('Mint successful!')

    // Get token id either from event or via onAfterSuccess
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

  // Success: mined → fallback path if event wasn't caught
  useEffect(() => {
    if (!isMined || !txHash) return
    handleSuccessOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMined, txHash])

  // Reset guards when a new attempt starts (no hash yet)
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

  // Clean up on unmount
  useEffect(() => stopWatch, [])

  // Click handler
  const mint = async () => {
    if (!nftAddress) return toast.error('Wrong network')
    if (!address)    return toast.error('Wallet not connected')

    try {
      // 1) Prepare an on-chain event watcher as a reliable fallback
      const client = getPublicClient(wagmiConfig, { chainId })
      const fromBlock = await client.getBlockNumber() // start at current height

      // Subscribe to ERC-721 Transfer(to = my address) from current height
      stopWatch()
      unwatchRef.current = watchContractEvent(wagmiConfig, {
        address: nftAddress,
        abi: HASHCANON_ABI,
        eventName: 'Transfer',
        args: { to: address },       // indexed topic filter
        fromBlock,                   // catch-up if app was backgrounded
        onLogs: (logs) => {
          // Handle the first matching log only
          const log = logs[0]
          const tokenId = Number(log?.args?.tokenId)
          handleSuccessOnce(Number.isFinite(tokenId) ? tokenId : undefined)
        },
      })

      // Safety: auto-unsubscribe after 3 minutes to avoid leaks
      setTimeout(stopWatch, 180_000)

      // 2) Fire the transaction (WC/MetaMask will open)
      await writeContractAsync({
        address: nftAddress,
        abi: HASHCANON_ABI,
        functionName: 'mint',
        value: parseEther('0.002'),
      })
      // Flow continues via:
      // - event watcher (preferred on mobile), or
      // - isSigning → txHash → isMined (desktop and some wallets)
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
