// src/App.tsx
import { useEffect, useRef, useState } from 'react'
import { useAccount, useChainId, useChains } from 'wagmi'
import { toast, Toaster } from 'sonner'

import {
  sendMintTx as mintNFT,
  getMintingStatus,
  getTotalMinted,
  getTokenURI,
} from './logic'
import { CONTRACTS, MINT_START_TIME, TOTAL_SUPPLY_CAP } from './constants'
import { wagmiConfig } from './wagmi'
import { getPublicClient } from 'wagmi/actions'

import { Header } from './components/Header'
import { Countdown } from './components/Countdown'
import { WalletInfo } from './components/WalletInfo'
import { StatusPanel } from './components/StatusPanel'
import { ContactBlock } from './components/ContactBlock'
import { MintedMandalas } from './components/MintedMandalas'

/* ────────────────────────────────────────────────────────────────── */
/*  Constants & Chain Helpers                                        */
/* ────────────────────────────────────────────────────────────────── */

const getAddress = (id?: number) => (id && CONTRACTS[id]) || undefined

/* ────────────────────────────────────────────────────────────────── */
/*  Component                                                        */
/* ────────────────────────────────────────────────────────────────── */

export default function App() {
  // Wallet & Network Info
  const [busy, setBusy] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const chains = useChains()
  const chain = chains.find(c => c.id === chainId)
  const networkOk = !!getAddress(chainId)

  // UI State
  const [now, setNow] = useState(new Date())
  const [mintingEnabled, setMintingEnabled] = useState<boolean | null>(null)
  const [totalMinted, setTotalMinted] = useState<number | null>(null)
  const [mintedTokens, setMintedTokens] = useState<any[]>([])
  const [waitToast, setWaitToast] = useState<string | number | null>(null)

  // Toast + tx refs for visibility change recovery
  const confirmToastRef = useRef<string | number | null>(null)
  const hashSeenRef = useRef(false)

  // Local clock: tick every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Initial fetch for totalSupply
  useEffect(() => {
    getTotalMinted().then(setTotalMinted).catch(() => setTotalMinted(null))
  }, [])

  // Poll mintingEnabled once per second for last minute before start
  useEffect(() => {
    let first = true
    const id = setInterval(async () => {
      const ms = MINT_START_TIME.getTime() - Date.now()
      if (first || ms <= 60000) {
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
    }, 1000)
    return () => clearInterval(id)
  }, [])

  // Show waiting toast before mint opens
  useEffect(() => {
    const afterStart = now >= MINT_START_TIME
    if (afterStart && mintingEnabled === false && !waitToast) {
      const id = toast('⏳ Waiting for network confirmation…', { duration: Infinity })
      setWaitToast(id)
    }
    if (mintingEnabled === true && waitToast) {
      toast.dismiss(waitToast)
      setWaitToast(null)
    }
  }, [now, mintingEnabled, waitToast])

  // Countdown formatter → "1 d 13 h 42 m 07 s"
  const fmt = (ms: number) => {
    const total = Math.max(0, Math.floor(ms / 1000))

    const d = Math.floor(total / 86_400)
    const h = Math.floor((total % 86_400) / 3_600)
    const m = Math.floor((total % 3_600) / 60)
    const s = total % 60

    const parts: string[] = []
    if (d) parts.push(`${d} d`)
    
    parts.push(`${h} h`)
    parts.push(`${m.toString().padStart(2, '0')} m`)
    parts.push(`${s.toString().padStart(2, '0')} s`)

    return parts.join(' ')
  }


  // Mint button handler
  const handleMint = async () => {
    if (busy)                     return
    if (!isConnected)             return toast.error('Connect wallet first')
    if (!networkOk)               return toast.error('Wrong network')
    if (mintingEnabled !== true)  return toast.error('Mint not active')
    if (totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP)
      return toast.error('Sold-out')

    setBusy(true)

    // Step 1 — ask user to sign transaction
    const confirmId = toast.info('Waiting for wallet confirmation…', {
      duration: Infinity,
    })
    confirmToastRef.current = confirmId

    // Show reminder only if user actually left the tab (mobile MetaMask)
    let reminderId: number | string | null = null
    const reminderTimer = document.hidden
      ? setTimeout(() => {
          reminderId = toast.info('↩︎ Return to the browser after signing.', {
            duration: Infinity,
          })
        }, 15_000)
      : undefined

    let progressId: number | string | null = null

    try {
      // Step 2 — wait for signature and get tx hash
      const { hash, chainId: txChain } = await mintNFT()
      hashSeenRef.current = true

      if (reminderTimer) clearTimeout(reminderTimer)
      toast.dismiss(confirmId)
      if (reminderId) toast.dismiss(reminderId)

      // Step 3 — wait for mining
      progressId = toast.info('Minting…', { duration: Infinity })
      const client = getPublicClient(wagmiConfig, { chainId: txChain })
      await client.waitForTransactionReceipt({ hash })

      toast.dismiss(progressId)
      toast.success('Mint successful!')

      // Step 4 — refresh UI
      const updated = await getTotalMinted()
      setTotalMinted(updated)
      const meta = await getTokenURI(updated)
      setMintedTokens(prev => [meta, ...prev])
    } catch (err: any) {
      if (reminderTimer) clearTimeout(reminderTimer)
      toast.dismiss(confirmId)
      if (progressId) toast.dismiss(progressId)
      if (reminderId) toast.dismiss(reminderId)

      toast.error(`${err?.shortMessage ?? err?.message ?? 'Transaction failed'}`)
    } finally {
      setBusy(false)
      confirmToastRef.current = null
      hashSeenRef.current = false
    }
  }

  // Visibility recovery: clear "Confirm..." if user stayed in MetaMask too long
  useEffect(() => {
    const onVis = () => {
      if (!document.hidden &&
          busy &&
          !hashSeenRef.current &&
          confirmToastRef.current !== null) {
        toast.dismiss(confirmToastRef.current)
        confirmToastRef.current = null
        setBusy(false)
      }
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [busy])

  return (
    <>
      <Header chainName={chain?.name} />
      <Countdown now={now} startTime={MINT_START_TIME} mintingEnabled={mintingEnabled} />

      <div id="mandala-section">
        <div className="section-title">Mint your unique mandala</div>
        <p className="status">Each token is fully on-chain and costs 0.002 ETH.</p>

        <WalletInfo
          isConnected={isConnected}
          address={address}
          chainName={chain?.name}
          networkOk={networkOk}
        />

        <button
          className={`wide-button green-button ${
            busy || !isConnected || !networkOk ||
            mintingEnabled !== true ||
            (totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP)
              ? 'disabled'
              : ''
          }`}
          disabled={
            busy || !isConnected || !networkOk ||
            mintingEnabled !== true ||
            (totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP)
          }
          onClick={handleMint}
        >
          {totalMinted !== null && totalMinted >= TOTAL_SUPPLY_CAP
            ? 'Sold out ❌'
            : mintingEnabled === null
            ? 'Checking status…'
            : mintingEnabled === false
            ? 'Mint disabled ❌'
            : 'Mint now'}
        </button>

        <StatusPanel
          totalMinted={totalMinted}
          totalCap={TOTAL_SUPPLY_CAP}
          priceLabel="0.002 ETH + gas"
          networkOk={networkOk}
          contractUrl={
            networkOk
              ? `https://${chain?.testnet ? 'sepolia.' : ''}etherscan.io/address/${getAddress(chainId)}`
              : undefined
          }
          contractShort={getAddress(chainId)?.slice(0, 6) + '…' + getAddress(chainId)?.slice(-4)}
        />
        
        <MintedMandalas tokens={mintedTokens} />
      </div>
      <ContactBlock />
      <Toaster position="bottom-center" richColors />
    </>
  )
}
