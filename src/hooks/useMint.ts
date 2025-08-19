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

import artifact from '../HashCanonNFT.json'
const HASHCANON_ABI = (artifact as { abi: Abi }).abi

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

  // one-shot guard per tx
  const handledTxRef = useRef<`0x${string}` | null>(null)

  // active watcher
  const unwatchRef = useRef<null | (() => void)>(null)
  const stopWatch = () => { try { unwatchRef.current?.() } finally { unwatchRef.current = null } }

  // write + receipt
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

  // toast refs
  const confirmToast = useRef<number | string | null>(null)
  const miningToast  = useRef<number | string | null>(null)

  /* Signing: show once */
  useEffect(() => {
    if (isSigning && !confirmToast.current) {
      confirmToast.current = toast.info('Waiting for wallet confirmation…', { duration: Infinity })
    }
    if (!isSigning && confirmToast.current) {
      toast.dismiss(confirmToast.current)
      confirmToast.current = null
    }
  }, [isSigning])

  /* Minting: ONLY when we actually have a tx hash */
  useEffect(() => {
    if (txHash && !isMined && !miningToast.current) {
      miningToast.current = toast.info('Minting…', { duration: Infinity })
    }
    if (isMined && miningToast.current) {
      toast.dismiss(miningToast.current)
      miningToast.current = null
    }
  }, [txHash, isMined])

  /* unified success */
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

    resetWrite() // enable next mint
  }

  /* success by mined receipt (fallback if event missed) */
  useEffect(() => {
    if (!isMined) return
    handleSuccessOnce()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMined])

  /* reset guard when no hash */
  useEffect(() => {
    if (!txHash) handledTxRef.current = null
  }, [txHash])

  /* mined-stage errors */
  useEffect(() => {
    if (!isMineError) return
    stopWatch()
    if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
    if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
    toast.error((mineError as any)?.shortMessage ?? (mineError as any)?.message ?? 'Transaction failed')
    handledTxRef.current = null
    resetWrite()
  }, [isMineError, mineError, resetWrite])

  /* cleanup */
  useEffect(() => stopWatch, [])

  // debounced re-mint helper (ensures write state fully resets)
  const flushMicrotask = () => new Promise<void>(r => queueMicrotask(() => r()))

  const mint = async () => {
    if (!nftAddress) return toast.error('Wrong network')
    if (!address)    return toast.error('Wallet not connected')

    // if previous attempt is stuck → hard reset before new write
    if (isSigning || unwatchRef.current || txHash) {
      stopWatch()
      if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
      if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
      handledTxRef.current = null
      resetWrite()
      await flushMicrotask() // let wagmi mutation reset before next call
    }

    try {
      // start watcher BEFORE opening wallet
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

      // send transaction (explicit account/chainId helps on mobile)
      await writeContractAsync({
        account: address as `0x${string}`,
        chainId,
        address: nftAddress,
        abi: HASHCANON_ABI,
        functionName: 'mint',
        value: parseEther('0.002'),
      })
      // flow continues via txHash->isMined OR via Transfer event
    } catch (err: any) {
      // user rejected / transport error before hash
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
