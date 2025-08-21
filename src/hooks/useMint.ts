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
  /** called after metadata is fetched */
  onSuccess(meta: any): void
  /**
   * should return the freshly updated totalSupply or tokenId
   * (returning totalSupply is fine for 1-based IDs)
   */
  onAfterSuccess?(): Promise<number | undefined> | number | undefined
}

export function useMint({ onSuccess, onAfterSuccess }: Options) {
  const { address } = useAccount()
  const chainId = useChainId()
  const nftAddress = (CONTRACTS[chainId] ?? '') as `0x${string}`
  const my = (address ?? '').toLowerCase()

  const [busy, setBusy] = useState(false)

  // guards / refs
  const doneRef      = useRef(false)               // ensures we finalize only once
  const txHashRef    = useRef<`0x${string}` | null>(null)
  const unwatchRef   = useRef<null | (() => void)>(null)

  // toast ids
  const confirmToast = useRef<number | string | null>(null)
  const miningToast  = useRef<number | string | null>(null)

  const stopWatch = () => { try { unwatchRef.current?.() } finally { unwatchRef.current = null } }
  const clearToasts = () => {
    if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
    if (miningToast.current)  { toast.dismiss(miningToast.current);  miningToast.current  = null }
  }

  const finalizeOnce = async (maybeTokenId?: number) => {
    if (doneRef.current) return
    doneRef.current = true

    stopWatch()
    clearToasts()
    toast.success('Mint successful!', { duration: 3000 })

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

  // cleanup on unmount
  useEffect(() => stopWatch, [])

  const mint = async () => {
    if (!nftAddress) return toast.error('Wrong network')
    if (!address)    return toast.error('Wallet not connected')
    if (busy)        return

    // reset per attempt
    setBusy(true)
    doneRef.current   = false
    txHashRef.current = null
    stopWatch()
    clearToasts()

    // show “waiting for wallet…” as soon as we hand off to wallet
    confirmToast.current = toast.info('Waiting for wallet confirmation…', { duration: Infinity })

    try {
      // clients
      const wallet = await getWalletClient(wagmiConfig)
      if (!wallet) throw new Error('Wallet not found')
      const publicClient = getPublicClient(wagmiConfig, { chainId })

      // start Transfer watcher BEFORE sending the tx
      const fromBlock = await publicClient.getBlockNumber()
      unwatchRef.current = watchContractEvent(wagmiConfig, {
        address: nftAddress,
        abi: HASHCANON_ABI,
        eventName: 'Transfer',
        fromBlock,
        onLogs: (logs) => {
          if (doneRef.current) return
          const hit = logs.find(l => String(l.args?.to ?? '').toLowerCase() === my)
          if (!hit) return
          const tokenId = Number(hit.args?.tokenId)
          finalizeOnce(Number.isFinite(tokenId) ? tokenId : undefined)
        },
      })

      // build concrete request (helps MetaMask Mobile always show confirm UI)
      const { request } = await publicClient.simulateContract({
        account: wallet.account,
        address: nftAddress,
        abi: HASHCANON_ABI,
        functionName: 'mint',
        value: parseEther('0.002'),
      })

      // send — MetaMask should pop the confirmation here
      const hash = await writeContract(wagmiConfig, request)
      txHashRef.current = hash

      // switch to “Minting…” only after real txHash
      if (confirmToast.current) { toast.dismiss(confirmToast.current); confirmToast.current = null }
      miningToast.current = toast.info('Minting…', { duration: Infinity })

      // fallback: if the event is missed, finalize on mined receipt
      publicClient.waitForTransactionReceipt({ hash })
        .then(() => finalizeOnce())
        .catch(() => { /* ignore; error handled below if send fails */ })

    } catch (err: any) {
      // user rejected / transport error before hash
      stopWatch()
      clearToasts()
      toast.error(err?.shortMessage ?? err?.message ?? 'Transaction failed')
      txHashRef.current = null
      doneRef.current = false
      setBusy(false)
    }
  }

  return { mint, busy }
}
