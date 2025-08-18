// hooks/useMint.ts
import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther, type Abi } from 'viem'
import { CONTRACTS } from '../constants'
import { getTokenURI } from '../logic'

// Load ABI array only (not the whole artifact object)
import artifact from '../HashCanonNFT.json'
const HASHCANON_ABI = (artifact as { abi: Abi }).abi

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
  const chainId = useChainId()
  const nftAddress = (CONTRACTS[chainId] ?? '') as `0x${string}`

  // Ensure we handle each tx success only once (StrictMode/HMR safe)
  const handledTxRef = useRef<`0x${string}` | null>(null)

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

  // Success: mined → refresh totals → fetch tokenURI → onSuccess
  useEffect(() => {
    if (!isMined || !txHash) return
    // Guard: handle each txHash once
    if (handledTxRef.current === txHash) return
    handledTxRef.current = txHash

    toast.success('Mint successful!')

    ;(async () => {
      let newId: number | undefined

      if (onAfterSuccess) {
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

      // Allow the next mint
      resetWrite()
    })()
  }, [isMined, txHash, onAfterSuccess, onSuccess, resetWrite])

  // Reset guard when a new attempt starts (no hash yet)
  useEffect(() => {
    if (!txHash) handledTxRef.current = null
  }, [txHash])

  // Error: signing canceled OR mining failed
  useEffect(() => {
    if (!isMineError) return
    if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
    if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
    toast.error((mineError as any)?.shortMessage ?? (mineError as any)?.message ?? 'Transaction failed')
    handledTxRef.current = null
    resetWrite()
  }, [isMineError, mineError, resetWrite])

  // Click handler
  const mint = async () => {
    if (!nftAddress) return toast.error('Wrong network')
    try {
      await writeContractAsync({
        address: nftAddress,
        abi: HASHCANON_ABI,     // must be an ABI array
        functionName: 'mint',
        value: parseEther('0.002'),
      })
      // Flow continues via isSigning → txHash → isMined
    } catch (err: any) {
      // User rejected / transport error before hash
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
